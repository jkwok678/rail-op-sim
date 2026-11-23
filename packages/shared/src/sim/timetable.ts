/**
 * Working trains to the timetable: bringing them on, calling at stations,
 * carrying out what they are booked to do there, and seeing them off.
 *
 * The runner never moves a train. It decides when a train may go and where it
 * next has to stop, and listens for what the train reports — arriving, passing
 * a location, leaving the railway.
 */

import { formatSimTime } from "../railway/timetable/time";
import {
	type Action,
	type ActionOf,
	actionLocation,
	actionTime,
	type Service,
	type Timetable,
} from "../railway/timetable/types";
import { applyPatch } from "../util/patch";
import { clearCallingOnSignal } from "./callingOn";
import { cellKey, type GraphNode, type RailGraph, type Seg } from "./graph";
import type { PerformanceLog } from "./log";
import { liesAgainst, nextSeg, sameSeg } from "./occupancy";
import { releaseBehind } from "./routes";
import {
	safeEntrySpeed,
	segsOccupied,
	startPosition,
	trainFromSpec,
} from "./trains";
import type {
	ServiceRun,
	SimState,
	Train,
	TrainStatus,
	TrainTimetableEntry,
	TrainTimetableRow,
	TrainTimetableState,
	TrainView,
	TrainWorking,
} from "./types";

/** RailOS's floor between any two timetabled actions of one train. */
const MIN_ACTION_GAP = 30;
/** Default time at a platform, when a stop gives none. */
const DEFAULT_DWELL = 30;

export interface RunnerContext {
	graph: RailGraph;
	state: SimState;
	timetable: Timetable;
	log: PerformanceLog;
}

export function serviceByRef(tt: Timetable, ref: string): Service | undefined {
	return tt.services.find((s) => s.ref === ref);
}

/** Every run of every service that brings on a train of its own. */
export function expandRuns(tt: Timetable): ServiceRun[] {
	return tt.services.flatMap((service) => {
		const start = service.actions[0];
		if (start?.kind !== "startNew" && start?.kind !== "startNewShuttle") {
			return [];
		}
		// A shuttle re-uses the one train; only its first repeat is introduced.
		const count =
			start.kind === "startNewShuttle" ? 1 : 1 + (service.repeat?.count ?? 0);
		return Array.from({ length: count }, (_, repeat) => ({
			ref: service.ref,
			repeat,
			status: "pending" as const,
			blockedReported: false,
			trainId: null,
		}));
	});
}

/** Seconds a repeat runs after the first. */
function repeatOffset(service: Service, repeat: number): number {
	return repeat * (service.repeat?.intervalMinutes ?? 0) * 60;
}

/**
 * The headcode of repeat `repeat`: the last four characters of the ref, its
 * last two digits advanced by the repeat's increment, as RailOS does.
 */
export function repeatHeadcode(service: Service, repeat: number): string {
	const headcode = service.ref.slice(-4);
	const step = (service.repeat?.headcodeIncrement ?? 0) * repeat;
	const tail = Number.parseInt(headcode.slice(-2), 10);
	if (step === 0 || Number.isNaN(tail)) return headcode;
	return headcode.slice(0, -2) + String((tail + step) % 100).padStart(2, "0");
}

/** How a log line names a cell: its location, or its grid position. */
export function placeName(node: GraphNode): string {
	return node.location ?? `(${node.cell.gx}, ${node.cell.gy})`;
}

export const actionsOf = (ctx: RunnerContext, w: TrainWorking): Action[] =>
	serviceByRef(ctx.timetable, w.ref)?.actions ?? [];

const offsetOf = (ctx: RunnerContext, w: TrainWorking): number => {
	const service = serviceByRef(ctx.timetable, w.ref);
	return service ? repeatOffset(service, w.repeat) : 0;
};

// ============================================================================
// Bringing trains on
// ============================================================================

/** Start every run that is due and has room to start. */
export function dispatchDue(ctx: RunnerContext): void {
	for (const run of ctx.state.runs) {
		if (run.status !== "pending") continue;
		const service = serviceByRef(ctx.timetable, run.ref);
		const start = service?.actions[0];
		if (
			!service ||
			(start?.kind !== "startNew" && start?.kind !== "startNewShuttle")
		) {
			continue;
		}
		if (ctx.state.time < start.time + repeatOffset(service, run.repeat))
			continue;
		dispatch(ctx, run, service, start);
	}
}

function dispatch(
	ctx: RunnerContext,
	run: ServiceRun,
	service: Service,
	start: ActionOf<"startNew" | "startNewShuttle">,
): void {
	const { graph, state, log } = ctx;
	const headcode = repeatHeadcode(service, run.repeat);
	const position = startPosition(graph, state.lies, start.rear, start.front);
	if (!position || !service.train) {
		log.error(
			state.time,
			`${headcode} cannot be placed at its start position.`,
		);
		run.status = "done";
		return;
	}
	if (segsOccupied(graph, state.trains, position.segs)) {
		if (!run.blockedReported) {
			log.warning(
				state.time,
				`${headcode} is unable to start: its start position is occupied.`,
			);
			run.blockedReported = true;
		}
		return;
	}
	const train = trainFromSpec(
		state.nextTrainId++,
		headcode,
		service.description ?? "",
		service.train,
		{
			ref: service.ref,
			repeat: run.repeat,
			index: 1,
			at: null,
			arrivedAt: null,
			lastActionAt: state.time,
			releaseAt: null,
			extraDwell: 0,
			heldReported: false,
			done: false,
		},
	);
	train.segs = position.segs;
	train.frontM = position.frontM;
	state.trains.push(train);
	run.status = "running";
	run.trainId = train.id;
	introduce(ctx, train, start);
}

