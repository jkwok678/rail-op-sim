/**
 * Trains: where they are, how they move, and what they run into.
 *
 * A train is a fixed length of metres laid back from its front along the
 * segments it occupies. Every step it looks ahead for its *movement
 * authority* — the nearest thing it must stop for — and the speed limits on
 * the way there, then accelerates or brakes along a braking curve towards
 * them. It never reads the timetable: the runner tells it where it is due to
 * stop and reacts to the events it reports.
 */

import { linkIndexForOffset } from "../railway/map/map-connectivity";
import type { Cell, TrainSpec } from "../railway/timetable/types";
import { CALL_ON_MAX_SPEED_MS, clearCallingOnSignal } from "./callingOn";
import { hitsRoadTraffic } from "./crossings";
import {
	isFacingSignal,
	leavesMap,
	nodeAt,
	occKeyOf,
	pathOf,
	type RailGraph,
	type Seg,
	segLength,
	stepFrom,
} from "./graph";
import { followSeg, liesAgainst, nextSeg, trainKeys } from "./occupancy";
import type { Route, SimState, Train, TrainWorking, WaitReason } from "./types";

/** Every train is RailOS's two default elements long. */
const DEFAULT_TRAIN_LENGTH_M = 200;
/** Acceleration is power-limited, but never more than adhesion allows. */
const MAX_ACCEL = 1.0;
const G = 9.81;
/** Closer than this to its authority, a train has arrived. */
const SNAP_M = 0.05;
/** The slowest a train approaches its authority at; it can always stop from here. */
const CREEP_SPEED = 1;
/** Maximum speed (m/s) when stepping forward one element under signaller control. */
const STEP_SPEED_MS = 15 / 3.6;

export type MoveEvent =
	| { type: "entered"; train: Train; seg: Seg; from: Seg }
	| { type: "cleared"; train: Train; seg: Seg }
	| { type: "left"; train: Train; seg: Seg }
	| { type: "stopped"; train: Train; reason: WaitReason }
	| { type: "spad"; train: Train; seg: Seg }
	| { type: "crash"; train: Train; other: Train }
	| { type: "crossingCrash"; train: Train; seg: Seg };

/** What a train can see ahead of it. */
interface Ahead {
	/** Metres to the nearest place it must stop, or Infinity. */
	authority: number;
	reason: WaitReason;
	/** Highest speed (m/s) the limits ahead allow it to be doing now. */
	limit: number;
}

/** The deceleration a train plans its stops around: half its full brake. */
const planningBrake = (train: Train): number => train.brakeRate / 2;

/** Maximum speed (m/s) the train may run at under its current control mode. */
function effectiveMaxSpeed(train: Train): number {
	const base =
		train.control.mode === "signaller" && train.signallerMaxSpeed !== null
			? Math.min(train.maxSpeed, train.signallerMaxSpeed)
			: train.maxSpeed;
	return train.callingOn ? Math.min(base, CALL_ON_MAX_SPEED_MS) : base;
}

export function trainFromSpec(
	id: number,
	headcode: string,
	description: string,
	spec: TrainSpec,
	working: TrainWorking,
): Train {
	const massKg = spec.massTonnes * 1000;
	return {
		id,
		headcode,
		description,
		massKg,
		powerW: spec.powerKw * 1000,
		brakeRate: (spec.brakeForceTonnes * G) / spec.massTonnes,
		maxSpeed: spec.maxSpeedKmh / 3.6,
		signallerMaxSpeed:
			spec.signallerSpeedKmh !== undefined
				? spec.signallerSpeedKmh / 3.6
				: null,
		lengthM: DEFAULT_TRAIN_LENGTH_M,
		segs: [],
		frontM: 0,
		speed: spec.startSpeedKmh / 3.6,
		status: "running",
		wait: null,
		control: { mode: "timetable" },
		reminder: null,
		callingOnAllowed: false,
		callingOn: false,
		allowedCallOnNode: null,
		working,
	};
}

/**
 * Where a train starting on `rear` → `front` stands: on both cells with its
 * front at the far edge of `front`, or — rear on an exit — just outside the
 * railway with its front at the exit's outer edge, about to enter.
 */
