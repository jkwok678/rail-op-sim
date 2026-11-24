import type { Map as Map_, Track } from "@rail-op-sim/shared";
import { Container, type Sprite } from "pixi.js";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE } from "#/lib/grid";
import { makeTrackSprite } from "#/renderer/layers/TrackLayer";
import type { TextureCache } from "#/renderer/textureCache";

// ============================================================================
// Platform side reverse-mapping
// ============================================================================

/**
 * For a given track subtype, which Platform direction does platform1 correspond
 * to, and which does platform2 correspond to? Derived from the `addPlatform`
 * logic in map-platform.ts.
 */
interface PlatformSideMapping {
	platform1Side: string | null;
	platform2Side: string | null;
}

const PLATFORM_SIDE_MAP: Record<string, PlatformSideMapping> = {
	// ── Straight ──
	STRAIGHTH: { platform1Side: "UP", platform2Side: "DOWN" },
	STRAIGHTV: { platform1Side: "LEFT", platform2Side: "RIGHT" },

	// ── Directed (UP/DOWN variants: p1=LEFT, p2=RIGHT; LEFT/RIGHT variants: p1=UP, p2=DOWN) ──
	DIRECTEDUP: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	DIRECTEDDOWN: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	DIRECTEDLEFT: { platform1Side: "UP", platform2Side: "DOWN" },
	DIRECTEDRIGHT: { platform1Side: "UP", platform2Side: "DOWN" },

	// ── Buffer ──
	BUFFERUP: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	BUFFERDOWN: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	BUFFERLEFT: { platform1Side: "UP", platform2Side: "DOWN" },
	BUFFERRIGHT: { platform1Side: "UP", platform2Side: "DOWN" },

	// ── Signal ──
	SIGNALUP: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	SIGNALDOWN: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	SIGNALLEFT: { platform1Side: "UP", platform2Side: "DOWN" },
	SIGNALRIGHT: { platform1Side: "UP", platform2Side: "DOWN" },

	// ── Bridge / Underpass (BRIDGE1/UNDERPASS1: p1=UP, p2=DOWN; BRIDGE2/UNDERPASS2: p1=LEFT, p2=RIGHT) ──
	BRIDGE1: { platform1Side: "UP", platform2Side: "DOWN" },
	BRIDGE2: { platform1Side: "LEFT", platform2Side: "RIGHT" },
	UNDERPASS1: { platform1Side: "UP", platform2Side: "DOWN" },
	UNDERPASS2: { platform1Side: "LEFT", platform2Side: "RIGHT" },

	// ── Switch ──
	SWITCHTIGHT1: { platform1Side: null, platform2Side: "DOWN" },
	SWITCHTIGHT2: { platform1Side: null, platform2Side: "DOWN" },
	SWITCH1: { platform1Side: null, platform2Side: "DOWN" },
	SWITCH2: { platform1Side: null, platform2Side: "DOWN" },
	SWITCHTIGHT3: { platform1Side: "UP", platform2Side: null },
	SWITCHTIGHT4: { platform1Side: "UP", platform2Side: null },
	SWITCH3: { platform1Side: "UP", platform2Side: null },
	SWITCH4: { platform1Side: "UP", platform2Side: null },
	SWITCHTIGHT5: { platform1Side: null, platform2Side: "RIGHT" },
	SWITCHTIGHT7: { platform1Side: null, platform2Side: "RIGHT" },
	SWITCH5: { platform1Side: null, platform2Side: "RIGHT" },
	SWITCH7: { platform1Side: null, platform2Side: "RIGHT" },
	SWITCHTIGHT6: { platform1Side: "LEFT", platform2Side: null },
	SWITCHTIGHT8: { platform1Side: "LEFT", platform2Side: null },
	SWITCH6: { platform1Side: "LEFT", platform2Side: null },
	SWITCH8: { platform1Side: "LEFT", platform2Side: null },
};

/** Build a PLATFORM_{SIDE}_{SET|UNSET} SVG key for a given direction and named state. */
function platformSvgKey(side: string, isNamed: boolean): string {
	const suffix = isNamed ? "_SET" : "_UNSET";
	return `PLATFORM_${side}${suffix}`;
}

// ============================================================================
// Sprite helpers
// ============================================================================

function cellKey(gx: number, gy: number): string {
	return `${gx},${gy}`;
}

/** Suffix of a level crossing's sprite key, after its cell key. */
const LC_SUFFIX = ":lc";

// ============================================================================
// Entry types
// ============================================================================

