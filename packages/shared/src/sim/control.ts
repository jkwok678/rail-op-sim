/**
 * Signaller control commands for individual trains: manual override, movement
 * orders, passing signals at danger, coupling, and timetable adjustments.
 */

import type { Action } from "../railway/timetable/types";
import { clearCallingOnSignal } from "./callingOn";
import {
	isFacingSignal,
	leavesMap,
	nodeOf,
	occKeyOf,
	type RailGraph,
	type Seg,
	segLength,
} from "./graph";
import { liesAgainst, nextSeg, sameSeg, trainKeys } from "./occupancy";
import { releaseBehind } from "./routes";
import {
	actionsOf,
	becomeService,
	handoverTarget,
	mergeTrainInto,
	placeName,
	type RunnerContext,
	repeatHeadcode,
	reverse,
	segLengthOf,
	serviceByRef,
} from "./timetable";
import type { CommandResult, SimCommand, Train, WaitReason } from "./types";

const ok = (message?: string): CommandResult =>
	message ? { ok: true, message } : { ok: true };
const fail = (message: string): CommandResult => ({ ok: false, message });

/** Obstruction wait reasons that remain meaningful when taking manual control. */
const OBSTRUCTION_WAIT = new Set<WaitReason>([
	"signal",
	"train",
	"points",
	"buffers",
]);

function isFinishAction(a: Action): boolean {
	return (
		a.kind === "finishNewService" ||
		a.kind === "finishJoin" ||
		a.kind === "finishToShuttle" ||
		a.kind === "finishRemainHere" ||
		a.kind === "finishExit" ||
		a.kind === "finishShuttleRemainHere" ||
		a.kind === "finishShuttleNewService"
	);
}

function findTrain(ctx: RunnerContext, trainId: number): Train | null {
	return ctx.state.trains.find((t) => t.id === trainId) ?? null;
}

function frontLocation(graph: RailGraph, train: Train): string | null {
	const front = train.segs.at(-1);
	return front ? nodeOf(graph, front.node).location : null;
}

function markRunDone(ctx: RunnerContext, trainId: number): void {
	const run = ctx.state.runs.find((r) => r.trainId === trainId);
	if (run) run.status = "done";
}

/** Whether `train` may currently return to timetable control (and why not). */
export function canRestoreTimetable(
	graph: RailGraph,
	train: Train,
): { ok: true } | { ok: false; reason: string } {
	if (train.status === "crashed") {
		return { ok: false, reason: "Crashed trains cannot be controlled." };
	}
	if (train.control.mode !== "signaller") {
		return { ok: false, reason: "Train is already under timetable control." };
	}
	if (train.speed > 0) {
		return {
			ok: false,
			reason: "Train must be stopped before restoring timetable control.",
		};
	}
	if (train.working.done) {
		return { ok: false, reason: "Train has finished its timetable." };
	}
	if (
		train.control.restoreLocation !== null &&
		frontLocation(graph, train) !== train.control.restoreLocation
	) {
		return {
			ok: false,
			reason: `Return train to ${train.control.restoreLocation} before restoring timetable control.`,
		};
	}
	return { ok: true };
}

export interface FollowOnCandidate {
	/** Formatted follow-on headcode (with repeat increment applied). */
	nextRef: string;
	/** Service ref in the loaded timetable. */
	rawRef: string;
	/** Which repeat of the follow-on the train becomes. */
	repeat: number;
	/** Index of the follow-on finish action in the current service. */
	finishIndex: number;
	/** Index in the follow-on service's actions where the train resumes. */
	resumeIndex: number;
}

/**
 * The train's booked follow-on service if it can currently transition to it
 * early at its current stop location, or `null`.
 */
