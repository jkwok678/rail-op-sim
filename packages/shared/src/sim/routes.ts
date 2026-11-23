/**
 * Setting, cancelling and releasing routes.
 *
 * A signal stands at the *entry* edge of its cell for the direction it faces,
 * so a train waits for it in the cell behind. A route therefore starts *on*
 * its entry signal's cell and stops short of its end signal: the route ahead
 * of that one starts on it, and routes never share a rail. A preferred or
 * automatic route may pass through signals between, each clearing in turn.
 *
 * No route starts or ends on a level crossing, and an automatic route may not
 * pass over one: its barriers must come down for each train, which only a
 * route set for that train does.
 */

import type { Cell } from "../railway/timetable/types";
import { firstOf, itemAt, lastOf, soleItem } from "../util/checked";
import { MinHeap } from "../util/min-heap";
import { clearCallingOnSignal } from "./callingOn";
import { crossingChanging, lowerCrossingsOn } from "./crossings";
import {
	endsAtBuffers,
	type GraphNode,
	isFacingSignal,
	leavesMap,
	type NodeId,
	nodeAt,
	nodeOf,
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
/** Ways a route can leave `node`: at least one, or why there are none. */
function startSegs(node: GraphNode, kind: RouteKind): [Seg, ...Seg[]] | string {
	if (node.crossing !== null)
		return "A route cannot start on a level crossing.";
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
	return throughSegs(node);
}

/** Every way through `node`, or why there is none. */
function throughSegs(node: GraphNode): [Seg, ...Seg[]] | string {
	const [first, ...rest] = node.paths.map((p) => ({
		node: node.id,
		entry: p.entry,
		exit: p.exit,
	}));
	return first ? [first, ...rest] : "There is no way through that track.";
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
	const starts = startSegs(nodeOf(graph, id), kind);
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
	const node = nodeOf(graph, seg.node);
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
 * Search for the shortest route of `kind` from `from` to `to` (see {@link search}).
 * Each step must be free of trains and other routes; preferred routes follow
 * preferred directions, through any signals on the way, and stop short of an
 * end signal.
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
	if (nodeOf(graph, endId).crossing !== null)
		return failed("A route cannot end on a level crossing.");
	const starts = startSegs(nodeOf(graph, startId), kind);
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
	const segs = search(graph, state.lies, kind, open, endId, free);
	if (segs) return withLies(graph, state, segs);
	if (
		kind === "auto" &&
		search(graph, state.lies, kind, open, endId, free, true)
	) {
		return failed(
			"An automatic signals route cannot pass over a level crossing.",
		);
	}
	return failed(
		followsPreferred(kind)
			? "No route that way: it must follow preferred directions to a signal, buffers or an exit."
			: "No route between those two places.",
	);
}

/**
 * How costly a route is, compared in order: its length in metres, then the
 * number of diverging legs of points it takes, then the number of points it
 * has to move. The shortest route wins, and of routes as short, the
 * straightest, then the one that disturbs least.
 */
type Cost = readonly [lengthM: number, diverging: number, moves: number];

const cheaper = (a: Cost, b: Cost): boolean =>
	a[0] !== b[0] ? a[0] < b[0] : a[1] !== b[1] ? a[1] < b[1] : a[2] < b[2];

/** The cost of running along `seg`, given how the points lie now. */
function segCost(graph: RailGraph, lies: readonly number[], seg: Seg): Cost {
	const node = nodeOf(graph, seg.node);
	const path = pathOf(graph, seg);
	// A cell with no length set still counts, so nothing is free to run over.
	const length = Math.max(path?.lengthM ?? 0, 1);
	if (node.kind !== "switch" || !path || path.rail < 0) return [length, 0, 0];
	const diverging = node.rails[path.rail]?.secondary ? 1 : 0;
	return [length, diverging, lies[seg.node] === path.rail ? 0 : 1];
}

const plus = (a: Cost, b: Cost): Cost => [
	a[0] + b[0],
	a[1] + b[1],
	a[2] + b[2],
];

/** A searched route so far; `done` once it has arrived. */
interface Candidate {
	at: SearchNode;
	cost: Cost;
	done: boolean;
}

/**
 * Cheapest-first (Dijkstra) from `starts` until `end` is reached, or null —
 * see {@link Cost}. A route counts as found only when it is the cheapest left,
 * so a longer one that happens to arrive first does not win. `overCrossings`
 * lets an automatic route over level crossings, to tell whether they are all
 * that stand in its way.
 */
function search(
	graph: RailGraph,
	lies: readonly number[],
	kind: RouteKind,
	starts: Seg[],
	end: NodeId,
	free: (seg: Seg) => boolean,
	overCrossings = false,
): Seg[] | null {
	// The exit counts too: facing points have two legs from one node and entry.
	const key = (seg: Seg): number => (seg.node * 9 + seg.entry) * 9 + seg.exit;
	const queue = new MinHeap<Candidate>((a, b) => cheaper(a.cost, b.cost));
	const best = new Map<number, Cost>();
	const settled = new Set<number>();
	const offer = (at: SearchNode, cost: Cost, done = false): void => {
		if (!done) {
			const k = key(at.seg);
			const known = best.get(k);
			if (settled.has(k) || (known && !cheaper(cost, known))) return;
			best.set(k, cost);
		}
		queue.push({ at, cost, done });
	};
	for (const seg of starts)
		offer({ seg, parent: null }, segCost(graph, lies, seg));

	for (let looked = 0; queue.size > 0 && looked < SEARCH_LIMIT; looked++) {
		const next = queue.pop() as Candidate;
		if (next.done) return unwind(next.at);
		const k = key(next.at.seg);
		if (settled.has(k)) continue;
		settled.add(k);
		expand(graph, lies, kind, next, end, free, offer, overCrossings);
	}
	return null;
}

/** Look one step on from `current`, offering each way on — or its arrival. */
function expand(
	graph: RailGraph,
	lies: readonly number[],
	kind: RouteKind,
	current: Candidate,
	end: NodeId,
	free: (seg: Seg) => boolean,
	offer: (at: SearchNode, cost: Cost, done?: boolean) => void,
	overCrossings: boolean,
): void {
	const step = stepFrom(graph, current.at.seg.node, current.at.seg.exit);
	if (!step) return;
	for (const path of pathsFrom(graph, step.node, step.entry)) {
		const seg = { node: step.node, entry: path.entry, exit: path.exit };
		const reached = arrival(graph, kind, seg, end);
		if (reached === "before") {
			offer(current.at, current.cost, true);
			continue;
		}
		const cost = plus(current.cost, segCost(graph, lies, seg));
		const at = { seg, parent: current.at };
		if (reached === "include" && free(seg)) offer(at, cost, true);
		else if (canExtend(graph, kind, seg, overCrossings) && free(seg)) {
			offer(at, cost);
		}
	}
}

/** Whether a route of `kind` may carry on through `seg`. */
function canExtend(
	graph: RailGraph,
	kind: RouteKind,
	seg: Seg,
	overCrossings: boolean,
): boolean {
	if (!followsPreferred(kind)) return true;
	const node = nodeOf(graph, seg.node);
	if (kind === "auto" && node.crossing !== null && !overCrossings) {
		return false;
	}
	return prefers(node, seg);
}

function withLies(graph: RailGraph, state: SimState, segs: Seg[]): RouteFound {
	const lies: [NodeId, number][] = [];
	for (const seg of segs) {
		if (nodeOf(graph, seg.node).kind !== "switch") continue;
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
	lowerCrossingsOn(graph, state, pending.route);
}

/**
 * Set an automatic signals route on every plain section of line that does not
 * have one: from each signal, or each exit leading in, along preferred
 * directions to just short of the next signal, or onto an exit.
 *
 * Only sections the signaller has no choice about are set — a section through
 * points or a crossing, over a level crossing, into buffers, onto an unpaired linked track, or on
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
	const node = nodeOf(graph, seg.node);
	return (
		!needsChoosing(node) &&
		node.crossing === null &&
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
			prefers(nodeOf(graph, step.node), p),
		);
		const way = soleItem(ways);
		if (!way) return null;
		const next = { node: step.node, entry: way.entry, exit: way.exit };
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
 * running towards its entry close enough that it could not stop, and while a
 * level crossing on it is still moving.
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
	if (crossingChanging(graph, state, route.segs)) {
		return failed("The level crossing on that route is still moving.");
	}
	for (const seg of route.segs) clearCallingOnSignal(state, seg.node);
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
	if (id === null || nodeOf(graph, id).kind !== "switch") {
		return failed("Those are not points.");
	}
	const key = firstOf(nodeOf(graph, id).occKeys, "occupancy key");
	if (trainKeys(graph, state.trains).has(key))
		return failed("A train is on those points.");
	if (routeKeys(graph, state).has(key))
		return failed("Those points are locked by a route.");
	if (state.run === "paused")
		return failed("Points cannot be moved while paused.");
	state.lies[id] = 1 - itemAt(state.lies, id, "lie");
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
		const rightWay = sameSeg(itemAt(route.segs, i, "segment"), seg);
		const inOrder =
			i === 0 ||
			(from !== null && sameSeg(itemAt(route.segs, i - 1, "segment"), from));
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
	const last = lastOf(route.segs, "segment");
	const step = stepFrom(graph, last.node, last.exit);
	return step ? followSeg(graph, state.lies, step) : null;
}
