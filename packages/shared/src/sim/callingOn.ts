/**
 * Calling-on (§5.13): permitting a train stopped at a red signal to draw onto
 * an already-occupied platform at low speed (up to 30 km/h).
 *
 * Follows railway-dot-exe's `CallingOnAllowed` (`TrainUnit.cpp:5402`) and
 * `CallingOnButton` / signal click handler (`InterfaceUnit.cpp:8709`).
 */

import type { Cell, Timetable } from "../railway/timetable/types";
import { lowerCrossingsOn } from "./crossings";
import {
	endsAtBuffers,
	isFacingSignal,
	leavesMap,
	type NodeId,
	nodeAt,
	nodeOf,
	occKeyOf,
	pathOf,
	type RailGraph,
	type Seg,
} from "./graph";
import {
	liesAgainst,
	nextSeg,
	routeKeys,
	sameSeg,
	trainKeys,
} from "./occupancy";
import type { CommandResult, Route, SimState, Train } from "./types";

const serviceByRef = (tt: Timetable, ref: string) =>
	tt.services.find((s) => s.ref === ref);

/** Maximum look-ahead distance past the protecting signal (RailOS: 4 km). */
const CALL_ON_RANGE_M = 4000;

/** Maximum speed while moving under calling-on authority (RailOS: 30 km/h). */
export const CALL_ON_MAX_SPEED_MS = 30 / 3.6;

/** Actions a facing train at the platform may be waiting on for calling-on. */
const ALLOWED_FACING_ACTIONS = new Set([
	"finishJoin",
	"joinedBy",
	"changeDirection",
	"finishRemainHere",
]);

interface CallingOnMatch {
	signalNode: NodeId;
	routeSegs: Seg[];
}

function upcomingStopsBeforeReversal(
	timetable: Timetable,
	train: Train,
): Set<string> {
	const stops = new Set<string>();
	const service = serviceByRef(timetable, train.working.ref);
	if (!service) return stops;
	for (const a of service.actions.slice(train.working.index)) {
		if (a.kind === "changeDirection") break;
		if (a.kind === "stop") stops.add(a.location);
	}
	return stops;
}

function trainOccupancyMap(
	graph: RailGraph,
	trains: readonly Train[],
	except: Train,
): Map<number, Train> {
	const map = new Map<number, Train>();
	for (const t of trains) {
		if (t === except) continue;
		for (const s of t.segs) {
			map.set(occKeyOf(graph, s), t);
		}
	}
	return map;
}

function isFacingOtherTrain(graph: RailGraph, other: Train, seg: Seg): boolean {
	const front = other.segs.at(-1);
	if (!front) return false;
	return (
		occKeyOf(graph, front) === occKeyOf(graph, seg) && !sameSeg(front, seg)
	);
}

function canAcceptBlockingTrain(
	graph: RailGraph,
	timetable: Timetable,
	other: Train,
	seg: Seg,
): boolean {
	if (other.segs.length === 0) return false;
	if (!isFacingOtherTrain(graph, other, seg)) return true;
	if (other.control.mode === "signaller") return true;
	const service = serviceByRef(timetable, other.working.ref);
	const action = service?.actions[other.working.index];
	return action !== undefined && ALLOWED_FACING_ACTIONS.has(action.kind);
}

function routeConflicts(state: SimState, graph: RailGraph, seg: Seg): boolean {
	const key = occKeyOf(graph, seg);
	for (const route of state.routes) {
		for (const rSeg of route.segs) {
			if (occKeyOf(graph, rSeg) === key && !sameSeg(rSeg, seg)) {
				return true;
			}
		}
	}
	return false;
}

const segKey = (seg: Seg): number => (seg.node * 9 + seg.entry) * 9 + seg.exit;

function isEligibleForCallingOn(state: SimState, train: Train): boolean {
	if (state.pending) return false;
	if (train.control.mode !== "timetable" || train.working.done) return false;
	if (
		train.status !== "waiting" ||
		train.wait !== "signal" ||
		train.speed > 0
	) {
		return false;
	}
	return train.working.at === null && train.segs.length > 0;
}

function protectingRedSignal(
	graph: RailGraph,
	state: SimState,
	lead: Seg,
): Seg | null {
	const firstAhead = nextSeg(graph, state.lies, lead);
	if (!firstAhead || !isFacingSignal(graph, firstAhead)) return null;
	if (state.aspects[firstAhead.node] !== 0) return null;
	if (state.callingOnSignals.includes(firstAhead.node)) return null;
	return firstAhead;
}

function isTargetPlatformCell(
	graph: RailGraph,
	cur: Seg,
	leadStation: string | null,
	stops: ReadonlySet<string>,
): boolean {
	const node = nodeOf(graph, cur.node);
	if (
		!node.location ||
		node.location === leadStation ||
		!stops.has(node.location)
	) {
		return false;
	}
	return node.kind !== "switch" || pathOf(graph, cur)?.rail === 0;
}

function isStepBlocked(
	graph: RailGraph,
	state: SimState,
	cur: Seg,
	stepNum: number,
	platformIndex: number,
): boolean {
	if (stepNum <= 1) return false;
	if (leavesMap(graph, cur) || endsAtBuffers(graph, cur)) return true;
	if (isFacingSignal(graph, cur)) return true;
	return platformIndex < 0 && routeConflicts(state, graph, cur);
}

