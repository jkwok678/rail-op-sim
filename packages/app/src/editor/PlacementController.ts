import {
	beginRecording,
	clearPreferredDirectionsAlongPath,
	createTrackData,
	deserializeMap,
	ElementAlreadyExistsError,
	endRecording,
	type FontInfo,
	findPathBetween,
	getConnectivityReport,
	kindToPhrase,
	Map as Map_,
	type ParapetType,
	Platform,
	redoEntries,
	type SerializedMap,
	serializeMap,
	setPreferredDirectionsAlongPath,
	type Text,
	type Track,
	undoEntries,
} from "@rail-op-sim/shared";
import {
	type Application,
	Container,
	type Sprite as SpriteType,
} from "pixi.js";
import { EditHistory, type RefreshFlags } from "#/editor/EditHistory";
import type { ViewportController } from "#/editor/ViewportController";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE, gridToWorld, worldToGrid } from "#/lib/grid";
import { applyOperateIntent } from "#/lib/operateActions";
import { resolveOperateClick } from "#/lib/operateInput";
import { buildHoveredTrackInfo } from "#/lib/trackInfo";
import { buildHoveredTrainInfo, findTrainAt } from "#/lib/trainInfo";
import type { DirectionLayer } from "#/renderer/layers/DirectionLayer";
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
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";
import { useTimetableStore } from "#/store/timetable-store";

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
	directionLayer: DirectionLayer;
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

