/**
 * Timetable validation — a pure function from a {@link Timetable} (and
 * optionally the railway it runs on) to a list of {@link TimetableIssue}.
 *
 * This is railway-dot-exe's two-pass check (`SecondPassActions` for syntax and
 * sequence, then the cross-reference and against-the-railway passes) turned
 * inside out. There it runs during parsing and reports through `ShowMessage`,
 * so an error is a modal and a test can only assert on prose. Here it runs on
 * the finished object and *returns* its findings, each carrying the service and
 * action index it belongs to — which is what lets the editor mark the offending
 * row while the user is still typing, and lets the tests assert on codes.
 *
 * The split into {@link validateTimetableStructure} and
 * {@link validateTimetableAgainstMap} is the other change: everything that can
 * be judged from the timetable alone is judged without a map, so most of the
 * rules are testable with no railway fixture at all.
 */

import type { Map_ } from "../map/map";
import { isRailwayComplete, linkIndexForOffset } from "../map/map-connectivity";
import { getLocationNames, trackAtCell } from "./locations";
import { formatSimTime, type SimTime } from "./time";
import {
	type Action,
	type ActionOf,
	actionTime,
	type Cell,
	createsTrain,
	FINISH_KINDS,
	isFinishAction,
	isStartAction,
	MAX_SERVICE_REF_LENGTH,
	type Repeat,
	type Service,
	type ServiceRef,
	START_KINDS,
	type Timetable,
} from "./types";

/**
 * One thing wrong with a timetable, addressed to the place it is wrong.
 *
 * `code` is the stable identity — the editor groups on it and the tests assert
 * on it — while `message` is prose for a human and may be reworded freely.
 */
export interface TimetableIssue {
	severity: "error" | "warning";
	/** Stable kebab-case identifier, e.g. `"no-start"`, `"unknown-location"`. */
	code: string;
	message: string;
	/** The service the issue belongs to; absent for whole-timetable issues. */
	serviceRef?: ServiceRef;
	/** Index into that service's `actions`; absent when the issue is the service. */
	actionIndex?: number;
}

/** Collects issues, so each rule below reads as one statement per finding. */
class IssueList {
	readonly issues: TimetableIssue[] = [];

	error(
		code: string,
		message: string,
		where: { serviceRef?: ServiceRef; actionIndex?: number } = {},
	): void {
		this.issues.push({ severity: "error", code, message, ...where });
	}

	warn(
		code: string,
		message: string,
		where: { serviceRef?: ServiceRef; actionIndex?: number } = {},
	): void {
		this.issues.push({ severity: "warning", code, message, ...where });
	}
}

/** A cross-reference one action makes to another service. */
interface Reference {
	serviceRef: ServiceRef;
	actionIndex: number;
	kind: Action["kind"];
	/** The service being named. */
	target: ServiceRef;
	time: SimTime | null;
}

/**
 * Check everything that can be judged from the timetable alone: each service's
 * shape and times, then the references between services.
 *
 * Needs no railway, so an editor can run it on every keystroke and a test can
 * exercise every rule without a map fixture.
 */
export function validateTimetableStructure(tt: Timetable): TimetableIssue[] {
	const out = new IssueList();

	if (tt.version !== 1) {
		out.error(
			"unsupported-version",
			`Unsupported timetable version ${String(tt.version)} (expected 1).`,
		);
	}
	if (!Number.isFinite(tt.startTime) || tt.startTime < 0) {
		out.error(
			"invalid-start-time",
			"The timetable's start time is not a time.",
		);
	}
	if (tt.services.length === 0) {
		out.warn("no-services", "The timetable has no services.");
	}

	const seenRefs = new Set<ServiceRef>();
	for (const service of tt.services) {
		if (seenRefs.has(service.ref)) {
			out.error(
				"duplicate-ref",
				`More than one service is called "${service.ref}".`,
				{ serviceRef: service.ref },
			);
		}
		seenRefs.add(service.ref);
		validateService(tt, service, out);
	}

	validateCrossReferences(tt, out);
	validateShuttles(tt, out);
	return out.issues;
}

/** One service's ref, train spec, action sequence, and times. */
function validateService(
	tt: Timetable,
	service: Service,
	out: IssueList,
): void {
	validateRef(service.ref, out);
	if (service.repeat) validateRepeat(service.ref, service.repeat, out);
	if (!validateShape(service, out)) return;
	validateTrainPresence(service, out);
	if (service.train) validateTrainSpec(service, out);
	validateTimes(tt, service, out);
}

