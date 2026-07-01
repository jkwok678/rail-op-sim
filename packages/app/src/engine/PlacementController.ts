import {
	createTrackData,
	ElementAlreadyExistsError,
	Map as Map_,
	type ParapetType,
	Platform,
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
import type { TextLayer } from "#/renderer/layers/TextLayer";
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

		this.unsubStore = useEditorStore.subscribe((state, prevState) => {
			if (
				state.tool === prevState.tool &&
				state.selectedSubtype === prevState.selectedSubtype &&
				state.selectedAspect === prevState.selectedAspect
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
		if (e.button !== 0) return;
		debugLog("placement", `pointerdown at (${e.clientX}, ${e.clientY})`);
		this.downPos = { x: e.clientX, y: e.clientY };
		this.downRect = this.app.canvas.getBoundingClientRect();
		this.downWasPanning = this.viewport.isPanning;
	};

	private onPointerUp = (e: PointerEvent): void => {
		if (e.button !== 0) return;

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

		// Text uses free pixel placement — no grid snapping.
		if (tool === "add" && selectedKind === "text" && selectedSubtype) {
			const wp = this.screenToWorld(e.clientX, e.clientY);
			if (wp) {
				useEditorStore.getState().setPendingTextLocation({ x: wp.x, y: wp.y });
				debugLog(
					"placement",
					`text click → world(${wp.x.toFixed(1)},${wp.y.toFixed(1)}) — opening dialog`,
				);
			}
			return;
		}

		// Name tool — click an element to open the naming dialog.
		if (tool === "name") {
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (!cell) return;

			// Priority order: NamedLocation > Concourse > bridgeUnderpass > platform track
			const nl = this.map.getNamedLocationAt(cell.gx, cell.gy);
			if (nl) {
				useEditorStore
					.getState()
					.setPendingNameTarget({ gx: cell.gx, gy: cell.gy, kind: "namedLocation" });
				debugLog(
					"placement",
					`name click → NamedLocation at (${cell.gx},${cell.gy}) — opening dialog`,
				);
				return;
			}

			const concourse = this.map.getConcourseAt(cell.gx, cell.gy);
			if (concourse) {
				useEditorStore
					.getState()
					.setPendingNameTarget({ gx: cell.gx, gy: cell.gy, kind: "concourse" });
				debugLog(
					"placement",
					`name click → Concourse at (${cell.gx},${cell.gy}) — opening dialog`,
				);
				return;
			}

			const track = this.map.getTrackAt(cell.gx, cell.gy);
			if (track) {
				if (track.data.kind === "bridgeUnderpass") {
					useEditorStore
						.getState()
						.setPendingNameTarget({ gx: cell.gx, gy: cell.gy, kind: "bridgeUnderpass" });
					debugLog(
						"placement",
						`name click → bridgeUnderpass at (${cell.gx},${cell.gy}) — opening dialog`,
					);
					return;
				}
				if (track.hasPlatform()) {
					useEditorStore
						.getState()
						.setPendingNameTarget({ gx: cell.gx, gy: cell.gy, kind: "platform" });
					debugLog(
						"placement",
						`name click → platform track at (${cell.gx},${cell.gy}) — opening dialog`,
					);
					return;
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
			} else {
				// ── Element placement ──
				this.handleElementPlacement(
					selectedKind as ElementKind,
					selectedSubtype,
					cell.gx,
					cell.gy,
				);
			}
		} else if (tool === "delete") {
			const deleted = this.map.deleteElement(cell.gx, cell.gy);
			debugLog(
				"placement",
				`deleteElement at (${cell.gx},${cell.gy}) — ${deleted ? "removed" : "nothing there"}`,
			);
			if (deleted) {
				this.trackLayer.removeCell(cell.gx, cell.gy);
				this.elementLayer.sync(this.map);
				this.textLayer.sync(this.map);
			}
		}
	};

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
				// Text is handled via early return in onPointerUp (free pixel placement).
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
	placeText(wx: number, wy: number, content: string): void {
		const gx = wx / CELL_SIZE;
		const gy = -wy / CELL_SIZE;
		this.map.createAddText(gx, gy, content, {
			family: "JetBrains Mono",
			pointSize: 12,
		});
		this.textLayer.sync(this.map);
		debugLog(
			"placement",
			`placeText "${content}" at world(${wx.toFixed(1)},${wy.toFixed(1)}) grid(${gx.toFixed(2)},${gy.toFixed(2)})`,
		);
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

	private onPointerMove = (e: PointerEvent): void => {
		const { tool, selectedSubtype } = useEditorStore.getState();
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
	};

	private onPointerCancel = (): void => {
		debugLog("placement", "pointercancel — clearing state");
		this.downPos = null;
		this.downRect = null;
		this.ghost.visible = false;
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
		else if (tool === "delete") cursor = "pointer";
		else if (tool === "name") cursor = "text";
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

		if (tool !== "add" || !selectedSubtype || selectedKind === "text") {
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
