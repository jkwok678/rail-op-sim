import {
	createTrackData,
	ElementAlreadyExistsError,
	kindToPhrase,
	type ParapetType,
	Platform,
	type TrackKind,
} from "@rail-op-sim/shared";
import type { Sprite } from "pixi.js";
import type { EditorTool, ToolContext, ToolPointer } from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";
import { gridToWorld } from "#/lib/grid";
import { makeTrackSprite } from "#/renderer/layers/TrackLayer";
import { type ElementKind, isTrackKind } from "#/store/editor-store";

/** Platform enum for each platform subtype string the palette uses. */
const PLATFORM_SIDES: Readonly<Partial<Record<string, Platform>>> = {
	PLATFORM_LEFT_SET: Platform.LEFT,
	PLATFORM_RIGHT_SET: Platform.RIGHT,
	PLATFORM_UP_SET: Platform.UP,
	PLATFORM_DOWN_SET: Platform.DOWN,
};

/** Map a platform subtype string from the palette to the Platform enum. */
function platformSubtypeToSide(subtype: string): Platform | null {
	return Object.hasOwn(PLATFORM_SIDES, subtype)
		? (PLATFORM_SIDES[subtype] ?? null)
		: null;
}

/** Undo labels for the non-track elements the Add palette can place. */
const ELEMENT_LABELS: Record<ElementKind, string> = {
	namedLocation: "Add named location",
	concourse: "Add concourse",
	parapet: "Add parapet",
	platform: "Add platform",
	levelCrossing: "Add level crossing",
};

/**
 * Places whatever the Add palette has selected, and deletes with a
 * right-click. A half-transparent ghost of the selection follows the pointer,
 * snapped to the grid, so the user sees what a click would put down.
 */
