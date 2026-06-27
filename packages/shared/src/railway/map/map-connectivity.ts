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