function introduce(
	ctx: RunnerContext,
	train: Train,
	start: ActionOf<"startNew" | "startNewShuttle">,
): void {
	const { graph, state, log } = ctx;
	const rear = graph.nodes[train.segs[0].node];
	const frontNode = graph.nodes[train.segs[train.segs.length - 1].node];
	if (rear.kind === "exit") {
		train.speed = safeEntrySpeed(graph, state, train);
		train.status = train.speed > 0 ? "running" : "waiting";
		log.info(
			state.time,
			`${train.headcode} entered railway at ${placeName(rear)}`,
		);
	} else {
		train.speed = 0;
		train.status = "dwelling";
		train.working.at = frontNode.location;
		log.info(
			state.time,
			`${train.headcode} created at ${placeName(frontNode)}`,
		);
	}
	if (start.kind === "startNew" && start.signallerControl) {
		if (rear.kind === "exit") {
			train.control = {
				mode: "signaller",
				order: { kind: "move" },
				restoreLocation: null,
				allowedRedSignalNode: null,
			};
			if (train.speed <= 0) {
				train.status = "waiting";
				train.wait = null;
			}
		} else {
			train.control = {
				mode: "signaller",
				order: { kind: "stop" },
				restoreLocation: null,
				allowedRedSignalNode: null,
			};
			train.speed = 0;
			train.status = "waiting";
			train.wait = "signaller";
		}
		log.info(state.time, `${train.headcode} started under signaller control`);
	}
}

// ============================================================================
// Where a train is going
// ============================================================================

const isCommand = (a: Action): boolean =>
	a.kind !== "stop" && a.kind !== "pass" && a.kind !== "finishExit";

/** The location a running train is next due to stop at, or null. */
export function stopTarget(ctx: RunnerContext, train: Train): string | null {
	const w = train.working;
	if (w.done || train.control.mode === "signaller") return null;
	const actions = actionsOf(ctx, w);
	for (let i = w.index; i < actions.length; i++) {
		const a = actions[i];
		if (a.kind === "stop") return a.location;
		if (isCommand(a)) return null;
	}
	return null;
}

/** What a train does next, for the train list. */
export function nextActionText(ctx: RunnerContext, train: Train): string {
	const w = train.working;
	if (train.status === "crashed") return "crashed";
	if (w.done) return "finished";
	const a = actionsOf(ctx, w)[w.index];
	return a ? describeAction(a, w.at, offsetOf(ctx, w)) : "";
}

/** Short words for the train list; anything missing shows its kind. */
const ACTION_WORDS: Partial<Record<Action["kind"], string>> = {
	pass: "pass",
	changeDirection: "reverse",
	changeDescription: "rename",
	changeMaxSpeed: "new max speed",
	frontSplit: "split",
	rearSplit: "split",
	joinedBy: "joined by",
	finishNewService: "next service",
	finishToShuttle: "to shuttle",
	finishJoin: "join",
	finishExit: "exit",
	finishRemainHere: "terminates",
	finishShuttleRemainHere: "shuttle",
	finishShuttleNewService: "shuttle",
};

function describeAction(a: Action, at: string | null, offset: number): string {
	const departing = a.kind === "stop" && a.location === at;
	const verb =
		a.kind === "stop"
			? departing
				? "dep"
				: "arr"
			: (ACTION_WORDS[a.kind] ?? a.kind);
	const time =
		a.kind === "stop" && departing
			? (a.depart ?? a.arrive ?? null)
			: actionTime(a);
	const when = time === null ? null : formatSimTime(time + offset);
	return [verb, actionLocation(a), when].filter(Boolean).join(" ");
}

function formatStopAction(
	a: ActionOf<"stop">,
	offset: number,
): Pick<TrainTimetableEntry, "time" | "label"> {
	if (a.arrive !== undefined && a.depart !== undefined) {
		return {
			time: `${formatSimTime(a.arrive + offset)}–${formatSimTime(a.depart + offset)}`,
			label: a.location,
		};
	}
	if (a.arrive !== undefined) {
		return {
			time: formatSimTime(a.arrive + offset),
			label: `arr ${a.location}`,
		};
	}
	if (a.depart !== undefined) {
		return {
			time: formatSimTime(a.depart + offset),
			label: `dep ${a.location}`,
		};
	}
	return { time: null, label: a.location };
}

type TimetableActionFormatters = {
	[K in Action["kind"]]: (
		a: ActionOf<K>,
		offset: number,
	) => Pick<TrainTimetableEntry, "time" | "label">;
};

const TIMETABLE_ACTION_FORMATTERS: TimetableActionFormatters = {
	startNew: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: "start",
	}),
	startNewService: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `from ${a.fromRef}`,
	}),
	startFromSplit: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `split from ${a.fromRef}`,
	}),
	stop: formatStopAction,
	pass: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `pass ${a.location}`,
	}),
	changeDirection: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: "reverse",
	}),
	changeDescription: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `rename "${a.description}"`,
	}),
	changeMaxSpeed: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `max ${a.maxSpeedKmh} km/h`,
	}),
	frontSplit: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `split → ${a.newRef}`,
	}),
	rearSplit: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `split → ${a.newRef}`,
	}),
	joinedBy: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `joined by ${a.otherRef}`,
	}),
	finishNewService: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `→ ${a.nextRef}`,
	}),
	finishJoin: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `join ${a.otherRef}`,
	}),
	finishToShuttle: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `→ shuttle ${a.nextRef}`,
	}),
	finishExit: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: "exit",
	}),
	finishRemainHere: () => ({ time: null, label: "terminates" }),
	startNewShuttle: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `shuttle ↔ ${a.otherRef}`,
	}),
	startShuttle: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `shuttle from ${a.fromRef}`,
	}),
	startFromShuttle: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `from shuttle ${a.fromRef}`,
	}),
	finishShuttleRemainHere: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `shuttle ↔ ${a.otherRef}`,
	}),
	finishShuttleNewService: (a, offset) => ({
		time: formatSimTime(a.time + offset),
		label: `shuttle ↔ ${a.otherRef} → ${a.nextRef}`,
	}),
};

