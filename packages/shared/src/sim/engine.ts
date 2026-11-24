/**
 * The simulation engine: one railway, one timetable, and everything that
 * happens on them once the signaller starts the clock.
 *
 * It is pure TypeScript with no I/O. A host — a Web Worker today, a server
 * later — feeds it commands and time, and reads back a {@link SimView} and the
 * log lines it produced.
 */

import type { Map_ } from "../railway/map/map";
import type { Timetable } from "../railway/timetable/types";
import { callOn, refreshCallingOnFlags } from "./callingOn";
import { afterPause, afterRun, isSpeed, SIM_DT } from "./clock";
import {
	availableFollowOnService,
	canRestoreTimetable,
	handleTrainCommand,
} from "./control";
import { initialCrossings, workCrossings } from "./crossings";
import {
	buildGraph,
	nodeOf,
	occKeyOf,
	type RailGraph,
	type Seg,
} from "./graph";
import { PerformanceLog } from "./log";
import { trainKeys } from "./occupancy";
import {
	cancelOnWrongEntry,
	cancelRoute,
	checkRouteStart,
	commitPendingRoute,
	releaseBehind,
	setAllAutoRoutes,
	setRoute,
	togglePoints,
} from "./routes";
import { computeAspects } from "./signalling";
import {
	dispatchDue,
	dwellForJoin,
	expandRuns,
	nextActionText,
	onEnterLocation,
	onLeftRailway,
	onStationStop,
	placeName,
	type RunnerContext,
	stopTarget,
	trainTimetableRows,
	workDwelling,
} from "./timetable";
import { approaching, type MoveEvent, moveTrain, trainSpans } from "./trains";
import type {
	CommandResult,
	Counters,
	LogLine,
	SimCommand,
	SimState,
	SimView,
	Train,
	TrainTimetableRow,
	ViewSeg,
	WaitReason,
} from "./types";

export interface EngineOptions {
	map: Map_;
	timetable: Timetable;
}

export interface Engine {
	readonly graph: RailGraph;
	readonly timetable: Timetable;
	/** The live state, for tests and the host's save; treat as read-only. */
	readonly state: SimState;
	handle(cmd: SimCommand): CommandResult;
	/** Run the clock on by `seconds` of timetable time, in fixed steps. */
	advance(seconds: number): void;
	view(): SimView;
	/** Log lines produced since the last call, oldest first. */
	drainLog(): LogLine[];
	/**
	 * Formatted timetable rows, keyed by train id, for every train whose working
	 * is new or changed since the last call (everything on the first call).
	 */
	drainTimetables(): Record<number, TrainTimetableRow[]>;
	/** Bumped whenever the state may have changed; equal versions mean an equal view. */
	readonly version: number;
}

/** Zeroed performance counters for a fresh session or test fixture. */
export function emptyCounters(): Counters {
	return {
		onTimeArrivals: 0,
		lateArrivals: 0,
		earlyArrivals: 0,
		totLateArrMins: 0,
		totEarlyArrMins: 0,
		onTimePasses: 0,
		latePasses: 0,
		earlyPasses: 0,
		totLatePassMins: 0,
		totEarlyPassMins: 0,
		onTimeDeps: 0,
		lateDeps: 0,
		totLateDepMins: 0,
		onTimeExits: 0,
		lateExits: 0,
		earlyExits: 0,
		totLateExitMins: 0,
		totEarlyExitMins: 0,
		missedStops: 0,
		otherMissedEvents: 0,
		unexpectedExits: 0,
		incorrectExits: 0,
		spads: 0,
		crashedTrains: 0,
		excessLcDownMins: 0,
	};
}

function initialState(graph: RailGraph, timetable: Timetable): SimState {
	return {
		time: timetable.startTime,
		run: "prestart",
		speed: 1,
		lies: graph.nodes.map((n) => n.defaultLie),
		aspects: graph.nodes.map(() => 0),
		callingOnSignals: [],
		crossings: initialCrossings(graph),
		routes: [],
		pending: null,
		nextRouteId: 1,
		trains: [],
		nextTrainId: 1,
		runs: [],
		counters: emptyCounters(),
	};
}

const ok: CommandResult = { ok: true };
const fail = (message: string): CommandResult => ({ ok: false, message });

function refreshEngineAspects(graph: RailGraph, state: SimState): void {
	const occupied = trainKeys(graph, state.trains);
	state.aspects = computeAspects(graph, state, (route, i) => {
		const seg = route.segs[i];
		return seg !== undefined && occupied.has(occKeyOf(graph, seg));
	});
}

function locationOf(graph: RailGraph, seg: Seg): string | null {
	return nodeOf(graph, seg.node).location;
}

/** A train that has stopped on the platforms it is due at has arrived. */
function handleArrived(
	ctx: RunnerContext,
	train: Train,
	reason: WaitReason,
): void {
	if (train.control.mode === "signaller") return;
	const target = stopTarget(ctx, train);
	const front = train.segs.at(-1);
	const here = front ? locationOf(ctx.graph, front) : null;
	const shortOf = reason === "signal" || reason === "train";
	if (target && here === target && (reason === "station" || shortOf)) {
		onStationStop(ctx, train, target);
	}
}

