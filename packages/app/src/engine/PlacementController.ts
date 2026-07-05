import {
	createTrackData,
	deserializeMap,
	ElementAlreadyExistsError,
	type FontInfo,
	findPathBetween,
	kindToLabel,
	Map as Map_,
	type ParapetType,
	Platform,
	type SerializedMap,
	serializeMap,
	subtypeToCode,
	type Text,
} from "@rail-op-sim/shared";
import {
	type Application,
	Container,
	type Sprite as SpriteType,
} from "pixi.js";
import type { ViewportController } from "#/engine/ViewportController";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE, gridToWorld, worldToGrid } from "#/lib/grid";
import type { ElementLayer } from "#/renderer/layers/ElementLayer";
import type { LinkHighlightLayer } from "#/renderer/layers/LinkHighlightLayer";
import type { TextLayer } from "#/renderer/layers/TextLayer";
import type { TrackColorLayer } from "#/renderer/layers/TrackColorLayer";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";
import { makeTrackSprite } from "#/renderer/layers/TrackLayer";
import type { TextureCache } from "#/renderer/textureCache";
import {
	type ElementKind,
	isTrackKind,
	type NameableKind,
	useEditorStore,
} from "#/store/editor-store";

/** Pointer travel (CSS px) above which a release counts as a drag, not a click. */
const DRAG_THRESHOLD = 3;

export interface PlacementControllerOptions {
	app: Application;
	/** The pannable/zoomable world container the ghost is parented to. */
	world: Container;
	trackLayer: TrackLayer;
	elementLayer: ElementLayer;
	textLayer: TextLayer;
	linkHighlightLayer: LinkHighlightLayer;
	trackColorLayer: TrackColorLayer;
	textures: TextureCache;
	viewport: ViewportController;
}

/** Map a platform subtype string from the palette to the Platform enum. */
function platformSubtypeToSide(subtype: string): Platform | null {
	switch (subtype) {
		case "PLATFORM_LEFT_SET":
			return Platform.LEFT;
		case "PLATFORM_RIGHT_SET":
			return Platform.RIGHT;
		case "PLATFORM_UP_SET":
			return Platform.UP;
		case "PLATFORM_DOWN_SET":
			return Platform.DOWN;
		default:
			return null;
	}
}

/**
 * Owns all canvas placement interaction: click-to-add, click-to-delete, grid
 * snapping, and the cursor ghost preview. Reads tool/selection from the editor
 * store and mutates a single {@link Map_}, re-syncing the {@link TrackLayer}
 * and {@link ElementLayer} after each change. Pans (driven by
 * {@link ViewportController}) are ignored.
 */
export class PlacementController {
	/** Singleton ref so React components (e.g. TextInputDialog) can call placement methods. */
	static instance: PlacementController | null = null;

	/** The authoritative layout. Owned here; React doesn't read it in this scope. */
	readonly map = new Map_();
	/** Container holding the ghost sprite; the host adds this to the world. */
	readonly ghost = new Container();

	private readonly app: Application;
	private readonly world: Container;
	private readonly trackLayer: TrackLayer;
	private readonly elementLayer: ElementLayer;
	private readonly textLayer: TextLayer;
	private readonly linkHighlightLayer: LinkHighlightLayer;
	private readonly trackColorLayer: TrackColorLayer;
	private readonly textures: TextureCache;
	private readonly viewport: ViewportController;

	private ghostSprite: SpriteType | null = null;
	private ghostSubtype: string | null = null;
	private ghostAspect: number | undefined = undefined;

	private downPos: { x: number; y: number } | null = null;
	private downWasPanning = false;

	/** Cached `getBoundingClientRect` from the last pointerdown (avoids forced layout per pointermove). */
	private downRect: DOMRect | null = null;

	private abort?: AbortController;
	private unsubStore?: () => void;

	constructor(opts: PlacementControllerOptions) {
		this.app = opts.app;
		this.world = opts.world;
		this.trackLayer = opts.trackLayer;
		this.elementLayer = opts.elementLayer;
		this.textLayer = opts.textLayer;
		this.linkHighlightLayer = opts.linkHighlightLayer;
		this.trackColorLayer = opts.trackColorLayer;
		this.textures = opts.textures;
		this.viewport = opts.viewport;

		// Phase 0: fix coordinate-unit mismatch so neighbor-math (grid ± 1)
		// matches app's integer-grid stored coordinates.
		this.map.setImageSize(1);

		this.ghost.label = "ghost";
		this.ghost.alpha = 0.5;
		this.ghost.visible = false;
		this.ghost.eventMode = "none";

		PlacementController.instance = this;
		// Publish the initial (empty) status so the UI leaves its "loading" state.
		this.publishTrackStatus();
	}

