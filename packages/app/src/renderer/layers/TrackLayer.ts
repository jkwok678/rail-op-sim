import type { Map as Map_, Track } from "@rail-op-sim/shared";
import {
	getTrackColorState,
	TRACK_COLOR_BOTH,
	TRACK_COLOR_LENGTH,
	TRACK_COLOR_SPEED,
} from "@rail-op-sim/shared";
import { Container, Sprite, type Texture } from "pixi.js";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import type { TextureCache } from "#/renderer/textureCache";

interface Entry {
	sprite: Sprite;
	/** Composite key tracking both subtype and aspect for change detection. */
	lookupKey: string;
	/** Resolved subtype + aspect the sprite was baked from — needed to swap
	 * between the themed and the white tintable texture variants. */
	subtype: string;
	aspect?: number;
}

function cellKey(gx: number, gy: number): string {
	return `${gx},${gy}`;
}

/** Composite key for a subtype + optional aspect — used to detect in-place changes. */
function entryKey(subtype: string, aspect?: number): string {
	return aspect !== undefined ? `${subtype}|a${aspect}` : subtype;
}

/**
 * Create a PixiJS Sprite positioned at the given grid cell.
 * Shared by both the track layer and the placement ghost so anchor/sizing
 * conventions stay consistent.
 */
export function makeTrackSprite(
	texture: Texture,
	gx: number,
	gy: number,
): Sprite {
	const sprite = new Sprite(texture);
	sprite.anchor.set(0.5);
	sprite.width = CELL_SIZE;
	sprite.height = CELL_SIZE;
	const { x, y } = gridToWorld(gx, gy);
	sprite.position.set(x, y);
	return sprite;
}

export interface TrackLayer {
	container: Container;
	/** Reconcile sprites with the current map state (full walk — use after preload / theme change). */
	sync(map: Map_): void;
	/** Add or update a single cell. Pass `aspect` for signal tracks. */
	upsertCell(subtype: string, gx: number, gy: number, aspect?: number): void;
	/** Remove the sprite at a single cell. Call after deleting a track. */
	removeCell(gx: number, gy: number): void;
	/** Drop all sprites so the next `sync` rebuilds them (e.g. after a theme change). */
	clear(): void;
	/** Apply/remove speed-length colour tints to all track sprites. */
	syncColors(map: Map_, active: boolean): void;
	/**
	 * Draw these cells (keyed `"x,y"`) with the listed `public/graphics/`
	 * files, bottom to top, in place of their usual art — operate mode's
	 * signal aspects and point lies. Cells left out, or whose files aren't
	 * preloaded, show their usual art. Pass an empty map to restore all.
	 */
	setOverrides(overrides: ReadonlyMap<string, readonly string[]>): void;
	destroy(): void;
}

/**
 * Renders one `Sprite` per placed track, keyed by `"x,y"`. Sprites reference
 * shared textures from the {@link TextureCache}; `sync` adds new cells, rebuilds
 * cells whose subtype changed, and removes deleted cells.
 */