export function availableFollowOnService(
	ctx: RunnerContext,
	train: Train,
): FollowOnCandidate | null {
	if (
		train.status === "crashed" ||
		train.control.mode !== "timetable" ||
		train.working.done ||
		train.speed > 0 ||
		train.working.at === null
	) {
		return null;
	}
	const target = handoverTarget(ctx, train);
	if (!target) return null;
	const next = serviceByRef(ctx.timetable, target.ref);
	if (!next) return null;

	const here = train.working.at;
	const matchIdx = next.actions.findIndex(
		(a, i) =>
			i >= 1 && (a.kind === "stop" || a.kind === "pass") && a.location === here,
	);
	const matched = next.actions[matchIdx];
	if (!matched) return null;
	const resumeIndex =
		matched.kind === "pass" ||
		(matched.kind === "stop" && matched.depart === undefined)
			? matchIdx + 1
			: matchIdx;

	return {
		nextRef: repeatHeadcode(next, target.repeat),
		rawRef: next.ref,
		finishIndex: target.actionIndex,
		resumeIndex,
		repeat: target.repeat,
	};
}

/**
 * Handle a train-targeted `SimCommand`, or return `null` if `cmd` is not a
 * train command.
 */
export function handleTrainCommand(
	ctx: RunnerContext,
	cmd: SimCommand,
): CommandResult | null {
	switch (cmd.type) {
		case "takeControl":
			return takeControl(ctx, cmd.trainId);
		case "restoreTimetable":
			return restoreTimetable(ctx, cmd.trainId);
		case "moveForwards":
			return moveForwards(ctx, cmd.trainId);
		case "stop":
			return stopTrain(ctx, cmd.trainId);
		case "changeDirection":
			return changeDirection(ctx, cmd.trainId);
		case "stepForward":
			return stepForward(ctx, cmd.trainId);
		case "passRed":
			return passRed(ctx, cmd.trainId);
		case "removeTrain":
			return removeTrain(ctx, cmd.trainId);
		case "signallerJoin":
			return signallerJoin(ctx, cmd.trainId);
		case "skipActions":
			return skipActions(ctx, cmd.trainId, cmd.toIndex);
		case "becomeNewService":
			return becomeNewService(ctx, cmd.trainId);
		case "setReminder":
			return setReminder(ctx, cmd.trainId, cmd.reminder);
		default:
			return null;
	}
}

function takeControl(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot be controlled.");
	if (train.control.mode === "signaller")
		return fail("Train is already under signaller control.");

	train.callingOn = false;
	train.callingOnAllowed = false;
	if (train.allowedCallOnNode !== null) {
		clearCallingOnSignal(ctx.state, train.allowedCallOnNode);
		train.allowedCallOnNode = null;
	}
	const restoreLocation =
		train.speed <= 0 && train.working.at !== null ? train.working.at : null;

	if (train.speed > 0) {
		train.control = {
			mode: "signaller",
			order: { kind: "move" },
			restoreLocation: null,
			allowedRedSignalNode: null,
		};
		train.status = "running";
		train.wait = null;
	} else {
		train.control = {
			mode: "signaller",
			order: { kind: "stop" },
			restoreLocation,
			allowedRedSignalNode: null,
		};
		train.speed = 0;
		const keepWait =
			train.status === "waiting" && OBSTRUCTION_WAIT.has(train.wait);
		train.status = "waiting";
		if (!keepWait) train.wait = "signaller";
	}
	ctx.log.info(
		ctx.state.time,
		`${train.headcode} placed under signaller control`,
	);
	return ok();
}

function restoreTimetable(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	const check = canRestoreTimetable(ctx.graph, train);
	if (!check.ok) return fail(check.reason);

	const restoreLocation =
		train.control.mode === "signaller" ? train.control.restoreLocation : null;
	train.control = { mode: "timetable" };

	const here = frontLocation(ctx.graph, train);
	if (restoreLocation !== null && here === restoreLocation) {
		train.working.at = restoreLocation;
		train.working.arrivedAt ??= ctx.state.time;
	} else if (train.working.at && train.working.at !== here) {
		train.working.at = null;
		train.working.arrivedAt = null;
		train.working.releaseAt = null;
	}

	if (train.working.at && train.working.at === here) {
		train.status = "dwelling";
		train.wait = null;
	} else {
		train.status = "waiting";
		if (train.wait === "signaller") train.wait = null;
	}

	ctx.log.info(
		ctx.state.time,
		`${train.headcode} restored to timetable control`,
	);
	return ok();
}