interface SpriteEntry {
	sprite: Sprite;
	/** Key for change detection (e.g. "NAMEDLOCATION_SET"). */
	lookupKey: string;
	/** The container the sprite sits in — {@link ElementLayer.underlay} or the main one. */
	parent: Container;
}

// ============================================================================
// Layer interface
// ============================================================================

export interface ElementLayer {
	container: Container;
	/**
	 * Goes below TrackLayer. Holds named locations that ride on a track: their
	 * sprite fills the cell, so drawn above it would hide the track, while
	 * RailOS paints the location behind the line.
	 */
	underlay: Container;
	/** Full reconcile against the map. */
	sync(map: Map_): void;
	/** Add or update a single element cell. */
	upsertElement(lookupKey: string, gx: number, gy: number): void;
	/** Remove all sprites at a cell. */
	removeCell(gx: number, gy: number): void;
	/**
	 * Draw these level-crossing cells (keyed `"x,y"`) with the given
	 * `public/graphics/` file in place of their usual crossing art — operate
	 * mode's lowered barriers. Cells left out, or whose file isn't preloaded,
	 * show the usual art. Pass an empty map to restore all.
	 */
	setLevelCrossingArt(art: ReadonlyMap<string, string>): void;
	/** Drop everything so the next sync rebuilds. */
	clear(): void;
	destroy(): void;
}

/**
 * Renders non-track elements (NamedLocation, Concourse, Parapet), platform
 * overlays, bridge/underpass Set/Unset variants, and level crossing icons.
 * Lives above TrackLayer in the scene graph, apart from its underlay.
 */
