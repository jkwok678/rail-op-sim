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

/**
 * Check that all tracks on the map are properly connected.
 */
export function checkAllTracksConnected(map: Map_): boolean {
	map.makeTrackList();
	const trackList: Track[] = map.getTrackList();
	let allConnected = map.checkAllLinkedTrackLinked();

	if (trackList.length === 0) {
		map.getOnMessage()?.("error", "There are zero tracks stored.");
		return false;
	}

	if (!allConnected) {
		return false;
	}

	const grid = map.getImageSize();

	for (const currentTrack of trackList) {
		const cx = currentTrack.getLocationX();
		const cy = currentTrack.getLocationY();

		for (let link = 0; link <= 8; link++) {
			if (link === 4) continue; // unused slot
			if (!currentTrack.getLinkAt(link)) continue;
			if (!allConnected) break; // early exit once disconnected

			const [dx, dy] = LINK_OFFSETS[link];
			if (map.getTrackAt(cx + dx * grid, cy + dy * grid) === null) {
				allConnected = false;
			}
		}
		if (!allConnected) break; // short-circuit outer loop
	}

	return allConnected;
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
