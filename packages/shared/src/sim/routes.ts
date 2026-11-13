/**
 * Setting, cancelling and releasing routes.
 *
 * A signal stands at the *entry* edge of its cell for the direction it faces,
 * so a train waits for it in the cell behind. A route therefore starts *on*
 * its entry signal's cell and stops short of the next signal: the route ahead
 * of that one starts on it, and routes never share a rail.
 */

import type { Cell } from "../railway/timetable/types";
import {
	endsAtBuffers,
	type GraphNode,
	isFacingSignal,
	leavesMap,
	type NodeId,
	nodeAt,
	occKeyOf,
	pathOf,
	type RailGraph,
	type Seg,
	stepFrom,
} from "./graph";
import {
	followSeg,
	pathsFrom,
	routeKeys,
	sameSeg,
	trainKeys,
} from "./occupancy";
import type { CommandResult, Route, RouteKind, SimState } from "./types";

/** How long a route takes to set, in timetable seconds. */
const SIGNALS_DELAY = 0.5;
const POINTS_DELAY = 2.5;
/** Most segments a route search will look at before giving up. */
const SEARCH_LIMIT = 20000;

type RouteFound =
	| { ok: true; segs: Seg[]; lies: [NodeId, number][] }
	| { ok: false; message: string };

const failed = (message: string): { ok: false; message: string } => ({
	ok: false,
	message,
});

const followsPreferred = (kind: RouteKind): boolean => kind !== "unrestricted";

const isJunction = (node: GraphNode): boolean =>
	node.kind === "switch" ||
	node.kind === "crossover" ||
	node.kind === "flyover";

const prefers = (
	node: GraphNode,
	seg: { entry: number; exit: number },
): boolean =>
	node.preferred.some((p) => p.entry === seg.entry && p.exit === seg.exit);

/**
 * The ways a route of `kind` may start on `node`, or a reason it may not.
 * Signals start in the direction they face; buffers and exits start heading
 * into the railway; unrestricted routes start on any plain cell either way.
 */
function startSegs(node: GraphNode, kind: RouteKind): Seg[] | string {
	if (followsPreferred(kind)) {
		if (node.signalExit !== null) {
			const seg = node.paths.find((p) => p.exit === node.signalExit);
			if (!seg || !prefers(node, seg)) {
				return "That signal does not face along a preferred direction.";
			}
			return [{ node: node.id, entry: seg.entry, exit: seg.exit }];
		}
		const leaving = node.deadEnd !== null && node.kind !== "linked";
		if (!leaving) return "A route must start at a signal, buffers or an exit.";
		if (kind === "auto" && node.kind === "buffer") {
			return "An automatic signals route cannot start at buffers.";
		}
		const dead = node.deadEnd as number;
		return [{ node: node.id, entry: dead, exit: 8 - dead }];
	}
	if (isJunction(node)) return "A route cannot start on points or a crossing.";
	return node.paths.map((p) => ({
		node: node.id,
		entry: p.entry,
		exit: p.exit,
	}));
}

/** Why a route of `kind` cannot start at `at`, or ok. */
export function checkRouteStart(
	graph: RailGraph,
	state: SimState,
	at: Cell,
	kind: RouteKind,
): CommandResult {
	const id = nodeAt(graph, at);
	if (id === null) return failed("There is no track there.");
	const starts = startSegs(graph.nodes[id], kind);
	if (typeof starts === "string") return failed(starts);
	const blocked = blockedReason(graph, state, starts[0]);
	return blocked ? failed(blocked) : { ok: true };
}

function blockedReason(
	graph: RailGraph,
	state: SimState,
	seg: Seg,
): string | null {
	const key = occKeyOf(graph, seg);
	if (trainKeys(graph, state.trains).has(key))
		return "There is a train in the way.";
	if (routeKeys(graph, state).has(key))
		return "There is already a route there.";
	return null;
}

interface SearchNode {
	seg: Seg;
	parent: SearchNode | null;
}

