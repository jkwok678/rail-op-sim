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
import { buildGraph, type RailGraph } from "./graph";
import type {
	CommandResult,
	Counters,
	LogLine,
	SimCommand,
	SimState,
	SimView,
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

	const step = (): void => {
		state.time += SIM_DT;
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
				default:
					return fail("Not supported yet.");
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
				signals: [],
				points: [],
				routes: [],
				pendingRoute: null,
				trains: [],
				counters: { ...state.counters },
			};
		},
		drainLog() {
			return log.splice(0);
		},
	};
}
