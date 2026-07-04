import { Container, Sprite, Texture } from "pixi.js";
import { Map as Map_ } from "@rail-op-sim/shared";
import type { Track } from "@rail-op-sim/shared";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import { debugLog } from "#/lib/debugLogger";
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

/** Create a PixiJS Sprite at the given grid cell, same conventions as TrackLayer. */
function makeElementSprite(texture: Texture, gx: number, gy: number): Sprite {
	const sprite = new Sprite(texture);
	sprite.anchor.set(0.5);
	sprite.width = CELL_SIZE;
	sprite.height = CELL_SIZE;
	const { x, y } = gridToWorld(gx, gy);
	sprite.position.set(x, y);
	return sprite;
}

// ============================================================================
// Entry types
// ============================================================================

interface SpriteEntry {
	sprite: Sprite;
	/** Key for change detection (e.g. "NAMEDLOCATION_SET"). */
	lookupKey: string;
}

// ============================================================================
// Layer interface
// ============================================================================

export interface ElementLayer {
	container: Container;
	/** Full reconcile against the map. */
	sync(map: Map_): void;
	/** Add or update a single element cell. */
	upsertElement(lookupKey: string, gx: number, gy: number): void;
	/** Remove all sprites at a cell. */
	removeCell(gx: number, gy: number): void;
	/** Drop everything so the next sync rebuilds. */
	clear(): void;
	destroy(): void;
}

/**
 * Renders non-track elements (NamedLocation, Concourse, Parapet), platform
 * overlays, bridge/underpass Set/Unset variants, and level crossing icons.
 * Lives above TrackLayer in the scene graph.
 */
export function createElementLayer(textures: TextureCache): ElementLayer {
	const container = new Container();
	container.label = "element-layer";

	const spriteEntries = new Map<string, SpriteEntry>();

	/** Remove a sprite entry and its display object. */
	const removeSpriteEntry = (key: string, entry: SpriteEntry) => {
		debugLog(
			"trackLayer",
			`elementLayer removeSprite at (${key}) — lookupKey=${entry.lookupKey}`,
		);
		container.removeChild(entry.sprite);
		entry.sprite.destroy();
		spriteEntries.delete(key);
	};

	/** Add or update a sprite at a cell, keyed by composite key. */
	const upsertSprite = (
		compositeKey: string,
		lookupKey: string,
		gx: number,
		gy: number,
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
		if (existing) {
			if (existing.lookupKey === lookupKey) return; // unchanged
			removeSpriteEntry(compositeKey, existing);
		}
		const sprite = makeElementSprite(texture, gx, gy);
		sprite.label = `element-${compositeKey}`;
		container.addChild(sprite);
		spriteEntries.set(compositeKey, { sprite, lookupKey });
		debugLog(
			"trackLayer",
			`elementLayer upsertSprite at (${compositeKey}) — lookupKey=${lookupKey}`,
		);
	};

	return {
		container,

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
				upsertSprite(key, lookupKey, gx, gy);
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
							const key = cellKey(gx, gy) + ":p1";
							seenSpriteKeys.add(key);
							upsertSprite(key, lookupKey, gx, gy);
						}
						if (p2 && mapping.platform2Side) {
							const lookupKey = platformSvgKey(mapping.platform2Side, isNamed);
							const key = cellKey(gx, gy) + ":p2";
							seenSpriteKeys.add(key);
							upsertSprite(key, lookupKey, gx, gy);
						}
					}
				}

				// ── Bridge / Underpass Set/Unset overlay ──
				if (track.data.kind === "bridgeUnderpass") {
					const lookupKey = isNamed ? subtype : `${subtype}_UNSET`;
					const key = cellKey(gx, gy) + ":bridge";
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
					const key = cellKey(gx, gy) + ":lc";
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

		clear() {
			for (const [key, entry] of spriteEntries) removeSpriteEntry(key, entry);
		},

		destroy() {
			this.clear();
			container.destroy({ children: true });
		},
	};
}