function formatTimetableAction(
	a: Action,
	offset: number,
): Pick<TrainTimetableEntry, "time" | "label"> {
	return (
		TIMETABLE_ACTION_FORMATTERS[a.kind] as (
			action: Action,
			offset: number,
		) => Pick<TrainTimetableEntry, "time" | "label">
	)(a, offset);
}

/** Booked timetable rows for `train`'s working, formatted once with repeat offsets applied. */
export function trainTimetableRows(
	ctx: RunnerContext,
	train: Train,
): TrainTimetableRow[] {
	const w = train.working;
	const offset = offsetOf(ctx, w);
	return actionsOf(ctx, w).map((a) => formatTimetableAction(a, offset));
}

/**
 * Where step `i` of a working stands: done once passed (or once a finished
 * working's train has run its course), next while it is the current action of
 * a live train, otherwise upcoming.
 */
export function timetableStepState(
	i: number,
	index: number,
	workingDone: boolean,
	status: TrainStatus,
): TrainTimetableState {
	if (i < index || (workingDone && status === "finished")) return "done";
	if (!workingDone && status !== "crashed" && i === index) return "next";
	return "upcoming";
}

/** Rows with their step states derived from a train view's position in them. */
export function timetableEntries(
	rows: readonly TrainTimetableRow[],
	train: Pick<TrainView, "timetableIndex" | "workingDone" | "status">,
): TrainTimetableEntry[] {
	return rows.map((row, i) => ({
		...row,
		state: timetableStepState(
			i,
			train.timetableIndex,
			train.workingDone,
			train.status,
		),
	}));
}

// ============================================================================
// At a location
// ============================================================================

/** Carry out whatever a dwelling train is due to do, and let it go when due. */
export function workDwelling(ctx: RunnerContext, train: Train): void {
	for (let guard = 0; guard < 16 && train.status === "dwelling"; guard++) {
		if (!workOne(ctx, train)) return;
	}
}

/** One action; true when the train moved on to its next action. */
function workOne(ctx: RunnerContext, train: Train): boolean {
	const w = train.working;
	const a = actionsOf(ctx, w)[w.index];
	if (!a) return false;
	switch (a.kind) {
		case "stop":
			if (a.location === w.at) departFromStop(ctx, train, a);
			else leaveWhenReady(ctx, train);
			return false;
		case "pass":
		case "finishExit":
			leaveWhenReady(ctx, train);
			return false;
		case "finishRemainHere":
			remainHere(ctx, train);
			return false;
		case "changeDirection":
		case "changeDescription":
		case "changeMaxSpeed":
		case "finishNewService":
			return runCommand(ctx, train, a);
		case "frontSplit":
		case "rearSplit":
			return splitTrain(ctx, train, a);
		case "joinedBy":
			return joinedBy(ctx, train, a);
		case "finishJoin":
			awaitJoin(ctx, train, a);
			return false;
		case "finishToShuttle":
		case "finishShuttleRemainHere":
		case "finishShuttleNewService":
			return runShuttleFinish(ctx, train, a);
		default:
			holdUnsupported(ctx, train, a);
			return false;
	}
}

const minDwell = (a: ActionOf<"stop">): number =>
	a.minDwellSeconds ?? DEFAULT_DWELL;

/** RailOS's release time: the booked time, the minimum dwell, and the action gap. */
function releaseTime(w: TrainWorking, booked: number, dwell: number): number {
	const floors = [booked, w.lastActionAt + MIN_ACTION_GAP];
	if (w.arrivedAt !== null) floors.push(w.arrivedAt + dwell + w.extraDwell);
	return Math.max(...floors);
}

function departFromStop(
	ctx: RunnerContext,
	train: Train,
	a: ActionOf<"stop">,
): void {
	const w = train.working;
	const booked = (a.depart ?? a.arrive ?? 0) + offsetOf(ctx, w);
	w.releaseAt ??= releaseTime(w, booked, minDwell(a));
	if (ctx.state.time < w.releaseAt) return;
	ctx.log.timed(
		ctx.state.time,
		booked,
		`${train.headcode} departed from ${a.location}`,
		"departure",
	);
	w.index++;
	setOff(ctx, train);
}

/** The train's next booking is elsewhere: go once the dwell and gap are up. */
function leaveWhenReady(ctx: RunnerContext, train: Train): void {
	const w = train.working;
	w.releaseAt ??= releaseTime(w, Number.NEGATIVE_INFINITY, DEFAULT_DWELL);
	if (ctx.state.time >= w.releaseAt) setOff(ctx, train);
}

function setOff(ctx: RunnerContext, train: Train): void {
	const w = train.working;
	w.at = null;
	w.arrivedAt = null;
	w.releaseAt = null;
	w.extraDwell = 0;
	w.lastActionAt = ctx.state.time;
	train.status = "waiting";
	train.wait = null;
}

function remainHere(ctx: RunnerContext, train: Train): void {
	const w = train.working;
	if (w.done) return;
	w.done = true;
	train.status = "finished";
	const where =
		w.at ?? placeName(ctx.graph.nodes[train.segs[train.segs.length - 1].node]);
	ctx.log.info(ctx.state.time, `${train.headcode} terminated at ${where}`);
}

function holdUnsupported(ctx: RunnerContext, train: Train, a: Action): void {
	const w = train.working;
	if (w.heldReported) return;
	w.heldReported = true;
	ctx.log.warning(
		ctx.state.time,
		`${train.headcode} is held: "${a.kind}" is not supported by the simulator yet.`,
	);
}

type Command = ActionOf<
	| "changeDirection"
	| "changeDescription"
	| "changeMaxSpeed"
	| "finishNewService"
>;

