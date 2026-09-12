import type { Track } from "../track/track";
import { getDirectedFlow, isTraversableLinkPair } from "../track/track-data";
import type { Map_ } from "./map";

// ============================================================================
// Connectivity helpers for Map_
// ============================================================================

/**
 * Relative neighbour offsets for each link index (0-8).
 * Link 4 is unused (represented as [0, 0]).
 */
const LINK_OFFSETS: readonly [number, number][] = [
	[-1, 1], // 0: top-left
	[0, 1], // 1: top
	[1, 1], // 2: top-right
	[-1, 0], // 3: left
	[0, 0], // 4: (unused)
	[1, 0], // 5: right
	[-1, -1], // 6: bottom-left
	[0, -1], // 7: bottom
	[1, -1], // 8: bottom-right
];

/** A track with at least one active link pointing at an empty cell. */
export interface DanglingLink {
	track: Track;
	/** Link indices (0-8) whose neighbouring cell is empty. */
	links: number[];
}

/** A full account of why a map is (or is not) a complete railway. */
export interface ConnectivityReport {
	/** Total tracks on the map. */
	total: number;
	/** True when nothing is dangling and every linked track is paired. */
	connected: boolean;
	/** Tracks with an active link running into an empty cell, in map order. */
	dangling: DanglingLink[];
	/** Linked tracks (portals) with no partner. */
	unpairedLinked: Track[];
}

/**
 * Describe the connectivity of the whole map: every dangling link and every
 * unpaired portal, not just whether a problem exists.
 *
 * Unlike {@link checkAllTracksConnected} this does not short-circuit, so the
 * counts are complete and the UI can point the user at the first offender.
 */
export function getConnectivityReport(map: Map_): ConnectivityReport {
	map.makeTrackList();
	const trackList: Track[] = map.getTrackList();
	const grid = map.getImageSize();

	const dangling: DanglingLink[] = [];
	for (const track of trackList) {
		const cx = track.getLocationX();
		const cy = track.getLocationY();
		const links: number[] = [];

		for (let link = 0; link <= 8; link++) {
			if (link === 4) continue; // unused slot
			if (!track.getLinkAt(link)) continue;
			const [dx, dy] = LINK_OFFSETS[link];
			if (map.getTrackAt(cx + dx * grid, cy + dy * grid) === null) {
				links.push(link);
			}
		}
		if (links.length > 0) dangling.push({ track, links });
	}

	const unpairedLinked = findUnpairedLinkedTracks(map);

	return {
		total: trackList.length,
		connected:
			trackList.length > 0 &&
			dangling.length === 0 &&
			unpairedLinked.length === 0,
		dangling,
		unpairedLinked,
	};
}

/**
 * Check that all tracks on the map are properly connected.
 *
 * A thin wrapper over {@link getConnectivityReport} — use that instead when the
 * caller wants to tell the user *what* is wrong.
 */
export function checkAllTracksConnected(map: Map_): boolean {
	const report = getConnectivityReport(map);

	if (report.total === 0) {
		map.getOnMessage()?.("error", "There are zero tracks stored.");
		return false;
	}

	return report.connected;
}

// ============================================================================
// Linked track diagnostics
// ============================================================================

export interface LinkedTrackPair {
	a: Track;
	b: Track;
}

export interface LinkedTrackReport {
	total: number;
	paired: number;
	unpaired: number;
	allPaired: boolean;
	pairedPairs: LinkedTrackPair[];
	unpairedTracks: Track[];
}

/** Return every linked track on the map. */
export function findAllLinkedTracks(map: Map_): Track[] {
	return map.getTracksOfKind("linked");
}

/** Return linked tracks that have no partner. */
export function findUnpairedLinkedTracks(map: Map_): Track[] {
	return findAllLinkedTracks(map).filter((t) => !t.isLinked());
}

/** Collect properly paired linked tracks as `{a, b}` tuples (each pair once). */
export function getLinkedTrackPairs(map: Map_): LinkedTrackPair[] {
	const linked = findAllLinkedTracks(map);
	const pairs: LinkedTrackPair[] = [];

	// Use the Track.found flag to avoid double-counting
	for (const t of linked) t.setFound(false);
	for (const t of linked) {
		if (t.getFound()) continue;
		if (t.isLinked()) {
			const partner = t.getOtherLinkedTrack()!;
			pairs.push({ a: t, b: partner });
			t.setFound(true);
			partner.setFound(true);
		}
	}
	for (const t of linked) t.setFound(false);

	return pairs;
}

/** Aggregate summary of all linked tracks and their pairing status. */
export function getLinkedTrackReport(map: Map_): LinkedTrackReport {
	const allLinked = findAllLinkedTracks(map);
	const pairs = getLinkedTrackPairs(map);
	const unpairedTracks = findUnpairedLinkedTracks(map);
	return {
		total: allLinked.length,
		paired: pairs.length * 2,
		unpaired: unpairedTracks.length,
		allPaired: unpairedTracks.length === 0,
		pairedPairs: pairs,
		unpairedTracks,
	};
}