/** The service's own identity. */
function validateRef(ref: ServiceRef, out: IssueList): void {
	if (ref.trim() === "") {
		out.error("empty-ref", "A service has no headcode.", { serviceRef: ref });
	} else if (ref.length > MAX_SERVICE_REF_LENGTH) {
		out.error(
			"ref-too-long",
			`"${ref}" is longer than ${MAX_SERVICE_REF_LENGTH} characters.`,
			{ serviceRef: ref },
		);
	}
}

function validateRepeat(ref: ServiceRef, repeat: Repeat, out: IssueList): void {
	const { intervalMinutes, count, headcodeIncrement } = repeat;
	if (!(intervalMinutes > 0)) {
		out.error(
			"repeat-interval",
			"A repeat must have an interval of at least one minute.",
			{ serviceRef: ref },
		);
	}
	if (!(count >= 1)) {
		out.error("repeat-count", "A repeat must run at least once more.", {
			serviceRef: ref,
		});
	}
	if (!Number.isInteger(headcodeIncrement) || headcodeIncrement < 0) {
		out.error(
			"repeat-increment",
			"A repeat's headcode increment must be zero or a positive whole number.",
			{ serviceRef: ref },
		);
	}
	// RailOS increments the numeric tail of the headcode, so it has to be
	// numeric for the repeats to have distinct, legible names.
	if (headcodeIncrement > 0 && !/\d\d$/.test(ref)) {
		out.error(
			"repeat-headcode",
			`"${ref}" must end in two digits for its repeats to be numbered.`,
			{ serviceRef: ref },
		);
	}
}

/**
 * The shape of the action list: one start, first; one finish, last; nothing
 * unsupported in between. False when there are no actions at all, since
 * nothing after this has anything to check.
 */
function validateShape(service: Service, out: IssueList): boolean {
	const { ref, actions } = service;
	const at = (actionIndex: number) => ({ serviceRef: ref, actionIndex });
	const first = actions[0];
	const last = actions[actions.length - 1];
	if (!first || !last) {
		out.error("no-actions", `"${ref}" does nothing.`, { serviceRef: ref });
		return false;
	}

	if (!isStartAction(first)) {
		out.error(
			"no-start",
			`"${ref}" must begin with a start action (${START_KINDS.join(", ")}).`,
			at(0),
		);
	}
	const lastIndex = actions.length - 1;
	if (!isFinishAction(last)) {
		out.error(
			"no-finish",
			`"${ref}" must end with a finish action (${FINISH_KINDS.join(", ")}).`,
			at(lastIndex),
		);
	}

	actions.forEach((action, i) => {
		if (i > 0 && isStartAction(action)) {
			out.error(
				"start-not-first",
				`"${action.kind}" can only be a service's first action.`,
				at(i),
			);
		}
		if (i < lastIndex && isFinishAction(action)) {
			out.error(
				"action-after-finish",
				`"${ref}" carries on after it finishes.`,
				at(i),
			);
		}
	});
	return true;
}

/** A train spec is required exactly when the service creates the train. */
function validateTrainPresence(service: Service, out: IssueList): void {
	const { ref } = service;
	const first = service.actions[0];
	const startCreatesTrain =
		first !== undefined && isStartAction(first) && createsTrain(first);
	if (startCreatesTrain && !service.train) {
		out.error(
			"missing-train",
			`"${ref}" puts a new train on the railway, so it needs a train type.`,
			{ serviceRef: ref },
		);
	}
	if (!startCreatesTrain && service.train) {
		// RailOS ignores a spec on a follow-on: the train already exists and keeps
		// the one it was built with. Say so rather than silently dropping it.
		out.warn(
			"unused-train",
			`"${ref}" takes over an existing train, so its train type is ignored.`,
			{ serviceRef: ref },
		);
	}
}

