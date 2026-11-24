import { Platform } from "../enums";
import type { Map_ } from "./map";
import { linkNewElementToText } from "./map-text-linking";

// ============================================================================
// Platform & level-crossing helpers for Map_
// ============================================================================

/** Platform slots allowed on a track subtype: [platform1Side, platform2Side]. */
type PlatformSlots = readonly [Platform | null, Platform | null];

const HORIZONTAL_SLOTS: PlatformSlots = [Platform.UP, Platform.DOWN];
const VERTICAL_SLOTS: PlatformSlots = [Platform.LEFT, Platform.RIGHT];
const UP_ONLY: PlatformSlots = [Platform.UP, null];
const DOWN_ONLY: PlatformSlots = [null, Platform.DOWN];
const LEFT_ONLY: PlatformSlots = [Platform.LEFT, null];
const RIGHT_ONLY: PlatformSlots = [null, Platform.RIGHT];

const PLATFORM_SLOTS_BY_SUBTYPE: Record<string, PlatformSlots> = {
	STRAIGHTH: HORIZONTAL_SLOTS,
	STRAIGHTV: VERTICAL_SLOTS,
	DIRECTEDUP: VERTICAL_SLOTS,
	DIRECTEDDOWN: VERTICAL_SLOTS,
	DIRECTEDLEFT: HORIZONTAL_SLOTS,
	DIRECTEDRIGHT: HORIZONTAL_SLOTS,
	BUFFERUP: VERTICAL_SLOTS,
	BUFFERDOWN: VERTICAL_SLOTS,
	BUFFERLEFT: HORIZONTAL_SLOTS,
	BUFFERRIGHT: HORIZONTAL_SLOTS,
	SIGNALUP: VERTICAL_SLOTS,
	SIGNALDOWN: VERTICAL_SLOTS,
	SIGNALLEFT: HORIZONTAL_SLOTS,
	SIGNALRIGHT: HORIZONTAL_SLOTS,
	BRIDGE1: HORIZONTAL_SLOTS,
	UNDERPASS1: HORIZONTAL_SLOTS,
	BRIDGE2: VERTICAL_SLOTS,
	UNDERPASS2: VERTICAL_SLOTS,
	SWITCHTIGHT1: DOWN_ONLY,
	SWITCHTIGHT2: DOWN_ONLY,
	SWITCH1: DOWN_ONLY,
	SWITCH2: DOWN_ONLY,
	SWITCHTIGHT3: UP_ONLY,
	SWITCHTIGHT4: UP_ONLY,
	SWITCH3: UP_ONLY,
	SWITCH4: UP_ONLY,
	SWITCHTIGHT5: RIGHT_ONLY,
	SWITCHTIGHT7: RIGHT_ONLY,
	SWITCH5: RIGHT_ONLY,
	SWITCH7: RIGHT_ONLY,
	SWITCHTIGHT6: LEFT_ONLY,
	SWITCHTIGHT8: LEFT_ONLY,
	SWITCH6: LEFT_ONLY,
	SWITCH8: LEFT_ONLY,
};

const NAMED_LOCATION_BLOCKED_KINDS = new Set([
	"straight",
	"directed",
	"buffer",
	"signal",
]);

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

	const { kind, subtype } = t.data;
	if (kind === "straight" && t.hasLevelCrossing()) return;
	if (NAMED_LOCATION_BLOCKED_KINDS.has(kind) && t.hasLinkedNamedLocation()) {
		return;
	}

	const slots = PLATFORM_SLOTS_BY_SUBTYPE[subtype];
	if (!slots) return;

	if (slots[0] === side) {
		t.setPlatform1(true);
	} else if (slots[1] === side) {
		t.setPlatform2(true);
	} else {
		return;
	}

	linkNewElementToText(map, locationX, locationY);
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
	if (t?.data.kind !== "straight") return;

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
	if (!t?.hasPlatform()) return false;
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
	if (!t?.hasLevelCrossing()) return false;
	t.removeLevelCrossing();
	return true;
}