function runCommand(ctx: RunnerContext, train: Train, a: Command): boolean {
	const w = train.working;
	const now = ctx.state.time;
	if (now < a.time + offsetOf(ctx, w) || now < w.lastActionAt + MIN_ACTION_GAP)
		return false;
	const where =
		w.at ?? placeName(ctx.graph.nodes[train.segs[train.segs.length - 1].node]);
	switch (a.kind) {
		case "changeDirection":
			reverse(ctx.graph, train);
			ctx.log.info(now, `${train.headcode} changed direction at ${where}`);
			break;
		case "changeDescription":
			train.description = a.description;
			ctx.log.info(
				now,
				`${train.headcode} changed its description to '${a.description}' at ${where}`,
			);
			break;
		case "changeMaxSpeed":
			train.maxSpeed = a.maxSpeedKmh / 3.6;
			ctx.log.info(
				now,
				`${train.headcode} changed its maximum speed to ${a.maxSpeedKmh} km/h at ${where}`,
			);
			break;
		case "finishNewService":
			return becomeService(ctx, train, a.nextRef, where);
	}
	w.index++;
	w.lastActionAt = now;
	w.releaseAt = null;
	return true;
}

export function becomeService(
	ctx: RunnerContext,
	train: Train,
	nextRef: string,
	where: string,
	logMessage?: string,
	repeat?: number,
): boolean {
	const next = serviceByRef(ctx.timetable, nextRef);
	const w = train.working;
	if (!next) {
		holdUnsupported(ctx, train, actionsOf(ctx, w)[w.index]);
		return false;
	}
	const old = train.headcode;
	if (repeat !== undefined) w.repeat = repeat;
	train.headcode = repeatHeadcode(next, w.repeat);
	if (next.description) train.description = next.description;
	w.ref = next.ref;
	w.index = 1;
	w.lastActionAt = ctx.state.time;
	w.releaseAt = null;
	w.heldReported = false;
	w.done = false;
	ctx.log.info(
		ctx.state.time,
		logMessage ?? `${old} became new service ${train.headcode} at ${where}`,
	);
	return true;
}

/** Turn a train round where it stands: the old rear becomes the front. */
export function reverse(graph: RailGraph, train: Train): void {
	const lengths = train.segs.map((s) => segLengthOf(graph, s));
	const behind =
		lengths.slice(0, -1).reduce((sum, len) => sum + len, 0) + train.frontM;
	const rearInto = Math.max(0, behind - train.lengthM);
	train.segs = train.segs
		.map((s) => ({ node: s.node, entry: s.exit, exit: s.entry }))
		.reverse();
	train.frontM = lengths[0] - rearInto;
}

export function segLengthOf(graph: RailGraph, seg: Seg): number {
	return (
		graph.nodes[seg.node].paths.find(
			(p) => p.entry === seg.entry && p.exit === seg.exit,
		)?.lengthM ?? 0
	);
}

// ============================================================================
// Splits and joins
// ============================================================================

/** A segment walked from the train, and whether the points on it lie against it. */
interface Walked {
	seg: Seg;
	derail: boolean;
}

/**
 * The next segment in the train's direction (`dir` 1) or back the way it came
 * (`dir` -1). The returned segment always faces the train's direction.
 */
function walk(ctx: RunnerContext, from: Seg, dir: 1 | -1): Walked | null {
	const facing = dir === 1 ? from : flip(from);
	const next = nextSeg(ctx.graph, ctx.state.lies, facing);
	if (!next) return null;
	return {
		seg: dir === 1 ? next : flip(next),
		derail: liesAgainst(ctx.graph, ctx.state.lies, next),
	};
}

const flip = (seg: Seg): Seg => ({
	node: seg.node,
	entry: seg.exit,
	exit: seg.entry,
});

/** Where a dwelling train is, for a log line. */
function standingAt(ctx: RunnerContext, train: Train): string {
	if (train.working.at) return train.working.at;
	const seg = train.segs[train.segs.length - 1];
	return seg ? placeName(ctx.graph.nodes[seg.node]) : "the railway";
}

/**
 * The named location a split is attempted at: where the working says it is
 * stopped, else the front cell's name, else the rear cell's.
 */
function splitLocation(ctx: RunnerContext, train: Train): string | null {
	if (train.working.at) return train.working.at;
	const lead = train.segs[train.segs.length - 1];
	const mid = train.segs[0];
	if (lead) {
		const name = ctx.graph.nodes[lead.node].location;
		if (name) return name;
	}
	return mid ? ctx.graph.nodes[mid.node].location : null;
}

/** Say `report` once per action, until the action is carried out. */
function reportOnce(train: Train, report: () => void): void {
	if (train.working.heldReported) return;
	train.working.heldReported = true;
	report();
}

/** Booked time reached, and 30 s since this train's previous action. */
function actionDue(ctx: RunnerContext, train: Train, time: number): boolean {
	const w = train.working;
	return (
		ctx.state.time >= time + offsetOf(ctx, w) &&
		ctx.state.time >= w.lastActionAt + MIN_ACTION_GAP
	);
}

/**
 * Headcode of the service a split or join names, advanced by this train's own
 * repeat — RailOS takes the increment from the train that is acting.
 */
function linkedHeadcode(ctx: RunnerContext, train: Train, ref: string): string {
	const service = serviceByRef(ctx.timetable, ref);
	if (!service) return ref.slice(-4);
	const parent = serviceByRef(ctx.timetable, train.working.ref);
	return repeatHeadcode(
		applyPatch(service, { repeat: parent?.repeat ?? service.repeat }),
		train.working.repeat,
	);
}

interface SplitEnds {
	/** Rear portion, rear cell then front cell, facing the original train. */
	rear: [Seg, Seg];
	front: [Seg, Seg];
	/** Cells the original train does not already occupy, which must be clear. */
	check: Walked[];
}

interface SplitWalks {
	mid: Seg;
	lead: Seg;
	fwd1: Walked | null;
	fwd2: Walked | null;
	rwd1: Walked | null;
	rwd2: Walked | null;
	numFwd: number;
	numFwdNamed: number;
	numRwd: number;
	numRwdNamed: number;
}

