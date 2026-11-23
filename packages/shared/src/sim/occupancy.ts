/**
 * Who is where: which rails trains stand on and which rails routes hold.
 *
 * Both are keyed by {@link GraphNode.occKeys}, so a flyover's two rails are
 * separate and every other cell is one key however many rails it has.
 */

import {
	type GraphPath,
	type NodeId,
	nodeOf,
	occKeyOf,
	type RailGraph,
	type Seg,
	type Step,
	stepFrom,
} from "./graph";
import type { Route, SimState, Train } from "./types";

/** Rails occupied by trains: occupancy key → train id. */
export function trainKeys(
	graph: RailGraph,
	trains: readonly Train[],
): Map<number, number> {
	const keys = new Map<number, number>();
	for (const train of trains) {
		for (const seg of train.segs) keys.set(occKeyOf(graph, seg), train.id);
	}
	return keys;
}

/** Rails held by routes, set or still being set: occupancy key → route. */
export function routeKeys(
	graph: RailGraph,
	state: SimState,
): Map<number, Route> {
	const keys = new Map<number, Route>();
	const all = state.pending
		? [...state.routes, state.pending.route]
		: state.routes;
	for (const route of all) {
		for (const seg of route.segs) keys.set(occKeyOf(graph, seg), route);
	}
	return keys;
}

export const sameSeg = (a: Seg, b: Seg): boolean =>
	a.node === b.node && a.entry === b.entry && a.exit === b.exit;

/** The paths a train entering `node` at `entry` could take, ignoring the lie. */
export function pathsFrom(
	graph: RailGraph,
	node: NodeId,
	entry: number,
): GraphPath[] {
	return nodeOf(graph, node).paths.filter((p) => p.entry === entry);
}

/**
 * The segment a train takes entering at `step`, given how the points lie.
 * Facing a switch it follows the lie; trailing one, the only way out — even if
 * the switch lies the other way (see {@link liesAgainst}).
 */
export function followSeg(
	graph: RailGraph,
	lies: readonly number[],
	step: Step,
): Seg | null {
	const options = pathsFrom(graph, step.node, step.entry);
	const [first] = options;
	if (!first) return null;
	const chosen =
		options.length === 1
			? first
			: (options.find((p) => p.rail === lies[step.node]) ?? first);
	return { node: step.node, entry: chosen.entry, exit: chosen.exit };
}

/** Whether running along `seg` means trailing through points set the other way. */
export function liesAgainst(
	graph: RailGraph,
	lies: readonly number[],
	seg: Seg,
): boolean {
	const node = nodeOf(graph, seg.node);
	if (node.kind !== "switch") return false;
	const path = node.paths.find(
		(p) => p.entry === seg.entry && p.exit === seg.exit,
	);
	return path !== undefined && path.rail !== lies[seg.node];
}

/** The segment after `seg`, following the lie, or null off the end of the line. */
export function nextSeg(
	graph: RailGraph,
	lies: readonly number[],
	seg: Seg,
): Seg | null {
	const step = stepFrom(graph, seg.node, seg.exit);
	return step ? followSeg(graph, lies, step) : null;
}