	/**
	 * Recompute the track connectivity summary and push it to the editor store as
	 * plain data. This is the single place that reads pixi/map connectivity for
	 * the UI, keeping browser-only code out of React components (and the SSR
	 * module graph).
	 */
	private publishTrackStatus(): void {
		const total = this.map.getTotalTrack();
		useEditorStore.getState().setTrackStatus({
			total,
			connected: total > 0 && this.map.checkAllTracksConnected(),
		});
	}

	/** Attach pointer listeners and subscribe to tool/selection changes. */
	attach(): void {
		const { tool, selectedKind, selectedSubtype } = useEditorStore.getState();
		debugLog(
			"placement",
			`attached — tool=${tool} kind=${selectedKind ?? "null"} subtype=${selectedSubtype ?? "null"}`,
		);

		const canvas = this.app.canvas;
		this.abort = new AbortController();
		const { signal } = this.abort;

		canvas.addEventListener("pointerdown", this.onPointerDown, { signal });
		canvas.addEventListener("pointerup", this.onPointerUp, { signal });
		canvas.addEventListener("pointermove", this.onPointerMove, { signal });
		canvas.addEventListener("pointerleave", this.onPointerLeave, { signal });
		canvas.addEventListener("pointercancel", this.onPointerCancel, { signal });
		// Right-click is a delete gesture (see handleRightClick) — suppress the
		// native context menu so the release lands as our own event.
		canvas.addEventListener("contextmenu", (e) => e.preventDefault(), {
			signal,
		});

		this.unsubStore = useEditorStore.subscribe((state, prevState) => {
			const toolChanged = state.tool !== prevState.tool;
			const highlightsChanged =
				state.showLinkHighlights !== prevState.showLinkHighlights;

			// Toggle: show/hide paired+unpaired highlights
			if (highlightsChanged) {
				if (state.showLinkHighlights) {
					this.linkHighlightLayer.sync(this.map);
					this.linkHighlightLayer.container.visible = true;
				} else if (state.tool !== "link") {
					this.linkHighlightLayer.container.visible = false;
				}
			}

			// Tool change: manage selection highlight for link tool
			if (toolChanged) {
				if (state.tool === "link") {
					this.linkHighlightLayer.container.visible = true;
					this.linkHighlightLayer.sync(this.map);
					this.linkHighlightLayer.syncSelection(this.map);
				} else if (prevState.tool === "link") {
					// Leaving link tool — reset selection state machine
					this.map.setLinkedTrack1(null);
					this.map.setLinkedTrack2(null);
					if (!state.showLinkHighlights) {
						this.linkHighlightLayer.container.visible = false;
					} else {
						// Keep highlights visible, but clear selection
						this.linkHighlightLayer.sync(this.map);
						this.linkHighlightLayer.syncSelection(this.map);
					}
				}

				// Entering section tool — show colour overlay immediately for all tracks
				if (state.tool === "section" && prevState.tool !== "section") {
					this.trackColorLayer.sync(this.map);
				}

				// Leaving section tool — clear section highlight & hide colour overlay
				if (prevState.tool === "section" && state.tool !== "section") {
					this.linkHighlightLayer.clearSectionHighlight();
					this.trackColorLayer.hide();
					if (!state.showLinkHighlights) {
						this.linkHighlightLayer.container.visible = false;
					}
				}
			}

			if (
				!toolChanged &&
				state.selectedSubtype === prevState.selectedSubtype &&
				state.selectedAspect === prevState.selectedAspect &&
				!highlightsChanged
			)
				return;

			debugLog(
				"placement",
				`store change — tool=${state.tool} kind=${state.selectedKind ?? "null"} subtype=${state.selectedSubtype ?? "null"}`,
			);
			this.applyCursor();
			this.refreshGhostSprite();
		});

		this.applyCursor();
		this.refreshGhostSprite();
	}

	detach(): void {
		if (PlacementController.instance === this) {
			PlacementController.instance = null;
		}
		this.abort?.abort();
		this.unsubStore?.();
		this.app.canvas.style.cursor = "";
		this.ghost.destroy({ children: true });
	}

