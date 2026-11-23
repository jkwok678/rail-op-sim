/**
 * The railway as the simulator sees it: an immutable snapshot of a map, with
 * every track numbered and every way through it spelled out.
 *
 * The editor's {@link Map_} is the wrong shape to run trains on — it is keyed
 * by coordinates, holds mutable undo-recorded state, and only knows its
 * neighbours by looking them up. The graph is built once when operation starts
 * and never changes; everything that *does* change while trains run (point
 * lies, signal aspects, routes, occupancy) lives in the sim state, keyed by
 * {@link NodeId}.
 */

import type { Map_ } from "../railway/map/map";
import {
	expectedEntryOnNeighbor,
	neighborThroughLink,
} from "../railway/map/map-connectivity";
import type { Cell } from "../railway/timetable/types";
import type { PreferredDirection, Track } from "../railway/track/track";
import {
	getLinksForSubtype,
	getRails,
	type Rail,
	signalFacingExit,
	type TrackKind,
} from "../railway/track/track-data";
import { itemAt } from "../util/checked";

/** Index of a track in {@link RailGraph.nodes}. */
export type NodeId = number;

/** One way through a cell: in at `entry`, out at `exit`. */
export interface Seg {
	node: NodeId;
	entry: number;
	exit: number;
}

/** Where a train arrives leaving a node through a link. */
export interface Step {
	node: NodeId;
	entry: number;
}

/** A directed path through one cell and what it costs to run along it. */
export interface GraphPath {
	entry: number;
	exit: number;
	lengthM: number;
	speedKmh: number;
	/** Index into {@link GraphNode.rails}; -1 for a dead-end cell's own path. */
	rail: number;
}

export interface GraphNode {
	id: NodeId;
	cell: Cell;
	kind: TrackKind;
	subtype: string;
	rails: Rail[];
	paths: GraphPath[];
	/** The rail a switch lies on with no route set. */
	defaultLie: number;
	/** Exit link the signal protects, or null when this is not a signal. */
	signalExit: number | null;
	/** 1 shunt, 2/3/4-aspect; 0 when not a signal. */
	signalAspects: number;
	/** The dead-end edge of a buffer, exit or portal, or null. */
	deadEnd: number | null;
	/** Timetable location this cell belongs to, or null. */
	location: string | null;
	preferred: readonly PreferredDirection[];
	/**
	 * Occupancy key for each rail. Two trains (or routes) may share a cell only
	 * on a flyover, whose rails are grade separated; everywhere else the whole
	 * cell is one key.
	 */
	occKeys: number[];
	/** Index into {@link RailGraph.crossings} when a level crossing is here. */
	crossing: number | null;
}

/**
 * A level crossing: one cell, or several parallel tracks side by side whose
 * crossing cells touch (RailOS's linked level crossings). The barriers of all
 * of them move together.
 */
export interface LevelCrossing {
	/** Top to bottom, then left to right. */
	nodes: NodeId[];
}

export interface RailGraph {
	nodes: GraphNode[];
	/** Node at a cell, by `"gx,gy"`. */
	byCell: ReadonlyMap<string, NodeId>;
	/** Cells of every location name. */
	locations: ReadonlyMap<string, NodeId[]>;
	/** `next[node * 9 + link]`: where leaving through `link` arrives, or null. */
	next: (Step | null)[];
	crossings: LevelCrossing[];
}

/** The node with id `id`. Throws if the id was not handed out by this graph. */
export function nodeOf(graph: RailGraph, id: NodeId): GraphNode {
	return itemAt(graph.nodes, id, "node");
}

export const cellKey = (cell: Cell): string => `${cell.gx},${cell.gy}`;

/** Where leaving `node` through `link` arrives, or null off the end of the line. */
export function stepFrom(
	graph: RailGraph,
	node: NodeId,
	link: number,
): Step | null {
	return graph.next[node * 9 + link] ?? null;
}