function handleEnteredEvent(
	ctx: RunnerContext,
	event: Extract<MoveEvent, { type: "entered" }>,
): void {
	const { graph, state, log } = ctx;
	const { train } = event;
	const cancelled = cancelOnWrongEntry(state, event.seg, event.from);
	if (cancelled) {
		log.error(
			state.time,
			`${train.headcode} entered a route from the wrong end at ${placeName(nodeOf(graph, event.seg.node))}; the route was cancelled`,
		);
	}
	const location = locationOf(graph, event.seg);
	if (location && location !== locationOf(graph, event.from)) {
		onEnterLocation(ctx, train, location);
	}
}

function handleCrashEvent(
	ctx: RunnerContext,
	event: Extract<MoveEvent, { type: "crash" | "crossingCrash" | "spad" }>,
): void {
	const { graph, state, log } = ctx;
	const { train } = event;
	if (event.type === "spad") {
		train.callingOn = false;
		train.status = "spad";
		train.speed = 0;
		state.counters.spads++;
		log.error(
			state.time,
			`SPAD: ${train.headcode} PASSED SIGNAL AT DANGER at ${placeName(nodeOf(graph, event.seg.node))}`,
		);
		return;
	}
	if (event.type === "crash") {
		for (const t of [train, event.other]) {
			t.callingOn = false;
			t.status = "crashed";
			t.speed = 0;
		}
		state.counters.crashedTrains += 2;
		log.error(
			state.time,
			`CRASH: ${train.headcode} collided with ${event.other.headcode}`,
		);
		return;
	}
	train.status = "crashed";
	train.speed = 0;
	state.counters.crashedTrains++;
	log.error(
		state.time,
		`CRASH: ${train.headcode} CRASHED INTO ROAD TRAFFIC AT A LEVEL CROSSING at ${placeName(nodeOf(graph, event.seg.node))}`,
	);
}

function handleMoveEvent(ctx: RunnerContext, event: MoveEvent): void {
	const { state } = ctx;
	const { train } = event;
	switch (event.type) {
		case "entered":
			handleEnteredEvent(ctx, event);
			return;
		case "cleared":
			releaseBehind(state, event.seg);
			return;
		case "left":
			releaseBehind(state, event.seg);
			state.trains = state.trains.filter((t) => t !== train);
			onLeftRailway(ctx, train, event.seg);
			return;
		case "spad":
		case "crash":
		case "crossingCrash":
			handleCrashEvent(ctx, event);
			return;
		case "stopped":
			train.callingOn = false;
			handleArrived(ctx, train, event.reason);
			dwellForJoin(ctx, train);
			return;
	}
}

function stepEngine(ctx: RunnerContext): void {
	const { graph, state, timetable } = ctx;
	state.time += SIM_DT;
	commitPendingRoute(graph, state);
	workCrossings(graph, state);
	dispatchDue(ctx);
	for (const train of state.trains) {
		if (train.status === "dwelling" && train.control.mode === "timetable") {
			workDwelling(ctx, train);
		}
	}
	refreshEngineAspects(graph, state);
	const events: MoveEvent[] = [];
	for (const train of [...state.trains]) {
		moveTrain(graph, state, train, stopTarget(ctx, train), SIM_DT, events);
	}
	for (const event of events) handleMoveEvent(ctx, event);
	refreshEngineAspects(graph, state);
	refreshCallingOnFlags(graph, state, timetable);
}

function routeSimCommand(ctx: RunnerContext, cmd: SimCommand): CommandResult {
	const { graph, state, timetable } = ctx;
	const trainResult = handleTrainCommand(ctx, cmd);
	if (trainResult !== null) return trainResult;
	switch (cmd.type) {
		case "checkRouteStart":
			return checkRouteStart(graph, state, cmd.at, cmd.kind);
		case "setRoute":
			return setRoute(graph, state, cmd.from, cmd.to, cmd.kind);
		case "setAllAutoRoutes":
			return setAllAutoRoutes(graph, state);
		case "callOn":
			return callOn(graph, state, timetable, cmd.at);
		case "cancelRoute":
			return cancelRoute(graph, state, cmd.at, (route) =>
				state.trains.some((t) => approaching(graph, state, t, route)),
			);
		case "togglePoints":
			return togglePoints(graph, state, cmd.at);
		default:
			return fail("Unknown command.");
	}
}

function handleEngineCommand(
	ctx: RunnerContext,
	cmd: SimCommand,
): CommandResult {
	const { graph, state, timetable } = ctx;
	switch (cmd.type) {
		case "run": {
			const next = afterRun(state.run);
			if (!next) return fail("The clock is already running.");
			state.run = next;
			return ok;
		}
		case "pause": {
			const next = afterPause(state.run);
			if (!next) return fail("The clock is not running.");
			state.run = next;
			return ok;
		}
		case "setSpeed":
			if (!isSpeed(cmd.speed)) return fail("That is not a clock speed.");
			state.speed = cmd.speed;
			return ok;
		default: {
			const result = routeSimCommand(ctx, cmd);
			// Before the clock starts barriers move at once, so a
			// cancelled route's crossings go straight back up.
			if (state.run === "prestart") workCrossings(graph, state);
			refreshEngineAspects(graph, state);
			refreshCallingOnFlags(graph, state, timetable);
			return result;
		}
	}
}