export class AddTool implements EditorTool {
	private ghostSprite: Sprite | null = null;
	private ghostSubtype: string | null = null;
	private ghostAspect: number | undefined = undefined;

	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return this.ctx.stores.editor.getState().selectedSubtype ? "crosshair" : "";
	}

	deactivate(): void {
		this.clearGhostSprite();
		this.ctx.ghost.visible = false;
	}

	clear(): void {
		this.ctx.ghost.visible = false;
	}

	/** Move the ghost to the cell under the pointer, or hide it with nothing selected. */
	preview(p: ToolPointer): void {
		const { ghost, stores } = this.ctx;
		if (!stores.editor.getState().selectedSubtype || !this.ghostSprite) {
			ghost.visible = false;
			return;
		}
		const { x, y } = gridToWorld(p.cell.gx, p.cell.gy);
		ghost.position.set(x, y);
		ghost.visible = true;
	}

	/** Forget the cached ghost so the next {@link refresh} rebuilds it (new textures). */
	invalidate(): void {
		this.ghostSubtype = null;
		this.ghostAspect = undefined;
	}

	/** Rebuild the ghost sprite to match the current subtype and aspect, or hide it. */
	refresh(): void {
		const { ghost, textures, stores } = this.ctx;
		const { selectedSubtype, selectedKind, selectedAspect } =
			stores.editor.getState();

		if (!selectedSubtype) {
			this.clearGhostSprite();
			ghost.visible = false;
			return;
		}

		const aspect = selectedKind === "signal" ? selectedAspect : undefined;
		if (
			selectedSubtype === this.ghostSubtype &&
			aspect === this.ghostAspect &&
			this.ghostSprite
		) {
			return;
		}

		const texture = textures.get(selectedSubtype, aspect);
		if (!texture) {
			debugLog(
				"placement",
				`refreshGhost — no texture for "${selectedSubtype}" aspect=${aspect} (not preloaded yet)`,
			);
			return;
		}

		this.clearGhostSprite();
		const sprite = makeTrackSprite(texture, 0, 0);
		ghost.addChild(sprite);
		this.ghostSprite = sprite;
		this.ghostSubtype = selectedSubtype;
		this.ghostAspect = aspect;
	}

	click(p: ToolPointer): void {
		const { selectedKind, selectedSubtype } = this.ctx.stores.editor.getState();
		const { gx, gy } = p.cell;
		const worldPos = gridToWorld(gx, gy);
		debugLog(
			"placement",
			`click — screen(${p.clientX},${p.clientY}) → grid(${gx},${gy}) → world(${worldPos.x.toFixed(1)},${worldPos.y.toFixed(1)})`,
		);
		if (!selectedKind || !selectedSubtype) return;

		if (isTrackKind(selectedKind))
			this.placeTrack(selectedKind, selectedSubtype, gx, gy);
		else this.placeElement(selectedKind, selectedSubtype, gx, gy);
	}

	/**
	 * Right-click delete, as a cascade: a level crossing first, then a
	 * platform, then the whole element (a named location riding on a track
	 * goes before the track under it).
	 */
	rightClick(p: ToolPointer): void {
		const { map, layers } = this.ctx;
		const { gx, gy } = p.cell;

		// 1) Level crossing first.
		if (
			this.ctx.commit("Remove level crossing", { element: true }, () =>
				map.removeLevelCrossing(gx, gy),
			)
		) {
			layers.element.sync(map);
			debugLog(
				"placement",
				`right-click → removeLevelCrossing at (${gx},${gy})`,
			);
			return;
		}

		// 2) Platform next (may unlink shared text on non-bridge tracks).
		if (
			this.ctx.commit("Remove platform", { element: true, text: true }, () =>
				map.removePlatform(gx, gy),
			)
		) {
			layers.element.sync(map);
			layers.text.sync(map);
			debugLog("placement", `right-click → removePlatform at (${gx},${gy})`);
			return;
		}

		// 3) Otherwise delete the whole element (track / NamedLocation /
		//    Concourse / Parapet) plus any text cascade.
		const deleted = this.ctx.commit(
			"Delete element",
			{
				track: true,
				element: true,
				text: true,
				linkHighlight: true,
				trackColor: true,
				direction: true,
				status: true,
			},
			() => map.deleteElement(gx, gy),
		);
		debugLog(
			"placement",
			`right-click → deleteElement at (${gx},${gy}) — ${deleted ? "removed" : "nothing there"}`,
		);
		if (deleted) this.refreshAfterDelete(gx, gy);
	}

	private placeTrack(
		kind: TrackKind,
		subtype: string,
		gx: number,
		gy: number,
	): void {
		const { map, layers, stores } = this.ctx;
		const { selectedAspect } = stores.editor.getState();
		const aspect = kind === "signal" ? selectedAspect : undefined;
		try {
			const trackData = createTrackData(
				kind,
				subtype,
				kind === "signal" ? { aspect: selectedAspect } : undefined,
			);
			this.ctx.commit(
				`Add ${kindToPhrase(kind)}`,
				{
					track: true,
					linkHighlight: true,
					trackColor: true,
					direction: true,
					status: true,
				},
				() => {
					map.addTrack(trackData, gx, gy);
				},
			);
			this.ctx.publishTrackStatus();
			debugLog(
				"placement",
				`addTrack OK — kind=${kind} subtype=${subtype} at (${gx},${gy})`,
			);
		} catch (err) {
			if (err instanceof ElementAlreadyExistsError) {
				debugLog(
					"placement",
					`addTrack SKIP — element already exists at (${gx},${gy})`,
				);
				return;
			}
			console.error("AddTool: addTrack failed", err);
			return;
		}
		layers.track.upsertCell(subtype, gx, gy, aspect);
		layers.linkHighlight.sync(map);
		layers.trackColor.sync(map);
		layers.direction.sync(map);
	}

	/** Place a non-track element on the map and sync the element layer. */
	private placeElement(
		kind: ElementKind,
		subtype: string,
		gx: number,
		gy: number,
	): void {
		const { map, layers } = this.ctx;
		try {
			this.ctx.commit(
				ELEMENT_LABELS[kind],
				{ element: true, text: true },
				() => {
					switch (kind) {
						case "namedLocation":
							map.createAddNamedLocation(gx, gy);
							debugLog("placement", `createAddNamedLocation at (${gx},${gy})`);
							break;
						case "concourse":
							map.createAddConcourse(gx, gy);
							debugLog("placement", `createAddConcourse at (${gx},${gy})`);
							break;
						case "parapet":
							map.createAddParapet(subtype as ParapetType, gx, gy);
							debugLog(
								"placement",
								`createAddParapet type=${subtype} at (${gx},${gy})`,
							);
							break;
						case "platform": {
							const side = platformSubtypeToSide(subtype);
							if (side !== null) {
								map.addPlatform(side, gx, gy);
								debugLog(
									"placement",
									`addPlatform side=${side} at (${gx},${gy})`,
								);
							}
							break;
						}
						case "levelCrossing":
							map.addLevelCrossing(gx, gy);
							debugLog("placement", `addLevelCrossing at (${gx},${gy})`);
							break;
					}
				},
			);
		} catch (err) {
			// Silently skip duplicates / invalid placements
			debugLog("placement", `placeElement SKIP — ${err}`);
			return;
		}
		// Re-sync both layers — placing a NamedLocation can create/delete
		// text objects via linkNewElementToText.
		layers.element.sync(map);
		layers.text.sync(map);
	}

	/** Bring every layer up to date after `deleteElement` removed something. */
	private refreshAfterDelete(gx: number, gy: number): void {
		const { map, layers } = this.ctx;
		// A named location riding on a track goes first; the track stays.
		if (!map.getTrackAt(gx, gy)) layers.track.removeCell(gx, gy);
		layers.element.sync(map);
		layers.text.sync(map);
		layers.linkHighlight.sync(map);
		layers.trackColor.sync(map);
		layers.direction.sync(map);
		this.ctx.publishTrackStatus();
	}

	private clearGhostSprite(): void {
		if (this.ghostSprite) {
			this.ctx.ghost.removeChild(this.ghostSprite);
			this.ghostSprite.destroy();
			this.ghostSprite = null;
		}
		this.ghostSubtype = null;
		this.ghostAspect = undefined;
	}
}
