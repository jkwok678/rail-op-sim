import { SignalAspect } from "@rail-op-sim/shared";

/**
 * Maps every track subtype (enum string value) to its SVG filename in
 * `public/graphics/`. Filenames are camelCase and do not match the UPPERCASE
 * enum values, so an explicit map is required.
 *
 * Completeness (every subtype of every track enum has an entry, and the file
 * exists) is enforced by `svgMap.test.ts` so a missing mapping fails the build
 * rather than silently rendering a blank tile.
 */

/** Build `{ PREFIXn: filePrefixn.svg }` entries for a numbered family. */
function numbered(
	enumPrefix: string,
	filePrefix: string,
	count: number,
): Record<string, string> {
	const out: Record<string, string> = {};
	for (let i = 1; i <= count; i++) {
		out[`${enumPrefix}${i}`] = `${filePrefix}${i}.svg`;
	}
	return out;
}

export const SVG_MAP: Record<string, string> = {
	// ── Straight ──
	STRAIGHTH: "straightH.svg",
	STRAIGHTV: "straightV.svg",
	STRAIGHTLEFTUP: "straightLeftUp.svg",
	STRAIGHTRIGHTUP: "straightRightUp.svg",

	// ── Directed (files use "direct", not "directed") ──
	DIRECTEDLEFT: "directLeft.svg",
	DIRECTEDRIGHT: "directRight.svg",
	DIRECTEDUP: "directUp.svg",
	DIRECTEDDOWN: "directDown.svg",
	DIRECTEDRIGHTUP: "directRightUp.svg",
	DIRECTEDLEFTUP: "directLeftUp.svg",
	DIRECTEDLEFTDOWN: "directLeftDown.svg",
	DIRECTEDRIGHTDOWN: "directRightDown.svg",

	// ── Curved ──
	...numbered("TIGHTCURVE", "tightCurve", 4),
	...numbered("CURVE", "curve", 8),

	// ── Linked (base = paired "Set" art; placement / unpaired renders Unset) ──
	LINKLEFT: "linkLeftSet.svg",
	LINKRIGHT: "linkRightSet.svg",
	LINKDOWN: "linkDownSet.svg",
	LINKUP: "linkUpSet.svg",
	LINKLEFTUP: "linkLeftUpSet.svg",
	LINKRIGHTUP: "linkRightUpSet.svg",
	LINKLEFTDOWN: "linkLeftDownSet.svg",
	LINKRIGHTDOWN: "linkRightDownSet.svg",

	// ── Exit ──
	EXITLEFT: "exitLeft.svg",
	EXITRIGHT: "exitRight.svg",
	EXITDOWN: "exitDown.svg",
	EXITUP: "exitUp.svg",
	EXITLEFTUP: "exitLeftUp.svg",
	EXITRIGHTUP: "exitRightUp.svg",
	EXITLEFTDOWN: "exitLeftDown.svg",
	EXITRIGHTDOWN: "exitRightDown.svg",

	// ── Buffer ──
	BUFFERLEFT: "bufferLeft.svg",
	BUFFERRIGHT: "bufferRight.svg",
	BUFFERDOWN: "bufferDown.svg",
	BUFFERUP: "bufferUp.svg",
	BUFFERLEFTUP: "bufferLeftUp.svg",
	BUFFERRIGHTUP: "bufferRightUp.svg",
	BUFFERLEFTDOWN: "bufferLeftDown.svg",
	BUFFERRIGHTDOWN: "bufferRightDown.svg",

	// ── Signal ──
	SIGNALLEFT: "signalLeft.svg",
	SIGNALRIGHT: "signalRight.svg",
	SIGNALDOWN: "signalDown.svg",
	SIGNALUP: "signalUp.svg",
	SIGNALLEFTUP: "signalLeftUp.svg",
	SIGNALRIGHTUP: "signalRightUp.svg",
	SIGNALLEFTDOWN: "signalLeftDown.svg",
	SIGNALRIGHTDOWN: "signalRightDown.svg",

	// ── Bridge / Underpass (default to the solid "Set" deck art) ──
	BRIDGE1: "bridgeSet1.svg",
	BRIDGE2: "bridgeSet2.svg",
	UNDERPASS1: "underpassSet1.svg",
	UNDERPASS2: "underpassSet2.svg",

	// ── Switch ──
	...numbered("SWITCHTIGHT", "switchTight", 8),
	...numbered("SWITCHSPLIT", "switchSplit", 8),
	...numbered("SWITCH", "switch", 16),

	// ── Crossover ──
	...numbered("CROSSOVER", "crossover", 6),

	// ── Flyover ──
	...numbered("FLYOVER", "flyover", 12),

	// ── Named Location (Set + Unset) ──
	NAMEDLOCATION_SET: "namedLocationSet.svg",
	NAMEDLOCATION_UNSET: "namedLocationUnset.svg",

	// ── Concourse (Set + Unset) ──
	CONCOURSE_SET: "concourseSet.svg",
	CONCOURSE_UNSET: "concourseUnset.svg",

	// ── Parapet (28 types, always solid — no Set/Unset) ──
	...numbered("PARAPET", "parapet", 28),

	// ── Platform (Set + Unset for each of 4 sides) ──
	PLATFORM_LEFT_SET: "platformLeftSet.svg",
	PLATFORM_LEFT_UNSET: "platformLeftUnset.svg",
	PLATFORM_RIGHT_SET: "platformRightSet.svg",
	PLATFORM_RIGHT_UNSET: "platformRightUnset.svg",
	PLATFORM_UP_SET: "platformUpSet.svg",
	PLATFORM_UP_UNSET: "platformUpUnset.svg",
	PLATFORM_DOWN_SET: "platformDownSet.svg",
	PLATFORM_DOWN_UNSET: "platformDownUnset.svg",

	// ── Linked Unset variants (Set variants mapped above) ──
	LINKLEFT_UNSET: "linkLeftUnset.svg",
	LINKRIGHT_UNSET: "linkRightUnset.svg",
	LINKDOWN_UNSET: "linkDownUnset.svg",
	LINKUP_UNSET: "linkUpUnset.svg",
	LINKLEFTUP_UNSET: "linkLeftUpUnset.svg",
	LINKRIGHTUP_UNSET: "linkRightUpUnset.svg",
	LINKLEFTDOWN_UNSET: "linkLeftDownUnset.svg",
	LINKRIGHTDOWN_UNSET: "linkRightDownUnset.svg",

	// ── Bridge / Underpass Unset variants (Set variants mapped above) ──
	BRIDGE1_UNSET: "bridgeUnset1.svg",
	BRIDGE2_UNSET: "bridgeUnset2.svg",
	UNDERPASS1_UNSET: "underpassUnset1.svg",
	UNDERPASS2_UNSET: "underpassUnset2.svg",

	// ── Level Crossing (icon = palette preview, H/V = in-canvas overlay) ──
	LEVELCROSSING: "levelCrossingIcon.svg",
	LEVELCROSSING_H: "levelCrossingH.svg",
	LEVELCROSSING_V: "levelCrossingV.svg",

	// ── Text sentinel (not an SVG — placeholder key for store state) ──
	TEXT_ENTRY: "namedLocationSet.svg",
};