export function nodeAt(graph: RailGraph, cell: Cell): NodeId | null {
	return graph.byCell.get(cellKey(cell)) ?? null;
}

/** The path for a segment, or undefined when it is not a way through the node. */
export function pathOf(graph: RailGraph, seg: Seg): GraphPath | undefined {
	return nodeOf(graph, seg.node).paths.find(
		(p) => p.entry === seg.entry && p.exit === seg.exit,
	);
}

export function segLength(graph: RailGraph, seg: Seg): number {
	return pathOf(graph, seg)?.lengthM ?? 0;
}

/** Occupancy key of the rail a segment runs along. */
export function occKeyOf(graph: RailGraph, seg: Seg): number {
	const node = nodeOf(graph, seg.node);
	const path = pathOf(graph, seg);
	return itemAt(node.occKeys, Math.max(0, path?.rail ?? 0), "occupancy key");
}

/** Whether a train running along `seg` passes a signal facing it. */
export function isFacingSignal(graph: RailGraph, seg: Seg): boolean {
	return nodeOf(graph, seg.node).signalExit === seg.exit;
}

/** Whether leaving `seg` takes a train off the map. */
export function leavesMap(graph: RailGraph, seg: Seg): boolean {
	const node = nodeOf(graph, seg.node);
	return node.kind === "exit" && node.deadEnd === seg.exit;
}

/** Whether `seg` runs into buffer stops. */
export function endsAtBuffers(graph: RailGraph, seg: Seg): boolean {
	const node = nodeOf(graph, seg.node);
	return node.kind === "buffer" && node.deadEnd === seg.exit;
}

/** Build the graph for `map`. Pure: the map is only read. */
export function buildGraph(map: Map_): RailGraph {
	const tracks: Track[] = [];
	map.forEachTrack((t) => {
		tracks.push(t);
	});
	const step = map.getImageSize();
	const cellOf = (t: Track): Cell => ({
		gx: t.getLocationX() / step,
		gy: t.getLocationY() / step,
	});
	tracks.sort((a, b) => {
		const ca = cellOf(a);
		const cb = cellOf(b);
		return ca.gy - cb.gy || ca.gx - cb.gx;
	});

	const ids = new Map<Track, NodeId>();
	tracks.forEach((t, i) => {
		ids.set(t, i);
	});

	const nodes = tracks.map((t, i) => buildNode(t, i, cellOf(t)));
	const byCell = new Map<string, NodeId>();
	const locations = new Map<string, NodeId[]>();
	for (const node of nodes) {
		byCell.set(cellKey(node.cell), node.id);
		if (node.location) {
			const list = locations.get(node.location) ?? [];
			list.push(node.id);
			locations.set(node.location, list);
		}
	}

	const next: (Step | null)[] = new Array(nodes.length * 9).fill(null);
	tracks.forEach((track, id) => {
		for (let link = 0; link <= 8; link++) {
			if (link === 4) continue;
			if (!track.getLinkAt(link) && !track.isTerminusDeadEnd(link)) continue;
			next[id * 9 + link] = resolveStep(map, track, link, ids);
		}
	});

	const crossings = groupCrossings(nodes, byCell, (id) =>
		itemAt(tracks, id, "track").hasLevelCrossing(),
	);

	return { nodes, byCell, locations, next, crossings };
}

/**
 * The cell next to a crossing on a track of `subtype` that would carry the
 * same road: below a horizontal track, right of a vertical one. Diagonal
 * crossings stand alone.
 */
function roadNeighbour(subtype: string, cell: Cell): Cell | null {
	if (subtype === "STRAIGHTH") return { gx: cell.gx, gy: cell.gy + 1 };
	if (subtype === "STRAIGHTV") return { gx: cell.gx + 1, gy: cell.gy };
	return null;
}

/**
 * Group level-crossing cells into crossings and number each node's crossing.
 * Nodes are sorted top to bottom, so walking down (or right) from the first
 * cell of each crossing finds the rest in order.
 */
