/**
 * Signal aspects, worked out from scratch from routes and occupancy.
 *
 * RailOS updates aspects incrementally as trains move and routes change; here
 * every aspect is recomputed each step instead, which is correct by
 * construction and cheap at the scale of a hand-built railway.
 *
 * A signal clears only along a set route. Walking each route back from its far
 * end, every signal shows one step better than the next signal ahead — red,
 * yellow, double yellow, green — and red when a train stands anywhere between
 * it and that next signal, or a level crossing there is not yet down.
 */

import { itemAt, lastOf } from "../util/checked";
import { crossingOpen } from "./crossings";
import {
	endsAtBuffers,
	isFacingSignal,
	leavesMap,
	type RailGraph,
} from "./graph";
import { beyondRoute } from "./routes";
import type { Route, SimState } from "./types";

/** Aspect values. */
const RED = 0;
const GREEN = 3;

/**
 * Nothing to step up from: a train, a level crossing that is not down, or the
 * plain end of a route lies ahead.
 */
const BLOCKED = -1;

/** As many passes as aspects can step up, so every chain settles. */
const PASSES = 4;

/**
 * The aspect a signal shows when the next signal ahead shows `ahead`
 * ({@link BLOCKED} for a train or a dead end in between).
 */
const behind = (ahead: number): number =>
	ahead < 0 ? RED : Math.min(GREEN, ahead + 1);

/** What the far end of `route` looks like to the last signal on it. */
function endValue(
	graph: RailGraph,
	state: SimState,
	route: Route,
	aspects: readonly number[],
): number {
	const last = lastOf(route.segs, "segment");
	// The world beyond an exit is assumed clear; buffers count as a red signal.
	if (leavesMap(graph, last)) return GREEN;
	if (endsAtBuffers(graph, last)) return RED;
	const next = beyondRoute(graph, state, route);
	if (next && isFacingSignal(graph, next))
		return itemAt(aspects, next.node, "aspect");
	return BLOCKED;
}

function setRouteAspects(
	graph: RailGraph,
	state: SimState,
	route: Route,
	occupied: (index: number) => boolean,
	aspects: number[],
): void {
	let ahead = endValue(graph, state, route, aspects);
	for (let i = route.segs.length - 1; i >= 0; i--) {
		const seg = itemAt(route.segs, i, "segment");
		if (occupied(i) || !crossingOpen(graph, state, seg.node)) {
			ahead = BLOCKED;
		}
		if (isFacingSignal(graph, seg)) {
			aspects[seg.node] = behind(ahead);
			ahead = itemAt(aspects, seg.node, "aspect");
		}
	}
}

/**
 * Every signal's aspect, given the routes set and where trains stand.
 * `isOccupied(route, index)` says whether a train is on that route segment.
 */
export function computeAspects(
	graph: RailGraph,
	state: SimState,
	isOccupied: (route: Route, index: number) => boolean,
): number[] {
	const aspects = graph.nodes.map(() => RED);
	for (let pass = 0; pass < PASSES; pass++) {
		for (const route of state.routes) {
			setRouteAspects(
				graph,
				state,
				route,
				(i) => isOccupied(route, i),
				aspects,
			);
		}
	}
	return aspects;
}