/** Public URL for a subtype's SVG, or null if unmapped. */
export function svgUrlFor(subtype: string): string | null {
	const filename = SVG_MAP[subtype];
	if (!filename) return null;
	// Resolve relative to the configured base so the app works under subpaths.
	const base = import.meta.env.BASE_URL ?? "/";
	return `${base}graphics/${filename}`;
}

// ── Raw SVG fetch cache (shared by the texture cache and the React preview) ──

const rawCache = new Map<string, Promise<string>>();

/**
 * Fetch the raw (un-recoloured) SVG markup for a subtype, cached by URL.
 * Rejects if the subtype is unmapped or the fetch fails.
 */
export function loadRawSvg(subtype: string): Promise<string> {
	const url = svgUrlFor(subtype);
	if (!url) {
		return Promise.reject(new Error(`No SVG mapped for subtype: ${subtype}`));
	}
	let pending = rawCache.get(url);
	if (!pending) {
		pending = fetch(url).then((res) => {
			if (!res.ok) {
				throw new Error(`Failed to load SVG ${url}: ${res.status}`);
			}
			return res.text();
		});
		// Don't cache a rejected fetch — allow a later retry.
		pending.catch(() => rawCache.delete(url));
		rawCache.set(url, pending);
	}
	return pending;
}

// ── Shunt signal SVG mapping ────────────────────────────────────────────

/**
 * Maps each {@link SignalType} to its shunt signal SVG filename.
 * Shunt signals use ground position light visuals instead of main signal posts.
 */
export const SHUNT_SVG_MAP: Record<string, string> = {
	SIGNALLEFT: "shuntLeftRed.svg",
	SIGNALRIGHT: "shuntRightRed.svg",
	SIGNALDOWN: "shuntDownRed.svg",
	SIGNALUP: "shuntUpRed.svg",
	SIGNALLEFTUP: "shuntLeftUpRed.svg",
	SIGNALRIGHTUP: "shuntRightUpRed.svg",
	SIGNALLEFTDOWN: "shuntLeftDownRed.svg",
	SIGNALRIGHTDOWN: "shuntRightDownRed.svg",
};

/**
 * Maps each aspect value to its preview SVG filename (used in the palette).
 */
export const ASPECT_SVG_MAP: Record<number, string> = {
	[SignalAspect.FOUR_ASPECT]: "aspect4.svg",
	[SignalAspect.THREE_ASPECT]: "aspect3.svg",
	[SignalAspect.TWO_ASPECT]: "aspect2.svg",
	[SignalAspect.SHUNT]: "aspectShunt.svg",
};

/**
 * Return the correct SVG filename for a signal given its direction subtype
 * and aspect. Shunt signals use the shunt SVG; all others use the normal
 * signal SVG.
 */
export function svgFilenameForSignal(subtype: string, aspect: number): string {
	if (aspect === SignalAspect.SHUNT) {
		return SHUNT_SVG_MAP[subtype] ?? SVG_MAP[subtype];
	}
	return SVG_MAP[subtype];
}

/**
 * Fetch raw SVG markup from a direct filename (bypassing the subtype map).
 * Used for aspect preview SVGs and other non-subtype assets.
 */
export function loadRawSvgByFilename(filename: string): Promise<string> {
	const base = import.meta.env.BASE_URL ?? "/";
	const url = `${base}graphics/${filename}`;
	let pending = rawCache.get(url);
	if (!pending) {
		pending = fetch(url).then((res) => {
			if (!res.ok) {
				throw new Error(`Failed to load SVG ${url}: ${res.status}`);
			}
			return res.text();
		});
		pending.catch(() => rawCache.delete(url));
		rawCache.set(url, pending);
	}
	return pending;
}
