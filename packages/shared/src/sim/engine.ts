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
import { afterPause, afterRun, isSpeed, SIM_DT } from "./clock";
import { buildGraph, occKeyOf, type RailGraph, type Seg } from "./graph";
import { trainKeys } from "./occupancy";
import {
	cancelOnWrongEntry,
	cancelRoute,
	checkRouteStart,
	commitPendingRoute,
	releaseBehind,
	setRoute,
	togglePoints,
} from "./routes";
import { computeAspects } from "./signalling";
import { approaching, type MoveEvent, moveTrain, trainSpans } from "./trains";
import type {
	CommandResult,
	Counters,
	LogLine,
	SimCommand,
	SimState,
	SimView,
	ViewSeg,
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
}

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
	};
}

export function initialState(graph: RailGraph, timetable: Timetable): SimState {
	return {
		time: timetable.startTime,
		run: "prestart",
		speed: 1,
		lies: graph.nodes.map((n) => n.defaultLie),
		aspects: graph.nodes.map(() => 0),
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

export function createEngine({ map, timetable }: EngineOptions): Engine {
	const graph = buildGraph(map);
	const state = initialState(graph, timetable);
	const log: LogLine[] = [];
	let carry = 0;

	const refreshAspects = (): void => {
		const occupied = trainKeys(graph, state.trains);
		state.aspects = computeAspects(graph, state, (route, i) =>
			occupied.has(occKeyOf(graph, route.segs[i])),
		);
	};

	const handleEvent = (event: MoveEvent): void => {
		switch (event.type) {
			case "entered":
				cancelOnWrongEntry(state, event.seg, event.from);
				return;
			case "cleared":
				releaseBehind(state, event.seg);
				return;
			case "left":
				releaseBehind(state, event.seg);
				state.trains = state.trains.filter((t) => t !== event.train);
				return;
			case "spad":
				event.train.status = "spad";
				event.train.speed = 0;
				state.counters.spads++;
				return;
			case "crash":
				for (const t of [event.train, event.other]) {
					t.status = "crashed";
					t.speed = 0;
				}
				state.counters.crashedTrains += 2;
				return;
			case "stopped":
				return;
		}
	};

	const step = (): void => {
		state.time += SIM_DT;
		commitPendingRoute(graph, state);
		refreshAspects();
		const events: MoveEvent[] = [];
		for (const train of [...state.trains]) {
			moveTrain(graph, state, train, null, SIM_DT, events);
		}
		for (const event of events) handleEvent(event);
		refreshAspects();
	};

	const viewSeg = (seg: Seg, from = 0, to = 1): ViewSeg => {
		const { gx, gy } = graph.nodes[seg.node].cell;
		return { gx, gy, entry: seg.entry, exit: seg.exit, from, to };
	};

	const routeCommand = (cmd: SimCommand): CommandResult => {
		switch (cmd.type) {
			case "checkRouteStart":
				return checkRouteStart(graph, state, cmd.at, cmd.kind);
			case "setRoute":
				return setRoute(graph, state, cmd.from, cmd.to, cmd.kind);
			case "cancelRoute":
				return cancelRoute(graph, state, cmd.at, (route) =>
					state.trains.some((t) => approaching(graph, state, t, route)),
				);
			case "togglePoints":
				return togglePoints(graph, state, cmd.at);
			default:
				return fail("Unknown command.");
		}
	};

	return {
		graph,
		timetable,
		state,
		handle(cmd) {
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
					const result = routeCommand(cmd);
					refreshAspects();
					return result;
				}
			}
		},
		advance(seconds) {
			if (state.run !== "running") return;
			carry += seconds;
			while (carry >= SIM_DT - 1e-9) {
				carry -= SIM_DT;
				step();
			}
		},
		view() {
			return {
				time: state.time,
				run: state.run,
				speed: state.speed,
				signals: graph.nodes
					.filter((n) => n.signalExit !== null)
					.map((n) => ({
						...n.cell,
						aspect: state.aspects[n.id],
						aspects: n.signalAspects,
					})),
				points: graph.nodes
					.filter((n) => n.kind === "switch")
					.map((n) => {
						const rail = n.rails[state.lies[n.id]];
						return { ...n.cell, a: rail.a, b: rail.b };
					}),
				routes: state.routes.map((r) => ({
					id: r.id,
					kind: r.kind,
					segs: r.segs.map((seg) => viewSeg(seg)),
				})),
				pendingRoute: state.pending
					? {
							kind: state.pending.route.kind,
							segs: state.pending.route.segs.map((seg) => viewSeg(seg)),
						}
					: null,
				trains: state.trains.map((t) => ({
					id: t.id,
					headcode: t.headcode,
					description: t.description,
					status: t.status,
					wait: t.wait,
					speedKmh: t.speed * 3.6,
					segs: trainSpans(graph, t).map((span) =>
						viewSeg(span.seg, span.from, span.to),
					),
					next: "",
				})),
				counters: { ...state.counters },
			};
		},
		drainLog() {
			return log.splice(0);
		},
	};
}