function moveForwards(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot be moved.");
	if (train.control.mode !== "signaller")
		return fail("Take signaller control before ordering movement.");

	train.control.order = { kind: "move" };
	if (train.speed <= 0) {
		train.status = "waiting";
		if (train.wait === "signaller") train.wait = null;
	}
	ctx.log.info(ctx.state.time, `${train.headcode} ordered to move forwards`);
	return ok();
}

function stopTrain(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot be controlled.");
	if (train.control.mode !== "signaller")
		return fail("Take signaller control before stopping the train.");

	train.control.order = { kind: "stop" };
	if (train.speed <= 0) {
		train.speed = 0;
		train.status = "waiting";
		if (train.wait === null || train.wait === "station") {
			train.wait = "signaller";
		}
	}
	ctx.log.info(ctx.state.time, `${train.headcode} ordered to stop`);
	return ok();
}

function changeDirection(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot change direction.");
	if (train.control.mode !== "signaller")
		return fail("Take signaller control before changing direction.");
	if (train.speed > 0)
		return fail("Train must be stopped before changing direction.");
	if (train.segs.length === 0) return fail("Train is not on the railway.");
	if (train.segs.length === 1 && train.frontM <= 0) {
		return fail("Train has not entered the railway yet.");
	}

	reverse(ctx.graph, train);
	train.control.allowedRedSignalNode = null;
	train.control.order = { kind: "stop" };
	train.status = "waiting";
	train.wait = "signaller";

	const here = frontLocation(ctx.graph, train);
	if (train.working.at && train.working.at !== here) {
		train.working.at = null;
		train.working.arrivedAt = null;
		train.working.releaseAt = null;
	}

	ctx.log.info(ctx.state.time, `${train.headcode} changed direction`);
	return ok();
}

function stepDistanceAhead(
	ctx: RunnerContext,
	train: Train,
	front: Seg,
	frontLen: number,
	rem: number,
): number | string {
	const { graph, state } = ctx;
	const next = nextSeg(graph, state.lies, front);
	if (!next) {
		return leavesMap(graph, front) ? frontLen : "Train is at buffer stops.";
	}
	const allowedRed =
		train.control.mode === "signaller"
			? train.control.allowedRedSignalNode
			: null;
	if (
		isFacingSignal(graph, next) &&
		state.aspects[next.node] === 0 &&
		next.node !== allowedRed
	) {
		return "Cannot step forward past a red signal.";
	}
	const others = trainKeys(
		graph,
		state.trains.filter((t) => t !== train),
	);
	if (others.has(occKeyOf(graph, next))) {
		return "Track ahead is occupied by another train.";
	}
	if (liesAgainst(graph, state.lies, next)) {
		return "Points ahead are set against the train.";
	}
	return rem + segLength(graph, next);
}

function stepForward(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot step forward.");
	if (train.control.mode !== "signaller")
		return fail("Take signaller control before stepping forward.");
	if (train.speed > 0)
		return fail("Train must be stopped before stepping forward.");
	const front = train.segs.at(-1);
	if (!front) return fail("Train is not on the railway.");

	const frontLen = segLength(ctx.graph, front);
	const rem = Math.max(0, frontLen - train.frontM);
	const dist =
		rem <= 0.05 ? stepDistanceAhead(ctx, train, front, frontLen, rem) : rem;
	if (typeof dist === "string") return fail(dist);

	train.control.order = { kind: "step", remainingM: dist };
	train.status = "waiting";
	train.wait = null;
	ctx.log.info(ctx.state.time, `${train.headcode} ordered to step forward`);
	return ok();
}

