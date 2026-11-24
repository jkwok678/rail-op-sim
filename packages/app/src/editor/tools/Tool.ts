import type { Map as Map_ } from "@rail-op-sim/shared";
import type { Container } from "pixi.js";
import type { RefreshFlags } from "#/editor/EditHistory";
import type { DirectionLayer } from "#/renderer/layers/DirectionLayer";
import type { ElementLayer } from "#/renderer/layers/ElementLayer";
import type { LinkHighlightLayer } from "#/renderer/layers/LinkHighlightLayer";
import type { TextLayer } from "#/renderer/layers/TextLayer";
import type { TrackColorLayer } from "#/renderer/layers/TrackColorLayer";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";
import type { TextureCache } from "#/renderer/textureCache";
import type { EditorState, Tool as ToolId } from "#/store/editor-store";
import type { ModeState } from "#/store/mode-store";
import type { OperateState } from "#/store/operate-store";
import type { TimetableState } from "#/store/timetable-store";

export type { ToolId };

/** A grid cell, in integer grid coordinates (y up). */
export interface GridCell {
	gx: number;
	gy: number;
}

/**
 * A pointer event as a tool sees it: already resolved to the grid cell and the
 * world position under it, so no tool has to know about the canvas, the
 * viewport transform or the cached bounding rect.
 */
export interface ToolPointer {
	/** 0 = primary, 2 = secondary (right-click). */
	button: number;
	clientX: number;
	clientY: number;
	/** The grid cell nearest the pointer. */
	cell: GridCell;
	/** The exact world position, without grid snapping (text placement). */
	world: { x: number; y: number };
}

/**
 * How a press ended, as the controller classifies it before any click
 * handling: `"cancelled"` when it was a pan or had no matching press on the
 * canvas, `"drag"` when the pointer travelled past the drag threshold, and
 * `"click"` otherwise.
 */
export type ReleaseKind = "cancelled" | "drag" | "click";

/** Read access to a zustand store — all a tool needs, and trivial to fake. */
export interface StoreReader<S> {
	getState(): S;
}

/** The stores the canvas reads and writes, passed in rather than imported. */
export interface ToolStores {
	editor: StoreReader<EditorState>;
	timetable: StoreReader<TimetableState>;
	operate: StoreReader<OperateState>;
	mode: StoreReader<ModeState>;
}

/** The render layers a tool may redraw after it changes the map. */
export interface ToolLayers {
	track: TrackLayer;
	element: ElementLayer;
	text: TextLayer;
	linkHighlight: LinkHighlightLayer;
	trackColor: TrackColorLayer;
	direction: DirectionLayer;
}

/**
 * Everything a tool is given to work with. The controller owns each of these;
 * a tool reaches them only through this object, which is what lets a tool be
 * built in a test with a plain map, stub layers and a store of its choosing.
 */
export interface ToolContext {
	/** The authoritative layout. */
	readonly map: Map_;
	readonly layers: ToolLayers;
	readonly stores: ToolStores;
	/** The world-space container the Add tool's ghost sprite lives in. */
	readonly ghost: Container;
	readonly textures: TextureCache;
	/**
	 * Run `fn` as one undoable step, recorded only if it changed something.
	 * See {@link PlacementController} for the rule.
	 */
	commit<T>(label: string, refresh: RefreshFlags, fn: () => T): T;
	/** Re-publish the connectivity summary after a change that can affect it. */
	publishTrackStatus(): void;
	/** Whether the viewport is mid-pan, so a press belongs to the pan. */
	isPanning(): boolean;
	/** Set the canvas cursor for a hover-dependent cursor (see {@link EditorTool.cursor}). */
	setCursor(cursor: string): void;
}

/**
 * One editor tool. The controller routes canvas input to whichever tool is
 * active and does nothing tool-specific itself, so adding a tool means adding
 * a file that implements this — not another branch in the controller.
 *
 * Every hook but {@link cursor} and {@link clear} is optional; a tool that
 * ignores an input just leaves the hook out.
 */
export interface EditorTool {
	/**
	 * The canvas cursor while this tool is active. The controller applies it
	 * when the tool or the palette selection changes. A cursor that depends on
	 * what is under the pointer is set from {@link preview} with
	 * {@link ToolContext.setCursor}.
	 */
	cursor(): string;

	/** The tool was just picked: show any overlay it works on. */
	activate?(): void;
	/**
	 * Another tool was just picked: drop this tool's gesture, previews and
	 * overlays. Defaults to {@link clear} when left out.
	 */
	deactivate?(): void;

	/** A primary or secondary press on the canvas. */
	pointerDown?(p: ToolPointer): void;
	/**
	 * The pointer moved. Return true while the tool holds the pointer (a drag
	 * in progress); the controller then skips hover previews and tooltips.
	 */
	pointerMove?(p: ToolPointer): boolean;
	/**
	 * Every release reaches this first, before it is treated as a click.
	 * Return true to consume it — a drag the tool finished — so no click
	 * handler runs.
	 */
	release?(p: ToolPointer, kind: ReleaseKind): boolean;
	/** A primary click (a release that was neither a pan nor a drag). */
	click?(p: ToolPointer): void;
	/** A secondary click — the delete gesture for tools that place things. */
	rightClick?(p: ToolPointer): void;
	/** Show what a click here would do (route, ghost, pairing, cursor). */
	preview?(p: ToolPointer): void;

	/** The palette selection or the textures changed: rebuild what is drawn from them. */
	refresh?(): void;
	/**
	 * The editor store changed. Every tool hears every change, active or not,
	 * so a tool can mirror store state the UI changes without a canvas event.
	 */
	editorChanged?(state: EditorState, prev: EditorState): void;

	/** The pointer left or was cancelled: drop hover previews and any drag. */
	clear(): void;
	/**
	 * The document changed underneath the tool (undo, redo, load): also drop
	 * a half-made gesture that may name an element which is no longer there.
	 */
	reset?(): void;
}