function validateTrainSpec(service: Service, out: IssueList): void {
	const spec = service.train;
	if (!spec) return;
	const where = { serviceRef: service.ref };
	const positive: [keyof typeof spec, string][] = [
		["maxSpeedKmh", "maximum speed"],
		["massTonnes", "mass"],
		["brakeForceTonnes", "brake force"],
		["powerKw", "power"],
	];
	for (const [field, label] of positive) {
		const value = spec[field];
		if (typeof value !== "number" || !(value > 0)) {
			out.error("train-spec", `A train's ${label} must be above zero.`, where);
		}
	}
	if (typeof spec.startSpeedKmh !== "number" || spec.startSpeedKmh < 0) {
		out.error(
			"train-spec",
			"A train's starting speed cannot be negative.",
			where,
		);
	}
	if (
		typeof spec.maxSpeedKmh === "number" &&
		typeof spec.startSpeedKmh === "number" &&
		spec.startSpeedKmh > spec.maxSpeedKmh
	) {
		out.error(
			"train-spec",
			"A train cannot start above its own maximum speed.",
			where,
		);
	}
	if (spec.signallerSpeedKmh !== undefined && !(spec.signallerSpeedKmh > 0)) {
		out.error(
			"train-spec",
			"A signaller speed limit must be above zero.",
			where,
		);
	}
}

/**
 * Times must not go backwards along a service, and a stop must not depart
 * before it arrives.
 *
 * A stop booked with a single time is RailOS's `HH:MM;Location`, whose meaning
 * depends on where it sits: the service's first location is a departure (the
 * train is already there), anywhere else is an arrival. That reading is applied
 * here so the ordering check compares like with like.
 */
function validateTimes(tt: Timetable, service: Service, out: IssueList): void {
	const ref = service.ref;
	const first = service.actions[0];

	if (
		first &&
		isStartAction(first) &&
		createsTrain(first) &&
		first.time < tt.startTime
	) {
		out.error(
			"start-before-timetable",
			`"${ref}" starts at ${formatSimTime(first.time)}, before the timetable does (${formatSimTime(tt.startTime)}).`,
			{ serviceRef: ref, actionIndex: 0 },
		);
	}

	let previous: SimTime | null = null;
	let seenLocation = false;

	service.actions.forEach((action, i) => {
		const where = { serviceRef: ref, actionIndex: i };

		if (action.kind === "stop") {
			if (action.arrive === undefined && action.depart === undefined) {
				out.error("stop-without-time", "A stop needs a time.", where);
				return;
			}
			previous = checkStop(out, ref, i, action, previous, seenLocation);
			seenLocation = true;
			return;
		}

		if (action.kind === "pass") seenLocation = true;

		const time = actionTime(action);
		if (time === null) return;
		if (!Number.isFinite(time) || time < 0) {
			out.error("invalid-time", "That is not a time.", where);
			return;
		}
		previous = checkOrder(out, ref, i, previous, time);
	});
}

/**
 * One timed stop: its own span, its dwell, and where it falls in the service's
 * order. Returns the time to carry forward.
 */
function checkStop(
	out: IssueList,
	ref: ServiceRef,
	actionIndex: number,
	stop: ActionOf<"stop">,
	previous: SimTime | null,
	seenLocation: boolean,
): SimTime | null {
	const { arrive, depart } = stop;
	const where = { serviceRef: ref, actionIndex };
	if (arrive !== undefined && depart !== undefined && depart < arrive) {
		out.error(
			"depart-before-arrive",
			`"${ref}" leaves ${stop.location} at ${formatSimTime(depart)}, before it arrives at ${formatSimTime(arrive)}.`,
			where,
		);
	}
	if (stop.minDwellSeconds !== undefined && !(stop.minDwellSeconds >= 0)) {
		out.error("invalid-dwell", "A minimum dwell cannot be negative.", where);
	}
	// A lone time at the first location is a departure; elsewhere it is an
	// arrival, and the stop's own span runs from there to `depart`.
	const effectiveArrive =
		arrive ?? (seenLocation ? (depart as SimTime) : undefined);
	const effectiveDepart = depart ?? (arrive as SimTime);
	let carried = previous;
	if (effectiveArrive !== undefined) {
		carried = checkOrder(out, ref, actionIndex, carried, effectiveArrive);
	}
	return checkOrder(out, ref, actionIndex, carried, effectiveDepart);
}

/** Report a time that goes backwards, and carry the later of the two forward. */
function checkOrder(
	out: IssueList,
	ref: ServiceRef,
	actionIndex: number,
	previous: SimTime | null,
	time: SimTime,
): SimTime {
	if (previous !== null && time < previous) {
		out.error(
			"time-goes-backwards",
			`"${ref}" is booked at ${formatSimTime(time)} after ${formatSimTime(previous)}.`,
			{ serviceRef: ref, actionIndex },
		);
		return previous;
	}
	return time;
}