// ============================================================================
// Section path-finding
// ============================================================================

/** Options for {@link findPathBetween}. */
export interface PathOptions {
	/**
	 * Refuse to route against the arrow of a one-way `directed` track. Off by
	 * default (section selection is direction-agnostic); on for preferred
	 * directions, which record an actual travel direction.
	 */
	respectOneWay?: boolean;
}

/** A BFS node: a track reached through a given entry link (null for `start`). */
interface PathNode {
	track: Track;
	/** Link index the track was entered by, or `null` for the start track. */
	entry: number | null;
	prev: PathNode | null;
}

/**
 * Find the shortest path between two tracks using BFS.
 * Returns the path as an array of tracks (inclusive of start and end),
 * or `null` if the tracks are in disconnected components.
 *
 * The search is link-aware: a track is expanded per entry link, and only exits
 * that {@link isTraversableLinkPair} allows for that entry are followed. So a
 * route cannot U-turn, nor hop between the two independent paths of a
 * crossover/flyover, nor take an impossible turn across a switch. A step is
 * also only taken when the neighbour links back: occupancy alone is not a
 * connection (an H straight sits beside a V straight without joining it), and
 * {@link checkAllTracksConnected} only checks that neighbouring cells are
 * occupied, so the check has to happen here.
 *
 * With `respectOneWay`, a `directed` track is entered only by its arrow's entry
 * edge and left only by its exit edge — including when it is the start track
 * (seeded with the arrow's entry) or the goal.
 */
export function findPathBetween(
	map: Map_,
	start: Track,
	end: Track,
	opts: PathOptions = {},
): Track[] | null {
	if (start === end) return [start];

	map.makeTrackList();
	const trackList = map.getTrackList();

	// Reset found flags before traversal
	for (const t of trackList) t.setFound(false);

	/** Entry links already expanded per track (`-1` = the start track). */
	const visited = new Map<Track, Set<number>>();
	const markVisited = (track: Track, entry: number | null): boolean => {
		let entries = visited.get(track);
		if (entries === undefined) {
			entries = new Set();
			visited.set(track, entries);
		}
		const key = entry ?? -1;
		if (entries.has(key)) return false;
		entries.add(key);
		track.setFound(true);
		return true;
	};

	/**
	 * Whether `track` may be entered by `entry`: the link must be active, and a
	 * one-way track accepts only its arrow's entry edge.
	 */
	const canEnter = (track: Track, entry: number): boolean => {
		if (!track.getLinkAt(entry)) return false;
		if (!opts.respectOneWay || track.data.kind !== "directed") return true;
		const flow = getDirectedFlow(track.data.subtype);
		return flow === null || entry === flow.entry;
	};

	// A one-way start track can only be left by its arrow, so seed the search
	// with the arrow's entry edge instead of leaving it unconstrained.
	const startEntry =
		opts.respectOneWay && start.data.kind === "directed"
			? (getDirectedFlow(start.data.subtype)?.entry ?? null)
			: null;

	const step = map.getImageSize();
	const queue: PathNode[] = [{ track: start, entry: startEntry, prev: null }];
	markVisited(start, startEntry);
	let goal: PathNode | null = null;

	while (queue.length > 0 && goal === null) {
		const current = queue.shift()!;
		const cx = current.track.getLocationX();
		const cy = current.track.getLocationY();

		for (let link = 0; link <= 8 && goal === null; link++) {
			if (link === 4) continue;
			if (!current.track.getLinkAt(link)) continue;
			if (
				current.entry !== null &&
				!isTraversableLinkPair(
					current.track.data.kind,
					current.track.data.subtype,
					current.entry,
					link,
					opts.respectOneWay,
				)
			) {
				continue;
			}

			const [dx, dy] = LINK_OFFSETS[link];
			const neighbor = map.getTrackAt(cx + dx * step, cy + dy * step);
			if (!neighbor) continue;

			// The neighbour is entered by its opposite link.
			const entry = 8 - link;
			if (!canEnter(neighbor, entry)) continue;
			if (!markVisited(neighbor, entry)) continue;

			const node: PathNode = { track: neighbor, entry, prev: current };
			if (neighbor === end) {
				goal = node;
			} else {
				queue.push(node);
			}
		}
	}

	// Always reset found flags after traversal
	for (const t of trackList) t.setFound(false);

	if (goal === null) return null;

	// Reconstruct path by walking the parent chain from end to start
	const path: Track[] = [];
	for (let node: PathNode | null = goal; node !== null; node = node.prev) {
		path.push(node.track);
	}
	path.reverse();
	return path;
}