	/** Force the ghost sprite to be rebuilt (e.g. after a theme/texture refresh). */
	refreshGhost(): void {
		this.ghostSubtype = null;
		this.ghostAspect = undefined;
		this.refreshGhostSprite();
	}

	// ── Pointer handling (arrow fields keep `this` bound as listeners) ──

	private onPointerDown = (e: PointerEvent): void => {
		if (e.button !== 0 && e.button !== 2) return;
		debugLog("placement", `pointerdown at (${e.clientX}, ${e.clientY})`);
		this.downPos = { x: e.clientX, y: e.clientY };
		this.downRect = this.app.canvas.getBoundingClientRect();
		this.downWasPanning = this.viewport.isPanning;
	};

	private onPointerUp = (e: PointerEvent): void => {
		if (e.button !== 0 && e.button !== 2) return;

		const down = this.downPos;
		this.downPos = null;
		this.downRect = null;

		const { tool, selectedKind, selectedSubtype } = useEditorStore.getState();
		debugLog(
			"placement",
			`pointerup — tool=${tool} kind=${selectedKind ?? "null"} subtype=${selectedSubtype ?? "null"} downWasPanning=${this.downWasPanning} isPanning=${this.viewport.isPanning}`,
		);

		if (this.downWasPanning || this.viewport.isPanning) {
			debugLog("placement", "pointerup ignored — was panning");
			return;
		}
		if (!down) {
			debugLog(
				"placement",
				"pointerup ignored — no matching pointerdown on canvas",
			);
			return;
		}
		const dx = e.clientX - down.x;
		const dy = e.clientY - down.y;
		if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
			debugLog(
				"placement",
				`pointerup ignored — drag distance (${dx.toFixed(1)}, ${dy.toFixed(1)}) > threshold`,
			);
			return;
		}

		// Right-click is the delete gesture (Add + Text tools).
		if (e.button === 2) {
			this.handleRightClick(e);
			return;
		}

		// Text tool — edit an existing text, name an element, or place new text.
		if (tool === "text") {
			const wp = this.screenToWorld(e.clientX, e.clientY);
			if (!wp) return;

			// 1) Clicked an existing text → edit it.
			const hit = this.textLayer.hitTest(wp.x, wp.y);
			if (hit) {
				useEditorStore.getState().setPendingText({
					mode: "edit",
					tx: hit.getLocationX(),
					ty: hit.getLocationY(),
				});
				debugLog(
					"placement",
					`text click → edit text at grid(${hit.getLocationX()},${hit.getLocationY()})`,
				);
				return;
			}

			// 2) Clicked a nameable element → open the naming dialog.
			//    Priority: NamedLocation > Concourse > bridgeUnderpass > platform track.
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (cell) {
				const nl = this.map.getNamedLocationAt(cell.gx, cell.gy);
				if (nl) {
					useEditorStore.getState().setPendingNameTarget({
						gx: cell.gx,
						gy: cell.gy,
						kind: "namedLocation",
					});
					return;
				}

				const concourse = this.map.getConcourseAt(cell.gx, cell.gy);
				if (concourse) {
					useEditorStore.getState().setPendingNameTarget({
						gx: cell.gx,
						gy: cell.gy,
						kind: "concourse",
					});
					return;
				}

				const track = this.map.getTrackAt(cell.gx, cell.gy);
				if (track) {
					if (track.data.kind === "bridgeUnderpass") {
						useEditorStore.getState().setPendingNameTarget({
							gx: cell.gx,
							gy: cell.gy,
							kind: "bridgeUnderpass",
						});
						return;
					}
					if (track.hasPlatform()) {
						useEditorStore.getState().setPendingNameTarget({
							gx: cell.gx,
							gy: cell.gy,
							kind: "platform",
						});
						return;
					}
				}
			}

			// 3) Empty / non-nameable cell → place a new standalone text.
			useEditorStore.getState().setPendingText({
				mode: "place",
				x: wp.x,
				y: wp.y,
			});
			debugLog(
				"placement",
				`text click → place at world(${wp.x.toFixed(1)},${wp.y.toFixed(1)})`,
			);
			return;
		}