export function startPosition(
	graph: RailGraph,
	lies: readonly number[],
	rear: Cell,
	front: Cell,
): { segs: Seg[]; frontM: number } | null {
	const rearId = nodeAt(graph, rear);
	const frontId = nodeAt(graph, front);
	const link = linkIndexForOffset(front.gx - rear.gx, front.gy - rear.gy);
	if (rearId === null || frontId === null || link === null) return null;
	const rearNode = graph.nodes[rearId];
	if (rearNode.kind === "exit" && rearNode.deadEnd !== null) {
		const dead = rearNode.deadEnd;
		return { segs: [{ node: rearId, entry: dead, exit: 8 - dead }], frontM: 0 };
	}
	const rearPath =
		rearNode.paths.find((p) => p.exit === link && p.rail === lies[rearId]) ??
		rearNode.paths.find((p) => p.exit === link);
	const step = stepFrom(graph, rearId, link);
	const frontSeg = step ? followSeg(graph, lies, step) : null;
	if (!rearPath || !frontSeg || frontSeg.node !== frontId) return null;
	const rearSeg = { node: rearId, entry: rearPath.entry, exit: rearPath.exit };
	return { segs: [rearSeg, frontSeg], frontM: segLength(graph, frontSeg) };
}

/** Whether any of `segs` is occupied by a train other than `except`. */
export function segsOccupied(
	graph: RailGraph,
	trains: readonly Train[],
	segs: readonly Seg[],
	except?: Train,
): boolean {
	const keys = trainKeys(
		graph,
		trains.filter((t) => t !== except),
	);
	return segs.some((seg) => keys.has(occKeyOf(graph, seg)));
}

const front = (train: Train): Seg => train.segs[train.segs.length - 1];

function speedLimit(graph: RailGraph, seg: Seg): number {
	return (pathOf(graph, seg)?.speedKmh ?? 0) / 3.6;
}

/** How far ahead a train must look to be sure it can stop in time. */
function horizon(train: Train): number {
	const v = Math.max(train.speed, effectiveMaxSpeed(train));
	return (v * v) / (2 * planningBrake(train)) + train.lengthM;
}

/** The location of `seg`'s cell, or null. */
const locationOf = (graph: RailGraph, seg: Seg | null): string | null =>
	seg ? graph.nodes[seg.node].location : null;

/** The first thing ahead of `train` it must stop for, and the limits on the way. */
function lookAhead(
	graph: RailGraph,
	state: SimState,
	train: Train,
	others: ReadonlyMap<number, number>,
	stopAt: string | null,
): Ahead {
	let seg = front(train);
	let dist = segLength(graph, seg) - train.frontM;
	let limit = Math.min(
		effectiveMaxSpeed(train),
		...train.segs.map((s) => speedLimit(graph, s)),
	);
	const bp = planningBrake(train);
	const reach = horizon(train);
	const allowedRedSignalNode =
		train.control.mode === "signaller"
			? train.control.allowedRedSignalNode
			: train.allowedCallOnNode;
	while (dist < reach) {
		const next = nextSeg(graph, state.lies, seg);
		const reason = stopReason(
			graph,
			state,
			others,
			stopAt,
			seg,
			next,
			allowedRedSignalNode,
		);
		if (reason) return { authority: Math.max(0, dist), reason, limit };
		if (!next) break;
		const lim = speedLimit(graph, next);
		limit = Math.min(limit, Math.sqrt(lim * lim + 2 * bp * dist));
		dist += segLength(graph, next);
		seg = next;
	}
	return { authority: Number.POSITIVE_INFINITY, reason: null, limit };
}

/**
 * Why a train must stop at the boundary between `seg` and `next`, or null
 * when it may run on (`next` null then means it is leaving the railway).
 */
function stopReason(
	graph: RailGraph,
	state: SimState,
	others: ReadonlyMap<number, number>,
	stopAt: string | null,
	seg: Seg,
	next: Seg | null,
	allowedRedSignalNode: number | null,
): WaitReason {
	const here = locationOf(graph, seg);
	if (stopAt && here === stopAt && locationOf(graph, next) !== stopAt) {
		return "station";
	}
	if (!next) return leavesMap(graph, seg) ? null : "buffers";
	if (
		isFacingSignal(graph, next) &&
		state.aspects[next.node] === 0 &&
		next.node !== allowedRedSignalNode
	) {
		return "signal";
	}
	if (others.has(occKeyOf(graph, next))) return "train";
	if (liesAgainst(graph, state.lies, next)) return "points";
	return null;
}

/** Speed after one step of `dt` towards what lies ahead. */
function nextSpeed(train: Train, ahead: Ahead, dt: number): number {
	const bp = planningBrake(train);
	const room = ahead.authority - SNAP_M;
	const curve =
		ahead.authority === Number.POSITIVE_INFINITY
			? Number.POSITIVE_INFINITY
			: Math.max(
					Math.sqrt(2 * bp * Math.max(0, room)),
					Math.min(CREEP_SPEED, ahead.authority / dt),
				);
	const target = Math.min(ahead.limit, curve);
	const v = train.speed;
	if (v > target) return Math.max(target, v - train.brakeRate * dt);
	const accel = Math.min(
		MAX_ACCEL,
		train.powerW / (train.massKg * Math.max(v, 0.1)),
	);
	return Math.min(target, v + accel * dt);
}