/**
 * Every link between services must be matched exactly once, from both ends, and
 * both ends must agree on the time.
 *
 * A split names the portion it becomes and that portion names its parent; a
 * finishing service names its successor and the successor names it; a join
 * names the train it couples onto and that train is waiting with a `joinedBy`.
 * A one-sided link is the mistake RailOS catches in its cross-reference pass,
 * and it is caught the same way here — by collecting both directions and
 * pairing them off.
 */
function validateCrossReferences(tt: Timetable, out: IssueList): void {
	const byRef = new Map<ServiceRef, Service>();
	for (const service of tt.services) {
		if (!byRef.has(service.ref)) byRef.set(service.ref, service);
	}

	/** References made *by* a service, keyed by the kind of link. */
	const splitsOut: Reference[] = [];
	const splitsIn: Reference[] = [];
	const handoversOut: Reference[] = [];
	const handoversIn: Reference[] = [];
	const joinsOut: Reference[] = [];
	const joinsIn: Reference[] = [];

	for (const service of tt.services) {
		service.actions.forEach((action, i) => {
			const base = {
				serviceRef: service.ref,
				actionIndex: i,
				kind: action.kind,
				time: actionTime(action),
			};
			switch (action.kind) {
				case "frontSplit":
				case "rearSplit":
					splitsOut.push({ ...base, target: action.newRef });
					break;
				case "startFromSplit":
					splitsIn.push({ ...base, target: action.fromRef });
					break;
				case "finishNewService":
					handoversOut.push({ ...base, target: action.nextRef });
					break;
				case "startNewService":
					handoversIn.push({ ...base, target: action.fromRef });
					break;
				case "finishJoin":
					joinsOut.push({ ...base, target: action.otherRef });
					break;
				case "joinedBy":
					joinsIn.push({ ...base, target: action.otherRef });
					break;
				default:
					break;
			}
		});
	}

	// Every reference must name a service that exists, whichever direction it
	// runs — checked once here so the pairing below only has real names to match.
	for (const reference of [
		...splitsOut,
		...splitsIn,
		...handoversOut,
		...handoversIn,
		...joinsOut,
		...joinsIn,
	]) {
		if (!byRef.has(reference.target)) {
			out.error(
				"unknown-service-ref",
				`"${reference.serviceRef}" refers to "${reference.target}", which is not in this timetable.`,
				{
					serviceRef: reference.serviceRef,
					actionIndex: reference.actionIndex,
				},
			);
		}
		if (reference.target === reference.serviceRef) {
			out.error(
				"self-reference",
				`"${reference.serviceRef}" refers to itself.`,
				{
					serviceRef: reference.serviceRef,
					actionIndex: reference.actionIndex,
				},
			);
		}
	}

	pairUp(out, byRef, splitsOut, splitsIn, {
		outName: "split",
		inName: "start from a split",
	});
	pairUp(out, byRef, handoversOut, handoversIn, {
		outName: "hand-over",
		inName: "take-over",
	});
	pairUp(out, byRef, joinsOut, joinsIn, {
		outName: "join",
		inName: "wait to be joined",
	});
}

const SHUTTLE_STARTS = new Set<Action["kind"]>([
	"startNewShuttle",
	"startShuttle",
]);
const SHUTTLE_FINISHES = new Set<Action["kind"]>([
	"finishShuttleRemainHere",
	"finishShuttleNewService",
]);

/** Ten seconds, the slack RailOS allows on a shuttle's repeat times. */
const SHUTTLE_TIME_SLACK = 10;

function lookupShuttleRef(
	byRef: Map<ServiceRef, Service>,
	ownerRef: ServiceRef,
	targetRef: ServiceRef,
	where: { serviceRef: ServiceRef; actionIndex: number },
	out: IssueList,
): Service | null {
	const target = byRef.get(targetRef);
	if (!target) {
		out.error(
			"unknown-service-ref",
			`"${ownerRef}" refers to "${targetRef}", which is not in this timetable.`,
			where,
		);
		return null;
	}
	if (targetRef === ownerRef) {
		out.error("self-reference", `"${ownerRef}" refers to itself.`, where);
		return null;
	}
	return target;
}