/** Whether a search reaching `seg` has found `end`, and if so where to stop. */
function arrival(
	graph: RailGraph,
	kind: RouteKind,
	seg: Seg,
	end: NodeId,
): "include" | "before" | null {
	if (seg.node !== end) return null;
	if (isFacingSignal(graph, seg)) return "before";
	const node = graph.nodes[seg.node];
	if (!followsPreferred(kind)) return isJunction(node) ? null : "include";
	if (leavesMap(graph, seg)) return "include";
	if (endsAtBuffers(graph, seg)) return kind === "auto" ? null : "include";
	return null;
}

function unwind(found: SearchNode | null): Seg[] {
	const segs: Seg[] = [];
	for (let n = found; n; n = n.parent) segs.push(n.seg);
	return segs.reverse();
}

/**
 * Breadth-first search for the shortest route of `kind` from `from` to `to`.
 * Each step must be free of trains and other routes; preferred routes follow
 * preferred directions and may not run past a signal facing them.
 */
function findRoute(
	graph: RailGraph,
	state: SimState,
	from: Cell,
	to: Cell,
	kind: RouteKind,
): RouteFound {
	const startId = nodeAt(graph, from);
	const endId = nodeAt(graph, to);
	if (startId === null || endId === null)
		return failed("There is no track there.");
	if (startId === endId) return failed("A route must end somewhere else.");
	const starts = startSegs(graph.nodes[startId], kind);
	if (typeof starts === "string") return failed(starts);

	const trains = trainKeys(graph, state.trains);
	const routes = routeKeys(graph, state);
	const free = (seg: Seg): boolean => {
		const key = occKeyOf(graph, seg);
		return !trains.has(key) && !routes.has(key);
	};

	const open = starts.filter(free);
	if (open.length === 0) {
		return failed(blockedReason(graph, state, starts[0]) ?? "");
	}
	const segs = search(graph, kind, open, endId, free);
	if (segs) return withLies(graph, state, segs);
	return failed(
		followsPreferred(kind)
			? "No route that way: it must follow preferred directions to the next signal, buffers or an exit."
			: "No route between those two places.",
	);
}

/** Breadth-first from `starts` until `end` is reached, or null. */
function search(
	graph: RailGraph,
	kind: RouteKind,
	starts: Seg[],
	end: NodeId,
	free: (seg: Seg) => boolean,
): Seg[] | null {
	const key = (seg: Seg): number => seg.node * 9 + seg.entry;
	const queue: SearchNode[] = starts.map((seg) => ({ seg, parent: null }));
	const seen = new Set<number>(starts.map(key));
	const enqueue = (node: SearchNode): void => {
		if (seen.has(key(node.seg))) return;
		seen.add(key(node.seg));
		queue.push(node);
	};
	for (let head = 0; head < queue.length && head < SEARCH_LIMIT; head++) {
		const found = expand(graph, kind, queue[head], end, free, enqueue);
		if (found) return found;
	}
	return null;
}

/** Look one step on from `current`: the route if it arrives, else queue the ways on. */
function expand(
	graph: RailGraph,
	kind: RouteKind,
	current: SearchNode,
	end: NodeId,
	free: (seg: Seg) => boolean,
	enqueue: (node: SearchNode) => void,
): Seg[] | null {
	const step = stepFrom(graph, current.seg.node, current.seg.exit);
	if (!step) return null;
	for (const path of pathsFrom(graph, step.node, step.entry)) {
		const seg = { node: step.node, entry: path.entry, exit: path.exit };
		const reached = arrival(graph, kind, seg, end);
		if (reached === "before") return unwind(current);
		if (reached === "include" && free(seg)) {
			return unwind({ seg, parent: current });
		}
		if (canExtend(graph, kind, seg) && free(seg)) {
			enqueue({ seg, parent: current });
		}
	}
	return null;
}

/** Whether a route of `kind` may carry on through `seg`. */
function canExtend(graph: RailGraph, kind: RouteKind, seg: Seg): boolean {
	if (!followsPreferred(kind)) return true;
	const node = graph.nodes[seg.node];
	if (!prefers(node, seg)) return false;
	// Consecutive signals only: a facing signal ends the route before it.
	return !isFacingSignal(graph, seg);
}

function withLies(graph: RailGraph, state: SimState, segs: Seg[]): RouteFound {
	const lies: [NodeId, number][] = [];
	for (const seg of segs) {
		if (graph.nodes[seg.node].kind !== "switch") continue;
		const rail = pathOf(graph, seg)?.rail ?? -1;
		if (rail >= 0 && state.lies[seg.node] !== rail) lies.push([seg.node, rail]);
	}
	return { ok: true, segs, lies };
}