function countWalkReach(
	first: Walked | null,
	second: Walked | null,
	isNamed: (w: Walked) => boolean,
	baseCount: number,
	baseNamed: number,
): { count: number; named: number } {
	if (!first) return { count: baseCount, named: baseNamed };
	let count = baseCount + 1;
	let named = isNamed(first) ? baseCount + 1 : baseNamed;
	if (second) {
		count = baseCount + 2;
		if (isNamed(second)) named = baseCount + 2;
	}
	return { count, named };
}

function tryNamedSplit(w: SplitWalks): SplitEnds | null {
	const { mid, lead, fwd1, fwd2, rwd1, rwd2 } = w;
	if (w.numFwdNamed === 2 && fwd1 && fwd2) {
		return {
			rear: [mid, lead],
			front: [fwd1.seg, fwd2.seg],
			check: [fwd1, fwd2],
		};
	}
	if (
		w.numFwdNamed === 1 &&
		w.numRwdNamed >= 1 &&
		w.numRwd >= 2 &&
		fwd1 &&
		rwd1
	) {
		return {
			rear: [rwd1.seg, mid],
			front: [lead, fwd1.seg],
			check: [fwd1, rwd1],
		};
	}
	if (w.numRwdNamed >= 2 && w.numRwd === 3 && rwd1 && rwd2) {
		return {
			rear: [rwd2.seg, rwd1.seg],
			front: [mid, lead],
			check: [rwd1, rwd2],
		};
	}
	return null;
}

function tryOverhangSplit(w: SplitWalks): SplitEnds | null {
	const { mid, lead, fwd1, fwd2, rwd1 } = w;
	if (w.numFwdNamed === 1 && w.numFwd === 2 && fwd1 && fwd2) {
		return {
			rear: [mid, lead],
			front: [fwd1.seg, fwd2.seg],
			check: [fwd1, fwd2],
		};
	}
	if (w.numFwd >= 1 && w.numRwdNamed >= 1 && w.numRwd >= 2 && fwd1 && rwd1) {
		return {
			rear: [rwd1.seg, mid],
			front: [lead, fwd1.seg],
			check: [fwd1, rwd1],
		};
	}
	return null;
}

/**
 * Four cells for a split, preferring the front portion on the named location.
 * The order is RailOS's `ThisLocationLongEnoughForSplit`: two cells ahead,
 * then one ahead and one behind, then two behind, then the same with the
 * front allowed to overhang the name.
 */
function splitEnds(
	ctx: RunnerContext,
	train: Train,
	location: string,
): SplitEnds | "short" | "points" | "train" {
	const mid = train.segs[0];
	const lead = train.segs[train.segs.length - 1];
	if (!mid || !lead || mid === lead) return "short";

	const fwd1 = walk(ctx, lead, 1);
	const fwd2 = fwd1 ? walk(ctx, fwd1.seg, 1) : null;
	const rwd1 = walk(ctx, mid, -1);
	const rwd2 = rwd1 ? walk(ctx, rwd1.seg, -1) : null;
	const isNamed = (w: Walked) =>
		ctx.graph.nodes[w.seg.node].location === location;
	const fwd = countWalkReach(fwd1, fwd2, isNamed, 0, 0);
	const rwd = countWalkReach(
		rwd1,
		rwd2,
		isNamed,
		1,
		ctx.graph.nodes[mid.node].location === location ? 1 : 0,
	);
	const walks: SplitWalks = {
		mid,
		lead,
		fwd1,
		fwd2,
		rwd1,
		rwd2,
		numFwd: fwd.count,
		numFwdNamed: fwd.named,
		numRwd: rwd.count,
		numRwdNamed: rwd.named,
	};

	const chosen = tryNamedSplit(walks) ?? tryOverhangSplit(walks);
	if (!chosen) return "short";
	if (chosen.check.some((w) => w.derail)) return "points";
	const occupied = segsOccupied(
		ctx.graph,
		ctx.state.trains,
		chosen.check.map((w) => w.seg),
		train,
	);
	return occupied ? "train" : chosen;
}

/** Stand on two cells with the front at the far edge of the second. */
function placePortion(
	graph: RailGraph,
	train: Train,
	rear: Seg,
	front: Seg,
): void {
	train.segs = [rear, front];
	train.frontM = segLengthOf(graph, front);
	train.speed = 0;
	train.status = "dwelling";
	train.wait = null;
}

/**
 * Divide a dwelling train. The continuing train keeps one half and a new train
 * is created for `newRef`, which starts at `startFromSplit`. Mass and power
 * are shared equally; brake rate and maximum speed are not.
 */
