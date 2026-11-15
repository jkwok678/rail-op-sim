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

/**
 * Where a level crossing's barriers are, after RailOS: *up* lets road traffic
 * over and closes the railway; *down* closes the road and opens the railway.
 * They take a while to move either way, and stay closed to trains meanwhile.
 */
export type BarrierState = "up" | "lowering" | "down" | "raising";

export interface CrossingState {
	barriers: BarrierState;
	/** When `lowering` or `raising` finishes. */
	changeAt: number;
	/** When the barriers last finished lowering. */
	downSince: number;
	/** A train has been over the crossing since its barriers went down. */
	trainSeen: boolean;
}

/** Why a stationary train is not moving. */
export type WaitReason =
	| "signal"
	| "train"
	| "buffers"
	| "points"
	| "station"
	| "signaller"
	| null;

export type TrainStatus =
	| "running"
	| "dwelling"
	| "waiting"
	| "spad"
	| "crashed"
	| "finished";

/** Current movement order when a train is under signaller control. */
export type SignallerMode = "stop" | "move" | "step";

export type SignallerOrder =
	| { kind: "stop" }
	| { kind: "move" }
	| { kind: "step"; remainingM: number };

export type TrainControl =
	| { mode: "timetable" }
	| {
			mode: "signaller";
			/** Movement order while under signaller control. */
			order: SignallerOrder;
			/**
			 * Named location where signaller control was taken while stopped there,
			 * or null when taken en route or created under signaller control.
			 */
			restoreLocation: string | null;
			/** Facing signal node the train is authorised to pass at danger once. */
			allowedRedSignalNode: NodeId | null;
	  };

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
	/** Speed cap (m/s) when under signaller control, or null when uncapped. */
	signallerMaxSpeed: number | null;
	lengthM: number;
	/** Occupied segments, rear first. The front is in the last one. */
	segs: Seg[];
	/** Metres the front has run into the last segment. */
	frontM: number;
	/** m/s */
	speed: number;
	status: TrainStatus;
	wait: WaitReason;
	/** Whether the timetable or the signaller is currently driving the train. */
	control: TrainControl;
	/** Optional reminder note attached by the signaller. */
	reminder: string | null;
	/** Eligible to be called on past the protecting red signal (§5.13). */
	callingOnAllowed: boolean;
	/** Currently advancing under calling-on authority (30 km/h cap). */
	callingOn: boolean;
	/** Red signal node the train was called on past, cleared on entry. */
	allowedCallOnNode: NodeId | null;
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
	/**
	 * Minutes level crossings were down beyond what the traffic needed: all of
	 * it with no train over them, else past a 3 minute allowance.
	 */
	excessLcDownMins: number;
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
	/** Signal nodes currently showing a calling-on aspect (§5.13). */
	callingOnSignals: NodeId[];
	/** Each level crossing's barriers, by index in the graph's crossings. */
	crossings: CrossingState[];
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
	| { type: "callOn"; at: Cell }
	| { type: "cancelRoute"; at: Cell }
	| { type: "togglePoints"; at: Cell }
	| { type: "takeControl"; trainId: number }
	| { type: "restoreTimetable"; trainId: number }
	| { type: "moveForwards"; trainId: number }
	| { type: "stop"; trainId: number }
	| { type: "changeDirection"; trainId: number }
	| { type: "stepForward"; trainId: number }
	| { type: "passRed"; trainId: number }
	| { type: "removeTrain"; trainId: number }
	| { type: "signallerJoin"; trainId: number }
	| { type: "skipActions"; trainId: number; toIndex: number }
	| { type: "becomeNewService"; trainId: number }
	| { type: "setReminder"; trainId: number; reminder: string | null };

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
	/** True while the signaller has manual control instead of the timetable. */
	signallerControl: boolean;
	/** Current signaller movement order while `signallerControl` is true. */
	signallerMode: SignallerMode;
	/** Whether timetable control can currently be restored for this train. */
	canRestoreTimetable: boolean;
	/** Booked follow-on service ref if the train can become it early here, else null. */
	followOnServiceRef: string | null;
	/** Optional signaller reminder note attached to the train. */
	reminder: string | null;
	/** Whether the train can currently be called on past its red signal (§5.13). */
	callingOnAllowed: boolean;
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
		callingOn: boolean;
	}[];
	/** Every set of points: its subtype and the rail (`a`–`b`) it lies on. */
	points: { gx: number; gy: number; subtype: string; a: number; b: number }[];
	/** Every level crossing: its track subtype, its cells in order, its barriers. */
	levelCrossings: {
		subtype: string;
		cells: { gx: number; gy: number }[];
		barriers: BarrierState;
	}[];
	routes: { id: string; kind: RouteKind; segs: ViewSeg[] }[];
	pendingRoute: { kind: RouteKind; segs: ViewSeg[] } | null;
	trains: TrainView[];
	counters: Counters;
}