function matchBlockingPlatform(
	graph: RailGraph,
	timetable: Timetable,
	blocking: Train,
	cur: Seg,
	path: readonly Seg[],
	platformIndex: number,
): Seg[] | null {
	if (platformIndex < 0) return null;
	if (!canAcceptBlockingTrain(graph, timetable, blocking, cur)) return null;
	return path.slice(0, platformIndex + 1);
}

function stepDistanceM(graph: RailGraph, cur: Seg, stepNum: number): number {
	return stepNum === 1 ? 0 : (pathOf(graph, cur)?.lengthM ?? 0);
}

function walkCallingOnRoute(
	graph: RailGraph,
	state: SimState,
	timetable: Timetable,
	train: Train,
	firstAhead: Seg,
	stops: ReadonlySet<string>,
): Seg[] | null {
	const lead = train.segs.at(-1);
	if (!lead) return null;
	const leadStation = nodeOf(graph, lead.node).location;
	const others = trainOccupancyMap(graph, state.trains, train);
	const seen = new Set<number>();
	const path: Seg[] = [];

	let cur: Seg | null = firstAhead;
	let stepNum = 1;
	let distance = 0;
	let platformIndex = -1;

	while (cur && distance <= CALL_ON_RANGE_M) {
		const sk = segKey(cur);
		if (seen.has(sk) || liesAgainst(graph, state.lies, cur)) return null;
		seen.add(sk);

		const blocking = others.get(occKeyOf(graph, cur));
		if (blocking) {
			return matchBlockingPlatform(
				graph,
				timetable,
				blocking,
				cur,
				path,
				platformIndex,
			);
		}
		if (isStepBlocked(graph, state, cur, stepNum, platformIndex)) return null;
		if (
			platformIndex < 0 &&
			isTargetPlatformCell(graph, cur, leadStation, stops)
		) {
			platformIndex = path.length;
		}

		path.push(cur);
		distance += stepDistanceM(graph, cur, stepNum);
		cur = nextSeg(graph, state.lies, cur);
		stepNum++;
	}
	return null;
}

/**
 * Determine whether `train` qualifies for calling-on (§5.13), and if so return
 * the protecting signal node and the unrestricted route segments to the first
 * platform element.
 */
function callingOnCheck(
	graph: RailGraph,
	state: SimState,
	timetable: Timetable,
	train: Train,
): CallingOnMatch | null {
	if (!isEligibleForCallingOn(state, train)) return null;

	const stops = upcomingStopsBeforeReversal(timetable, train);
	if (stops.size === 0) return null;

	const front = train.segs.at(-1);
	const firstAhead = front && protectingRedSignal(graph, state, front);
	if (!firstAhead) return null;

	const routeSegs = walkCallingOnRoute(
		graph,
		state,
		timetable,
		train,
		firstAhead,
		stops,
	);
	return routeSegs ? { signalNode: firstAhead.node, routeSegs } : null;
}

/** Recompute `callingOnAllowed` for every live train. */
export function refreshCallingOnFlags(
	graph: RailGraph,
	state: SimState,
	timetable: Timetable,
): void {
	for (const train of state.trains) {
		train.callingOnAllowed =
			callingOnCheck(graph, state, timetable, train) !== null;
	}
}

/** Clear calling-on indicator from a signal node if present. */
export function clearCallingOnSignal(state: SimState, nodeId: NodeId): void {
	if (!state.callingOnSignals.includes(nodeId)) return;
	state.callingOnSignals = state.callingOnSignals.filter((id) => id !== nodeId);
}

/**
 * Call a waiting train past the protecting red signal at `at` into its next
 * stop platform under restricted 30 km/h authority.
 */
export function callOn(
	graph: RailGraph,
	state: SimState,
	timetable: Timetable,
	at: Cell,
): CommandResult {
	if (state.run === "paused") {
		return { ok: false, message: "Cannot call on while paused." };
	}
	const signalNode = nodeAt(graph, at);
	if (signalNode === null || nodeOf(graph, signalNode).signalExit === null) {
		return { ok: false, message: "There is no signal there." };
	}
	for (const train of state.trains) {
		const match = callingOnCheck(graph, state, timetable, train);
		if (!match || match.signalNode !== signalNode) continue;

		if (!state.callingOnSignals.includes(signalNode)) {
			state.callingOnSignals.push(signalNode);
		}
		train.callingOn = true;
		train.callingOnAllowed = false;
		train.allowedCallOnNode = signalNode;

		// Set an unrestricted route up to the first platform cell unless the
		// segments are already covered by an existing route or part-route.
		const existingRoutes = routeKeys(graph, state);
		const occupied = trainKeys(graph, state.trains);
		const uncovered = match.routeSegs.filter(
			(s) =>
				!existingRoutes.has(occKeyOf(graph, s)) &&
				!occupied.has(occKeyOf(graph, s)),
		);
		if (uncovered.length === match.routeSegs.length && uncovered.length > 0) {
			const route: Route = {
				id: `R${state.nextRouteId++}`,
				kind: "unrestricted",
				segs: uncovered,
			};
			state.routes.push(route);
			lowerCrossingsOn(graph, state, route);
		}
		return { ok: true };
	}
	return { ok: false, message: "No train can be called on at that signal." };
}