function splitTrain(
	ctx: RunnerContext,
	train: Train,
	a: ActionOf<"frontSplit" | "rearSplit">,
): boolean {
	if (!actionDue(ctx, train, a.time)) return false;
	const where = splitLocation(ctx, train);
	if (!where) {
		reportOnce(train, () =>
			ctx.log.error(
				ctx.state.time,
				`${train.headcode} failed to split - location too short at ${standingAt(ctx, train)}`,
			),
		);
		return false;
	}
	const ends = splitEnds(ctx, train, where);
	if (ends === "short") {
		reportOnce(train, () =>
			ctx.log.error(
				ctx.state.time,
				`${train.headcode} failed to split - location too short at ${where}`,
			),
		);
		return false;
	}
	if (ends === "points" || ends === "train") {
		// Retry every 30 s, once the other train moves or the points are changed.
		train.working.lastActionAt = ctx.state.time;
		const why =
			ends === "points" ? "points set wrongly" : "other train obstructing";
		reportOnce(train, () =>
			ctx.log.warning(
				ctx.state.time,
				`${train.headcode} unable to split - ${why} at ${where}`,
			),
		);
		return false;
	}

	const service = serviceByRef(ctx.timetable, a.newRef);
	if (!service) {
		reportOnce(train, () =>
			ctx.log.error(
				ctx.state.time,
				`${train.headcode} failed to split - no service ${a.newRef}`,
			),
		);
		return false;
	}

	const now = ctx.state.time;
	const newMass = train.massKg / 2;
	const newPower = train.powerW / 2;
	const newLengthM = train.lengthM / 2;
	train.massKg -= newMass;
	train.powerW -= newPower;
	train.lengthM -= newLengthM;
	const frontSplit = a.kind === "frontSplit";
	if (frontSplit) train.working.extraDwell += MIN_ACTION_GAP;

	const portion = portionTrain(
		ctx,
		train,
		service,
		newMass,
		newPower,
		newLengthM,
		where,
	);
	if (!frontSplit) portion.working.extraDwell += MIN_ACTION_GAP;
	const [rearRear, rearFront] = ends.rear;
	const [frontRear, frontFront] = ends.front;
	if (frontSplit) {
		placePortion(ctx.graph, train, rearRear, rearFront);
		placePortion(ctx.graph, portion, frontRear, frontFront);
	} else {
		placePortion(ctx.graph, train, frontRear, frontFront);
		placePortion(ctx.graph, portion, rearRear, rearFront);
	}
	ctx.state.trains.push(portion);

	const other = portion.headcode;
	const side = frontSplit ? "front" : "rear";
	ctx.log.info(
		now,
		`${train.headcode} split mass%-Power% = 50-50 from ${side} to ${other} at ${where}`,
	);
	ctx.log.info(now, `${other} created at ${where}`);

	train.working.index++;
	train.working.lastActionAt = now;
	train.working.releaseAt = null;
	train.working.heldReported = false;
	train.working.at = where;
	return true;
}

/** The train a split creates, standing in for `service` at the same repeat. */
function portionTrain(
	ctx: RunnerContext,
	parent: Train,
	service: Service,
	massKg: number,
	powerW: number,
	lengthM: number,
	where: string,
): Train {
	const now = ctx.state.time;
	const portion = trainFromSpec(
		ctx.state.nextTrainId++,
		linkedHeadcode(ctx, parent, service.ref),
		service.description ?? parent.description,
		{
			startSpeedKmh: 0,
			maxSpeedKmh: parent.maxSpeed * 3.6,
			massTonnes: massKg / 1000,
			brakeForceTonnes: 1,
			powerKw: powerW / 1000,
		},
		{
			ref: service.ref,
			repeat: parent.working.repeat,
			index: 1,
			at: where,
			arrivedAt: parent.working.arrivedAt,
			lastActionAt: now,
			releaseAt: null,
			extraDwell: 0,
			heldReported: false,
			done: false,
		},
	);
	portion.massKg = massKg;
	portion.powerW = powerW;
	portion.brakeRate = parent.brakeRate;
	portion.maxSpeed = parent.maxSpeed;
	portion.signallerMaxSpeed = parent.signallerMaxSpeed;
	portion.lengthM = lengthM;
	return portion;
}

/**
 * Where a shuttle finish sends the train: the next repeat of the service it
 * alternates with, or — on the last repeat — the non-repeating service it
 * forms. `finishShuttleRemainHere` ends the day instead.
 */
function runShuttleFinish(
	ctx: RunnerContext,
	train: Train,
	a: ActionOf<
		"finishToShuttle" | "finishShuttleRemainHere" | "finishShuttleNewService"
	>,
): boolean {
	if (!actionDue(ctx, train, a.time)) return false;
	const where = standingAt(ctx, train);
	if (a.kind === "finishToShuttle") {
		return becomeService(ctx, train, a.nextRef, where, undefined, 0);
	}
	const total =
		serviceByRef(ctx.timetable, train.working.ref)?.repeat?.count ?? 0;
	if (train.working.repeat < total) {
		return becomeService(
			ctx,
			train,
			a.otherRef,
			where,
			undefined,
			train.working.repeat + 1,
		);
	}
	if (a.kind === "finishShuttleRemainHere") {
		remainHere(ctx, train);
		return false;
	}
	return becomeService(ctx, train, a.nextRef, where, undefined, 0);
}

/**
 * The follow-on a train can become, and which repeat of it. A shuttle that
 * still has repeats left returns to the service it alternates with; its last
 * repeat forms the non-repeating service, when it has one.
 */
export interface ServiceHandover {
	ref: string;
	repeat: number;
	/** Index of the finish action this handover comes from. */
	actionIndex: number;
}

export function handoverTarget(
	ctx: RunnerContext,
	train: Train,
): ServiceHandover | null {
	const actions = actionsOf(ctx, train.working);
	const w = train.working;
	for (let i = w.index; i < actions.length; i++) {
		const a = actions[i];
		if (a.kind === "finishNewService") {
			return { ref: a.nextRef, repeat: w.repeat, actionIndex: i };
		}
		if (a.kind === "finishToShuttle") {
			return { ref: a.nextRef, repeat: 0, actionIndex: i };
		}
		if (
			a.kind === "finishShuttleRemainHere" ||
			a.kind === "finishShuttleNewService"
		) {
			const total = serviceByRef(ctx.timetable, w.ref)?.repeat?.count ?? 0;
			if (w.repeat < total) {
				return { ref: a.otherRef, repeat: w.repeat + 1, actionIndex: i };
			}
			if (a.kind === "finishShuttleNewService") {
				return { ref: a.nextRef, repeat: 0, actionIndex: i };
			}
			return null;
		}
	}
	return null;
}

const JOIN_PARTNER = {
	joinedBy: "finishJoin",
	finishJoin: "joinedBy",
} as const;

/**
 * The train named by a join, stopped on the matching action for the same
 * repeat, and pointing back at this one.
 */