		// Link tool — click a linked track to pair it.
		if (tool === "link") {
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (!cell) return;
			this.map.connectTwoLinkedTracks(cell.gx, cell.gy);
			this.publishTrackStatus();
			this.trackLayer.sync(this.map);
			// Always keep highlight data fresh; visibility controls display
			this.linkHighlightLayer.sync(this.map);
			this.linkHighlightLayer.syncSelection(this.map);
			debugLog("placement", `link click → grid(${cell.gx},${cell.gy})`);
			return;
		}

		// Section tool — two-click path selection
		if (tool === "section") {
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (!cell) {
				useEditorStore.getState().clearSectionSelection();
				this.linkHighlightLayer.clearSectionHighlight();
				this.trackColorLayer.hide();
				return;
			}

			const track = this.map.getTrackAt(cell.gx, cell.gy);
			if (!track) {
				// Clicked empty space — clear selection
				useEditorStore.getState().clearSectionSelection();
				this.linkHighlightLayer.clearSectionHighlight();
				this.trackColorLayer.hide();
				debugLog("placement", "section click → empty cell, cleared");
				return;
			}

			const { sectionStart } = useEditorStore.getState();
			if (!sectionStart) {
				// First click — set start
				useEditorStore.getState().setSectionStart({ gx: cell.gx, gy: cell.gy });
				debugLog(
					"placement",
					`section click → start at (${cell.gx},${cell.gy})`,
				);
			} else {
				// Second click — find path
				const startTrack = this.map.getTrackAt(
					sectionStart.gx,
					sectionStart.gy,
				);
				if (!startTrack) {
					useEditorStore.getState().clearSectionSelection();
					this.linkHighlightLayer.clearSectionHighlight();
					this.trackColorLayer.hide();
					debugLog("placement", "section click → start track gone, cleared");
					return;
				}

				const path = findPathBetween(this.map, startTrack, track);
				if (path) {
					const coords = path.map((t) => ({
						gx: t.getLocationX(),
						gy: t.getLocationY(),
					}));
					useEditorStore
						.getState()
						.setSectionEnd({ gx: cell.gx, gy: cell.gy }, coords);
					this.linkHighlightLayer.highlightSection(coords);
					this.linkHighlightLayer.container.visible = true;
					this.trackColorLayer.sync(this.map);
					this.trackColorLayer.container.visible = true;
					debugLog(
						"placement",
						`section click → end at (${cell.gx},${cell.gy}), path length=${coords.length}`,
					);
				} else {
					// No path — clear and let user retry
					useEditorStore.getState().clearSectionSelection();
					this.linkHighlightLayer.clearSectionHighlight();
					this.trackColorLayer.hide();
					debugLog("placement", "section click → no path found, cleared");
				}
			}
			return;
		}

		const cell = this.screenToGrid(e.clientX, e.clientY);
		if (!cell) {
			debugLog(
				"placement",
				`pointerup — screenToGrid returned null for (${e.clientX}, ${e.clientY})`,
			);
			return;
		}

		const worldPos = gridToWorld(cell.gx, cell.gy);
		debugLog(
			"placement",
			`click — screen(${e.clientX},${e.clientY}) → grid(${cell.gx},${cell.gy}) → world(${worldPos.x.toFixed(1)},${worldPos.y.toFixed(1)})`,
		);