function applySignallerOrder(train: Train, ahead: Ahead): Ahead {
	if (train.control.mode !== "signaller") return ahead;
	if (train.control.order.kind === "stop") {
		return { authority: ahead.authority, reason: ahead.reason, limit: 0 };
	}
	if (train.control.order.kind === "step") {
		const stepDist = train.control.order.remainingM;
		return {
			authority: Math.min(ahead.authority, stepDist),
			reason: stepDist <= ahead.authority ? "signaller" : ahead.reason,
			limit: Math.min(ahead.limit, STEP_SPEED_MS),
		};
	}
	return ahead;
}

function canStopAtBoundary(train: Train, authority: number): boolean {
	return (
		train.speed <= CREEP_SPEED ||
		train.speed * train.speed <= 2 * train.brakeRate * authority + 0.5
	);
}

function stopTrainAtBoundary(
	train: Train,
	ahead: Ahead,
	wasMoving: boolean,
	isStopping: boolean,
	events: MoveEvent[],
): number {
	if (wasMoving || (train.wait === null && ahead.reason === "station")) {
		events.push({ type: "stopped", train, reason: ahead.reason });
	}
	train.speed = 0;
	train.status = "waiting";
	train.wait = ahead.reason ?? (isStopping ? "signaller" : null);
	if (
		train.control.mode === "signaller" &&
		train.control.order.kind === "step"
	) {
		train.control.order = { kind: "stop" };
		train.wait = ahead.reason ?? "signaller";
	}
	return ahead.authority;
}

function settleTrainMotion(
	train: Train,
	ahead: Ahead,
	move: number,
	wasMoving: boolean,
	isStopping: boolean,
	events: MoveEvent[],
): number {
	const reachesStop =
		move >= ahead.authority - 1e-6 &&
		(canStopAtBoundary(train, ahead.authority) || ahead.reason !== "signal");
	if (reachesStop) {
		return stopTrainAtBoundary(train, ahead, wasMoving, isStopping, events);
	}
	if (move > 0) {
		train.status = "running";
		train.wait = null;
	} else if (isStopping && train.speed === 0) {
		train.status = "waiting";
		train.wait =
			ahead.authority <= 1.0 && ahead.reason !== null
				? ahead.reason
				: "signaller";
	}
	return move;
}

function advanceStepOrder(train: Train, move: number): void {
	if (
		train.control.mode !== "signaller" ||
		train.control.order.kind !== "step"
	) {
		return;
	}
	const remaining = Math.max(0, train.control.order.remainingM - move);
	if (remaining <= SNAP_M) {
		train.control.order = { kind: "stop" };
		train.speed = 0;
		train.status = "waiting";
		train.wait = "signaller";
	} else {
		train.control.order = { kind: "step", remainingM: remaining };
	}
}

/**
 * Move one train one step. Trains not running (dwelling, crashed, finished)
 * stand still. `stopAt` is the location the train is next due to stop at.
 */
export function moveTrain(
	graph: RailGraph,
	state: SimState,
	train: Train,
	stopAt: string | null,
	dt: number,
	events: MoveEvent[],
): void {
	if (train.status !== "running" && train.status !== "waiting") return;

	const others = trainKeys(
		graph,
		state.trains.filter((t) => t !== train),
	);
	const ahead = applySignallerOrder(
		train,
		lookAhead(graph, state, train, others, stopAt),
	);
	const isStopping =
		train.control.mode === "signaller" && train.control.order.kind === "stop";

	const wasMoving = train.speed > 0;
	train.speed = nextSpeed(train, ahead, dt);
	const move = settleTrainMotion(
		train,
		ahead,
		train.speed * dt,
		wasMoving,
		isStopping,
		events,
	);
	advanceFront(graph, state, train, move, events);
	advanceStepOrder(train, move);
	dropRear(graph, train, events);
}

function consumeRedSignalAuthority(
	state: SimState,
	train: Train,
	node: number,
): boolean {
	const wasSignallerAllowed =
		train.control.mode === "signaller" &&
		train.control.allowedRedSignalNode === node;
	if (wasSignallerAllowed && train.control.mode === "signaller") {
		train.control.allowedRedSignalNode = null;
	}
	const wasCallOnAllowed = train.allowedCallOnNode === node;
	if (wasCallOnAllowed) {
		train.allowedCallOnNode = null;
		clearCallingOnSignal(state, node);
	}
	return wasSignallerAllowed || wasCallOnAllowed;
}