function joinPartner(
	ctx: RunnerContext,
	train: Train,
	otherRef: string,
	expect: "joinedBy" | "finishJoin",
): Train | undefined {
	return ctx.state.trains.find((other) => {
		if (other === train || other.working.done || other.speed > 0) return false;
		if (other.control.mode !== "timetable") return false;
		if (other.working.ref !== otherRef) return false;
		if (other.working.repeat !== train.working.repeat) return false;
		const action = actionsOf(ctx, other.working)[other.working.index];
		return action?.kind === expect && action.otherRef === train.working.ref;
	});
}

/** Whether either end of `a` is the next cell off either end of `b`. */
function trainsAdjacent(ctx: RunnerContext, a: Train, b: Train): boolean {
	const touches = (from: Train, to: Train): boolean => {
		if (from.segs.length === 0) return false;
		const front = from.segs[from.segs.length - 1];
		const rear = from.segs[0];
		const ahead = nextSeg(ctx.graph, ctx.state.lies, front);
		const behindRaw = nextSeg(ctx.graph, ctx.state.lies, flip(rear));
		const cells = [ahead?.node, behindRaw?.node].filter(
			(n): n is number => n !== undefined,
		);
		return to.segs.some((s) => cells.includes(s.node));
	};
	return touches(a, b) || touches(b, a);
}

/**
 * A train that has stopped beside the train it is booked to join can dwell
 * there even when the stop was forced by the train ahead rather than by the
 * end of the platform.
 */
export function dwellForJoin(ctx: RunnerContext, train: Train): void {
	if (train.status === "dwelling" || train.speed > 0) return;
	if (train.control.mode !== "timetable" || train.working.done) return;
	const a = actionsOf(ctx, train.working)[train.working.index];
	if (a?.kind !== "joinedBy" && a?.kind !== "finishJoin") return;
	const partner = joinPartner(ctx, train, a.otherRef, JOIN_PARTNER[a.kind]);
	if (!partner || !trainsAdjacent(ctx, train, partner)) return;
	train.status = "dwelling";
	train.wait = null;
	train.working.at ??= partner.working.at ?? standingAt(ctx, train);
	train.working.arrivedAt ??= ctx.state.time;
	train.working.releaseAt = null;
}

/** `joinedBy` couples the adjacent train on and deletes it. */
function joinedBy(
	ctx: RunnerContext,
	train: Train,
	a: ActionOf<"joinedBy">,
): boolean {
	if (!actionDue(ctx, train, a.time)) return false;
	const where = standingAt(ctx, train);
	const partner = joinPartner(ctx, train, a.otherRef, "finishJoin");
	if (!partner || !trainsAdjacent(ctx, train, partner)) {
		reportOnce(train, () =>
			ctx.log.warning(
				ctx.state.time,
				`${train.headcode} waiting to be joined by ${linkedHeadcode(ctx, train, a.otherRef)} at ${where}`,
			),
		);
		return false;
	}
	return couple(ctx, train, partner, where);
}

/** `finishJoin` waits; the train it couples onto does the work. */
function awaitJoin(
	ctx: RunnerContext,
	train: Train,
	a: ActionOf<"finishJoin">,
): void {
	if (!actionDue(ctx, train, a.time)) return;
	const partner = joinPartner(ctx, train, a.otherRef, "joinedBy");
	if (partner && trainsAdjacent(ctx, train, partner)) return;
	reportOnce(train, () =>
		ctx.log.warning(
			ctx.state.time,
			`${train.headcode} waiting to join ${linkedHeadcode(ctx, train, a.otherRef)} at ${standingAt(ctx, train)}`,
		),
	);
}

/**
 * Merge `absorbed` physically and operationally into `into`, release any
 * route segments `absorbed` no longer holds, and remove `absorbed` from the
 * railway. Used by both timetabled joins and signaller joins.
 */
export function mergeTrainInto(
	ctx: RunnerContext,
	into: Train,
	absorbed: Train,
): void {
	const mass = into.massKg + absorbed.massKg;
	into.brakeRate =
		(into.brakeRate * into.massKg + absorbed.brakeRate * absorbed.massKg) /
		mass;
	into.massKg = mass;
	into.powerW += absorbed.powerW;
	into.maxSpeed = Math.min(into.maxSpeed, absorbed.maxSpeed);
	if (absorbed.signallerMaxSpeed !== null) {
		into.signallerMaxSpeed =
			into.signallerMaxSpeed !== null
				? Math.min(into.signallerMaxSpeed, absorbed.signallerMaxSpeed)
				: absorbed.signallerMaxSpeed;
	}
	into.lengthM += absorbed.lengthM;
	if (absorbed.reminder && !into.reminder) {
		into.reminder = absorbed.reminder;
	} else if (absorbed.reminder && into.reminder) {
		into.reminder = `${into.reminder}; ${absorbed.reminder}`;
	}

	for (const seg of absorbed.segs) {
		if (!into.segs.some((kept) => sameSeg(kept, seg))) {
			releaseBehind(ctx.state, seg);
		}
	}
	absorbed.callingOn = false;
	absorbed.callingOnAllowed = false;
	if (absorbed.allowedCallOnNode !== null) {
		clearCallingOnSignal(ctx.state, absorbed.allowedCallOnNode);
		absorbed.allowedCallOnNode = null;
	}

	absorbed.working.done = true;
	absorbed.status = "finished";
	absorbed.speed = 0;
	const run = ctx.state.runs.find((r) => r.trainId === absorbed.id);
	if (run) run.status = "done";
	ctx.state.trains = ctx.state.trains.filter((t) => t !== absorbed);
}

/**
 * Add `partner` into `train` and remove `partner`. Both must already be
 * adjacent and stopped. The join itself waits 30 s after the later of the
 * two trains reached its action.
 */