function validateShuttleRepeatRules(service: Service, out: IssueList): void {
	const start = service.actions[0];
	const finish = service.actions[service.actions.length - 1];
	const where = { serviceRef: service.ref };
	const shuttles =
		(start !== undefined && SHUTTLE_STARTS.has(start.kind)) ||
		(finish !== undefined && SHUTTLE_FINISHES.has(finish.kind));
	if (shuttles && !service.repeat) {
		out.error(
			"shuttle-needs-repeat",
			`"${service.ref}" is a shuttle, so it needs a repeat.`,
			where,
		);
	}
	if (shuttles && service.repeat && service.repeat.count < 1) {
		out.error(
			"shuttle-needs-repeat",
			`"${service.ref}" must run at least one repeat.`,
			where,
		);
	}
	const linksWithoutRepeating =
		start?.kind === "startFromShuttle" || finish?.kind === "finishToShuttle";
	if (linksWithoutRepeating && service.repeat) {
		out.error(
			"shuttle-no-repeat",
			`"${service.ref}" links a shuttle without itself repeating, so it cannot have a repeat.`,
			where,
		);
	}
	if (
		start?.kind === "startNewShuttle" &&
		service.train &&
		service.train.startSpeedKmh !== 0
	) {
		out.error(
			"shuttle-start-speed",
			`"${service.ref}" starts a shuttle, so it must start from rest.`,
			where,
		);
	}
}

function validateShuttlePairTiming(
	service: Service,
	other: Service,
	startTime: number,
	finishTime: number,
	where: { serviceRef: ServiceRef; actionIndex: number },
	out: IssueList,
): void {
	if (!service.repeat || !other.repeat) return;
	const same =
		service.repeat.intervalMinutes === other.repeat.intervalMinutes &&
		service.repeat.headcodeIncrement === other.repeat.headcodeIncrement &&
		service.repeat.count === other.repeat.count;
	if (!same) {
		out.error(
			"shuttle-repeat-mismatch",
			`"${service.ref}" and "${other.ref}" must repeat on the same interval, increment and count.`,
			where,
		);
	}
	const expected = startTime + service.repeat.intervalMinutes * 60;
	if (Math.abs(expected - finishTime) > SHUTTLE_TIME_SLACK) {
		out.error(
			"shuttle-time",
			`"${other.ref}" should finish its first shuttle leg at ${formatSimTime(expected)}.`,
			{ serviceRef: other.ref, actionIndex: other.actions.length - 1 },
		);
	}
}

function validateShuttleStart(
	service: Service,
	byRef: Map<ServiceRef, Service>,
	claimedFinishes: Set<ServiceRef>,
	out: IssueList,
): void {
	const start = service.actions[0];
	if (start?.kind !== "startNewShuttle" && start?.kind !== "startShuttle") {
		return;
	}
	const where = { serviceRef: service.ref, actionIndex: 0 };
	if (start.kind === "startShuttle") {
		const feeder = lookupShuttleRef(
			byRef,
			service.ref,
			start.fromRef,
			where,
			out,
		);
		if (
			feeder &&
			!feeder.actions.some(
				(a) => a.kind === "finishToShuttle" && a.nextRef === service.ref,
			)
		) {
			out.error(
				"unmatched-reference",
				`"${service.ref}" expects to start a shuttle from "${start.fromRef}", but "${start.fromRef}" does not hand over to it.`,
				where,
			);
		}
	}

	const other = byRef.get(start.otherRef);
	if (!other) {
		out.error(
			"unknown-service-ref",
			`"${service.ref}" refers to "${start.otherRef}", which is not in this timetable.`,
			where,
		);
		return;
	}
	claimedFinishes.add(other.ref);
	const finish = other.actions[other.actions.length - 1];
	const matches =
		(finish?.kind === "finishShuttleRemainHere" ||
			finish?.kind === "finishShuttleNewService") &&
		finish.otherRef === service.ref;
	if (!matches) {
		out.error(
			"unmatched-reference",
			`"${service.ref}" alternates with "${other.ref}", but "${other.ref}" does not shuttle back to it.`,
			where,
		);
		return;
	}
	validateShuttlePairTiming(
		service,
		other,
		start.time,
		finish.time,
		where,
		out,
	);
	const linked = shuttleFinish(byRef, service);
	if (!linked || linked.otherRef !== service.ref) {
		out.error(
			"shuttle-integrity",
			`"${service.ref}" never shuttles back to its own start.`,
			where,
		);
	}
}