function recordEntryHazards(
	graph: RailGraph,
	state: SimState,
	train: Train,
	next: Seg,
	wasAllowed: boolean,
	events: MoveEvent[],
): void {
	if (
		!wasAllowed &&
		isFacingSignal(graph, next) &&
		state.aspects[next.node] === 0
	) {
		events.push({ type: "spad", train, seg: next });
	}
	// RailOS (TrainUnit.cpp:903): faster than a crawl onto a crossing
	// whose barriers are not down, and the train hits road traffic.
	if (hitsRoadTraffic(graph, state, next, train.speed)) {
		events.push({ type: "crossingCrash", train, seg: next });
	}
	const nextKey = occKeyOf(graph, next);
	const hit = state.trains.find(
		(t) => t !== train && t.segs.some((s) => occKeyOf(graph, s) === nextKey),
	);
	if (hit) events.push({ type: "crash", train, other: hit });
}

function advanceFront(
	graph: RailGraph,
	state: SimState,
	train: Train,
	move: number,
	events: MoveEvent[],
): void {
	train.frontM += move;
	for (;;) {
		const current = front(train);
		const len = segLength(graph, current);
		if (train.frontM <= len + 1e-9 || leavesMap(graph, current)) return;
		const next = nextSeg(graph, state.lies, current);
		if (!next) {
			train.frontM = len;
			return;
		}
		train.frontM -= len;
		train.segs.push(next);
		events.push({ type: "entered", train, seg: next, from: current });
		const wasAllowed = consumeRedSignalAuthority(state, train, next.node);
		recordEntryHazards(graph, state, train, next, wasAllowed, events);
	}
}

/** Let go of segments the rear has cleared, and notice a train that has left. */
function dropRear(graph: RailGraph, train: Train, events: MoveEvent[]): void {
	let behindFront = train.frontM;
	for (let i = 0; i < train.segs.length - 1; i++) {
		behindFront += segLength(graph, train.segs[i]);
	}
	while (train.segs.length > 0) {
		const rear = train.segs[0];
		const rearLen = segLength(graph, rear);
		if (behindFront - rearLen < train.lengthM) return;
		if (train.segs.length === 1) {
			events.push({ type: "left", train, seg: rear });
			train.segs = [];
			return;
		}
		train.segs.shift();
		behindFront -= rearLen;
		events.push({ type: "cleared", train, seg: rear });
	}
}

/** Whether `train` could not stop before reaching the start of `route`. */
export function approaching(
	graph: RailGraph,
	state: SimState,
	train: Train,
	route: Route,
): boolean {
	if (train.speed <= 0) return false;
	const v = train.speed;
	const reach = (v * v) / (2 * planningBrake(train)) + train.lengthM;
	const first = route.segs[0];
	let seg: Seg | null = front(train);
	let dist = segLength(graph, seg) - train.frontM;
	while (seg && dist < reach) {
		seg = nextSeg(graph, state.lies, seg);
		if (!seg) return false;
		if (seg.node === first.node && seg.entry === first.entry) return true;
		dist += segLength(graph, seg);
	}
	return false;
}

/** Highest entry speed from which a train could stop for what lies ahead. */
export function safeEntrySpeed(
	graph: RailGraph,
	state: SimState,
	train: Train,
): number {
	const others = trainKeys(
		graph,
		state.trains.filter((t) => t !== train),
	);
	const ahead = lookAhead(graph, state, train, others, null);
	const stop = Math.sqrt(2 * planningBrake(train) * ahead.authority);
	return Math.min(train.speed, ahead.limit, stop);
}

/**
 * Each segment of a train as a span of its cell, rear first: the rear may
 * stand part way into the first, the front part way into the last.
 */
export function trainSpans(
	graph: RailGraph,
	train: Train,
): { seg: Seg; from: number; to: number }[] {
	const spans: { seg: Seg; from: number; to: number }[] = [];
	const last = train.segs.length - 1;
	if (last < 0) return spans;
	const frontLen = segLength(graph, train.segs[last]);
	// Whatever has run on past an exit's outer edge is off the map.
	let remaining = train.lengthM - Math.max(0, train.frontM - frontLen);
	for (let i = last; i >= 0 && remaining > 0; i--) {
		const seg = train.segs[i];
		const len = segLength(graph, seg) || 1;
		const frontHere = i === last ? Math.min(train.frontM, len) : len;
		const covered = Math.min(frontHere, remaining);
		spans.unshift({
			seg,
			from: (frontHere - covered) / len,
			to: frontHere / len,
		});
		remaining -= covered;
	}
	return spans;
}
