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
import { cellKey, type GraphNode, type RailGraph, type Seg } from "./graph";
import type { PerformanceLog } from "./log";
import {
	safeEntrySpeed,
	segsOccupied,
	startPosition,
	trainFromSpec,
} from "./trains";
import type { ServiceRun, SimState, Train, TrainWorking } from "./types";

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

function serviceByRef(tt: Timetable, ref: string): Service | undefined {
	return tt.services.find((s) => s.ref === ref);
}

/** Every run of every service that brings on a train of its own. */
export function expandRuns(tt: Timetable): ServiceRun[] {
	return tt.services.flatMap((service) => {
		if (service.actions[0]?.kind !== "startNew") return [];
		const count = 1 + (service.repeat?.count ?? 0);
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

const actionsOf = (ctx: RunnerContext, w: TrainWorking): Action[] =>
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
		if (!service || start?.kind !== "startNew") continue;
		if (ctx.state.time < start.time + repeatOffset(service, run.repeat))
			continue;
		dispatch(ctx, run, service, start);
	}
}

function dispatch(
	ctx: RunnerContext,
	run: ServiceRun,
	service: Service,
	start: ActionOf<"startNew">,
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
	start: ActionOf<"startNew">,
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
	if (start.signallerControl) {
		log.warning(
			state.time,
			`${train.headcode} was booked to start under signaller control, which is not available yet; it is held.`,
		);
		train.working.done = true;
		train.status = "finished";
		train.speed = 0;
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
	if (w.done) return null;
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
	finishNewService: "next service",
	finishExit: "exit",
	finishRemainHere: "terminates",
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
	if (w.arrivedAt !== null) floors.push(w.arrivedAt + dwell);
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

function becomeService(
	ctx: RunnerContext,
	train: Train,
	nextRef: string,
	where: string,
): boolean {
	const next = serviceByRef(ctx.timetable, nextRef);
	const w = train.working;
	if (!next) {
		holdUnsupported(ctx, train, actionsOf(ctx, w)[w.index]);
		return false;
	}
	const old = train.headcode;
	train.headcode = repeatHeadcode(next, w.repeat);
	if (next.description) train.description = next.description;
	w.ref = next.ref;
	w.index = 1;
	w.lastActionAt = ctx.state.time;
	w.releaseAt = null;
	ctx.log.info(
		ctx.state.time,
		`${old} became new service ${train.headcode} at ${where}`,
	);
	return true;
}

/** Turn a train round where it stands: the old rear becomes the front. */
function reverse(graph: RailGraph, train: Train): void {
	const lengths = train.segs.map((s) => segLengthOf(graph, s));
	const behind =
		lengths.slice(0, -1).reduce((sum, len) => sum + len, 0) + train.frontM;
	const rearInto = Math.max(0, behind - train.lengthM);
	train.segs = train.segs
		.map((s) => ({ node: s.node, entry: s.exit, exit: s.entry }))
		.reverse();
	train.frontM = lengths[0] - rearInto;
}

function segLengthOf(graph: RailGraph, seg: Seg): number {
	return (
		graph.nodes[seg.node].paths.find(
			(p) => p.entry === seg.entry && p.exit === seg.exit,
		)?.lengthM ?? 0
	);
}

// ============================================================================
// What trains report
// ============================================================================

/** Stop and pass actions from `from` to before `to`, logged as missed. */
function missBetween(
	ctx: RunnerContext,
	train: Train,
	from: number,
	to: number,
): void {
	const actions = actionsOf(ctx, train.working);
	for (let i = from; i < to; i++) {
		const a = actions[i];
		if (a.kind === "stop") {
			ctx.state.counters.missedStops++;
			ctx.log.error(
				ctx.state.time,
				`${train.headcode} missed its stop at ${a.location}`,
			);
		} else if (a.kind === "pass") {
			ctx.state.counters.otherMissedEvents++;
			ctx.log.error(
				ctx.state.time,
				`${train.headcode} missed passing ${a.location}`,
			);
		}
	}
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
	if (w.done) return;
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
