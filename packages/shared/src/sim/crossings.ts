/**
 * Automatic level crossings, after RailOS (OPERATE-MODE §5.12).
 *
 * A crossing's barriers stand up — road open, railway closed — until a route
 * is set over it. Then they lower, which takes 30 seconds, and the signals
 * protecting the crossing stay red until they are down. Once no route and no
 * train is left on the crossing they rise again, in 10 seconds.
 *
 * Both times are timetable time, shortened at clock speeds below ×1 so they
 * take the same real time there, and nothing at all before the clock starts.
 */

import type { NodeId, RailGraph, Seg } from "./graph";
import { nodeOf } from "./graph";
import { routeKeys, trainKeys } from "./occupancy";
import type { CrossingState, Route, SimState } from "./types";

/** How long the barriers take to come down, and to go back up, in seconds. */
const LOWER_S = 30;
const RAISE_S = 10;
/** Down time that counts as needed once a train has been over the crossing. */
const ALLOWANCE_S = 180;

export function initialCrossings(graph: RailGraph): CrossingState[] {
	return graph.crossings.map(() => ({
		barriers: "up",
		changeAt: 0,
		downSince: 0,
		trainSeen: false,
	}));
}

function changeTime(state: SimState, seconds: number): number {
	return state.run === "prestart" ? 0 : seconds * Math.min(1, state.speed);
}

/** The crossing at `node`, or null when there is none. */
function crossingAt(
	graph: RailGraph,
	state: SimState,
	node: NodeId,
): CrossingState | null {
	const index = nodeOf(graph, node).crossing;
	return index === null ? null : (state.crossings[index] ?? null);
}

/** Whether a train may run over `node`: no crossing there, or one that is down. */
export function crossingOpen(
	graph: RailGraph,
	state: SimState,
	node: NodeId,
): boolean {
	const crossing = crossingAt(graph, state, node);
	return crossing === null || crossing.barriers === "down";
}

/** Whether any crossing on `segs` has its barriers on the move. */
export function crossingChanging(
	graph: RailGraph,
	state: SimState,
	segs: readonly Seg[],
): boolean {
	return segs.some((seg) => {
		const barriers = crossingAt(graph, state, seg.node)?.barriers;
		return barriers === "lowering" || barriers === "raising";
	});
}

/** A route has been set: start lowering every crossing on it that is not down. */
export function lowerCrossingsOn(
	graph: RailGraph,
	state: SimState,
	route: Route,
): void {
	for (const seg of route.segs) {
		const crossing = crossingAt(graph, state, seg.node);
		if (!crossing || crossing.barriers === "down") continue;
		if (crossing.barriers === "lowering") continue;
		crossing.barriers = "lowering";
		crossing.changeAt = state.time + changeTime(state, LOWER_S);
	}
	finishChanges(state);
}

/** Barriers that have finished moving come to rest. */
function finishChanges(state: SimState): void {
	for (const crossing of state.crossings) {
		if (state.time + 1e-9 < crossing.changeAt) continue;
		if (crossing.barriers === "lowering") {
			crossing.barriers = "down";
			crossing.downSince = state.time;
			crossing.trainSeen = false;
		} else if (crossing.barriers === "raising") {
			crossing.barriers = "up";
		}
	}
}

/**
 * Bring moving barriers to rest, note trains over crossings that are down, and
 * start raising any crossing that no route or train needs any more — adding
 * how long it was down for nothing to the excess-down counter.
 */
export function workCrossings(graph: RailGraph, state: SimState): void {
	finishChanges(state);
	const trains = trainKeys(graph, state.trains);
	const routes = routeKeys(graph, state);
	graph.crossings.forEach((lc, i) => {
		const crossing = state.crossings[i];
		if (crossing?.barriers !== "down") return;
		const keys = lc.nodes.flatMap((id) => nodeOf(graph, id).occKeys);
		const trainOn = keys.some((key) => trains.has(key));
		if (trainOn) crossing.trainSeen = true;
		if (trainOn || keys.some((key) => routes.has(key))) return;
		const allowed = crossing.trainSeen ? ALLOWANCE_S : 0;
		const excess = state.time - crossing.downSince - allowed;
		if (excess > 0) state.counters.excessLcDownMins += excess / 60;
		crossing.barriers = "raising";
		crossing.changeAt = state.time + changeTime(state, RAISE_S);
	});
	finishChanges(state);
}

/** Whether a train entering `seg` at `speed` (m/s) runs into road traffic. */
export function hitsRoadTraffic(
	graph: RailGraph,
	state: SimState,
	seg: Seg,
	speed: number,
): boolean {
	return speed > 1 / 3.6 && !crossingOpen(graph, state, seg.node);
}