export function createElementLayer(textures: TextureCache): ElementLayer {
	const container = new Container();
	container.label = "element-layer";
	const underlay = new Container();
	underlay.label = "element-underlay";

	const spriteEntries = new Map<string, SpriteEntry>();
	/** Level-crossing art last asked for, re-applied after a rebuild. */
	let crossingArt: ReadonlyMap<string, string> = new Map();

	const resolveCrossingTexture = (key: string, entry: SpriteEntry) => {
		const file = crossingArt.get(key.slice(0, -LC_SUFFIX.length));
		const override = file ? textures.getFile(file) : null;
		return override ?? textures.get(entry.lookupKey);
	};

	const syncCrossingSprite = (key: string, entry: SpriteEntry) => {
		const texture = resolveCrossingTexture(key, entry);
		if (!texture || entry.sprite.texture === texture) return;
		entry.sprite.texture = texture;
		entry.sprite.width = CELL_SIZE;
		entry.sprite.height = CELL_SIZE;
	};

	/** Point each crossing sprite at its operate art, or back at its usual art. */
	const applyCrossingArt = () => {
		for (const [key, entry] of spriteEntries) {
			if (key.endsWith(LC_SUFFIX)) syncCrossingSprite(key, entry);
		}
	};

	/** Remove a sprite entry and its display object. */
	const removeSpriteEntry = (key: string, entry: SpriteEntry) => {
		entry.parent.removeChild(entry.sprite);
		entry.sprite.destroy();
		spriteEntries.delete(key);
	};

	const matchesEntry = (
		existing: SpriteEntry | undefined,
		lookupKey: string,
		parent: Container,
	): boolean =>
		existing !== undefined &&
		existing.lookupKey === lookupKey &&
		existing.parent === parent;

	/** Add or update a sprite at a cell, keyed by composite key. */
	const upsertSprite = (
		compositeKey: string,
		lookupKey: string,
		gx: number,
		gy: number,
		parent: Container = container,
	) => {
		const texture = textures.get(lookupKey);
		if (!texture) {
			debugLog(
				"trackLayer",
				`elementLayer upsertSprite SKIP at (${compositeKey}) — no texture for "${lookupKey}"`,
			);
			return;
		}
		const existing = spriteEntries.get(compositeKey);
		if (matchesEntry(existing, lookupKey, parent)) return;
		if (existing) removeSpriteEntry(compositeKey, existing);
		const sprite = makeTrackSprite(texture, gx, gy);
		sprite.label = `element-${compositeKey}`;
		parent.addChild(sprite);
		spriteEntries.set(compositeKey, { sprite, lookupKey, parent });
	};

	return {
		container,
		underlay,

		sync(map) {
			const seenSpriteKeys = new Set<string>();

			// ── 1. NamedLocations ──
			for (const nl of map.getNamedLocationList()) {
				const gx = nl.getLocationX();
				const gy = nl.getLocationY();
				const key = cellKey(gx, gy);
				const isNamed = nl.getNamed();
				const lookupKey = isNamed ? "NAMEDLOCATION_SET" : "NAMEDLOCATION_UNSET";
				seenSpriteKeys.add(key);
				const parent = map.getTrackAt(gx, gy) ? underlay : container;
				upsertSprite(key, lookupKey, gx, gy, parent);
			}

			// ── 2. Concourses ──
			for (const c of map.getConcourseList()) {
				const gx = c.getLocationX();
				const gy = c.getLocationY();
				const key = cellKey(gx, gy);
				const isNamed = c.getNamed();
				const lookupKey = isNamed ? "CONCOURSE_SET" : "CONCOURSE_UNSET";
				seenSpriteKeys.add(key);
				upsertSprite(key, lookupKey, gx, gy);
			}

			// ── 3. Parapets ──
			for (const p of map.getParapetList()) {
				const gx = p.getLocationX();
				const gy = p.getLocationY();
				const key = cellKey(gx, gy);
				const lookupKey = p.getParapetType(); // e.g. "PARAPET1"
				seenSpriteKeys.add(key);
				upsertSprite(key, lookupKey, gx, gy);
			}

			// ── 4. Platforms & 5. Bridge/Underpass & 6. Level Crossings ──
			// Single pass over all tracks to avoid redundant iteration.
			map.forEachTrack((track: Track) => {
				const gx = track.getLocationX();
				const gy = track.getLocationY();
				const isNamed = track.getNamed();
				const subtype = track.data.subtype;

				// ── Platforms ──
				if (track.hasPlatform()) {
					const mapping = PLATFORM_SIDE_MAP[subtype];
					if (mapping) {
						const p1 = track.getPlatform1();
						const p2 = track.getPlatform2();
						if (p1 && mapping.platform1Side) {
							const lookupKey = platformSvgKey(mapping.platform1Side, isNamed);
							const key = `${cellKey(gx, gy)}:p1`;
							seenSpriteKeys.add(key);
							upsertSprite(key, lookupKey, gx, gy);
						}
						if (p2 && mapping.platform2Side) {
							const lookupKey = platformSvgKey(mapping.platform2Side, isNamed);
							const key = `${cellKey(gx, gy)}:p2`;
							seenSpriteKeys.add(key);
							upsertSprite(key, lookupKey, gx, gy);
						}
					}
				}

				// ── Bridge / Underpass Set/Unset overlay ──
				if (track.data.kind === "bridgeUnderpass") {
					const lookupKey = isNamed ? subtype : `${subtype}_UNSET`;
					const key = `${cellKey(gx, gy)}:bridge`;
					seenSpriteKeys.add(key);
					upsertSprite(key, lookupKey, gx, gy);
				}

				// ── Level Crossings ──
				if (track.data.kind === "straight" && track.hasLevelCrossing()) {
					const lcKey =
						subtype === "STRAIGHTH"
							? "LEVELCROSSING_H"
							: subtype === "STRAIGHTV"
								? "LEVELCROSSING_V"
								: "LEVELCROSSING";
					const key = cellKey(gx, gy) + LC_SUFFIX;
					seenSpriteKeys.add(key);
					upsertSprite(key, lcKey, gx, gy);
				}
			});

			// ── Remove sprites no longer in the map ──
			let removed = 0;
			for (const [key, entry] of spriteEntries) {
				if (!seenSpriteKeys.has(key)) {
					removeSpriteEntry(key, entry);
					removed++;
				}
			}
			// Rebuilt crossing sprites start on their usual art.
			applyCrossingArt();

			debugLog(
				"trackLayer",
				`elementLayer sync complete — ${spriteEntries.size} sprites, ${removed} removed`,
			);
		},

		upsertElement(lookupKey, gx, gy) {
			const key = cellKey(gx, gy);
			upsertSprite(key, lookupKey, gx, gy);
		},

		removeCell(gx, gy) {
			const key = cellKey(gx, gy);
			const existing = spriteEntries.get(key);
			if (existing) removeSpriteEntry(key, existing);
		},

		setLevelCrossingArt(art) {
			crossingArt = art;
			applyCrossingArt();
		},

		clear() {
			for (const [key, entry] of spriteEntries) removeSpriteEntry(key, entry);
		},

		destroy() {
			this.clear();
			underlay.destroy({ children: true });
			container.destroy({ children: true });
		},
	};
}
