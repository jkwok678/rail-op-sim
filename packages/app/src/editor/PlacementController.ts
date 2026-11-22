import {
	beginRecording,
	deserializeMap,
	endRecording,
	type FontInfo,
	getConnectivityReport,
	Map as Map_,
	redoEntries,
	type SerializedMap,
	serializeMap,
	type Text,
	undoEntries,
} from "@rail-op-sim/shared";
import { type Application, Container } from "pixi.js";
import { EditHistory, type RefreshFlags } from "#/editor/EditHistory";
import { AddTool } from "#/editor/tools/AddTool";
import { CellPickTool } from "#/editor/tools/CellPickTool";
import { DirectionTool } from "#/editor/tools/DirectionTool";
import { LinkTool } from "#/editor/tools/LinkTool";
import { OperateTool } from "#/editor/tools/OperateTool";
import { type SectionEdit, SectionTool } from "#/editor/tools/SectionTool";
import { SelectTool } from "#/editor/tools/SelectTool";
import { TextTool } from "#/editor/tools/TextTool";
import type {
	Tool,
	ToolContext,
	ToolId,
	ToolLayers,
	ToolPointer,
	ToolStores,
} from "#/editor/tools/Tool";
import type { ViewportController } from "#/editor/ViewportController";
import { debugLog } from "#/lib/debugLogger";
import { worldToGrid } from "#/lib/grid";
import { buildHoveredTrackInfo } from "#/lib/trackInfo";
import { buildHoveredTrainInfo, findTrainAt } from "#/lib/trainInfo";
import type { DirectionLayer } from "#/renderer/layers/DirectionLayer";
import type { ElementLayer } from "#/renderer/layers/ElementLayer";
import type { LinkHighlightLayer } from "#/renderer/layers/LinkHighlightLayer";
import type { TextLayer } from "#/renderer/layers/TextLayer";
import type { TrackColorLayer } from "#/renderer/layers/TrackColorLayer";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";
import type { TextureCache } from "#/renderer/textureCache";
import {
	type EditorState,
	type NameableKind,
	useEditorStore,
} from "#/store/editor-store";
import { type AppMode, type ModeState, useModeStore } from "#/store/mode-store";
import { type OperateState, useOperateStore } from "#/store/operate-store";
import { useTimetableStore } from "#/store/timetable-store";

/** Pointer travel (CSS px) above which a release counts as a drag, not a click. */
const DRAG_THRESHOLD = 3;

/** A store as the controller uses it: read, and subscribe to changes. */
interface SubscribableStore<S> {
	getState(): S;
	subscribe(listener: (state: S, prev: S) => void): () => void;
}

/** The stores the controller reads, writes and subscribes to. */
export interface PlacementStores extends ToolStores {
	editor: SubscribableStore<EditorState>;
	operate: SubscribableStore<OperateState>;
	mode: SubscribableStore<ModeState>;
}

const DEFAULT_STORES: PlacementStores = {
	editor: useEditorStore,
	timetable: useTimetableStore,
	operate: useOperateStore,
	mode: useModeStore,
};

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
	/** The app's stores by default; a test passes its own. */
	stores?: PlacementStores;
}

/** Who a click goes to — see {@link resolveClickTarget}. */
export type ClickTarget = "operate" | "cellPick" | "tool" | null;

/**
 * Decide who handles a click, before any tool sees it:
 *
 * - Operate mode: every click works the signalling, never the map.
 * - Outside railway mode the map is a read-only backdrop, so no tool gets
 *   the click. Entering another mode already puts the tool back to Select,
 *   which edits nothing — this is the backstop, so no path that leaves a tool
 *   armed can reach the map.
 * - Right-click is the active tool's delete gesture.
 * - A pending timetable cell pick borrows a primary click ahead of the tool.
 */
export function resolveClickTarget(
	mode: AppMode,
	button: number,
	cellPickPending: boolean,
): ClickTarget {
	if (mode === "operate") return "operate";
	const mapEditable = mode === "railway";
	if (button !== 2 && cellPickPending) return "cellPick";
	return mapEditable ? "tool" : null;
}