function passRed(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed") return fail("Crashed trains cannot move.");
	if (train.control.mode !== "signaller")
		return fail("Take signaller control before passing a red signal.");
	if (train.speed > 0)
		return fail("Train must be stopped before passing a red signal.");

	const { graph, state } = ctx;
	const front = train.segs.at(-1);
	const next = front ? segJustAhead(ctx, train, front) : null;
	if (!next || !isFacingSignal(graph, next) || state.aspects[next.node] !== 0) {
		return fail("Train is not stopped at a red signal.");
	}

	train.control.allowedRedSignalNode = next.node;
	train.control.order = { kind: "move" };
	train.status = "waiting";
	train.wait = null;
	ctx.log.info(
		ctx.state.time,
		`${train.headcode} authorised to pass red signal at ${placeName(nodeOf(graph, next.node))}`,
	);
	return ok();
}

function removeTrain(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status !== "crashed") {
		if (train.control.mode !== "signaller") {
			return fail("Take signaller control before removing a train.");
		}
		if (train.speed > 0) {
			return fail("Train must be stopped before removing it from the railway.");
		}
	}

	for (const seg of train.segs) {
		releaseBehind(ctx.state, seg);
	}
	ctx.state.trains = ctx.state.trains.filter((t) => t !== train);
	markRunDone(ctx, train.id);
	ctx.log.info(
		ctx.state.time,
		`${train.headcode} removed from railway by signaller`,
	);
	return ok();
}

/**
 * The segment just past a train whose front has stopped at the end of `front`,
 * or null when it is short of the end or nothing lies beyond.
 */
function segJustAhead(
	ctx: RunnerContext,
	train: Train,
	front: Seg,
): Seg | null {
	const rem = Math.max(0, segLength(ctx.graph, front) - train.frontM);
	return rem > 1.0 ? null : nextSeg(ctx.graph, ctx.state.lies, front);
}

/**
 * How `other` meets a train about to enter `next`: its front facing back
 * along it (it must turn round to join), its rear on it, or neither.
 */
function joinOrientation(other: Train, next: Seg): "front" | "rear" | null {
	const front = other.segs.at(-1);
	if (
		front &&
		sameSeg({ node: front.node, entry: front.exit, exit: front.entry }, next)
	) {
		return "front";
	}
	const [rear] = other.segs;
	return rear && sameSeg(rear, next) ? "rear" : null;
}

function signallerJoin(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot join another train.");
	if (train.control.mode !== "signaller")
		return fail("Take signaller control before joining trains.");
	if (train.speed > 0) return fail("Train must be stopped before joining.");
	const front = train.segs.at(-1);
	if (!front) return fail("Train is not on the railway.");

	const { graph, state } = ctx;
	const next = segJustAhead(ctx, train, front);
	if (!next) return fail("There is no train immediately ahead to join.");

	const nextKey = occKeyOf(graph, next);
	const other = state.trains.find(
		(t) => t !== train && t.segs.some((s) => occKeyOf(graph, s) === nextKey),
	);
	if (!other) return fail("There is no train immediately ahead to join.");
	if (other.status === "crashed")
		return fail("Cannot join to a crashed train.");
	if (other.speed > 0)
		return fail("The train ahead must be stopped before joining.");
	if (other.control.mode !== "signaller") {
		return fail(
			"The train ahead must be under signaller control before joining.",
		);
	}

	const meets = joinOrientation(other, next);
	if (!meets) return fail("Cannot join trains at this track configuration.");
	if (meets === "front") reverse(graph, other);

	const oldFrontLen = segLengthOf(graph, front);
	if (train.frontM < oldFrontLen) {
		train.frontM = oldFrontLen;
	}

	other.segs = [...train.segs, ...other.segs];
	mergeTrainInto(ctx, other, train);

	other.control = {
		mode: "signaller",
		order: { kind: "stop" },
		restoreLocation: other.control.restoreLocation,
		allowedRedSignalNode: null,
	};
	other.status = "waiting";
	other.wait = "signaller";
	ctx.log.info(ctx.state.time, `${train.headcode} joined to ${other.headcode}`);
	return ok();
}

