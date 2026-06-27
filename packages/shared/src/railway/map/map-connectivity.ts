import type { Track } from "../track/track-base";
import type { Map_ } from "./map";

// ============================================================================
// Connectivity helpers for Map_
// ============================================================================

/**
 * Check that all tracks on the map are properly connected.
 * (Formerly Map_.checkAllTracksConnected.)
 */
export function checkAllTracksConnected(map: Map_): boolean {
  map.makeTrackList();
  const trackList: Track[] = map.getTrackList();
  let allConnected = map.checkAllLinkedTrackLinked();

  if (trackList.length === 0) {
    map.getOnMessage()?.(
      "error",
      "There are zero tracks stored.",
    );
    return false;
  }

  if (!allConnected) {
    return false;
  }

  for (const currentTrack of trackList) {
    const cx = currentTrack.getLocationX();
    const cy = currentTrack.getLocationY();

    if (currentTrack.getLinkAt(0)) {
      if (map.getTrackAt(cx - 16, cy + 16) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(1) && allConnected) {
      if (map.getTrackAt(cx, cy + 16) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(2) && allConnected) {
      if (map.getTrackAt(cx + 16, cy + 16) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(3) && allConnected) {
      if (map.getTrackAt(cx - 16, cy) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(5) && allConnected) {
      if (map.getTrackAt(cx + 16, cy) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(6) && allConnected) {
      if (map.getTrackAt(cx - 16, cy - 16) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(7) && allConnected) {
      if (map.getTrackAt(cx, cy - 16) === null) {
        allConnected = false;
      }
    }
    if (currentTrack.getLinkAt(8) && allConnected) {
      if (map.getTrackAt(cx + 16, cy - 16) === null) {
        allConnected = false;
      }
    }
  }

  return allConnected;
}
