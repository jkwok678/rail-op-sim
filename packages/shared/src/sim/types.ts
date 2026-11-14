/**
 * The simulation's state, the commands that change it and the view a renderer
 * reads. Everything here is plain data — no classes, no cycles — so it can
 * cross a `postMessage` or a socket unchanged.
 */

import type { Cell, ServiceRef } from "../railway/timetable/types";
import type { NodeId, Seg } from "./graph";

/** RailOS's Level2OperMode: set up, running, or stopped part way. */
export type RunState = "prestart" | "running" | "paused";

/**
 * - `auto`: automatic signals — follows preferred directions and stays set
 *   after trains pass, the signals stepping back up behind them.
 * - `preferred`: follows preferred directions, released as trains pass.
 * - `unrestricted`: any connected track, released as trains pass.
 */
export type RouteKind = "auto" | "preferred" | "unrestricted";

export interface Route {
	id: string;
	kind: RouteKind;
	segs: Seg[];
}

/** A route found and waiting out its setting delay. */
export interface PendingRoute {
	route: Route;
	commitAt: number;
	lies: [NodeId, number][];
}

/** Why a stationary train is not moving. */
export type WaitReason =
	| "signal"
	| "train"
	| "buffers"
	| "points"
	| "station"
	| null;

export type TrainStatus =
	| "running"
	| "dwelling"
	| "waiting"
	| "spad"
	| "crashed"
	| "finished";

/** Where a train is in its timetable. */
export interface TrainWorking {
	ref: ServiceRef;
	repeat: number;
	/** Index of the next action to perform in the service's `actions`. */
	index: number;
	/** Location the train is standing at for the timetable, or null. */
	at: string | null;
	arrivedAt: number | null;
	lastActionAt: number;
	/** When the train may leave `at`, once worked out. */
	releaseAt: number | null;
	/** Set once a hold for an unsupported action has been reported. */
	heldReported: boolean;
	/** The service has run its course; the train stays where it is. */
	done: boolean;
}

export interface Train {
	id: number;
	headcode: string;
	description: string;
	/** Physical figures, SI units. */
	massKg: number;
	powerW: number;
	/** Full-service deceleration, m/s². */
	brakeRate: number;
	maxSpeed: number;
	lengthM: number;
	/** Occupied segments, rear first. The front is in the last one. */
	segs: Seg[];
	/** Metres the front has run into the last segment. */
	frontM: number;
	/** m/s */
	speed: number;
	status: TrainStatus;
	wait: WaitReason;
	working: TrainWorking;
}

export type LogLevel = "info" | "warning" | "error";

export interface LogLine {
	time: number;
	level: LogLevel;
	text: string;
}

/** RailOS's performance counters (OPERATE-MODE §10.3). */
export interface Counters {
	onTimeArrivals: number;
	lateArrivals: number;
	earlyArrivals: number;
	totLateArrMins: number;
	totEarlyArrMins: number;
	onTimePasses: number;
	latePasses: number;
	earlyPasses: number;
	totLatePassMins: number;
	totEarlyPassMins: number;
	onTimeDeps: number;
	lateDeps: number;
	totLateDepMins: number;
	onTimeExits: number;
	lateExits: number;
	earlyExits: number;
	totLateExitMins: number;
	totEarlyExitMins: number;
	missedStops: number;
	otherMissedEvents: number;
	unexpectedExits: number;
	incorrectExits: number;
	spads: number;
	crashedTrains: number;
}

/** One run (repeat) of a service that creates its own train. */
export interface ServiceRun {
	ref: ServiceRef;
	repeat: number;
	status: "pending" | "running" | "done";
	/** Set once a blocked entry has been reported, so it is reported once. */
	blockedReported: boolean;
	/** The train this run brought on, once it has. */
	trainId: number | null;
}

export interface SimState {
	/** Timetable clock, seconds since 00:00 on day one. */
	time: number;
	run: RunState;
	speed: number;
	/** Rail index each switch lies on, by node. */
	lies: number[];
	/** Signal aspect by node: 0 red, 1 yellow, 2 double yellow, 3 green. */
	aspects: number[];
	routes: Route[];
	pending: PendingRoute | null;
	nextRouteId: number;
	trains: Train[];
	nextTrainId: number;
	runs: ServiceRun[];
	counters: Counters;
}

export type SimCommand =
	| { type: "run" }
	| { type: "pause" }
	| { type: "setSpeed"; speed: number }
	| { type: "checkRouteStart"; at: Cell; kind: RouteKind }
	| { type: "setRoute"; from: Cell; to: Cell; kind: RouteKind }
	| { type: "setAllAutoRoutes" }
	| { type: "cancelRoute"; at: Cell }
	| { type: "togglePoints"; at: Cell };

/** A success may say what it did; a refusal always says why. */
export type CommandResult =
	| { ok: true; message?: string }
	| { ok: false; message: string };

/** A segment as a renderer draws it: a cell, its links, and a span of it. */
export interface ViewSeg {
	gx: number;
	gy: number;
	entry: number;
	exit: number;
	/** Fraction of the way from entry to exit the span starts and ends. */
	from: number;
	to: number;
}

/** One booked step of a working, formatted once; static for the working's life. */
export interface TrainTimetableRow {
	/** Formatted booked time(s) (e.g. "06:00", "06:01–06:02"), or null when untimed. */
	time: string | null;
	/** What the action does and where (e.g. "Ashfield", "pass Barton", "exit"). */
	label: string;
}

/** Whether a step has been completed, is the next step, or is still to come. */
export type TrainTimetableState = "done" | "next" | "upcoming";

export interface TrainTimetableEntry extends TrainTimetableRow {
	state: TrainTimetableState;
}

export interface TrainView {
	id: number;
	headcode: string;
	description: string;
	status: TrainStatus;
	wait: WaitReason;
	speedKmh: number;
	/** Rear first; the front is the `to` end of the last one. */
	segs: ViewSeg[];
	/** What the train does next, for the train list. */
	next: string;
	/** Index of the working's current action; rows come from `drainTimetables`. */
	timetableIndex: number;
	/** The working has run its course (with `status`, decides each step's state). */
	workingDone: boolean;
}

export interface SimView {
	time: number;
	run: RunState;
	speed: number;
	/** Every signal: its subtype, aspect (0 red … 3 green) and capability. */
	signals: {
		gx: number;
		gy: number;
		subtype: string;
		aspect: number;
		aspects: number;
	}[];
	/** Every set of points: its subtype and the rail (`a`–`b`) it lies on. */
	points: { gx: number; gy: number; subtype: string; a: number; b: number }[];
	routes: { id: string; kind: RouteKind; segs: ViewSeg[] }[];
	pendingRoute: { kind: RouteKind; segs: ViewSeg[] } | null;
	trains: TrainView[];
	counters: Counters;
}