function skipActions(
	ctx: RunnerContext,
	trainId: number,
	toIndex: number,
): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot skip timetabled actions.");
	if (train.control.mode !== "timetable")
		return fail(
			"Restore timetable control before skipping timetabled actions.",
		);
	if (train.speed > 0)
		return fail("Train must be stopped before skipping timetabled actions.");
	if (train.working.done)
		return fail("Train has already finished its timetable.");

	const actions = actionsOf(ctx, train.working);
	if (!Number.isInteger(toIndex) || toIndex <= train.working.index) {
		return fail("Invalid timetable step to skip to.");
	}

	const target = actions[toIndex];
	if (!target) return fail("Invalid timetable step to skip to.");
	if (isFinishAction(target)) {
		return fail("Cannot skip directly to a finish action.");
	}

	train.working.index = toIndex;
	train.working.done = false;
	train.working.heldReported = false;
	train.working.releaseAt = null;

	const here = frontLocation(ctx.graph, train);
	const staysAtStop =
		target.kind === "stop" &&
		here !== null &&
		target.location === here &&
		train.working.at === here;
	if (!staysAtStop) {
		train.working.at = null;
		train.working.arrivedAt = null;
		if (train.status === "dwelling") {
			train.status = "waiting";
			train.wait = null;
		}
	}

	ctx.log.info(ctx.state.time, `${train.headcode} skipped timetabled actions`);
	return ok();
}

function becomeNewService(ctx: RunnerContext, trainId: number): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");
	if (train.status === "crashed")
		return fail("Crashed trains cannot become a new service.");
	if (train.control.mode !== "timetable")
		return fail(
			"Restore timetable control before becoming the follow-on service.",
		);
	if (train.speed > 0 || train.working.at === null) {
		return fail(
			"Train must be stopped at a location to become the follow-on service.",
		);
	}
	if (train.working.done)
		return fail("Train has already finished its timetable.");

	const target = handoverTarget(ctx, train);
	if (!target) return fail("This service has no follow-on service.");

	const candidate = availableFollowOnService(ctx, train);
	if (!candidate) {
		return fail(
			`Follow-on service ${target.ref} does not call at ${train.working.at}.`,
		);
	}

	const actions = actionsOf(ctx, train.working);
	const oldIndex = train.working.index;
	const nextActions =
		serviceByRef(ctx.timetable, candidate.rawRef)?.actions ?? [];
	const skippedReversals =
		actions
			.slice(oldIndex, candidate.finishIndex)
			.filter((a) => a.kind === "changeDirection").length +
		nextActions
			.slice(1, candidate.resumeIndex)
			.filter((a) => a.kind === "changeDirection").length;

	const oldHeadcode = train.headcode;
	const here = train.working.at;
	const nextHeadcode = candidate.nextRef;
	const changed = becomeService(
		ctx,
		train,
		candidate.rawRef,
		here,
		`${oldHeadcode} became follow-on service ${nextHeadcode} early at ${here}`,
		candidate.repeat,
	);
	if (!changed) {
		return fail(`Follow-on service ${target.ref} not found.`);
	}

	if (skippedReversals % 2 === 1) {
		reverse(ctx.graph, train);
	}

	train.working.index = candidate.resumeIndex;
	train.working.at = here;
	train.working.arrivedAt = ctx.state.time;
	train.working.releaseAt = null;
	train.status = "dwelling";
	train.wait = null;
	return ok();
}

function setReminder(
	ctx: RunnerContext,
	trainId: number,
	reminder: string | null,
): CommandResult {
	const train = findTrain(ctx, trainId);
	if (!train) return fail("Train not found.");

	const trimmed = reminder?.trim() ?? "";
	train.reminder = trimmed.length > 0 ? trimmed : null;
	ctx.log.info(
		ctx.state.time,
		train.reminder
			? `${train.headcode} reminder set: "${train.reminder}"`
			: `${train.headcode} reminder cleared`,
	);
	return ok();
}
