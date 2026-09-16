import { Platform } from "../enums";
import type { Map_ } from "./map";
import { linkNewElementToText } from "./map-text-linking";

// ============================================================================
// Platform & level-crossing helpers for Map_
// ============================================================================

/**
 * Add a platform to a track at the given coordinates.
 */
export function addPlatform(
	map: Map_,
	side: Platform,
	locationX: number,
	locationY: number,
): void {
	const t = map.getTrackAt(locationX, locationY);
	if (!t) return;

	const d = t.data;
	let added = false;

	switch (d.kind) {
		case "straight": {
			if (t.hasLevelCrossing() || t.hasLinkedNamedLocation()) break;
			if (d.subtype === "STRAIGHTH") {
				if (side === Platform.UP) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.DOWN) {
					t.setPlatform2(true);
					added = true;
				}
			} else if (d.subtype === "STRAIGHTV") {
				if (side === Platform.LEFT) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.RIGHT) {
					t.setPlatform2(true);
					added = true;
				}
			}
			break;
		}
		case "directed": {
			if (t.hasLinkedNamedLocation()) break;
			if (d.subtype === "DIRECTEDUP" || d.subtype === "DIRECTEDDOWN") {
				if (side === Platform.LEFT) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.RIGHT) {
					t.setPlatform2(true);
					added = true;
				}
			} else if (
				d.subtype === "DIRECTEDLEFT" ||
				d.subtype === "DIRECTEDRIGHT"
			) {
				if (side === Platform.UP) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.DOWN) {
					t.setPlatform2(true);
					added = true;
				}
			}
			break;
		}
		case "buffer": {
			if (t.hasLinkedNamedLocation()) break;
			if (d.subtype === "BUFFERUP" || d.subtype === "BUFFERDOWN") {
				if (side === Platform.LEFT) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.RIGHT) {
					t.setPlatform2(true);
					added = true;
				}
			} else if (d.subtype === "BUFFERLEFT" || d.subtype === "BUFFERRIGHT") {
				if (side === Platform.UP) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.DOWN) {
					t.setPlatform2(true);
					added = true;
				}
			}
			break;
		}
		case "signal": {
			if (t.hasLinkedNamedLocation()) break;
			if (d.subtype === "SIGNALUP" || d.subtype === "SIGNALDOWN") {
				if (side === Platform.LEFT) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.RIGHT) {
					t.setPlatform2(true);
					added = true;
				}
			} else if (d.subtype === "SIGNALLEFT" || d.subtype === "SIGNALRIGHT") {
				if (side === Platform.UP) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.DOWN) {
					t.setPlatform2(true);
					added = true;
				}
			}
			break;
		}
		case "bridgeUnderpass": {
			if (d.subtype === "BRIDGE2" || d.subtype === "UNDERPASS2") {
				if (side === Platform.LEFT) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.RIGHT) {
					t.setPlatform2(true);
					added = true;
				}
			} else if (d.subtype === "BRIDGE1" || d.subtype === "UNDERPASS1") {
				if (side === Platform.UP) {
					t.setPlatform1(true);
					added = true;
				} else if (side === Platform.DOWN) {
					t.setPlatform2(true);
					added = true;
				}
			}
			break;
		}
		case "switch": {
			switch (d.subtype) {
				case "SWITCHTIGHT1":
				case "SWITCHTIGHT2":
				case "SWITCH1":
				case "SWITCH2":
					if (side === Platform.DOWN) {
						t.setPlatform2(true);
						added = true;
					}
					break;
				case "SWITCHTIGHT3":
				case "SWITCHTIGHT4":
				case "SWITCH3":
				case "SWITCH4":
					if (side === Platform.UP) {
						t.setPlatform1(true);
						added = true;
					}
					break;
				case "SWITCHTIGHT5":
				case "SWITCHTIGHT7":
				case "SWITCH5":
				case "SWITCH7":
					if (side === Platform.RIGHT) {
						t.setPlatform2(true);
						added = true;
					}
					break;
				case "SWITCHTIGHT6":
				case "SWITCHTIGHT8":
				case "SWITCH6":
				case "SWITCH8":
					if (side === Platform.LEFT) {
						t.setPlatform1(true);
						added = true;
					}
					break;
			}
			break;
		}
	}

	if (added) {
		linkNewElementToText(map, locationX, locationY);
	}
}

/**
 * Add a level crossing at the given coordinates.
 */
export function addLevelCrossing(
	map: Map_,
	locationX: number,
	locationY: number,
): void {
	const t = map.getTrackAt(locationX, locationY);
	if (!t || t.data.kind !== "straight") return;

	if (
		!(t.hasPlatform() || t.hasLevelCrossing() || t.hasLinkedNamedLocation())
	) {
		t.addLevelCrossing();
	}
}

/**
 * Remove both platforms from a track at the given coordinates. Returns true if a
 * platform was present and cleared. Also unlinks any shared text (except on
 * bridge/underpass tracks, whose naming isn't platform-gated).
 */
export function removePlatform(map: Map_, x: number, y: number): boolean {
	const t = map.getTrackAt(x, y);
	if (!t || !t.hasPlatform()) return false;
	t.setPlatform1(false);
	t.setPlatform2(false);
	// Track text-linking is platform-gated, except bridge/underpass naming.
	if (t.getNamed() && t.data.kind !== "bridgeUnderpass") t.setText(null);
	return true;
}

/**
 * Remove a level crossing from a track at the given coordinates. Returns true if
 * a level crossing was present and removed.
 */
export function removeLevelCrossing(map: Map_, x: number, y: number): boolean {
	const t = map.getTrackAt(x, y);
	if (!t || !t.hasLevelCrossing()) return false;
	t.removeLevelCrossing();
	return true;
}