/** Undo labels for the non-track elements the Add palette can place. */
const ELEMENT_LABELS: Record<ElementKind, string> = {
	namedLocation: "Add named location",
	concourse: "Add concourse",
	parapet: "Add parapet",
	platform: "Add platform",
	levelCrossing: "Add level crossing",
};

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
	/** Undo/redo over the document, as recorded journal deltas. */
	private readonly history = new EditHistory();
	/** Container holding the ghost sprite; the host adds this to the world. */
	readonly ghost = new Container();

	private readonly app: Application;
	private readonly world: Container;
	private readonly trackLayer: TrackLayer;
	private readonly elementLayer: ElementLayer;
	private readonly textLayer: TextLayer;
	private readonly linkHighlightLayer: LinkHighlightLayer;
	private readonly trackColorLayer: TrackColorLayer;
	private readonly directionLayer: DirectionLayer;
	private readonly textures: TextureCache;
	/**
	 * Public so React can reach the viewport through {@link instance}, the same
	 * seam the dialogs use to reach the map — rather than a second singleton on
	 * ViewportController, or prop-drilling the ref out of usePixiApp.
	 */
	readonly viewport: ViewportController;

	private ghostSprite: SpriteType | null = null;
	private ghostSubtype: string | null = null;
	private ghostAspect: number | undefined = undefined;

	private downPos: { x: number; y: number } | null = null;
	private downWasPanning = false;

	/** Cell key of the last direction-tool route preview (avoids re-running BFS per pointermove). */
	private directionHoverKey: string | null = null;

	/** Cell key of the last section-tool route preview (same BFS guard). */
	private sectionHoverKey: string | null = null;

	/** Cell key of the last link-tool pairing preview. */
	private linkHoverKey: string | null = null;

	/** Cached `getBoundingClientRect` from the last pointerdown (avoids forced layout per pointermove). */
	private downRect: DOMRect | null = null;
	/**
	 * In-progress text drag: the grabbed Text plus the world-space offset from
	 * its anchor to the pointer, so the text keeps its grab point under the
	 * cursor. Only the rendered sprite follows the pointer — the model is written
	 * once on release, so every cancel path is just a re-sync.
	 */
	private textDrag: {
		text: Text;
		offsetX: number;
		offsetY: number;
	} | null = null;

	private abort?: AbortController;
	private unsubStore?: () => void;
	private unsubOperate?: () => void;
	private unsubMode?: () => void;
	private lastPointer: { clientX: number; clientY: number } | null = null;

	constructor(opts: PlacementControllerOptions) {
		this.app = opts.app;
		this.world = opts.world;
		this.trackLayer = opts.trackLayer;
		this.elementLayer = opts.elementLayer;
		this.textLayer = opts.textLayer;
		this.linkHighlightLayer = opts.linkHighlightLayer;
		this.trackColorLayer = opts.trackColorLayer;
		this.directionLayer = opts.directionLayer;
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
		this.publishHistoryState();
	}

	/**
	 * Recompute the track connectivity summary and push it to the editor store as
	 * plain data. This is the single place that reads pixi/map connectivity for
	 * the UI, keeping browser-only code out of React components (and the SSR
	 * module graph).
	 */
	private publishTrackStatus(): void {
		const report = getConnectivityReport(this.map);
		const connected = report.connected;

		// Point the user at the first thing that is wrong: a dangling link if
		// there is one, otherwise an unpaired portal, unnamed element, or
		// undirected track.
		const offender =
			report.dangling[0]?.track ??
			report.unpairedLinked[0] ??
			report.unnamed[0] ??
			report.undirected[0] ??
			report.brokenRoutes[0]?.track ??
			null;

		useEditorStore.getState().setTrackStatus({
			total: report.total,
			connected,
			complete: report.complete,
			dangling: report.dangling.length,
			unpairedLinked: report.unpairedLinked.length,
			unnamed: report.unnamed.length,
			undirected: report.undirected.length,
			brokenRoutes: report.brokenRoutes.length,
			firstIssue: offender
				? { gx: offender.getLocationX(), gy: offender.getLocationY() }
				: null,
		});

		// The direction tool requires physically joined track; if the map just
		// became disconnected (e.g. a track deleted, or a load), drop back to
		// the select tool. Names and preferred directions are not this gate.
		if (!connected && useEditorStore.getState().tool === "direction") {
			useEditorStore.getState().setTool("select");
		}

		// The timetable is validated against this map, so a map edit can
		// invalidate it — renaming a platform orphans every service booked to
		// it. Re-checking here, where every mutation already lands, is what
		// keeps the editor's issue list honest about a railway that moved
		// underneath it.
		useTimetableStore.getState().revalidate(this.map);
	}

	/** Push the undo/redo summary to the store for the toolbar to render. */
	private publishHistoryState(): void {
		useEditorStore.getState().setHistoryState(this.history.getState());
	}

	/**
	 * Run `fn` as one undoable step.
	 *
	 * Records the primitive mutations it causes and pushes a command only if it
	 * actually changed something. That single rule is what keeps the silently
	 * refused edits off the stack — a platform on a side the track cannot take,
	 * the first click of a portal pairing, a speed re-applied unchanged — without
	 * every call site having to test for its own particular kind of no-op.
	 *
	 * The window closes in a `finally` because addTrack throws on a real
	 * conflict, and a window left open would swallow the next edit.
	 */
	private commit<T>(label: string, refresh: RefreshFlags, fn: () => T): T {
		beginRecording();
		try {
			return fn();
		} finally {
			const entries = endRecording();
			if (entries.length > 0) {
				this.history.push({ label, entries, refresh });
				this.publishHistoryState();
			}
		}
	}

	/** Re-sync the layers a command touched, after an undo or a redo. */
	private applyRefresh(refresh: RefreshFlags): void {
		if (refresh.track) this.trackLayer.sync(this.map);
		if (refresh.element) this.elementLayer.sync(this.map);
		if (refresh.text) this.textLayer.sync(this.map);
		if (refresh.linkHighlight) {
			this.linkHighlightLayer.sync(this.map);
			this.linkHighlightLayer.syncSelection(this.map);
		}
		if (refresh.trackColor) this.trackColorLayer.sync(this.map);
		if (refresh.direction) this.directionLayer.sync(this.map);
		if (refresh.status) this.publishTrackStatus();
	}

	/**
	 * Drop any half-made gesture and hover preview. Both describe a topology that
	 * the edit being undone or redone is about to change underneath them, and a
	 * pending direction start may name a track that is about to disappear.
	 */
	private resetPreviewsForHistory(): void {
		this.directionHoverKey = null;
		this.sectionHoverKey = null;
		this.linkHoverKey = null;
		this.directionLayer.setSelection(null);
		useEditorStore.getState().setDirectionStart(null);
	}

	// ── Undo / redo ─────────────────────────────────────────────────

	/** Step the document back one edit. No-op when there is nothing to undo. */
	undo(): void {
		const command = this.history.undo();
		if (!command) return;
		this.resetPreviewsForHistory();
		undoEntries(this.map, command.entries);
		this.applyRefresh(command.refresh);
		this.publishHistoryState();
		debugLog("placement", `undo — ${command.label}`);
	}

	/** Re-apply the edit the last undo reversed. No-op when there is no redo. */
	redo(): void {
		const command = this.history.redo();
		if (!command) return;
		this.resetPreviewsForHistory();
		redoEntries(this.map, command.entries);
		this.applyRefresh(command.refresh);
		this.publishHistoryState();
		debugLog("placement", `redo — ${command.label}`);
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
			const directionsChanged =
				state.showDirections !== prevState.showDirections;

			// Toggle: show/hide paired+unpaired highlights
			if (highlightsChanged) {
				if (state.showLinkHighlights) {
					this.linkHighlightLayer.sync(this.map);
					this.linkHighlightLayer.container.visible = true;
				} else if (state.tool !== "link") {
					this.linkHighlightLayer.container.visible = false;
				}
			}

			// Toggle: show/hide preferred-direction arrows (kept visible while the
			// direction tool is active regardless of the toggle).
			if (directionsChanged) {
				if (state.showDirections) {
					this.directionLayer.sync(this.map);
					this.directionLayer.container.visible = true;
				} else if (state.tool !== "direction") {
					this.directionLayer.container.visible = false;
				}
			}

			// The pending direction start can also be cleared without a tool change —
			// re-clicking the active direction tool resets it in the store — so mirror
			// the store rather than relying on the click handler alone.
			if (state.directionStart !== prevState.directionStart && !toolChanged) {
				this.directionLayer.setSelection(
					state.directionStart,
					state.directionMode === "erase",
				);
				this.directionHoverKey = null;
			}

			// Flipping set/erase recolours the gesture even when the pending start
			// is already null (so the branch above does not fire).
			if (state.directionMode !== prevState.directionMode) {
				this.directionLayer.setSelection(
					state.directionStart,
					state.directionMode === "erase",
				);
				this.directionHoverKey = null;
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
					this.clearLinkPreview();
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
					this.trackColorLayer.show(this.map);
				}

				// Leaving section tool — clear section highlight & hide colour overlay
				if (prevState.tool === "section" && state.tool !== "section") {
					this.sectionHoverKey = null;
					this.linkHighlightLayer.clearSectionHighlight();
					this.trackColorLayer.hide();
					if (!state.showLinkHighlights) {
						this.linkHighlightLayer.container.visible = false;
					}
				}

				// Entering direction tool — show the arrow overlay for all tracks.
				if (state.tool === "direction" && prevState.tool !== "direction") {
					this.directionLayer.sync(this.map);
					this.directionLayer.container.visible = true;
				}

				// Leaving direction tool — clear the pending start highlight, and
				// hide the overlay unless the user pinned it visible.
				if (prevState.tool === "direction" && state.tool !== "direction") {
					this.directionLayer.setSelection(null);
					this.directionHoverKey = null;
					if (!state.showDirections) {
						this.directionLayer.container.visible = false;
					}
				}
			}

			if (
				(state.showTrackInfo !== prevState.showTrackInfo ||
					state.showTrainInfo !== prevState.showTrainInfo ||
					state.showTrainTimetable !== prevState.showTrainTimetable) &&
				this.lastPointer
			) {
				this.updateHoverTooltips(
					this.lastPointer.clientX,
					this.lastPointer.clientY,
				);
			}

			if (
				!toolChanged &&
				state.selectedSubtype === prevState.selectedSubtype &&
				state.selectedAspect === prevState.selectedAspect &&
				!highlightsChanged
			)
				return;

			this.applyCursor();
			this.refreshGhostSprite();
		});

		this.unsubOperate = useOperateStore.subscribe((state, prevState) => {
			const { showTrainInfo, showTrainTimetable } = useEditorStore.getState();
			if (
				state.view !== prevState.view &&
				this.lastPointer &&
				(showTrainInfo || showTrainTimetable)
			) {
				this.updateHoverTooltips(
					this.lastPointer.clientX,
					this.lastPointer.clientY,
				);
			}
		});

		this.unsubMode = useModeStore.subscribe((state, prevState) => {
			if (state.mode !== prevState.mode && state.mode !== "operate") {
				useEditorStore.getState().setHoveredTrainInfo(null);
			}
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
		this.unsubOperate?.();
		this.unsubMode?.();
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
		this.downPos = { x: e.clientX, y: e.clientY };
		this.downRect = this.app.canvas.getBoundingClientRect();
		this.downWasPanning = this.viewport.isPanning;

		// Text tool: pressing on an existing text arms a drag-to-move. A release
		// that never passes the drag threshold still opens the edit dialog.
		this.textDrag = null;
		if (
			e.button === 0 &&
			!this.downWasPanning &&
			useEditorStore.getState().tool === "text"
		) {
			const wp = this.screenToWorld(e.clientX, e.clientY);
			const hit = wp ? this.textLayer.hitTest(wp.x, wp.y) : null;
			if (wp && hit) {
				const anchor = gridToWorld(hit.getLocationX(), hit.getLocationY());
				this.textDrag = {
					text: hit,
					offsetX: wp.x - anchor.x,
					offsetY: wp.y - anchor.y,
				};
				debugLog(
					"placement",
					`text drag armed at grid(${hit.getLocationX()},${hit.getLocationY()})`,
				);
			}
		}
	};

	/**
	 * Handle a click that never reaches the railway tools, and say whether it
	 * was one: a right-click, a click the timetable editor borrowed, or any
	 * click outside railway mode.
	 */
	private claimClick(e: PointerEvent): boolean {
		// Operate mode: every click works the signalling, never the map.
		if (useModeStore.getState().mode === "operate") {
			this.handleOperateClick(e);
			return true;
		}

		// Outside railway mode the map is a read-only backdrop. Entering another
		// mode already puts the tool back to Select, which edits nothing — this
		// is the backstop, so no path that leaves a tool armed can reach the map.
		const mapEditable = useModeStore.getState().mode === "railway";

		// Right-click is the delete gesture (Add + Text tools).
		if (e.button === 2) {
			if (mapEditable) this.handleRightClick(e);
			return true;
		}

		// The timetable editor can borrow one click to fill a cell field
		// ("pick on map"). It takes priority over every tool, since the user
		// asked for this click specifically — and it deliberately does not need
		// a tool of its own, so the map stays on whatever tool it was using.
		const pendingCellPick = useTimetableStore.getState().pendingCellPick;
		if (pendingCellPick) {
			this.completeCellPick(e, pendingCellPick.field);
			return true;
		}

		return !mapEditable;
	}

	/** Set or cancel a route, throw points, or open a train menu in operate mode. */
	private handleOperateClick(e: PointerEvent): void {
		const cell = this.screenToGrid(e.clientX, e.clientY);
		if (!cell) return;
		const step = this.map.getImageSize();
		const track = this.map.getTrackAt(cell.gx * step, cell.gy * step);
		const operate = useOperateStore.getState();
		const train = findTrainAt(operate.view?.trains ?? [], cell.gx, cell.gy);
		const intent = resolveOperateClick(operate, {
			button: e.button === 2 ? "right" : "left",
			cell,
			onPoints: track?.data.kind === "switch",
			trainId: train?.id ?? null,
			screenX: e.clientX,
			screenY: e.clientY,
		});
		debugLog("placement", `operate click → ${intent.type}`);
		void applyOperateIntent(intent);
	}

	/** Fill the timetable's pending cell field from where the click landed. */
	private completeCellPick(e: PointerEvent, field: string): void {
		const cell = this.screenToGrid(e.clientX, e.clientY);
		if (cell) {
			useTimetableStore.getState().completeCellPick(cell, this.map);
			debugLog(
				"placement",
				`cell pick → (${cell.gx},${cell.gy}) into ${field}`,
			);
		} else {
			// Off-grid: abandon the pick rather than leave the canvas armed.
			useTimetableStore.getState().cancelCellPick();
			debugLog("placement", "cell pick → off grid, cancelled");
		}
	}

	private onPointerUp = (e: PointerEvent): void => {
		if (e.button !== 0 && e.button !== 2) return;

		const down = this.downPos;
		const drag = this.textDrag;
		// Resolve the release point while downRect still describes this gesture.
		const dragTo = drag ? this.screenToWorld(e.clientX, e.clientY) : null;
		this.downPos = null;
		this.downRect = null;
		this.textDrag = null;

		const { tool, selectedKind, selectedSubtype } = useEditorStore.getState();

		if (this.downWasPanning || this.viewport.isPanning) {
			debugLog("placement", "pointerup ignored — was panning");
			if (drag) this.textLayer.sync(this.map);
			return;
		}
		if (!down) {
			debugLog(
				"placement",
				"pointerup ignored — no matching pointerdown on canvas",
			);
			if (drag) this.textLayer.sync(this.map);
			return;
		}
		const dx = e.clientX - down.x;
		const dy = e.clientY - down.y;

		// A text drag past the threshold commits the move and swallows the click.
		// Below it the text never really moved, so fall through to the click
		// handling that opens the edit dialog.
		if (drag) {
			if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
				if (dragTo)
					this.moveTextTo(
						drag.text,
						dragTo.x - drag.offsetX,
						dragTo.y - drag.offsetY,
					);
				else this.textLayer.sync(this.map);
				return;
			}
			// Drop any sub-threshold preview drift.
			this.textLayer.sync(this.map);
		}

		if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
			debugLog(
				"placement",
				`pointerup ignored — drag distance (${dx.toFixed(1)}, ${dy.toFixed(1)}) > threshold`,
			);
			return;
		}

		if (this.claimClick(e)) return;

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
			this.commit(
				"Link portals",
				{ track: true, linkHighlight: true, status: true },
				() => {
					this.map.connectTwoLinkedTracks(cell.gx, cell.gy);
				},
			);
			this.publishTrackStatus();
			this.trackLayer.sync(this.map);
			// Always keep highlight data fresh; visibility controls display
			this.linkHighlightLayer.sync(this.map);
			this.linkHighlightLayer.syncSelection(this.map);
			// The click either took the first pick or completed the pairing, so
			// whatever was being previewed no longer describes the next click.
			this.clearLinkPreview();
			debugLog("placement", `link click → grid(${cell.gx},${cell.gy})`);
			return;
		}

		// Section tool — two-click path selection
		if (tool === "section") {
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (!cell) {
				useEditorStore.getState().clearSectionSelection();
				this.clearSectionPreview();
				this.linkHighlightLayer.clearSectionHighlight();
				this.trackColorLayer.hide();
				return;
			}

			const track = this.map.getTrackAt(cell.gx, cell.gy);
			if (!track) {
				// Clicked empty space — clear selection
				useEditorStore.getState().clearSectionSelection();
				this.clearSectionPreview();
				this.linkHighlightLayer.clearSectionHighlight();
				this.trackColorLayer.hide();
				debugLog("placement", "section click → empty cell, cleared");
				return;
			}

			const { sectionStart } = useEditorStore.getState();
			if (!sectionStart) {
				// First click — set start
				useEditorStore.getState().setSectionStart({ gx: cell.gx, gy: cell.gy });
				this.sectionHoverKey = null;
				// Outline the pending start so the first click has feedback too.
				this.linkHighlightLayer.highlightSection(this.map, [], cell, null);
				this.linkHighlightLayer.container.visible = true;
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
					this.clearSectionPreview();
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
					this.linkHighlightLayer.highlightSection(
						this.map,
						coords,
						sectionStart,
						{ gx: cell.gx, gy: cell.gy },
					);
					this.linkHighlightLayer.container.visible = true;
					this.trackColorLayer.show(this.map);
					this.sectionHoverKey = null;
					debugLog(
						"placement",
						`section click → end at (${cell.gx},${cell.gy}), path length=${coords.length}`,
					);
				} else {
					// No path — clear and let user retry
					useEditorStore.getState().clearSectionSelection();
					this.clearSectionPreview();
					this.linkHighlightLayer.clearSectionHighlight();
					this.trackColorLayer.hide();
					debugLog("placement", "section click → no path found, cleared");
				}
			}
			return;
		}

		// Direction tool — two-click preferred-direction assignment, or removal
		// of the same legs when the tool is in erase mode.
		if (tool === "direction") {
			const erasing = useEditorStore.getState().directionMode === "erase";
			// Gated on physically joined track; the toolbar disables the tool
			// otherwise, but guard here too in case the map changed mid-gesture.
			if (!useEditorStore.getState().trackStatus?.connected) {
				debugLog("placement", "direction click ignored — railway not joined");
				return;
			}

			const cell = this.screenToGrid(e.clientX, e.clientY);
			const track = cell ? this.map.getTrackAt(cell.gx, cell.gy) : null;
			if (!cell || !track) {
				useEditorStore.getState().setDirectionStart(null);
				this.directionLayer.setSelection(null, erasing);
				this.directionHoverKey = null;
				debugLog("placement", "direction click → empty cell, cleared");
				return;
			}

			const { directionStart } = useEditorStore.getState();
			if (!directionStart) {
				// First click — set start.
				useEditorStore.getState().setDirectionStart(cell);
				this.directionLayer.setSelection(cell, erasing);
				this.directionHoverKey = null;
				debugLog(
					"placement",
					`direction ${erasing ? "erase" : "set"} click → start at (${cell.gx},${cell.gy})`,
				);
				return;
			}

			if (directionStart.gx === cell.gx && directionStart.gy === cell.gy) {
				// Clicked the start again — cancel.
				useEditorStore.getState().setDirectionStart(null);
				this.directionLayer.setSelection(null, erasing);
				this.directionHoverKey = null;
				debugLog("placement", "direction click → cancelled start");
				return;
			}

			const startTrack = this.map.getTrackAt(
				directionStart.gx,
				directionStart.gy,
			);
			if (!startTrack) {
				useEditorStore.getState().setDirectionStart(null);
				this.directionLayer.setSelection(null, erasing);
				this.directionHoverKey = null;
				debugLog("placement", "direction click → start track gone, cleared");
			} else if (erasing) {
				const result = this.commit(
					"Erase directions",
					{ direction: true, status: true },
					() => clearPreferredDirectionsAlongPath(this.map, startTrack, track),
				);
				if (result === null) {
					debugLog("placement", "direction erase click → no path found");
				} else if (result.removed === 0) {
					// Path exists but carried no directions either way round, so there
					// was nothing along it to undo.
					debugLog(
						"placement",
						`direction erase click → nothing to remove (path length=${result.path.length})`,
					);
				} else {
					this.directionLayer.sync(this.map);
					this.publishTrackStatus();
					debugLog(
						"placement",
						`direction erase click → removed ${result.removed} along path length=${result.path.length}`,
					);
				}
				useEditorStore.getState().setDirectionStart(null);
				this.directionLayer.setSelection(null, erasing);
				this.directionHoverKey = null;
			} else {
				const result = this.commit(
					"Set directions",
					{ direction: true, status: true },
					() => setPreferredDirectionsAlongPath(this.map, startTrack, track),
				);
				if (result === null) {
					debugLog("placement", "direction click → no path found");
				} else if (result.facingSwitchEndpoint) {
					// Nothing was written. Keep the start click so the next cell
					// past the switch can choose the branch.
					useEditorStore
						.getState()
						.setDirectionHint("Click past the switch to choose a branch");
					debugLog(
						"placement",
						`direction click → facing switch, kept start (path length=${result.path.length})`,
					);
					return;
				} else if (result.applied === 0) {
					// Path exists but nothing changed — every pair was already set, or
					// none could be determined.
					debugLog(
						"placement",
						`direction click → no directions applied (path length=${result.path.length})`,
					);
				} else {
					this.directionLayer.sync(this.map);
					this.publishTrackStatus();
					debugLog(
						"placement",
						`direction click → assigned ${result.applied} along path length=${result.path.length}`,
					);
				}
				useEditorStore.getState().setDirectionStart(null);
				this.directionLayer.setSelection(null, erasing);
				this.directionHoverKey = null;
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
					this.commit(
						`Add ${kindToPhrase(selectedKind)}`,
						{
							track: true,
							linkHighlight: true,
							trackColor: true,
							direction: true,
							status: true,
						},
						() => {
							this.map.addTrack(trackData, cell.gx, cell.gy);
						},
					);
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
				this.directionLayer.sync(this.map);
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

		// Direction tool: right-click clears all preferred directions on a track.
		if (tool === "direction") {
			const cell = this.screenToGrid(e.clientX, e.clientY);
			if (!cell) return;
			const track = this.map.getTrackAt(cell.gx, cell.gy);
			if (track?.hasPreferredDirection()) {
				this.commit(
					"Clear directions",
					{ direction: true, status: true },
					() => {
						track.clearPreferredDirections();
					},
				);
				this.directionLayer.sync(this.map);
				this.publishTrackStatus();
				debugLog(
					"placement",
					`right-click → clearPreferredDirections at (${cell.gx},${cell.gy})`,
				);
			}
			return;
		}

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
			if (
				this.commit("Remove level crossing", { element: true }, () =>
					this.map.removeLevelCrossing(cell.gx, cell.gy),
				)
			) {
				this.elementLayer.sync(this.map);
				debugLog(
					"placement",
					`right-click → removeLevelCrossing at (${cell.gx},${cell.gy})`,
				);
				return;
			}

			// 2) Platform next (may unlink shared text on non-bridge tracks).
			if (
				this.commit("Remove platform", { element: true, text: true }, () =>
					this.map.removePlatform(cell.gx, cell.gy),
				)
			) {
				this.elementLayer.sync(this.map);
				this.textLayer.sync(this.map);
				debugLog(
					"placement",
					`right-click → removePlatform at (${cell.gx},${cell.gy})`,
				);
				return;
			}

			// 3) Otherwise delete the whole element (track / NamedLocation /
			//    Concourse / Parapet) plus any text cascade. A named location on a
			//    track is deleted before the track under it.
			const deleted = this.commit(
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
				() => this.map.deleteElement(cell.gx, cell.gy),
			);
			debugLog(
				"placement",
				`right-click → deleteElement at (${cell.gx},${cell.gy}) — ${deleted ? "removed" : "nothing there"}`,
			);
			if (deleted) this.refreshAfterDelete(cell.gx, cell.gy);
		}
	}

	/** Bring every layer up to date after `deleteElement` removed something. */
	private refreshAfterDelete(gx: number, gy: number): void {
		// A named location riding on a track goes first; the track stays.
		if (!this.map.getTrackAt(gx, gy)) this.trackLayer.removeCell(gx, gy);
		this.elementLayer.sync(this.map);
		this.textLayer.sync(this.map);
		this.linkHighlightLayer.sync(this.map);
		this.trackColorLayer.sync(this.map);
		this.directionLayer.sync(this.map);
		this.publishTrackStatus();
	}

	/** Place a non-track element on the map and sync the element layer. */
	private handleElementPlacement(
		kind: ElementKind,
		subtype: string,
		gx: number,
		gy: number,
	): void {
		try {
			this.commit(ELEMENT_LABELS[kind], { element: true, text: true }, () => {
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
							debugLog(
								"placement",
								`addPlatform side=${side} at (${gx},${gy})`,
							);
						}
						break;
					}
					case "levelCrossing":
						this.map.addLevelCrossing(gx, gy);
						debugLog("placement", `addLevelCrossing at (${gx},${gy})`);
						break;
				}
			});
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
		this.commit("Add text", { text: true }, () => {
			this.map.createAddText(gx, gy, content, font);
		});
		this.textLayer.sync(this.map);
		debugLog(
			"placement",
			`placeText "${content}" at world(${wx.toFixed(1)},${wy.toFixed(1)}) grid(${gx.toFixed(2)},${gy.toFixed(2)})`,
		);
	}

	/**
	 * Move a Text to the given world position — the left edge and vertical centre
	 * of its rendered box, matching how the text layer anchors it. Fractional grid
	 * coords keep gridToWorld() round-tripping to the same pixel.
	 */
	moveTextTo(text: Text, wx: number, wy: number): void {
		const gx = wx / CELL_SIZE;
		const gy = -wy / CELL_SIZE;
		// moveText() also refreshes the editable bounds the model keeps alongside
		// the location, so go through the map rather than setLocationX/Y.
		this.commit("Move text", { text: true }, () => {
			this.map.setTextToMove(text);
			this.map.moveText(gx, gy);
			this.map.setTextToMove(null);
		});
		this.textLayer.sync(this.map);
		debugLog(
			"placement",
			`moveTextTo "${text.getReadableText()}" → grid(${gx.toFixed(2)},${gy.toFixed(2)})`,
		);
	}

	/** Abandon an in-progress text drag, restoring the rendered position. */
	private cancelTextDrag(): void {
		if (!this.textDrag) return;
		this.textDrag = null;
		this.textLayer.sync(this.map);
		debugLog("placement", "text drag cancelled");
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
		this.commit(
			trimmed === "" ? "Delete text" : "Edit text",
			{ text: true, element: true, track: true },
			() => {
				this.map.changeDeleteText(trimmed, trimmed !== "", text);
				// changeDeleteText deletes the text when trimmed is empty; only
				// restyle when it survived (non-empty content) and a font was given.
				if (trimmed !== "" && font) text.setFont(font);
			},
		);
		this.syncAfterTextChange();
		debugLog("placement", `updateTextAt (${tx},${ty}) → "${trimmed}"`);
	}

	/** Delete a Text and unlink it from every element that shared it. */
	deleteTextObject(text: Text): void {
		this.commit(
			"Delete text",
			{ text: true, element: true, track: true },
			() => {
				this.map.changeDeleteText("", false, text);
			},
		);
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

		this.commit(
			trimmed === "" ? "Remove name" : "Name element",
			{
				text: true,
				element: true,
				track: kind === "bridgeUnderpass",
			},
			() => {
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
			},
		);

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

	/** Apply a mutation to every track in the selected section and refresh layers. */
	private mutateSelectedSection(
		label: string,
		mutate: (track: Track) => void,
	): number {
		const { sectionTracks } = useEditorStore.getState();
		this.commit(label, { track: true, trackColor: true, status: true }, () => {
			for (const coord of sectionTracks) {
				const track = this.map.getTrackAt(coord.gx, coord.gy);
				if (track) mutate(track);
			}
		});
		this.trackLayer.sync(this.map);
		this.trackColorLayer.show(this.map);
		// Drop the purple route tint (keeping the endpoint outlines) so the
		// speed/length colours just applied are visible rather than covered.
		this.linkHighlightLayer.setSectionRouteVisible(false);
		this.publishTrackStatus();
		return sectionTracks.length;
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
		const count = this.mutateSelectedSection(
			"Change speed & length",
			(track) => {
				track.setTrackMainSpeed(values.mainSpeed);
				track.setTrackMainLength(values.mainLength);
				if (values.secondarySpeed !== undefined) {
					track.setTrackSecondarySpeed(values.secondarySpeed);
				}
				if (values.secondaryLength !== undefined) {
					track.setTrackSecondaryLength(values.secondaryLength);
				}
			},
		);
		debugLog("placement", `applySectionEdit — ${count} tracks updated`);
	}

	/** Clear the section highlight overlay (public for SectionEditPanel). */
	clearSectionHighlight(): void {
		this.linkHighlightLayer.clearSectionHighlight();
	}

	/** Restore defaults for all tracks in the selected section. */
	restoreSection(): void {
		const count = this.mutateSelectedSection(
			"Restore section defaults",
			(track) => {
				track.restoreDefaults();
			},
		);
		debugLog("placement", `restoreSection — ${count} tracks reset to defaults`);
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
		// Rebuild direction arrows from the loaded map and clear any pending start.
		this.directionLayer.sync(this.map);
		this.directionLayer.setSelection(null);
		this.directionHoverKey = null;
		this.sectionHoverKey = null;
		this.linkHoverKey = null;
		useEditorStore.getState().setDirectionStart(null);

		// Any prior section selection now points at removed tracks — clear it.
		useEditorStore.getState().clearSectionSelection();
		// Opening a file starts a new document. clearAll is not invertible from a
		// delta, and the steps that built the previous map are not reachable from
		// here, so they are dropped rather than left to undo into a map the user
		// never had on screen.
		this.history.clear();
		this.publishHistoryState();
		this.publishTrackStatus();
		debugLog(
			"placement",
			`loadFromData — ${this.map.getTotalTrack()} tracks restored`,
		);
	}

	/** Drop any direction-tool route preview (endpoint outline + blue legs). */
	private clearDirectionPreview(): void {
		if (this.directionHoverKey === null) return;
		this.directionHoverKey = null;
		this.directionLayer.setRoutePreview(this.map, null, null);
	}

	/**
	 * Preview the route the direction tool would assign: the hovered cell is
	 * outlined and, when a path exists, each leg the gesture would assign is
	 * stroked.
	 */
	private updateDirectionPreview(e: PointerEvent): void {
		const { directionStart } = useEditorStore.getState();
		if (!directionStart) {
			this.clearDirectionPreview();
			return;
		}

		const cell = this.screenToGrid(e.clientX, e.clientY);
		const end = cell ? this.map.getTrackAt(cell.gx, cell.gy) : null;
		// Hovering the start itself would cancel on click, so show no route.
		if (
			!cell ||
			!end ||
			(cell.gx === directionStart.gx && cell.gy === directionStart.gy)
		) {
			this.clearDirectionPreview();
			return;
		}

		const key = `${cell.gx},${cell.gy}`;
		if (key === this.directionHoverKey) return;
		this.directionHoverKey = key;

		const start = this.map.getTrackAt(directionStart.gx, directionStart.gy);
		const path = start
			? findPathBetween(this.map, start, end, { respectOneWay: true })
			: null;
		this.directionLayer.setRoutePreview(this.map, path, cell);
	}

	/** Drop any section-tool route preview (hovered outline + blue route). */
	private clearSectionPreview(): void {
		if (this.sectionHoverKey === null) return;
		this.sectionHoverKey = null;
		this.linkHighlightLayer.setSectionPreview(null, null);
	}

	/**
	 * Preview the run the section tool would select: the hovered cell is
	 * outlined and, when a path exists, the route to it is stroked. Mirrors
	 * {@link updateDirectionPreview} so the speed/length gesture shows the same
	 * thing before its second click as the direction gesture does.
	 */
	private updateSectionPreview(e: PointerEvent): void {
		const { sectionStart } = useEditorStore.getState();
		if (!sectionStart) {
			this.clearSectionPreview();
			return;
		}

		const cell = this.screenToGrid(e.clientX, e.clientY);
		const end = cell ? this.map.getTrackAt(cell.gx, cell.gy) : null;
		// Hovering the start itself would re-pick the same cell, so show no route.
		if (
			!cell ||
			!end ||
			(cell.gx === sectionStart.gx && cell.gy === sectionStart.gy)
		) {
			this.clearSectionPreview();
			return;
		}

		const key = `${cell.gx},${cell.gy}`;
		if (key === this.sectionHoverKey) return;
		this.sectionHoverKey = key;

		const start = this.map.getTrackAt(sectionStart.gx, sectionStart.gy);
		const path = start ? findPathBetween(this.map, start, end) : null;
		this.linkHighlightLayer.setSectionPreview(
			path
				? path.map((t) => ({ gx: t.getLocationX(), gy: t.getLocationY() }))
				: null,
			cell,
		);
	}

	/** Drop any link-tool pairing preview (hovered outline + dashed connector). */
	private clearLinkPreview(): void {
		if (this.linkHoverKey === null) return;
		this.linkHoverKey = null;
		this.linkHighlightLayer.setLinkPreview(this.map, null);
	}

	/**
	 * Preview the pairing the link tool would make: once a portal is picked,
	 * the hovered cell is outlined amber when it can pair with it and red when
	 * it cannot, with a dashed connector showing the link that would be made.
	 */
	private updateLinkPreview(e: PointerEvent): void {
		if (!this.map.getLinkedTrack1()) {
			this.clearLinkPreview();
			return;
		}

		const cell = this.screenToGrid(e.clientX, e.clientY);
		if (!cell) {
			this.clearLinkPreview();
			return;
		}

		const key = `${cell.gx},${cell.gy}`;
		if (key === this.linkHoverKey) return;
		this.linkHoverKey = key;
		this.linkHighlightLayer.setLinkPreview(this.map, cell);
	}

	private onPointerMove = (e: PointerEvent): void => {
		// A text drag owns the pointer: drive the rendered text and skip the hover
		// previews below. The model stays untouched until the release.
		if (this.textDrag) {
			const wp = this.screenToWorld(e.clientX, e.clientY);
			if (wp)
				this.textLayer.moveTo(
					this.textDrag.text,
					wp.x - this.textDrag.offsetX,
					wp.y - this.textDrag.offsetY,
				);
			// This branch skips the info hover below, so a tooltip opened before
			// the drag would otherwise hang frozen until the release.
			useEditorStore.getState().setHoveredTrackInfo(null);
			useEditorStore.getState().setHoveredTrainInfo(null);
			return;
		}

		const { tool, selectedSubtype } = useEditorStore.getState();

		// Text tool: hovering a placed text advertises the drag-to-move gesture.
		if (tool === "text") {
			const wp = this.screenToWorld(e.clientX, e.clientY);
			this.app.canvas.style.cursor =
				wp && this.textLayer.hitTest(wp.x, wp.y) ? "move" : "text";
		}

		// Each two-click gesture previews what its second click would do. Only
		// the active tool's preview runs; the other two are cleared, so a tool
		// switch mid-gesture cannot leave a stale route on screen.
		if (tool === "direction") this.updateDirectionPreview(e);
		else this.clearDirectionPreview();

		if (tool === "section") this.updateSectionPreview(e);
		else this.clearSectionPreview();

		if (tool === "link") this.updateLinkPreview(e);
		else this.clearLinkPreview();

		// Track/train-info hover: independent of the ghost/add logic below, so it
		// works with any tool (e.g. select tool inspecting track, or operate mode).
		this.lastPointer = { clientX: e.clientX, clientY: e.clientY };
		this.updateHoverTooltips(e.clientX, e.clientY);

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

	private findHoveredTrain(hoverCell: { gx: number; gy: number } | null) {
		if (!hoverCell || useModeStore.getState().mode !== "operate") return null;
		const trains = useOperateStore.getState().view?.trains ?? [];
		return findTrainAt(trains, hoverCell.gx, hoverCell.gy);
	}

	private updateTrainHoverTooltip(
		train: ReturnType<typeof findTrainAt>,
		clientX: number,
		clientY: number,
		showTrainInfo: boolean,
		showTrainTimetable: boolean,
	): void {
		const info = train
			? buildHoveredTrainInfo(train, clientX, clientY, {
					showBasic: showTrainInfo,
					showTimetable: showTrainTimetable,
					timetableRows: useOperateStore.getState().timetables[train.id],
				})
			: null;
		useEditorStore.getState().setHoveredTrainInfo(info);
	}

	private updateTrackHoverTooltip(
		hoverCell: { gx: number; gy: number } | null,
		blockedByTrain: boolean,
		clientX: number,
		clientY: number,
	): void {
		const track =
			!blockedByTrain && hoverCell
				? this.map.getTrackAt(hoverCell.gx, hoverCell.gy)
				: null;
		const info =
			track && hoverCell
				? buildHoveredTrackInfo(
						track,
						hoverCell.gx,
						hoverCell.gy,
						clientX,
						clientY,
					)
				: null;
		useEditorStore.getState().setHoveredTrackInfo(info);
	}

	private updateHoverTooltips(clientX: number, clientY: number): void {
		const { showTrackInfo, showTrainInfo, showTrainTimetable } =
			useEditorStore.getState();
		const wantTrainHover = showTrainInfo || showTrainTimetable;
		if (!showTrackInfo && !wantTrainHover) return;

		const hoverCell = this.screenToGrid(clientX, clientY);
		const train = wantTrainHover ? this.findHoveredTrain(hoverCell) : null;
		if (wantTrainHover) {
			this.updateTrainHoverTooltip(
				train,
				clientX,
				clientY,
				showTrainInfo,
				showTrainTimetable,
			);
		}
		if (showTrackInfo) {
			this.updateTrackHoverTooltip(hoverCell, train !== null, clientX, clientY);
		}
	}

	private onPointerLeave = (): void => {
		this.lastPointer = null;
		this.cancelTextDrag();
		this.ghost.visible = false;
		this.clearDirectionPreview();
		this.clearSectionPreview();
		this.clearLinkPreview();
		useEditorStore.getState().setHoveredTrackInfo(null);
		useEditorStore.getState().setHoveredTrainInfo(null);
	};

	private onPointerCancel = (): void => {
		debugLog("placement", "pointercancel — clearing state");
		this.lastPointer = null;
		this.cancelTextDrag();
		this.downPos = null;
		this.downRect = null;
		this.ghost.visible = false;
		this.clearDirectionPreview();
		this.clearSectionPreview();
		this.clearLinkPreview();
		useEditorStore.getState().setHoveredTrackInfo(null);
		useEditorStore.getState().setHoveredTrainInfo(null);
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
		else if (tool === "direction") cursor = "pointer";
		canvas.style.cursor = cursor;
	}

	/** Rebuild the ghost sprite to match the current subtype and aspect, or hide it. */
	private refreshGhostSprite(): void {
		const { tool, selectedSubtype, selectedKind, selectedAspect } =
			useEditorStore.getState();

		if (tool !== "add" || !selectedSubtype) {
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
