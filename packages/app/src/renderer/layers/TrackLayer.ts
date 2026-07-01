import { Container, Sprite, Texture } from "pixi.js";
import type { Map as Map_ } from "@rail-op-sim/shared";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import { debugLog } from "#/lib/debugLogger";
import type { TextureCache } from "#/renderer/textureCache";

interface Entry {
	sprite: Sprite;
	/** Composite key tracking both subtype and aspect for change detection. */
	lookupKey: string;
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
export function makeTrackSprite(texture: Texture, gx: number, gy: number): Sprite {
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

	const entries = new Map<string, Entry>();

	const removeEntry = (key: string, entry: Entry) => {
		debugLog("trackLayer", `remove sprite at (${key}) — lookupKey=${entry.lookupKey}`);
		container.removeChild(entry.sprite);
		entry.sprite.destroy();
		entries.delete(key);
	};

	const addSprite = (key: string, subtype: string, gx: number, gy: number, aspect?: number) => {
		const texture = textures.get(subtype, aspect);
		if (!texture) {
			debugLog("trackLayer", `addSprite SKIP at (${key}) — no texture for "${subtype}" (aspect=${aspect ?? "undefined"})`);
			return;
		}
		const lk = entryKey(subtype, aspect);
		debugLog("trackLayer", `addSprite at (${key}) — lookupKey=${lk}`);
		const sprite = makeTrackSprite(texture, gx, gy);
		sprite.label = `track-${key}`;
		container.addChild(sprite);
		entries.set(key, { sprite, lookupKey: lk });
	};

	return {
		container,

		sync(map) {
			let trackCount = 0;
			const seen = new Set<string>();

			map.forEachTrack((track) => {
				trackCount++;
				const key = track.locationToString();
				let subtype: string = track.data.subtype;
				const aspect = track.getAspect() >= 0 ? track.getAspect() : undefined;

				// Bridge / Underpass: use Unset variant when not named,
				// mirroring how Concourse and NamedLocation behave.
				if (track.data.kind === "bridgeUnderpass" && !track.getNamed()) {
					subtype = `${subtype}_UNSET`;
				}

				seen.add(key);

				const lookupKey = entryKey(subtype, aspect);
				const existing = entries.get(key);
				if (existing) {
					if (existing.lookupKey === lookupKey) return; // unchanged
					removeEntry(key, existing); // subtype or aspect changed — rebuild
				}
				addSprite(key, subtype, track.getLocationX(), track.getLocationY(), aspect);
			});

			let removed = 0;
			for (const [key, entry] of entries) {
				if (!seen.has(key)) { removeEntry(key, entry); removed++; }
			}

			debugLog("trackLayer", `sync complete — ${trackCount} tracks in map, ${entries.size} sprites rendered, ${removed} removed`);
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
			for (const [key, entry] of entries) removeEntry(key, entry);
		},

		destroy() {
			this.clear();
			container.destroy({ children: true });
		},
	};
}