function groupCrossings(
	nodes: GraphNode[],
	byCell: ReadonlyMap<string, NodeId>,
	hasCrossing: (id: NodeId) => boolean,
): LevelCrossing[] {
	const crossings: LevelCrossing[] = [];
	for (const node of nodes) {
		if (!hasCrossing(node.id) || node.crossing !== null) continue;
		const members = [node.id];
		node.crossing = crossings.length;
		for (
			let cell = roadNeighbour(node.subtype, node.cell);
			cell;
			cell = roadNeighbour(node.subtype, cell)
		) {
			const id = byCell.get(cellKey(cell));
			if (id === undefined || !hasCrossing(id)) break;
			const member = itemAt(nodes, id, "node");
			if (member.subtype !== node.subtype) break;
			member.crossing = crossings.length;
			members.push(id);
		}
		crossings.push({ nodes: members });
	}
	return crossings;
}

function resolveStep(
	map: Map_,
	track: Track,
	link: number,
	ids: ReadonlyMap<Track, NodeId>,
): Step | null {
	const neighbour = neighborThroughLink(map, track, link);
	if (!neighbour) return null;
	const entry = expectedEntryOnNeighbor(track, link, neighbour);
	if (entry === null) return null;
	const reachable =
		neighbour.getLinkAt(entry) || neighbour.isTerminusDeadEnd(entry);
	const id = ids.get(neighbour);
	if (!reachable || id === undefined) return null;
	return { node: id, entry };
}

function buildNode(track: Track, id: NodeId, cell: Cell): GraphNode {
	const { kind, subtype } = track.data;
	const rails = getRails(kind, subtype);
	const deadEnd = deadEndOf(track);
	const paths = pathsOf(track, rails, deadEnd);
	const main = rails.findIndex((r) => !r.secondary);
	const occKeys =
		kind === "flyover" ? rails.map((_, r) => id * 2 + r) : [id * 2, id * 2];
	return {
		id,
		cell,
		kind,
		subtype,
		rails,
		paths,
		defaultLie: Math.max(0, main),
		signalExit: kind === "signal" ? signalFacingExit(subtype) : null,
		signalAspects: Math.max(0, track.getAspect()),
		deadEnd,
		location: locationOf(track),
		preferred: track.getPreferredDirections(),
		occKeys,
		crossing: null,
	};
}

function deadEndOf(track: Track): number | null {
	const links = getLinksForSubtype(track.data.kind, track.data.subtype);
	const [link] = links;
	if (links.length !== 1 || link === undefined) return null;
	return track.isTerminusDeadEnd(8 - link) ? 8 - link : null;
}

function pathsOf(
	track: Track,
	rails: readonly Rail[],
	deadEnd: number | null,
): GraphPath[] {
	const main = {
		lengthM: track.getTrackMainLength(),
		speedKmh: track.getTrackMainSpeed(),
	};
	const secondary = {
		lengthM: track.getTrackSecondaryLength(),
		speedKmh: track.getTrackSecondarySpeed(),
	};
	if (deadEnd !== null) {
		const only = 8 - deadEnd;
		return [
			{ entry: only, exit: deadEnd, ...main, rail: -1 },
			{ entry: deadEnd, exit: only, ...main, rail: -1 },
		];
	}
	return rails.flatMap((r, i) => {
		const figures = r.secondary ? secondary : main;
		return [
			{ entry: r.a, exit: r.b, ...figures, rail: i },
			{ entry: r.b, exit: r.a, ...figures, rail: i },
		];
	});
}

/**
 * The timetable location a track belongs to — the same reading as
 * `getLocationNames`: a platform's own label, or the named location it is
 * linked to.
 */
function locationOf(track: Track): string | null {
	if (!track.hasPlatform() && !track.hasLinkedNamedLocation()) return null;
	const name =
		track.getText()?.getReadableText().trim() ||
		track.getLinkedNamedLocation()?.getText()?.getReadableText().trim();
	return name || null;
}