/**
 * Find and set a route. Outside prestart it is held as pending for the
 * setting delay — longer when points have to move — and committed by
 * {@link commitPendingRoute}.
 */
export function setRoute(
	graph: RailGraph,
	state: SimState,
	from: Cell,
	to: Cell,
	kind: RouteKind,
): CommandResult {
	if (state.run === "paused")
		return failed("Routes cannot be set while paused.");
	if (state.pending)
		return failed("Wait for the last route to finish setting.");
	const found = findRoute(graph, state, from, to, kind);
	if (!found.ok) return found;
	const route: Route = {
		id: `R${state.nextRouteId++}`,
		kind,
		segs: found.segs,
	};
	const delay =
		state.run === "prestart"
			? 0
			: found.lies.length > 0
				? POINTS_DELAY
				: SIGNALS_DELAY;
	state.pending = { route, commitAt: state.time + delay, lies: found.lies };
	if (delay === 0) commitPendingRoute(graph, state);
	return { ok: true };
}

/**
 * Commit the pending route once its delay is up. A train that has moved onto
 * it while it was setting abandons it, as RailOS does.
 */
export function commitPendingRoute(graph: RailGraph, state: SimState): void {
	const pending = state.pending;
	if (!pending || state.time + 1e-9 < pending.commitAt) return;
	state.pending = null;
	const trains = trainKeys(graph, state.trains);
	if (pending.route.segs.some((seg) => trains.has(occKeyOf(graph, seg))))
		return;
	for (const [node, rail] of pending.lies) state.lies[node] = rail;
	state.routes.push(pending.route);
}

/**
 * Set an automatic signals route on every plain section of line that does not
 * have one: from each signal, or each exit leading in, along preferred
 * directions to just short of the next signal, or onto an exit.
 *
 * Only sections the signaller has no choice about are set — a section through
 * points or a crossing, into buffers, onto an unpaired linked track, or on
 * track preferred both ways (where an automatic route would lock out the other
 * direction) is left for setting by hand. Paired linked tracks are plain line:
 * a section carries on through the hop to the partner. Nothing moves, so the
 * routes set at once.
 */
export function setAllAutoRoutes(
	graph: RailGraph,
	state: SimState,
): CommandResult {
	if (state.run === "paused")
		return failed("Routes cannot be set while paused.");
	const taken = new Set<number>([
		...trainKeys(graph, state.trains).keys(),
		...routeKeys(graph, state).keys(),
	]);
	const free = (seg: Seg): boolean => !taken.has(occKeyOf(graph, seg));
	let set = 0;
	for (const node of graph.nodes) {
		const starts = startSegs(node, "auto");
		if (typeof starts === "string") continue;
		const segs = plainAutoRoute(graph, starts[0], free);
		if (!segs) continue;
		for (const seg of segs) taken.add(occKeyOf(graph, seg));
		state.routes.push({ id: `R${state.nextRouteId++}`, kind: "auto", segs });
		set++;
	}
	if (set === 0) return failed("No automatic routes left to set.");
	return {
		ok: true,
		message: `Set ${set} automatic route${set === 1 ? "" : "s"}.`,
	};
}

/** Points and crossings: places a route needs the signaller to choose. */
const needsChoosing = (node: GraphNode): boolean =>
	node.kind === "switch" || node.kind === "crossover";

/** Whether `seg` runs on track preferred the other way too. */
const twoWay = (node: GraphNode, seg: Seg): boolean =>
	prefers(node, { entry: seg.exit, exit: seg.entry });

/** Whether `seg` is somewhere an automatic route may run through. */
function plainSeg(
	graph: RailGraph,
	seg: Seg,
	free: (s: Seg) => boolean,
): boolean {
	const node = graph.nodes[seg.node];
	return (
		!needsChoosing(node) &&
		prefers(node, seg) &&
		!twoWay(node, seg) &&
		free(seg)
	);
}

/**
 * The plain section from `start` to just short of the next signal, or onto an
 * exit, or null when it is not plain all the way.
 */