		if (tool === "add" && selectedKind && selectedSubtype) {
			if (isTrackKind(selectedKind)) {
				// ── Existing track placement ──
				try {
					const { selectedAspect } = useEditorStore.getState();
					const options =
						selectedKind === "signal" ? { aspect: selectedAspect } : undefined;
					const trackData = createTrackData(
						selectedKind,
						selectedSubtype,
						options,
					);
					this.map.addTrack(trackData, cell.gx, cell.gy);
					this.publishTrackStatus();
					debugLog(
						"placement",
						`addTrack OK — kind=${selectedKind} subtype=${selectedSubtype} at (${cell.gx},${cell.gy})`,
					);
				} catch (err) {
					if (err instanceof ElementAlreadyExistsError) {
						debugLog(
							"placement",
							`addTrack SKIP — element already exists at (${cell.gx},${cell.gy})`,
						);
						return;
					}
					console.error("PlacementController: addTrack failed", err);
					return;
				}
				const aspectArg =
					selectedKind === "signal"
						? useEditorStore.getState().selectedAspect
						: undefined;
				this.trackLayer.upsertCell(
					selectedSubtype,
					cell.gx,
					cell.gy,
					aspectArg,
				);
				this.linkHighlightLayer.sync(this.map);
				this.trackColorLayer.sync(this.map);
			} else {
				// ── Element placement ──
				this.handleElementPlacement(
					selectedKind as ElementKind,
					selectedSubtype,
					cell.gx,
					cell.gy,
				);
			}
		}
	};

	/**
	 * Right-click delete gesture.
	 * - Text tool: delete the text under the pointer (unlinking it everywhere).
	 * - Add tool: cascade — level crossing first, then platform, then the whole
	 *   element.
	 */
	private handleRightClick(e: PointerEvent): void {
		const { tool } = useEditorStore.getState();

		if (tool === "text") {
			const wp = this.screenToWorld(e.clientX, e.clientY);
			if (!wp) return;
			const hit = this.textLayer.hitTest(wp.x, wp.y);
			if (hit) this.deleteTextObject(hit);
			return;
		}

		if (tool === "add") {
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (!cell) return;

			// 1) Level crossing first.
			if (this.map.removeLevelCrossing(cell.gx, cell.gy)) {
				this.elementLayer.sync(this.map);
				debugLog(
					"placement",
					`right-click → removeLevelCrossing at (${cell.gx},${cell.gy})`,
				);
				return;
			}

			// 2) Platform next (may unlink shared text on non-bridge tracks).
			if (this.map.removePlatform(cell.gx, cell.gy)) {
				this.elementLayer.sync(this.map);
				this.textLayer.sync(this.map);
				debugLog(
					"placement",
					`right-click → removePlatform at (${cell.gx},${cell.gy})`,
				);
				return;
			}

			// 3) Otherwise delete the whole element (track / NamedLocation /
			//    Concourse / Parapet) plus any text cascade.
			const deleted = this.map.deleteElement(cell.gx, cell.gy);
			debugLog(
				"placement",
				`right-click → deleteElement at (${cell.gx},${cell.gy}) — ${deleted ? "removed" : "nothing there"}`,
			);
			if (deleted) {
				this.trackLayer.removeCell(cell.gx, cell.gy);
				this.elementLayer.sync(this.map);
				this.textLayer.sync(this.map);
				this.linkHighlightLayer.sync(this.map);
				this.trackColorLayer.sync(this.map);
				this.publishTrackStatus();
			}
		}
	}

	/** Place a non-track element on the map and sync the element layer. */
	private handleElementPlacement(
		kind: ElementKind,
		subtype: string,
		gx: number,
		gy: number,
	): void {
		try {
			switch (kind) {
				case "namedLocation":
					this.map.createAddNamedLocation(gx, gy);
					debugLog("placement", `createAddNamedLocation at (${gx},${gy})`);
					break;
				case "concourse":
					this.map.createAddConcourse(gx, gy);
					debugLog("placement", `createAddConcourse at (${gx},${gy})`);
					break;
				case "parapet":
					this.map.createAddParapet(subtype as ParapetType, gx, gy);
					debugLog(
						"placement",
						`createAddParapet type=${subtype} at (${gx},${gy})`,
					);
					break;
				case "platform": {
					const side = platformSubtypeToSide(subtype);
					if (side !== null) {
						this.map.addPlatform(side, gx, gy);
						debugLog("placement", `addPlatform side=${side} at (${gx},${gy})`);
					}
					break;
				}
				case "levelCrossing":
					this.map.addLevelCrossing(gx, gy);
					debugLog("placement", `addLevelCrossing at (${gx},${gy})`);
					break;
			}
		} catch (err) {
			// Silently skip duplicates / invalid placements
			debugLog("placement", `handleElementPlacement SKIP — ${err}`);
			return;
		}
		// Re-sync both layers — placing a NamedLocation can create/delete
		// text objects via linkNewElementToText.
		this.elementLayer.sync(this.map);
		this.textLayer.sync(this.map);
	}

	/**
	 * Place a text element at the given world coordinates.
	 * Converts to fractional grid coords so gridToWorld() round-trips correctly.
	 */
	placeText(wx: number, wy: number, content: string, font: FontInfo): void {
		const gx = wx / CELL_SIZE;
		const gy = -wy / CELL_SIZE;
		this.map.createAddText(gx, gy, content, font);
		this.textLayer.sync(this.map);
		debugLog(
			"placement",
			`placeText "${content}" at world(${wx.toFixed(1)},${wy.toFixed(1)}) grid(${gx.toFixed(2)},${gy.toFixed(2)})`,
		);
	}

	/** Find the Text at exact grid coordinates (used to prefill/apply text edits). */
	getTextByLocation(tx: number, ty: number): Text | null {
		for (const t of this.map.getTextList()) {
			if (t.getLocationX() === tx && t.getLocationY() === ty) return t;
		}
		return null;
	}

	/**
	 * Rename (or delete, when content is empty) the Text at the given grid
	 * coordinates, then re-sync the affected layers.
	 */
	updateTextAt(tx: number, ty: number, content: string, font?: FontInfo): void {
		const text = this.getTextByLocation(tx, ty);
		if (!text) return;
		const trimmed = content.trim();
		this.map.changeDeleteText(trimmed, trimmed !== "", text);
		// changeDeleteText deletes the text when trimmed is empty; only restyle
		// when it survived (non-empty content) and a new font was supplied.
		if (trimmed !== "" && font) text.setFont(font);
		this.syncAfterTextChange();
		debugLog("placement", `updateTextAt (${tx},${ty}) → "${trimmed}"`);
	}

	/** Delete a Text and unlink it from every element that shared it. */
	deleteTextObject(text: Text): void {
		this.map.changeDeleteText("", false, text);
		this.syncAfterTextChange();
		debugLog("placement", "deleteTextObject");
	}

	/**
	 * Re-sync layers touched by a text rename/delete. The track layer is included
	 * because bridge/underpass base sprites swap between Set/Unset on name change.
	 */
	private syncAfterTextChange(): void {
		this.textLayer.sync(this.map);
		this.elementLayer.sync(this.map);
		this.trackLayer.sync(this.map);
	}

	/**
	 * Name (or rename/delete) any nameable element at the given grid coordinates.
	 *
	 * For unnamed elements with non-empty content this calls
	 * {@link Map_.createAddLinkText}, which flood-fills the text to adjacent
	 * elements of the same domain (NamedLocations stay in the NamedLocation
	 * domain; tracks/concourses/bridges share the other domain).
	 */
	nameElementAt(
		gx: number,
		gy: number,
		content: string,
		kind: NameableKind,
	): void {
		let element: import("@rail-op-sim/shared").NamedElement | null = null;
		switch (kind) {
			case "namedLocation":
				element = this.map.getNamedLocationAt(gx, gy);
				break;
			case "concourse":
				element = this.map.getConcourseAt(gx, gy);
				break;
			case "platform":
			case "bridgeUnderpass":
				element = this.map.getTrackAt(gx, gy);
				break;
		}
		if (!element) return;

		const trimmed = content.trim();

		if (element.getNamed()) {
			const text = element.getText();
			if (text) {
				this.map.changeDeleteText(trimmed, trimmed !== "", text);
			}
		} else if (trimmed !== "") {
			this.map.createAddLinkText(gx, gy, trimmed, true, {
				family: "JetBrains Mono",
				pointSize: 12,
			});
		}

		this.textLayer.sync(this.map);
		this.elementLayer.sync(this.map);
		// Bridge / Underpass base sprites live in the track layer and swap
		// between Set/Unset based on named state — re-sync when naming.
		if (kind === "bridgeUnderpass") {
			this.trackLayer.sync(this.map);
		}
		debugLog(
			"placement",
			`nameElementAt "${trimmed}" kind=${kind} at (${gx},${gy})`,
		);
	}

	/**
	 * Name (or rename/delete) a NamedLocation at the given grid coordinates.
	 * Delegates to {@link nameElementAt} for backward compatibility.
	 */
	nameNamedLocation(gx: number, gy: number, content: string): void {
		this.nameElementAt(gx, gy, content, "namedLocation");
	}

	/**
	 * Apply speed/length edits from the section panel to every track in the
	 * selected section.
	 */
	applySectionEdit(values: {
		mainSpeed: number;
		mainLength: number;
		secondarySpeed?: number;
		secondaryLength?: number;
	}): void {
		const { sectionTracks } = useEditorStore.getState();
		for (const coord of sectionTracks) {
			const track = this.map.getTrackAt(coord.gx, coord.gy);
			if (!track) continue;
			track.setTrackMainSpeed(values.mainSpeed);
			track.setTrackMainLength(values.mainLength);
			if (values.secondarySpeed !== undefined) {
				track.setTrackSecondarySpeed(values.secondarySpeed);
			}
			if (values.secondaryLength !== undefined) {
				track.setTrackSecondaryLength(values.secondaryLength);
			}
		}
		this.trackLayer.sync(this.map);
		this.trackColorLayer.sync(this.map);
		this.publishTrackStatus();
		debugLog(
			"placement",
			`applySectionEdit — ${sectionTracks.length} tracks updated`,
		);
	}

	/** Clear the section highlight overlay (public for SectionEditPanel). */
	clearSectionHighlight(): void {
		this.linkHighlightLayer.clearSectionHighlight();
	}

	/** Restore defaults for all tracks in the selected section. */
	restoreSection(): void {
		const { sectionTracks } = useEditorStore.getState();
		for (const coord of sectionTracks) {
			const track = this.map.getTrackAt(coord.gx, coord.gy);
			if (!track) continue;
			track.restoreDefaults();
		}
		this.trackLayer.sync(this.map);
		this.trackColorLayer.sync(this.map);
		this.publishTrackStatus();
		debugLog(
			"placement",
			`restoreSection — ${sectionTracks.length} tracks reset to defaults`,
		);
	}

	// ── Save / load ─────────────────────────────────────────────────────

	/** Snapshot the current map as a plain-JSON structure for file download. */
	serialize(): SerializedMap {
		return serializeMap(this.map);
	}

	/**
	 * Replace the current map with a loaded snapshot and rebuild every render
	 * layer. Mirrors the initial sync in usePixiApp (clearing the track layer
	 * first so stale cells from the previous map are removed).
	 */
	loadFromData(data: SerializedMap): void {
		// Validate by building into a throwaway map first: assertSerializedMap only
		// checks the top-level shape, so a structurally-valid file with malformed
		// element entries would otherwise throw *after* clearAll and destroy the
		// user's unsaved work. If this deserialize succeeds, the same data is safe
		// to apply to the live map below.
		deserializeMap(data, new Map_());

		this.map.clearAll();
		deserializeMap(data, this.map);

		// Rebuild sprites from scratch so stale cells from the previous map go away.
		this.trackLayer.clear();
		this.elementLayer.clear();
		this.textLayer.clear();
		this.trackLayer.sync(this.map);
		// Reset the section colour overlay: no section is selected after a load, so
		// restore plain themed textures (otherwise tracks with non-default speed/
		// length would appear tinted).
		this.trackColorLayer.hide();
		this.elementLayer.sync(this.map);
		this.textLayer.sync(this.map);
		this.linkHighlightLayer.clearSectionHighlight();
		this.linkHighlightLayer.sync(this.map);

		// Any prior section selection now points at removed tracks — clear it.
		useEditorStore.getState().clearSectionSelection();
		this.publishTrackStatus();
		debugLog(
			"placement",
			`loadFromData — ${this.map.getTotalTrack()} tracks restored`,
		);
	}

	private onPointerMove = (e: PointerEvent): void => {
		const { tool, selectedSubtype, showTrackInfo } = useEditorStore.getState();

		// Track-info hover: independent of the ghost/add logic below, so it works
		// with any tool (e.g. the select tool while inspecting placed track).
		if (showTrackInfo) {
			const hoverCell = this.screenToGrid(e.clientX, e.clientY);
			const track = hoverCell
				? this.map.getTrackAt(hoverCell.gx, hoverCell.gy)
				: null;
			useEditorStore.getState().setHoveredTrackInfo(
				track && hoverCell
					? {
							kindLabel: kindToLabel(track.data.kind),
							subtypeCode: subtypeToCode(track.data.kind, track.data.subtype),
							mainSpeed: track.getTrackMainSpeed(),
							mainLength: track.getTrackMainLength(),
							gx: hoverCell.gx,
							gy: hoverCell.gy,
							screenX: e.clientX,
							screenY: e.clientY,
						}
					: null,
			);
		}

		if (tool !== "add" || !selectedSubtype || !this.ghostSprite) {
			this.ghost.visible = false;
			return;
		}
		const cell = this.screenToGrid(e.clientX, e.clientY);
		if (!cell) {
			this.ghost.visible = false;
			return;
		}
		const { x, y } = gridToWorld(cell.gx, cell.gy);
		this.ghost.position.set(x, y);
		this.ghost.visible = true;
	};

	private onPointerLeave = (): void => {
		this.ghost.visible = false;
		useEditorStore.getState().setHoveredTrackInfo(null);
	};

	private onPointerCancel = (): void => {
		debugLog("placement", "pointercancel — clearing state");
		this.downPos = null;
		this.downRect = null;
		this.ghost.visible = false;
		useEditorStore.getState().setHoveredTrackInfo(null);
	};

	// ── Helpers ──

	/**
	 * Convert a client pointer position to world coordinates without grid snapping.
	 * Used for text placement where we want exact pixel positioning.
	 */
	private screenToWorld(
		clientX: number,
		clientY: number,
	): { x: number; y: number } | null {
		const rect = this.downRect ?? this.app.canvas.getBoundingClientRect();
		const sx = clientX - rect.left;
		const sy = clientY - rect.top;
		const x = (sx - this.world.position.x) / this.world.scale.x;
		const y = (sy - this.world.position.y) / this.world.scale.y;
		return { x, y };
	}

	/** Convert a client pointer position to the nearest grid cell. */
	private screenToGrid(
		clientX: number,
		clientY: number,
	): { gx: number; gy: number } | null {
		const rect = this.downRect ?? this.app.canvas.getBoundingClientRect();
		const sx = clientX - rect.left;
		const sy = clientY - rect.top;
		const wx = (sx - this.world.position.x) / this.world.scale.x;
		const wy = (sy - this.world.position.y) / this.world.scale.y;
		const result = worldToGrid(wx, wy);
		if (!result) {
			debugLog(
				"placement",
				`screenToGrid(${clientX},${clientY}) → null — rect=(${rect.left},${rect.top},${rect.width}x${rect.height}) worldPos=(${this.world.position.x.toFixed(1)},${this.world.position.y.toFixed(1)}) worldScale=(${this.world.scale.x.toFixed(3)},${this.world.scale.y.toFixed(3)})`,
			);
		}
		return result;
	}

	private applyCursor(): void {
		const { tool, selectedSubtype } = useEditorStore.getState();
		const canvas = this.app.canvas;
		let cursor = "";
		if (tool === "add" && selectedSubtype) cursor = "crosshair";
		else if (tool === "text") cursor = "text";
		else if (tool === "link") cursor = "pointer";
		else if (tool === "section") cursor = "pointer";
		canvas.style.cursor = cursor;
		debugLog(
			"placement",
			`cursor → "${cursor}" (tool=${tool} subtype=${selectedSubtype ?? "null"})`,
		);
	}

	/** Rebuild the ghost sprite to match the current subtype and aspect, or hide it. */
	private refreshGhostSprite(): void {
		const { tool, selectedSubtype, selectedKind, selectedAspect } =
			useEditorStore.getState();

		if (tool !== "add" || !selectedSubtype) {
			debugLog(
				"placement",
				`refreshGhost — hiding (tool=${tool} kind=${selectedKind ?? "null"} subtype=${selectedSubtype ?? "null"})`,
			);
			this.clearGhostSprite();
			this.ghost.visible = false;
			return;
		}

		const aspect = selectedKind === "signal" ? selectedAspect : undefined;
		if (
			selectedSubtype === this.ghostSubtype &&
			aspect === this.ghostAspect &&
			this.ghostSprite
		) {
			debugLog(
				"placement",
				`refreshGhost — unchanged (subtype=${selectedSubtype} aspect=${aspect})`,
			);
			return;
		}

		const texture = this.textures.get(selectedSubtype, aspect);
		if (!texture) {
			debugLog(
				"placement",
				`refreshGhost — no texture for "${selectedSubtype}" aspect=${aspect} (not preloaded yet)`,
			);
			return;
		}

		debugLog(
			"placement",
			`refreshGhost — building sprite for "${selectedSubtype}" aspect=${aspect}`,
		);
		this.clearGhostSprite();
		const sprite = makeTrackSprite(texture, 0, 0);
		this.ghost.addChild(sprite);
		this.ghostSprite = sprite;
		this.ghostSubtype = selectedSubtype;
		this.ghostAspect = aspect;
	}

	private clearGhostSprite(): void {
		if (this.ghostSprite) {
			this.ghost.removeChild(this.ghostSprite);
			this.ghostSprite.destroy();
			this.ghostSprite = null;
		}
		this.ghostSubtype = null;
		this.ghostAspect = undefined;
	}
}