function couple(
	ctx: RunnerContext,
	train: Train,
	partner: Train,
	where: string,
): boolean {
	const gate = Math.max(
		train.working.lastActionAt,
		partner.working.lastActionAt,
	);
	if (ctx.state.time < gate + MIN_ACTION_GAP) {
		if (train.working.lastActionAt < gate) train.working.lastActionAt = gate;
		return false;
	}
	const ready = (t: Train): number =>
		(t.working.arrivedAt ?? ctx.state.time) + t.working.extraDwell;
	if (ready(partner) > ready(train)) {
		train.working.arrivedAt = partner.working.arrivedAt;
		train.working.extraDwell = partner.working.extraDwell;
	}
	mergeTrainInto(ctx, train, partner);

	const now = ctx.state.time;
	ctx.log.info(
		now,
		`${train.headcode} joined by ${partner.headcode} at ${where}`,
	);
	train.working.index++;
	train.working.lastActionAt = now;
	train.working.releaseAt = null;
	train.working.heldReported = false;
	return true;
}

// ============================================================================
// What trains report
// ============================================================================

/** Where a missed action was booked to happen. */
function missedWhere(ctx: RunnerContext, train: Train, a: Action): string {
	return actionLocation(a) ?? standingAt(ctx, train);
}

/** Actions from `from` to before `to`, logged as missed. */
function missBetween(
	ctx: RunnerContext,
	train: Train,
	from: number,
	to: number,
): void {
	const actions = actionsOf(ctx, train.working);
	for (let i = from; i < to; i++) {
		const a = actions[i];
		const where = missedWhere(ctx, train, a);
		if (a.kind === "stop") {
			ctx.state.counters.missedStops++;
			ctx.log.error(
				ctx.state.time,
				`${train.headcode} missed its stop at ${a.location}`,
			);
			continue;
		}
		const missed = missedEvent(train.headcode, a, where);
		if (!missed) continue;
		ctx.state.counters.otherMissedEvents++;
		ctx.log.error(ctx.state.time, missed);
	}
}

const MISSED_EVENT_PHRASE: Partial<Record<Action["kind"], string>> = {
	pass: "missed passing",
	frontSplit: "failed to split at",
	rearSplit: "failed to split at",
	joinedBy: "failed to be joined by another train at",
	finishJoin: "failed to join another train at",
	finishNewService: "failed to form a new service at",
	finishToShuttle: "failed to form a new service at",
	finishShuttleRemainHere: "failed to form a new service at",
	finishShuttleNewService: "failed to form a new service at",
	finishRemainHere: "failed to terminate at",
};

/** RailOS's wording for an action a train ran past, or null when it is not counted. */
function missedEvent(
	headcode: string,
	a: Action,
	where: string,
): string | null {
	const phrase = MISSED_EVENT_PHRASE[a.kind];
	return phrase ? `${headcode} ${phrase} ${where}` : null;
}

/**
 * The index of the next stop or pass at `location`, before the train next
 * does anything else, or -1.
 */
function findBooking(
	actions: Action[],
	from: number,
	location: string,
): number {
	for (let i = from; i < actions.length; i++) {
		const a = actions[i];
		if ((a.kind === "stop" || a.kind === "pass") && a.location === location)
			return i;
		if (a.kind !== "stop" && a.kind !== "pass") return -1;
	}
	return -1;
}

/** A train's front has come onto a location it was not on before. */
export function onEnterLocation(
	ctx: RunnerContext,
	train: Train,
	location: string,
): void {
	const w = train.working;
	if (w.done || train.control.mode === "signaller") return;
	const actions = actionsOf(ctx, w);
	const j = findBooking(actions, w.index, location);
	if (j < 0) return;
	missBetween(ctx, train, w.index, j);
	w.index = j;
	const a = actions[j];
	if (a.kind !== "pass") return;
	ctx.log.timed(
		ctx.state.time,
		a.time + offsetOf(ctx, w),
		`${train.headcode} passed ${location}`,
		"pass",
	);
	w.index++;
	w.lastActionAt = ctx.state.time;
}

/** A train has come to rest at the end of the platforms it was due to stop at. */
export function onStationStop(
	ctx: RunnerContext,
	train: Train,
	location: string,
): void {
	const w = train.working;
	const a = actionsOf(ctx, w)[w.index];
	if (a?.kind !== "stop" || a.location !== location) return;
	const booked = (a.arrive ?? a.depart ?? 0) + offsetOf(ctx, w);
	ctx.log.timed(
		ctx.state.time,
		booked,
		`${train.headcode} arrived at ${location}`,
		"arrival",
	);
	w.at = location;
	w.arrivedAt = ctx.state.time;
	w.lastActionAt = ctx.state.time;
	w.releaseAt = null;
	train.status = "dwelling";
	// A stop with one time is an arrival only; with both, the departure waits.
	if (a.arrive === undefined || a.depart === undefined) w.index++;
}

/** A train has left the railway through the exit `seg`. */
export function onLeftRailway(
	ctx: RunnerContext,
	train: Train,
	seg: Seg,
): void {
	const { graph, state, log } = ctx;
	const w = train.working;
	const node = graph.nodes[seg.node];
	const actions = actionsOf(ctx, w);
	const j = actions.findIndex(
		(a, i) => i >= w.index && a.kind === "finishExit",
	);
	const finish = actions[j];
	const run = state.runs.find((r) => r.trainId === train.id);
	if (run) run.status = "done";
	if (w.done || finish?.kind !== "finishExit") {
		if (!w.done) {
			missBetween(ctx, train, w.index, actions.length);
			state.counters.unexpectedExits++;
			log.error(
				state.time,
				`${train.headcode} left the railway unexpectedly at ${placeName(node)}`,
			);
		}
		return;
	}
	missBetween(ctx, train, w.index, j);
	const here = cellKey(node.cell);
	if (!finish.exits.some((c) => cellKey(c) === here)) {
		state.counters.incorrectExits++;
		log.error(
			state.time,
			`${train.headcode} left the railway at the wrong exit, ${placeName(node)}`,
		);
		return;
	}
	log.timed(
		state.time,
		finish.time + offsetOf(ctx, w),
		`${train.headcode} left railway at ${placeName(node)}`,
		"exit",
	);
}