function validateUnclaimedShuttleFinish(
	service: Service,
	byRef: Map<ServiceRef, Service>,
	claimedFinishes: Set<ServiceRef>,
	out: IssueList,
): void {
	const finish = service.actions[service.actions.length - 1];
	const isShuttleFinish =
		finish?.kind === "finishShuttleRemainHere" ||
		finish?.kind === "finishShuttleNewService";
	if (!isShuttleFinish || claimedFinishes.has(service.ref)) return;

	const where = {
		serviceRef: service.ref,
		actionIndex: service.actions.length - 1,
	};
	if (!byRef.has(finish.otherRef)) {
		out.error(
			"unknown-service-ref",
			`"${service.ref}" refers to "${finish.otherRef}", which is not in this timetable.`,
			where,
		);
	} else {
		out.error(
			"unmatched-reference",
			`"${service.ref}" shuttles back to "${finish.otherRef}", but that service does not alternate with it.`,
			where,
		);
	}
}

function validateStartFromShuttle(
	service: Service,
	byRef: Map<ServiceRef, Service>,
	out: IssueList,
): void {
	const start = service.actions[0];
	if (start?.kind !== "startFromShuttle") return;
	const where = { serviceRef: service.ref, actionIndex: 0 };
	const shuttle = lookupShuttleRef(
		byRef,
		service.ref,
		start.fromRef,
		where,
		out,
	);
	if (!shuttle) return;
	const shuttleFinishAction = shuttle.actions[shuttle.actions.length - 1];
	if (
		shuttleFinishAction?.kind !== "finishShuttleNewService" ||
		shuttleFinishAction.nextRef !== service.ref
	) {
		out.error(
			"unmatched-reference",
			`"${service.ref}" expects to take over from shuttle "${start.fromRef}", but "${start.fromRef}" does not form it.`,
			where,
		);
	}
}

function validateFinishToShuttleActions(
	service: Service,
	byRef: Map<ServiceRef, Service>,
	out: IssueList,
): void {
	service.actions.forEach((action, i) => {
		if (action.kind !== "finishToShuttle") return;
		const where = { serviceRef: service.ref, actionIndex: i };
		const shuttle = lookupShuttleRef(
			byRef,
			service.ref,
			action.nextRef,
			where,
			out,
		);
		if (!shuttle) return;
		const shuttleStart = shuttle.actions[0];
		if (
			shuttleStart?.kind !== "startShuttle" ||
			shuttleStart.fromRef !== service.ref
		) {
			out.error(
				"unmatched-reference",
				`"${service.ref}" hands over to shuttle "${action.nextRef}", but that shuttle does not start from it.`,
				where,
			);
			return;
		}
		if (shuttleStart.time !== action.time) {
			out.error(
				"shuttle-time",
				`"${action.nextRef}" should start when "${service.ref}" hands it over, at ${formatSimTime(action.time)}.`,
				where,
			);
		}
	});
}

function validateShuttleTail(
	service: Service,
	byRef: Map<ServiceRef, Service>,
	out: IssueList,
): void {
	const finish = service.actions[service.actions.length - 1];
	if (finish?.kind !== "finishShuttleNewService") return;
	const where = {
		serviceRef: service.ref,
		actionIndex: service.actions.length - 1,
	};
	const tail = lookupShuttleRef(byRef, service.ref, finish.nextRef, where, out);
	if (!tail) return;
	const tailStart = tail.actions[0];
	if (
		tailStart?.kind !== "startFromShuttle" ||
		tailStart.fromRef !== service.ref
	) {
		out.error(
			"unmatched-reference",
			`"${service.ref}" forms "${finish.nextRef}" after its last repeat, but that service does not take over from it.`,
			where,
		);
		return;
	}
	if (!service.repeat) return;
	const expected =
		finish.time + service.repeat.count * service.repeat.intervalMinutes * 60;
	if (Math.abs(tailStart.time - expected) > SHUTTLE_TIME_SLACK) {
		out.error(
			"shuttle-time",
			`"${finish.nextRef}" should start at ${formatSimTime(expected)}, when "${service.ref}" finishes its last repeat.`,
			{ serviceRef: finish.nextRef, actionIndex: 0 },
		);
	}
}

/**
 * Shuttle links: a repeating pair that names each other, a feeder with no
 * repeat of its own, and a tail that starts when the last repeat finishes.
 *
 * RailOS checks these in `CheckCrossReferencesAndSetData`,
 * `CheckNonRepeatingShuttleLinksAndSetData` and `CheckShuttleServiceIntegrity`.
 */
