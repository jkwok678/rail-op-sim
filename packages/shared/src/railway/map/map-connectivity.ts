import type { Track } from "../track/track";
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

/**
 * Find the shortest path between two tracks using BFS.
 * Returns the path as an array of tracks (inclusive of start and end),
 * or `null` if the tracks are in disconnected components.
 */
export function findPathBetween(
	map: Map_,
	start: Track,
	end: Track,
): Track[] | null {
	if (start === end) return [start];

	map.makeTrackList();
	const trackList = map.getTrackList();

	// Reset found flags before traversal
	for (const t of trackList) t.setFound(false);

	const parent = new Map<Track, Track>();
	const queue: Track[] = [start];
	start.setFound(true);

	const step = map.getImageSize();
	let found = false;

	while (queue.length > 0 && !found) {
		const current = queue.shift()!;
		const cx = current.getLocationX();
		const cy = current.getLocationY();

		for (let link = 0; link <= 8 && !found; link++) {
			if (link === 4) continue;
			if (!current.getLinkAt(link)) continue;

			const [dx, dy] = LINK_OFFSETS[link];
			const nx = cx + dx * step;
			const ny = cy + dy * step;
			const neighbor = map.getTrackAt(nx, ny);

			if (neighbor && !neighbor.getFound()) {
				neighbor.setFound(true);
				parent.set(neighbor, current);
				queue.push(neighbor);
				if (neighbor === end) {
					found = true;
				}
			}
		}
	}

	// Always reset found flags after traversal
	for (const t of trackList) t.setFound(false);

	if (!found) return null;

	// Reconstruct path by walking parent chain from end to start
	const path: Track[] = [];
	let node: Track | undefined = end;
	while (node) {
		path.push(node);
		node = parent.get(node);
	}
	path.reverse();
	return path;
}