function plainAutoRoute(
	graph: RailGraph,
	start: Seg,
	free: (seg: Seg) => boolean,
): Seg[] | null {
	if (!plainSeg(graph, start, free)) return null;
	const segs = [start];
	const seen = new Set<NodeId>([start.node]);
	for (let current = start; segs.length < SEARCH_LIMIT; ) {
		if (leavesMap(graph, current)) return segs;
		if (endsAtBuffers(graph, current)) return null;
		const step = stepFrom(graph, current.node, current.exit);
		if (!step) return null;
		const ways = pathsFrom(graph, step.node, step.entry).filter((p) =>
			prefers(graph.nodes[step.node], p),
		);
		if (ways.length !== 1) return null;
		const next = { node: step.node, entry: ways[0].entry, exit: ways[0].exit };
		if (isFacingSignal(graph, next)) return segs;
		if (seen.has(next.node) || !plainSeg(graph, next, free)) return null;
		seen.add(next.node);
		segs.push(next);
		current = next;
	}
	return null;
}

/**
 * Cancel the route through `at`, whole. Refused while a train is on it or
 * running towards its entry close enough that it could not stop.
 */
export function cancelRoute(
	graph: RailGraph,
	state: SimState,
	at: Cell,
	approaching: (route: Route) => boolean,
): CommandResult {
	const id = nodeAt(graph, at);
	const route = state.routes.find((r) => r.segs.some((s) => s.node === id));
	if (!route) return failed("There is no route there.");
	const trains = trainKeys(graph, state.trains);
	if (route.segs.some((seg) => trains.has(occKeyOf(graph, seg)))) {
		return failed("A train is on that route.");
	}
	if (approaching(route)) {
		return failed("A train is too close to that route to stop for it.");
	}
	state.routes.splice(state.routes.indexOf(route), 1);
	return { ok: true };
}

/** Throw the points at `at` over, when nothing holds them. */
export function togglePoints(
	graph: RailGraph,
	state: SimState,
	at: Cell,
): CommandResult {
	const id = nodeAt(graph, at);
	if (id === null || graph.nodes[id].kind !== "switch") {
		return failed("Those are not points.");
	}
	const key = graph.nodes[id].occKeys[0];
	if (trainKeys(graph, state.trains).has(key))
		return failed("A train is on those points.");
	if (routeKeys(graph, state).has(key))
		return failed("Those points are locked by a route.");
	if (state.run === "paused")
		return failed("Points cannot be moved while paused.");
	state.lies[id] = 1 - state.lies[id];
	return { ok: true };
}

/**
 * A train's rear has cleared `seg`: release it from any route that is not an
 * automatic signals route, along with whatever of that route lies behind it.
 */
export function releaseBehind(state: SimState, seg: Seg): void {
	state.routes = state.routes.filter((route) => {
		if (route.kind === "auto") return true;
		const i = route.segs.findIndex((s) => sameSeg(s, seg));
		if (i >= 0) route.segs.splice(0, i + 1);
		return route.segs.length > 0;
	});
}

/**
 * A train's front has entered `seg` from `from`. A route entered anywhere but
 * at its start, or from somewhere other than the segment before, is cancelled:
 * RailOS's wrong-end entry. Returns the cancelled route, if any.
 */
export function cancelOnWrongEntry(
	state: SimState,
	seg: Seg,
	from: Seg | null,
): Route | null {
	for (const route of state.routes) {
		const i = route.segs.findIndex((s) => s.node === seg.node);
		if (i < 0) continue;
		const rightWay = sameSeg(route.segs[i], seg);
		const inOrder =
			i === 0 || (from !== null && sameSeg(route.segs[i - 1], from));
		if (rightWay && inOrder) return null;
		if (route.kind === "auto" && rightWay) return null;
		state.routes.splice(state.routes.indexOf(route), 1);
		return route;
	}
	return null;
}

/** Follow `segs` from the end of a route into whatever is beyond, by the lie. */
export function beyondRoute(
	graph: RailGraph,
	state: SimState,
	route: Route,
): Seg | null {
	const last = route.segs[route.segs.length - 1];
	const step = stepFrom(graph, last.node, last.exit);
	return step ? followSeg(graph, state.lies, step) : null;
}