function validateShuttles(tt: Timetable, out: IssueList): void {
	const byRef = new Map<ServiceRef, Service>();
	for (const service of tt.services) {
		if (!byRef.has(service.ref)) byRef.set(service.ref, service);
	}

	for (const service of tt.services) {
		validateShuttleRepeatRules(service, out);
	}
	const claimedFinishes = new Set<ServiceRef>();
	for (const service of tt.services) {
		validateShuttleStart(service, byRef, claimedFinishes, out);
	}
	for (const service of tt.services) {
		validateUnclaimedShuttleFinish(service, byRef, claimedFinishes, out);
	}
	for (const service of tt.services) {
		validateStartFromShuttle(service, byRef, out);
		validateFinishToShuttleActions(service, byRef, out);
		validateShuttleTail(service, byRef, out);
	}
}

/**
 * The shuttle finish reached by following `finishNewService` links from
 * `start`, or null when the chain leaves the shuttle or loops.
 */
function shuttleFinish(
	byRef: Map<ServiceRef, Service>,
	start: Service,
): ActionOf<"finishShuttleRemainHere" | "finishShuttleNewService"> | null {
	const seen = new Set<ServiceRef>();
	let current: Service | undefined = start;
	while (current && !seen.has(current.ref)) {
		seen.add(current.ref);
		const last = current.actions[current.actions.length - 1];
		if (
			last?.kind === "finishShuttleRemainHere" ||
			last?.kind === "finishShuttleNewService"
		) {
			return last;
		}
		if (last?.kind !== "finishNewService") return null;
		current = byRef.get(last.nextRef);
	}
	return null;
}

/**
 * Match one direction of a non-shuttle link against the other.
 *
 * A reference pairs when the service it names names it back. Anything left over
 * on either side is reported against the end that made it — which is the end
 * the user has to fix.
 */
function pairUp(
	out: IssueList,
	byRef: Map<ServiceRef, Service>,
	outgoing: Reference[],
	incoming: Reference[],
	labels: { outName: string; inName: string },
): void {
	const unmatchedIn = new Set(incoming);

	for (const from of outgoing) {
		if (!byRef.has(from.target)) continue; // already reported as unknown
		const matches = incoming.filter(
			(to) => to.serviceRef === from.target && to.target === from.serviceRef,
		);
		const [to] = matches;
		if (to === undefined) {
			out.error(
				"unmatched-reference",
				`"${from.serviceRef}" names "${from.target}" as its ${labels.outName}, but "${from.target}" does not ${labels.inName} from it.`,
				{ serviceRef: from.serviceRef, actionIndex: from.actionIndex },
			);
			continue;
		}
		if (matches.length > 1) {
			out.error(
				"ambiguous-reference",
				`"${from.target}" refers back to "${from.serviceRef}" more than once.`,
				{ serviceRef: from.serviceRef, actionIndex: from.actionIndex },
			);
		}
		unmatchedIn.delete(to);
		if (from.time !== null && to.time !== null && from.time !== to.time) {
			out.error(
				"reference-time-mismatch",
				`"${from.serviceRef}" is booked at ${formatSimTime(from.time)} but "${to.serviceRef}" answers at ${formatSimTime(to.time)}.`,
				{ serviceRef: from.serviceRef, actionIndex: from.actionIndex },
			);
		}
	}

	for (const to of unmatchedIn) {
		if (!byRef.has(to.target)) continue; // already reported as unknown
		out.error(
			"unmatched-reference",
			`"${to.serviceRef}" expects to ${labels.inName} from "${to.target}", but "${to.target}" has no matching ${labels.outName}.`,
			{ serviceRef: to.serviceRef, actionIndex: to.actionIndex },
		);
	}
}

/**
 * Check a timetable against the railway it is meant to run on: locations that
 * exist, start positions a train actually fits on, and exits that are exits.
 *
 * Ported from railway-dot-exe's `CheckLocationsExistInRailway` and
 * `CheckStartPositionValidity`, with the adjacency test taken from the same
 * helpers the connectivity report uses, so "these two cells are joined" means
 * exactly the same thing to the timetable as it does to the map.
 */