function toViewSeg(graph: RailGraph, seg: Seg, from = 0, to = 1): ViewSeg {
	const { gx, gy } = nodeOf(graph, seg.node).cell;
	return { gx, gy, entry: seg.entry, exit: seg.exit, from, to };
}

function buildTrainView(
	ctx: RunnerContext,
	t: Train,
): SimView["trains"][number] {
	const { graph } = ctx;
	return {
		id: t.id,
		headcode: t.headcode,
		description: t.description,
		status: t.status,
		wait: t.wait,
		speedKmh: t.speed * 3.6,
		segs: trainSpans(graph, t).map((span) =>
			toViewSeg(graph, span.seg, span.from, span.to),
		),
		next: nextActionText(ctx, t),
		timetableIndex: t.working.index,
		workingDone: t.working.done,
		signallerControl: t.control.mode === "signaller",
		signallerMode:
			t.control.mode === "signaller" ? t.control.order.kind : "stop",
		canRestoreTimetable: canRestoreTimetable(graph, t).ok,
		followOnServiceRef: availableFollowOnService(ctx, t)?.nextRef ?? null,
		reminder: t.reminder,
		callingOnAllowed: t.callingOnAllowed,
	};
}

function buildSimView(ctx: RunnerContext): SimView {
	const { graph, state } = ctx;
	return {
		time: state.time,
		run: state.run,
		speed: state.speed,
		signals: graph.nodes
			.filter((n) => n.signalExit !== null)
			.map((n) => ({
				...n.cell,
				subtype: n.subtype,
				aspect: state.aspects[n.id] ?? 0,
				aspects: n.signalAspects,
				callingOn: state.callingOnSignals.includes(n.id),
			})),
		points: graph.nodes
			.filter((n) => n.kind === "switch")
			.flatMap((n) => {
				const rail = n.rails[state.lies[n.id] ?? 0];
				return rail
					? [{ ...n.cell, subtype: n.subtype, a: rail.a, b: rail.b }]
					: [];
			}),
		levelCrossings: graph.crossings.map((lc, i) => {
			const members = lc.nodes.map((id) => nodeOf(graph, id));
			return {
				subtype: members[0]?.subtype ?? "",
				cells: members.map((n) => ({ ...n.cell })),
				barriers: state.crossings[i]?.barriers ?? "up",
			};
		}),
		routes: state.routes.map((r) => ({
			id: r.id,
			kind: r.kind,
			segs: r.segs.map((seg) => toViewSeg(graph, seg)),
		})),
		pendingRoute: state.pending
			? {
					kind: state.pending.route.kind,
					segs: state.pending.route.segs.map((seg) => toViewSeg(graph, seg)),
				}
			: null,
		trains: state.trains.map((t) => buildTrainView(ctx, t)),
		counters: { ...state.counters },
	};
}

function drainEngineTimetables(
	ctx: RunnerContext,
	sentWorking: Map<number, string>,
): Record<number, TrainTimetableRow[]> {
	const rows: Record<number, TrainTimetableRow[]> = {};
	const live = new Set<number>();
	for (const t of ctx.state.trains) {
		live.add(t.id);
		const key = `${t.working.ref}#${t.working.repeat}`;
		if (sentWorking.get(t.id) === key) continue;
		sentWorking.set(t.id, key);
		rows[t.id] = trainTimetableRows(ctx, t);
	}
	for (const id of sentWorking.keys()) {
		if (!live.has(id)) sentWorking.delete(id);
	}
	return rows;
}

export function createEngine({ map, timetable }: EngineOptions): Engine {
	const graph = buildGraph(map);
	const state = initialState(graph, timetable);
	state.runs = expandRuns(timetable);
	const log = new PerformanceLog(state.counters);
	const ctx: RunnerContext = { graph, state, timetable, log };
	let drained = 0;
	let carry = 0;
	let version = 0;
	/** Per train id, the working whose rows were last sent. */
	const sentWorking = new Map<number, string>();

	return {
		graph,
		timetable,
		state,
		get version() {
			return version;
		},
		handle(cmd) {
			version++;
			return handleEngineCommand(ctx, cmd);
		},
		advance(seconds) {
			if (state.run !== "running") return;
			carry += seconds;
			while (carry >= SIM_DT - 1e-9) {
				carry -= SIM_DT;
				version++;
				stepEngine(ctx);
			}
		},
		view: () => buildSimView(ctx),
		drainTimetables: () => drainEngineTimetables(ctx, sentWorking),
		drainLog() {
			const lines = log.lines.slice(drained);
			drained = log.lines.length;
			return lines;
		},
	};
}
