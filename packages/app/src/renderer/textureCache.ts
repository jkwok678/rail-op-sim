import { SignalAspect } from "@rail-op-sim/shared";
import { Texture } from "pixi.js";
import { debugLog } from "#/lib/debugLogger";
import { type ColorMap, recolorSvg, SOURCE_FILLS } from "#/lib/svgColors";
import { loadRawSvg, loadRawSvgByFilename, SHUNT_SVG_MAP } from "#/lib/svgMap";
import { svgToCanvas } from "#/lib/svgToCanvas";

/**
 * Composite key prefix for shunt signal variant raw SVGs.
 * E.g. `"shunt:SIGNALLEFT"` → `shuntLeftRed.svg`.
 */
const SHUNT_PREFIX = "shunt:";

/**
 * Colour map that bakes every source fill to a single flat colour. Used for
 * status-coloured track variants, which replace the fills outright instead of
 * tinting — a multiplicative tint against the light theme's near-black rail
 * would swallow the colour.
 */
const flatColorMap = (color: string): ColorMap =>
	Object.fromEntries(Object.values(SOURCE_FILLS).map((fill) => [fill, color]));

/**
 * Bakes recoloured track SVGs into shared PixiJS textures, cached by
 * `subtype + theme`. Placed tiles and the cursor ghost are lightweight
 * `Sprite`s pointing at these shared textures, so a layout of N tiles costs N
 * sprites referencing at most (#subtypes) textures — no per-tile SVG re-parse.
 *
 * For signal tracks, the optional {@link aspect} parameter on `get()` selects
 * the shunt variant texture when aspect is {@link SignalAspect.SHUNT}.
 *
 * Lifecycle: `preload()` the subtypes you need (fetches + caches raw markup),
 * then `get()` synchronously returns a baked texture for the current theme.
 * On a theme change call `setTheme()` to drop stale textures, then re-render.
 */
export interface TextureCache {
	/** Fetch + cache the raw SVG markup for the given subtypes. Also preloads shunt variants for signal subtypes. */
	preload(subtypes: string[]): Promise<void>;
	/**
	 * Baked texture for a subtype in the current theme, or null if its markup
	 * hasn't been preloaded yet. Pass `aspect` for signal tracks to select the
	 * shunt variant.
	 */
	get(subtype: string, aspect?: number): Texture | null;
	/**
	 * Variant of a subtype texture with every fill replaced by the given
	 * `#rrggbb` colour (theme-independent), or null if its markup hasn't been
	 * preloaded yet.
	 */
	getColored(subtype: string, color: string, aspect?: number): Texture | null;
	/** Update the active theme colour map and drop baked textures. */
	setTheme(themeKey: string, colorMap: ColorMap): void;
	/** Destroy all baked textures. */
	destroy(): void;
}

export function createTextureCache(
	themeKey: string,
	colorMap: ColorMap,
): TextureCache {
	/** Resolved raw SVG markup per subtype (or shunt composite key). */
	const raw = new Map<string, string>();
	/** Baked textures keyed by `${themeKey}:${lookupKey}`. */
	const baked = new Map<string, Texture>();

	let currentTheme = themeKey;
	let currentColorMap = colorMap;

	/** Composite cache key for a subtype + optional aspect. */
	const lookupKey = (subtype: string, aspect?: number): string =>
		aspect === SignalAspect.SHUNT ? `${SHUNT_PREFIX}${subtype}` : subtype;

	const bake = (key: string, colorMap = currentColorMap): Texture | null => {
		const svg = raw.get(key);
		if (svg === undefined) return null;

		const recolored = recolorSvg(svg, colorMap);
		const canvas = svgToCanvas(recolored, 2);
		const texture = Texture.from(canvas);
		texture.source.scaleMode = "nearest";
		return texture;
	};

	/** True for the 8 {@link SignalType} enum values. */
	const isSignalSubtype = (s: string): boolean => s in SHUNT_SVG_MAP;

	return {
		async preload(subtypes) {
			debugLog("textureCache", `preload started — ${subtypes.length} subtypes`);
			let loaded = 0;
			let failed = 0;

			// Build the set of raw keys to load, including shunt variants.
			const keysToLoad = new Set<string>();
			for (const subtype of subtypes) {
				keysToLoad.add(subtype);
				if (isSignalSubtype(subtype)) {
					keysToLoad.add(`${SHUNT_PREFIX}${subtype}`);
				}
			}

			await Promise.all(
				Array.from(keysToLoad).map(async (key) => {
					if (raw.has(key)) return;
					try {
						let svg: string;
						if (key.startsWith(SHUNT_PREFIX)) {
							const signalSubtype = key.slice(SHUNT_PREFIX.length);
							const filename = SHUNT_SVG_MAP[signalSubtype];
							if (!filename)
								throw new Error(`No shunt SVG mapped for ${signalSubtype}`);
							svg = await loadRawSvgByFilename(filename);
						} else {
							svg = await loadRawSvg(key);
						}
						raw.set(key, svg);
						loaded++;
					} catch (err) {
						failed++;
						console.warn("textureCache: failed to load", key, err);
					}
				}),
			);
			debugLog(
				"textureCache",
				`preload complete — ${loaded} loaded, ${failed} failed, ${raw.size} total in cache`,
			);
		},

		get(subtype, aspect) {
			const key = lookupKey(subtype, aspect);
			const bakedKey = `${currentTheme}:${key}`;
			const existing = baked.get(bakedKey);
			if (existing) return existing;

			const rawSvg = raw.get(key);
			if (rawSvg === undefined) {
				debugLog(
					"textureCache",
					`get("${key}") → miss (raw SVG not preloaded)`,
				);
				return null;
			}

			const texture = bake(key);
			if (texture) {
				baked.set(bakedKey, texture);
			} else {
				debugLog("textureCache", `get("${key}") → bake returned null`);
			}
			return texture;
		},

		getColored(subtype, color, aspect) {
			const key = lookupKey(subtype, aspect);
			// Flat-colour bakes are theme-independent, so the key omits the theme.
			const bakedKey = `${color}:${key}`;
			const existing = baked.get(bakedKey);
			if (existing) return existing;

			const texture = bake(key, flatColorMap(color));
			if (texture) {
				baked.set(bakedKey, texture);
			} else {
				debugLog(
					"textureCache",
					`getColored("${key}", ${color}) → miss (raw SVG not preloaded)`,
				);
			}
			return texture;
		},

		setTheme(nextTheme, nextColorMap) {
			debugLog("textureCache", `setTheme: ${currentTheme} → ${nextTheme}`);
			currentTheme = nextTheme;
			currentColorMap = nextColorMap;
			for (const texture of baked.values()) texture.destroy(true);
			baked.clear();
		},

		destroy() {
			debugLog("textureCache", "destroy");
			for (const texture of baked.values()) texture.destroy(true);
			baked.clear();
			raw.clear();
		},
	};
}