export function validateTimetableAgainstMap(
	tt: Timetable,
	map: Map_,
): TimetableIssue[] {
	const out = new IssueList();

	if (!isRailwayComplete(map)) {
		out.warn(
			"railway-incomplete",
			"The railway is not complete, so these checks may be judging a half-built map.",
		);
	}

	const known = new Set(getLocationNames(map));

	for (const service of tt.services) {
		service.actions.forEach((action, i) => {
			const where = { serviceRef: service.ref, actionIndex: i };

			if (action.kind === "stop" || action.kind === "pass") {
				if (!known.has(action.location.trim())) {
					out.error(
						"unknown-location",
						`There is nowhere called "${action.location}" on this railway.`,
						where,
					);
				}
				return;
			}

			if (action.kind === "startNew" || action.kind === "startNewShuttle") {
				checkStartPosition(map, action.rear, action.front, out, where);
				return;
			}

			if (action.kind === "finishExit") {
				if (action.exits.length === 0) {
					out.error(
						"no-exit",
						"A service leaving the map needs an exit.",
						where,
					);
				}
				for (const cell of action.exits) {
					const track = trackAtCell(map, cell);
					if (!track) {
						out.error(
							"exit-not-track",
							`There is no track at (${cell.gx}, ${cell.gy}).`,
							where,
						);
					} else if (track.data.kind !== "exit") {
						out.error(
							"exit-not-exit",
							`The track at (${cell.gx}, ${cell.gy}) is not an exit.`,
							where,
						);
					}
				}
			}
		});
	}

	return out.issues;
}

/**
 * A start position is a rear and a front cell: both track, adjacent, joined to
 * each other, and somewhere a train can legitimately stand.
 *
 * "Joined" is the same reciprocal-link test the connectivity report uses: two
 * cells being neighbours is not enough, since an H straight sits beside a V
 * straight without connecting to it.
 */
function checkStartPosition(
	map: Map_,
	rear: Cell,
	front: Cell,
	out: IssueList,
	where: { serviceRef: ServiceRef; actionIndex: number },
): void {
	const rearTrack = trackAtCell(map, rear);
	const frontTrack = trackAtCell(map, front);

	if (!rearTrack || !frontTrack) {
		const missing = !rearTrack ? rear : front;
		out.error(
			"start-not-track",
			`There is no track at (${missing.gx}, ${missing.gy}) to start a train on.`,
			where,
		);
		return;
	}
	if (rearTrack === frontTrack) {
		out.error(
			"start-same-cell",
			"A train's rear and front must be different cells.",
			where,
		);
		return;
	}

	// Front-first, because a train placed nose-out of an exit would leave the
	// map the instant it moved.
	if (frontTrack.data.kind === "exit") {
		out.error(
			"start-on-exit",
			"A train cannot start with its front on an exit.",
			where,
		);
	}
	if (rearTrack.hasLevelCrossing() || frontTrack.hasLevelCrossing()) {
		out.error(
			"start-on-level-crossing",
			"A train cannot start standing on a level crossing.",
			where,
		);
	}

	const link = linkIndexForOffset(front.gx - rear.gx, front.gy - rear.gy);
	if (link === null) {
		out.error(
			"start-not-adjacent",
			`(${rear.gx}, ${rear.gy}) and (${front.gx}, ${front.gy}) are not next to each other.`,
			where,
		);
		return;
	}
	// Adjacency is geometry; joining is the reciprocal link, which is what the
	// connectivity report means by "connected".
	if (!rearTrack.getLinkAt(link) || !frontTrack.getLinkAt(8 - link)) {
		out.error(
			"start-not-joined",
			`The track at (${rear.gx}, ${rear.gy}) does not join the track at (${front.gx}, ${front.gy}).`,
			where,
		);
	}
}

/**
 * Everything wrong with `tt`, against `map` when one is given.
 *
 * Without a map only the structural half runs, which is the right answer while
 * a timetable is being written against a railway that is not loaded — the
 * missing checks are the ones that would need the railway to answer.
 */
export function validateTimetable(
	tt: Timetable,
	map?: Map_ | null,
): TimetableIssue[] {
	const issues = validateTimetableStructure(tt);
	if (map) issues.push(...validateTimetableAgainstMap(tt, map));
	return issues;
}

/** Whether any issue is an error (warnings do not stop a timetable running). */
export function hasErrors(issues: readonly TimetableIssue[]): boolean {
	return issues.some((issue) => issue.severity === "error");
}

/** The issues belonging to one service, in the order they were found. */
export function issuesForService(
	issues: readonly TimetableIssue[],
	ref: ServiceRef,
): TimetableIssue[] {
	return issues.filter((issue) => issue.serviceRef === ref);
}