export function createTrackLayer(textures: TextureCache): TrackLayer {
	const container = new Container();
	container.label = "track-layer";
	/** One sprite per placed track. */
	const tiles = new Container();
	/** Operate-mode art, drawn over cells whose tile is hidden. */
	const overlay = new Container();
	overlay.label = "track-overrides";
	container.addChild(tiles, overlay);

	const entries = new Map<string, Entry>();
	/** Override sprites per cell, with the file list they were built from. */
	const overridden = new Map<string, { files: string; sprites: Sprite[] }>();
	/** The overrides last asked for, re-applied after a rebuild. */
	let requested: ReadonlyMap<string, readonly string[]> = new Map();

	let colorModeActive = false;

	const removeEntry = (key: string, entry: Entry) => {
		tiles.removeChild(entry.sprite);
		entry.sprite.destroy();
		entries.delete(key);
	};

	const addSprite = (
		key: string,
		subtype: string,
		gx: number,
		gy: number,
		aspect?: number,
	) => {
		const texture = textures.get(subtype, aspect);
		if (!texture) {
			debugLog(
				"trackLayer",
				`addSprite SKIP at (${key}) — no texture for "${subtype}" (aspect=${aspect ?? "undefined"})`,
			);
			return;
		}
		const lk = entryKey(subtype, aspect);
		const sprite = makeTrackSprite(texture, gx, gy);
		sprite.label = `track-${key}`;
		sprite.visible = !overridden.has(key);
		tiles.addChild(sprite);
		entries.set(key, { sprite, lookupKey: lk, subtype, aspect });
	};

	const dropOverride = (key: string) => {
		const existing = overridden.get(key);
		if (!existing) return;
		for (const sprite of existing.sprites) {
			overlay.removeChild(sprite);
			sprite.destroy();
		}
		overridden.delete(key);
		const entry = entries.get(key);
		if (entry) entry.sprite.visible = true;
	};

	const mountOverrideSprites = (key: string, baked: Texture[]): Sprite[] => {
		const [gxStr, gyStr] = key.split(",");
		const entry = entries.get(key);
		if (entry) entry.sprite.visible = false;
		return baked.map((t) => {
			const sprite = makeTrackSprite(t, Number(gxStr), Number(gyStr));
			sprite.label = `track-override-${key}`;
			overlay.addChild(sprite);
			return sprite;
		});
	};

	const syncOverride = (key: string, files: readonly string[]) => {
		const id = files.join("+");
		if (overridden.get(key)?.files === id) return;
		dropOverride(key);
		const baked = files.map((f) => textures.getFile(f));
		if (!baked.every((t): t is Texture => t !== null)) return;
		overridden.set(key, {
			files: id,
			sprites: mountOverrideSprites(key, baked),
		});
	};

	const applyOverrides = () => {
		for (const key of [...overridden.keys()]) {
			if (!requested.has(key)) dropOverride(key);
		}
		for (const [key, files] of requested) syncOverride(key, files);
	};

	// Bridge / Underpass and linked tracks use Unset variants until named/paired.
	const UNSET_CHECK: Partial<
		Record<Track["data"]["kind"], (t: Track) => boolean>
	> = {
		bridgeUnderpass: (t) => !t.getNamed(),
		linked: (t) => !t.isLinked(),
	};

	const trackDisplaySubtype = (track: Track): string => {
		const check = UNSET_CHECK[track.data.kind];
		return check?.(track) ? `${track.data.subtype}_UNSET` : track.data.subtype;
	};

	const needsRebuild = (key: string, lookupKey: string): boolean => {
		const existing = entries.get(key);
		if (existing?.lookupKey === lookupKey) return false;
		if (existing) removeEntry(key, existing);
		return true;
	};

	const syncTrack = (track: Track, seen: Set<string>) => {
		const key = track.locationToString();
		const subtype = trackDisplaySubtype(track);
		const aspect = track.getAspect() >= 0 ? track.getAspect() : undefined;
		seen.add(key);

		if (!needsRebuild(key, entryKey(subtype, aspect))) return;
		addSprite(key, subtype, track.getLocationX(), track.getLocationY(), aspect);
	};

	return {
		container,

		sync(map) {
			let trackCount = 0;
			const seen = new Set<string>();

			map.forEachTrack((track) => {
				trackCount++;
				syncTrack(track, seen);
			});

			let removed = 0;
			for (const [key, entry] of entries) {
				if (!seen.has(key)) {
					removeEntry(key, entry);
					removed++;
				}
			}

			debugLog(
				"trackLayer",
				`sync complete — ${trackCount} tracks in map, ${entries.size} sprites rendered, ${removed} removed`,
			);

			// Re-apply colour tints if the section colour mode is active
			// (sync may have rebuilt sprites, losing previous tints).
			if (colorModeActive) this.syncColors(map, true);
			// …and operate art, which clear() drops with its textures.
			applyOverrides();
		},

		upsertCell(subtype, gx, gy, aspect) {
			// Bridge / Underpass: tracks are always unnamed at creation time,
			// so use the Unset variant. sync() handles the Set swap when named.
			let resolvedSubtype = subtype;
			if (
				subtype === "BRIDGE1" ||
				subtype === "BRIDGE2" ||
				subtype === "UNDERPASS1" ||
				subtype === "UNDERPASS2"
			) {
				resolvedSubtype = `${subtype}_UNSET`;
			}

			// Linked tracks are always unpaired at placement time
			if (subtype.startsWith("LINK") && !subtype.endsWith("_UNSET")) {
				resolvedSubtype = `${subtype}_UNSET`;
			}

			const key = cellKey(gx, gy);
			const lk = entryKey(resolvedSubtype, aspect);
			const existing = entries.get(key);
			if (existing) {
				if (existing.lookupKey === lk) return;
				removeEntry(key, existing);
			}
			addSprite(key, resolvedSubtype, gx, gy, aspect);
		},

		removeCell(gx, gy) {
			const key = cellKey(gx, gy);
			const existing = entries.get(key);
			if (existing) removeEntry(key, existing);
		},

		clear() {
			// Keep `requested`: the next sync rebuilds the overrides too.
			for (const key of [...overridden.keys()]) dropOverride(key);
			for (const [key, entry] of entries) removeEntry(key, entry);
		},

		syncColors(map, active) {
			colorModeActive = active;
			for (const [key, entry] of entries) {
				let state: ReturnType<typeof getTrackColorState> = "default";
				if (active) {
					const [gxStr, gyStr] = key.split(",");
					const track = map.getTrackAt(Number(gxStr), Number(gyStr));
					if (track) state = getTrackColorState(track);
				}

				if (state === "default") {
					// Restore the themed texture.
					const texture = textures.get(entry.subtype, entry.aspect);
					if (texture) entry.sprite.texture = texture;
					continue;
				}

				// Swap to a variant baked with the fills replaced by the status
				// colour — theme-independent, so it reads identically in light
				// and dark mode.
				const color =
					state === "speed"
						? TRACK_COLOR_SPEED
						: state === "length"
							? TRACK_COLOR_LENGTH
							: TRACK_COLOR_BOTH;
				const texture = textures.getColored(
					entry.subtype,
					`#${color.toString(16).padStart(6, "0")}`,
					entry.aspect,
				);
				if (texture) entry.sprite.texture = texture;
			}
		},

		setOverrides(overrides) {
			requested = overrides;
			applyOverrides();
		},

		destroy() {
			requested = new Map();
			this.clear();
			container.destroy({ children: true });
		},
	};
}