/**
 * Owns the map and routes canvas input to the active editor {@link Tool}.
 *
 * Each tool lives in its own file under `editor/tools/` and is handed a
 * {@link ToolContext} — the map, the render layers, the stores and the undo
 * `commit` — rather than reaching for any of them itself. This class does
 * nothing tool-specific: it classifies pointer events (pan, drag or click),
 * converts them to grid and world coordinates, picks who handles a click, and
 * calls the matching hook. It also owns what is not a tool: undo/redo, save/
 * load, the connectivity summary, the overlay toggles and the hover tooltips.
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
	private readonly layers: ToolLayers;
	private readonly stores: PlacementStores;
	/**
	 * Public so React can reach the viewport through {@link instance}, the same
	 * seam the dialogs use to reach the map — rather than a second singleton on
	 * ViewportController, or prop-drilling the ref out of usePixiApp.
	 */
	readonly viewport: ViewportController;

	private readonly addTool: AddTool;
	private readonly textTool: TextTool;
	private readonly sectionTool: SectionTool;
	/** Every editor tool, by the id the editor store names it with. */
	private readonly tools: Record<ToolId, Tool>;
	/** Takes the clicks a pending timetable "pick on map" borrows. */
	private readonly cellPickTool: CellPickTool;
	/** Takes every click in operate mode. */
	private readonly operateTool: OperateTool;

	private downPos: { x: number; y: number } | null = null;
	private downWasPanning = false;
	/** Cached `getBoundingClientRect` from the last pointerdown (avoids forced layout per pointermove). */
	private downRect: DOMRect | null = null;

	private abort?: AbortController;
	private unsubStore?: () => void;
	private unsubOperate?: () => void;
	private unsubMode?: () => void;
	private lastPointer: { clientX: number; clientY: number } | null = null;

	constructor(opts: PlacementControllerOptions) {
		this.app = opts.app;
		this.world = opts.world;
		this.viewport = opts.viewport;
		this.stores = opts.stores ?? DEFAULT_STORES;
		this.layers = {
			track: opts.trackLayer,
			element: opts.elementLayer,
			text: opts.textLayer,
			linkHighlight: opts.linkHighlightLayer,
			trackColor: opts.trackColorLayer,
			direction: opts.directionLayer,
		};

		// Phase 0: fix coordinate-unit mismatch so neighbor-math (grid ± 1)
		// matches app's integer-grid stored coordinates.
		this.map.setImageSize(1);

		this.ghost.label = "ghost";
		this.ghost.alpha = 0.5;
		this.ghost.visible = false;
		this.ghost.eventMode = "none";

		const ctx: ToolContext = {
			map: this.map,
			layers: this.layers,
			stores: this.stores,
			ghost: this.ghost,
			textures: opts.textures,
			commit: (label, refresh, fn) => this.commit(label, refresh, fn),
			publishTrackStatus: () => this.publishTrackStatus(),
			isPanning: () => this.viewport.isPanning,
			setCursor: (cursor) => {
				this.app.canvas.style.cursor = cursor;
			},
		};
		this.addTool = new AddTool(ctx);
		this.textTool = new TextTool(ctx);
		this.sectionTool = new SectionTool(ctx);
		this.tools = {
			select: new SelectTool(),
			add: this.addTool,
			text: this.textTool,
			link: new LinkTool(ctx),
			section: this.sectionTool,
			direction: new DirectionTool(ctx),
		};
		this.cellPickTool = new CellPickTool(ctx);
		this.operateTool = new OperateTool(ctx);

		PlacementController.instance = this;
		// Publish the initial (empty) status so the UI leaves its "loading" state.
		this.publishTrackStatus();
		this.publishHistoryState();
	}

	/** The editor tool the store says is active. */
	private activeTool(): Tool {
		return this.tools[this.stores.editor.getState().tool];
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
		const editor = this.stores.editor.getState();

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

		editor.setTrackStatus({
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
		if (!connected && this.stores.editor.getState().tool === "direction") {
			editor.setTool("select");
		}

		// The timetable is validated against this map, so a map edit can
		// invalidate it — renaming a platform orphans every service booked to
		// it. Re-checking here, where every mutation already lands, is what
		// keeps the editor's issue list honest about a railway that moved
		// underneath it.
		this.stores.timetable.getState().revalidate(this.map);
	}

	/** Push the undo/redo summary to the store for the toolbar to render. */
	private publishHistoryState(): void {
		this.stores.editor.getState().setHistoryState(this.history.getState());
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
		const { layers, map } = this;
		if (refresh.track) layers.track.sync(map);
		if (refresh.element) layers.element.sync(map);
		if (refresh.text) layers.text.sync(map);
		if (refresh.linkHighlight) {
			layers.linkHighlight.sync(map);
			layers.linkHighlight.syncSelection(map);
		}
		if (refresh.trackColor) layers.trackColor.sync(map);
		if (refresh.direction) layers.direction.sync(map);
		if (refresh.status) this.publishTrackStatus();
	}

	/**
	 * Tell every tool the document is about to change underneath it, so a
	 * half-made gesture or hover preview describing the old topology is dropped.
	 */
	private resetTools(): void {
		for (const tool of Object.values(this.tools)) tool.reset?.();
	}

	// ── Undo / redo ─────────────────────────────────────────────────

	/** Step the document back one edit. No-op when there is nothing to undo. */
	undo(): void {
		const command = this.history.undo();
		if (!command) return;
		this.resetTools();
		undoEntries(this.map, command.entries);
		this.applyRefresh(command.refresh);
		this.publishHistoryState();
		debugLog("placement", `undo — ${command.label}`);
	}

	/** Re-apply the edit the last undo reversed. No-op when there is no redo. */
	redo(): void {
		const command = this.history.redo();
		if (!command) return;
		this.resetTools();
		redoEntries(this.map, command.entries);
		this.applyRefresh(command.refresh);
		this.publishHistoryState();
		debugLog("placement", `redo — ${command.label}`);
	}

	/** Attach pointer listeners and subscribe to tool/selection changes. */
	attach(): void {
		const { tool, selectedKind, selectedSubtype } =
			this.stores.editor.getState();
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
		// Right-click is a delete gesture — suppress the native context menu so
		// the release lands as our own event.
		canvas.addEventListener("contextmenu", (e) => e.preventDefault(), {
			signal,
		});

		this.unsubStore = this.stores.editor.subscribe((state, prevState) => {
			const toolChanged = state.tool !== prevState.tool;
			const highlightsChanged =
				state.showLinkHighlights !== prevState.showLinkHighlights;

			this.applyOverlayToggles(state, prevState);

			// Hand over from the tool being left to the one being picked. The old
			// tool goes first so it cannot undo an overlay the new one just showed.
			if (toolChanged) {
				const prevTool = this.tools[prevState.tool];
				if (prevTool.deactivate) prevTool.deactivate();
				else prevTool.clear();
				this.tools[state.tool].activate?.();
			}

			for (const t of Object.values(this.tools)) {
				t.editorChanged?.(state, prevState);
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
			this.activeTool().refresh?.();
		});

		this.unsubOperate = this.stores.operate.subscribe((state, prevState) => {
			const { showTrainInfo, showTrainTimetable } =
				this.stores.editor.getState();
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

		this.unsubMode = this.stores.mode.subscribe((state, prevState) => {
			if (state.mode !== prevState.mode && state.mode !== "operate") {
				this.stores.editor.getState().setHoveredTrainInfo(null);
			}
		});

		this.applyCursor();
		this.activeTool().refresh?.();
	}

	/**
	 * The toolbar's "show link highlights" and "show directions" toggles. Each
	 * overlay stays up while the tool that works on it is active, whatever the
	 * toggle says.
	 */
	private applyOverlayToggles(state: EditorState, prev: EditorState): void {
		const { layers, map } = this;
		if (state.showLinkHighlights !== prev.showLinkHighlights) {
			if (state.showLinkHighlights) {
				layers.linkHighlight.sync(map);
				layers.linkHighlight.container.visible = true;
			} else if (state.tool !== "link") {
				layers.linkHighlight.container.visible = false;
			}
		}
		if (state.showDirections !== prev.showDirections) {
			if (state.showDirections) {
				layers.direction.sync(map);
				layers.direction.container.visible = true;
			} else if (state.tool !== "direction") {
				layers.direction.container.visible = false;
			}
		}
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
		this.addTool.invalidate();
		this.activeTool().refresh?.();
	}

	// ── Pointer handling (arrow fields keep `this` bound as listeners) ──

	private onPointerDown = (e: PointerEvent): void => {
		if (e.button !== 0 && e.button !== 2) return;
		this.downPos = { x: e.clientX, y: e.clientY };
		this.downRect = this.app.canvas.getBoundingClientRect();
		this.downWasPanning = this.viewport.isPanning;
		// Only a press whose click would reach the tool may start one of its
		// gestures. Otherwise a drag armed here (moving a text) would edit a
		// read-only map, or take over a press a cell pick has borrowed.
		if (this.clickTarget(e.button) === this.activeTool()) {
			this.activeTool().pointerDown?.(this.toPointer(e));
		}
	};

	private onPointerUp = (e: PointerEvent): void => {
		if (e.button !== 0 && e.button !== 2) return;

		const down = this.downPos;
		// Resolve the release point while downRect still describes this gesture.
		const p = this.toPointer(e);
		this.downPos = null;
		this.downRect = null;
		const tool = this.activeTool();

		if (this.downWasPanning || this.viewport.isPanning || !down) {
			debugLog(
				"placement",
				down
					? "pointerup ignored — was panning"
					: "pointerup ignored — no matching pointerdown on canvas",
			);
			tool.release?.(p, "cancelled");
			return;
		}

		const dx = e.clientX - down.x;
		const dy = e.clientY - down.y;
		const dragged =
			Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD;
		if (tool.release?.(p, dragged ? "drag" : "click")) return;
		if (dragged) {
			debugLog(
				"placement",
				`pointerup ignored — drag distance (${dx.toFixed(1)}, ${dy.toFixed(1)}) > threshold`,
			);
			return;
		}

		const target = this.clickTarget(e.button);
		if (!target) return;
		if (e.button === 2) target.rightClick?.(p);
		else target.click?.(p);
	};

	/** The tool a click goes to, if any — see {@link resolveClickTarget}. */
	private clickTarget(button: number): Tool | null {
		const target = resolveClickTarget(
			this.stores.mode.getState().mode,
			button,
			this.stores.timetable.getState().pendingCellPick !== null,
		);
		switch (target) {
			case "operate":
				return this.operateTool;
			case "cellPick":
				return this.cellPickTool;
			case "tool":
				return this.activeTool();
			case null:
				return null;
		}
	}

	private onPointerMove = (e: PointerEvent): void => {
		const p = this.toPointer(e);
		const tool = this.activeTool();

		// A drag owns the pointer: skip the hover preview and the info hover. A
		// tooltip opened before the drag would otherwise hang frozen until the
		// release, so drop it.
		if (tool.pointerMove?.(p)) {
			this.clearHoverTooltips();
			return;
		}

		tool.preview?.(p);

		// Track/train-info hover: independent of the tool, so it works with any
		// tool (e.g. select tool inspecting track, or operate mode).
		this.lastPointer = { clientX: e.clientX, clientY: e.clientY };
		this.updateHoverTooltips(e.clientX, e.clientY, p.cell);
	};

	private onPointerLeave = (): void => {
		this.lastPointer = null;
		this.activeTool().clear();
		this.clearHoverTooltips();
	};

	private onPointerCancel = (): void => {
		debugLog("placement", "pointercancel — clearing state");
		this.lastPointer = null;
		this.activeTool().clear();
		this.downPos = null;
		this.downRect = null;
		this.clearHoverTooltips();
	};

	// ── Hover tooltips ──

	private clearHoverTooltips(): void {
		const editor = this.stores.editor.getState();
		editor.setHoveredTrackInfo(null);
		editor.setHoveredTrainInfo(null);
	}

	private findHoveredTrain(hoverCell: { gx: number; gy: number }) {
		if (this.stores.mode.getState().mode !== "operate") return null;
		const trains = this.stores.operate.getState().view?.trains ?? [];
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
					timetableRows: this.stores.operate.getState().timetables[train.id],
				})
			: null;
		this.stores.editor.getState().setHoveredTrainInfo(info);
	}

	private updateTrackHoverTooltip(
		hoverCell: { gx: number; gy: number },
		blockedByTrain: boolean,
		clientX: number,
		clientY: number,
	): void {
		const track = blockedByTrain
			? null
			: this.map.getTrackAt(hoverCell.gx, hoverCell.gy);
		const info = track
			? buildHoveredTrackInfo(
					track,
					hoverCell.gx,
					hoverCell.gy,
					clientX,
					clientY,
				)
			: null;
		this.stores.editor.getState().setHoveredTrackInfo(info);
	}

	private updateHoverTooltips(
		clientX: number,
		clientY: number,
		cell?: { gx: number; gy: number },
	): void {
		const { showTrackInfo, showTrainInfo, showTrainTimetable } =
			this.stores.editor.getState();
		const wantTrainHover = showTrainInfo || showTrainTimetable;
		if (!showTrackInfo && !wantTrainHover) return;

		const hoverCell = cell ?? this.screenToGrid(clientX, clientY);
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

	// ── Document operations (the dialogs and panels call these) ──

	/** Place a text element at the given world coordinates. */
	placeText(wx: number, wy: number, content: string, font: FontInfo): void {
		this.textTool.placeText(wx, wy, content, font);
	}

	/** Find the Text at exact grid coordinates (used to prefill/apply text edits). */
	getTextByLocation(tx: number, ty: number): Text | null {
		return this.textTool.getTextByLocation(tx, ty);
	}

	/** Rename (or delete, when content is empty) the Text at the given grid coordinates. */
	updateTextAt(tx: number, ty: number, content: string, font?: FontInfo): void {
		this.textTool.updateTextAt(tx, ty, content, font);
	}

	/** Name (or rename/delete) any nameable element at the given grid coordinates. */
	nameElementAt(
		gx: number,
		gy: number,
		content: string,
		kind: NameableKind,
	): void {
		this.textTool.nameElementAt(gx, gy, content, kind);
	}

	/** Apply speed/length edits to every track in the selected section. */
	applySectionEdit(values: SectionEdit): void {
		this.sectionTool.applySectionEdit(values);
	}

	/** Clear the section highlight overlay (public for SectionEditPanel). */
	clearSectionHighlight(): void {
		this.sectionTool.clearSectionHighlight();
	}

	/** Restore defaults for all tracks in the selected section. */
	restoreSection(): void {
		this.sectionTool.restoreSection();
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

		this.resetTools();
		this.map.clearAll();
		deserializeMap(data, this.map);

		const { layers, map } = this;
		// Rebuild sprites from scratch so stale cells from the previous map go away.
		layers.track.clear();
		layers.element.clear();
		layers.text.clear();
		layers.track.sync(map);
		// Reset the section colour overlay: no section is selected after a load, so
		// restore plain themed textures (otherwise tracks with non-default speed/
		// length would appear tinted).
		layers.trackColor.hide();
		layers.element.sync(map);
		layers.text.sync(map);
		layers.linkHighlight.clearSectionHighlight();
		layers.linkHighlight.sync(map);
		// Rebuild direction arrows from the loaded map.
		layers.direction.sync(map);

		// Any prior section selection now points at removed tracks — clear it.
		this.stores.editor.getState().clearSectionSelection();
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

	// ── Helpers ──

	/** Resolve a pointer event to the grid cell and world position tools work in. */
	private toPointer(e: PointerEvent): ToolPointer {
		const world = this.screenToWorld(e.clientX, e.clientY);
		return {
			button: e.button,
			clientX: e.clientX,
			clientY: e.clientY,
			world,
			cell: worldToGrid(world.x, world.y),
		};
	}

	/** Convert a client pointer position to world coordinates, without grid snapping. */
	private screenToWorld(
		clientX: number,
		clientY: number,
	): { x: number; y: number } {
		const rect = this.downRect ?? this.app.canvas.getBoundingClientRect();
		const sx = clientX - rect.left;
		const sy = clientY - rect.top;
		return {
			x: (sx - this.world.position.x) / this.world.scale.x,
			y: (sy - this.world.position.y) / this.world.scale.y,
		};
	}

	/** Convert a client pointer position to the nearest grid cell. */
	private screenToGrid(
		clientX: number,
		clientY: number,
	): { gx: number; gy: number } {
		const { x, y } = this.screenToWorld(clientX, clientY);
		return worldToGrid(x, y);
	}

	private applyCursor(): void {
		this.app.canvas.style.cursor = this.activeTool().cursor();
	}
}
