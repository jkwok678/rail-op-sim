import {
	SignalAspect,
	type SignalAspectValue,
	type TrackKind,
} from "@rail-op-sim/shared";
import { create } from "zustand";
import { DEFAULT_ZOOM } from "#/engine/zoomConstants";
import { debugLog } from "#/lib/debugLogger";

/** The active editing tool. */
export type Tool = "select" | "add" | "text" | "link" | "section" | "direction";

/**
 * What the direction tool's two-click gesture does along the route it finds:
 * `set` assigns preferred directions, `erase` removes the ones the same
 * gesture would have assigned — the way back from a mis-drawn route.
 */
export type DirectionMode = "set" | "erase";

/** Non-track element types placeable from the Add palette. */
export type ElementKind =
	| "namedLocation"
	| "concourse"
	| "parapet"
	| "platform"
	| "levelCrossing";

/**
 * Pending action for the Text tool. Kept serialisable (no pixi/model refs) so it
 * can live in the store, per store convention.
 * - `place`: world-pixel coords for a new standalone text.
 * - `edit`: grid coords of an existing Text to edit/delete.
 */
export type PendingText =
	| { mode: "place"; x: number; y: number }
	| { mode: "edit"; tx: number; ty: number };

/** Element types that can be named via the Text tool. */
export type NameableKind =
	| "namedLocation"
	| "concourse"
	| "platform"
	| "bridgeUnderpass";

/** Union of all placeable categories (tracks + elements). */
export type AddKind = TrackKind | ElementKind;

/**
 * Plain-data snapshot of the track under the pointer, pushed by the placement
 * controller when "show track info" is enabled. Kept serialisable (no pixi/model
 * references) so it can live in the store and be read by the tooltip.
 */
export type HoveredTrackInfo = {
	kindLabel: string;
	subtypeCode: string;
	mainSpeed: number;
	mainLength: number;
	gx: number;
	gy: number;
	/** Viewport coordinates of the pointer (for fixed-position rendering). */
	screenX: number;
	screenY: number;
};

/** Returns true when `kind` is a track category (not an element). */
export function isTrackKind(kind: AddKind): kind is TrackKind {
	const TRACK_KINDS: Set<string> = new Set([
		"straight",
		"directed",
		"curved",
		"linked",
		"exit",
		"buffer",
		"signal",
		"bridgeUnderpass",
		"switch",
		"crossover",
		"flyover",
	]);
	return TRACK_KINDS.has(kind);
}

/**
 * Connectivity summary published by the placement controller, detailed enough
 * for the UI to say *what* is incomplete rather than just that something is.
 */
export interface TrackStatus {
	/** Total tracks on the map. */
	total: number;
	/** True when nothing dangles and every portal is paired. */
	connected: boolean;
	/** Tracks with an active link running into an empty cell. */
	dangling: number;
	/** Linked tracks (portals) with no partner. */
	unpairedLinked: number;
	/** Grid location of the first offending track, for "first at (x, y)". */
	firstIssue: { gx: number; gy: number } | null;
}

export interface EditorState {
	/** Current tool. */
	tool: Tool;
	/** Category chosen in the Add palette (null = showing categories). */
	selectedKind: AddKind | null;
	/** Subtype chosen in the Add palette (the thing that gets placed). */
	selectedSubtype: string | null;
	/** Signal capability type (only meaningful when selectedKind === "signal"). */
	selectedAspect: SignalAspectValue;

	/**
	 * Pending Text-tool action. When non-null, the TextInputDialog opens to
	 * place a new text (`place`) or edit/delete an existing one (`edit`).
	 */
	pendingText: PendingText | null;

	/**
	 * Grid coordinates and element kind of the element the user clicked with the
	 * Text tool on a nameable element. When non-null, the NameElementDialog opens
	 * to set/change/delete its label.
	 */
	pendingNameTarget: { gx: number; gy: number; kind: NameableKind } | null;

	/** Whether the linked track highlight overlay is visible. */
	showLinkHighlights: boolean;

	/** Whether the preferred-direction arrow overlay is visible. */
	showDirections: boolean;

	/** Whether hovering the canvas shows a floating track-info tooltip. */
	showTrackInfo: boolean;

	/** Whether the graph-paper grid behind the tracks is visible. */
	showGrid: boolean;

	/**
	 * Plain-data snapshot of the track currently under the pointer, or null when
	 * the pointer isn't over a track (or the feature is disabled).
	 */
	hoveredTrackInfo: HoveredTrackInfo | null;

	/**
	 * Track connectivity summary, recomputed by the (pixi-owning) placement
	 * controller after every map mutation and pushed here as plain data.
	 * `null` means the map isn't ready yet. Keeping this as serialisable data —
	 * rather than reaching into the controller/pixi — keeps the SSR module graph
	 * free of browser-only code.
	 */
	trackStatus: TrackStatus | null;

	/** Switch the active tool. Leaving "add" clears the palette selection. */
	setTool: (tool: Tool) => void;
	/** Choose a category (clears any subtype). Pass null to go back to categories. */
	selectKind: (kind: AddKind | null) => void;
	/** Choose the subtype to place. */
	selectSubtype: (subtype: string | null) => void;
	/** Set the signal aspect type. */
	setAspect: (aspect: SignalAspectValue) => void;
	/** Store the pending Text-tool action, triggering the TextInputDialog. */
	setPendingText: (pending: PendingText | null) => void;
	/** Store the grid-coordinate target for a nameable element, triggering the dialog. */
	setPendingNameTarget: (
		loc: { gx: number; gy: number; kind: NameableKind } | null,
	) => void;
	/** Toggle the linked track highlight overlay on/off. */
	toggleLinkHighlights: () => void;
	/** Toggle the preferred-direction arrow overlay on/off. */
	toggleShowDirections: () => void;
	/** Toggle the hover track-info tooltip on/off (clears any hover when off). */
	toggleShowTrackInfo: () => void;
	/** Toggle the ground grid on/off. */
	toggleShowGrid: () => void;
	/** Push (or clear) the track-info snapshot for the tooltip to render. */
	setHoveredTrackInfo: (info: HoveredTrackInfo | null) => void;
	/** Push a freshly-computed track connectivity summary for the UI to read. */
	setTrackStatus: (status: TrackStatus | null) => void;

	/** Current zoom level. */
	zoom: number;
	/** Set zoom level. */
	setZoom: (z: number) => void;

	/**
	 * Screen position (px, top-left corner) of the floating toolbar. Panels that
	 * anchor to the toolbar (e.g. the Add palette) read this so they follow it as
	 * the user drags it around the viewport.
	 */
	toolbarPos: { x: number; y: number };
	/** Move the floating toolbar to a new screen position. */
	setToolbarPos: (pos: { x: number; y: number }) => void;

	/**
	 * Section tool — two-click path selection.
	 * grid coordinates of the first clicked track (start), or null.
	 */
	sectionStart: { gx: number; gy: number } | null;
	/** grid coordinates of the second clicked track (end), or null. */
	sectionEnd: { gx: number; gy: number } | null;
	/** Ordered array of grid coords for every track in the computed section path. */
	sectionTracks: { gx: number; gy: number }[];
	/** Set the section start track (clears end + tracks). */
	setSectionStart: (loc: { gx: number; gy: number } | null) => void;
	/** Set the section end track and the computed path tracks. */
	setSectionEnd: (
		loc: { gx: number; gy: number } | null,
		tracks: { gx: number; gy: number }[],
	) => void;
	/** Set the section tracks array (used after recomputing path). */
	setSectionTracks: (tracks: { gx: number; gy: number }[]) => void;
	/** Clear all section selection state. */
	clearSectionSelection: () => void;

	/**
	 * Direction tool — two-click path assignment. Grid coordinates of the first
	 * clicked track (start), or null when no start is pending.
	 */
	directionStart: { gx: number; gy: number } | null;
	/** Set (or clear) the pending direction start track. */
	setDirectionStart: (loc: { gx: number; gy: number } | null) => void;

	/** Whether the direction tool assigns or erases along the route it finds. */
	directionMode: DirectionMode;
	/** Switch the direction tool between assigning and erasing. */
	setDirectionMode: (mode: DirectionMode) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
	tool: "select",
	selectedKind: null,
	selectedSubtype: null,
	selectedAspect: SignalAspect.FOUR_ASPECT,
	pendingText: null,
	pendingNameTarget: null,
	showLinkHighlights: false,
	showDirections: false,
	showTrackInfo: false,
	showGrid: true,
	hoveredTrackInfo: null,
	trackStatus: null,
	zoom: DEFAULT_ZOOM,
	toolbarPos: { x: 16, y: 16 },
	sectionStart: null,
	sectionEnd: null,
	sectionTracks: [],
	directionStart: null,
	directionMode: "set",

	setTool: (tool) => {
		debugLog("store", `setTool: ${tool}`);
		set(
			tool === "add"
				? { tool, pendingNameTarget: null, pendingText: null }
				: {
						tool,
						selectedKind: null,
						selectedSubtype: null,
						pendingNameTarget: null,
						pendingText: null,
						sectionStart: null,
						sectionEnd: null,
						sectionTracks: [],
					},
		);
	},

	selectKind: (kind) => {
		debugLog("store", `selectKind: ${kind ?? "null"}`);
		set({
			selectedKind: kind,
			selectedSubtype: null,
			selectedAspect: SignalAspect.FOUR_ASPECT,
		});
	},

	selectSubtype: (subtype) => {
		debugLog("store", `selectSubtype: ${subtype ?? "null"}`);
		set({ selectedSubtype: subtype });
	},

	setAspect: (aspect) => {
		debugLog("store", `setAspect: ${aspect}`);
		set({ selectedAspect: aspect });
	},

	setPendingText: (pending) => {
		debugLog(
			"store",
			`setPendingText: ${
				pending
					? pending.mode === "place"
						? `place(${pending.x.toFixed(1)},${pending.y.toFixed(1)})`
						: `edit(${pending.tx},${pending.ty})`
					: "null"
			}`,
		);
		set({ pendingText: pending });
	},

	setPendingNameTarget: (loc) => {
		debugLog(
			"store",
			`setPendingNameTarget: ${loc ? `(${loc.gx},${loc.gy},${loc.kind})` : "null"}`,
		);
		set({ pendingNameTarget: loc });
	},

	toggleLinkHighlights: () =>
		set((s) => ({ showLinkHighlights: !s.showLinkHighlights })),
	toggleShowDirections: () =>
		set((s) => ({ showDirections: !s.showDirections })),
	toggleShowTrackInfo: () =>
		set((s) => ({
			showTrackInfo: !s.showTrackInfo,
			hoveredTrackInfo: s.showTrackInfo ? null : s.hoveredTrackInfo,
		})),
	toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
	setHoveredTrackInfo: (info) => set({ hoveredTrackInfo: info }),
	setTrackStatus: (status) => set({ trackStatus: status }),
	setZoom: (z) => set({ zoom: z }),
	setToolbarPos: (pos) => set({ toolbarPos: pos }),

	setSectionStart: (loc) => {
		debugLog(
			"store",
			`setSectionStart: ${loc ? `(${loc.gx},${loc.gy})` : "null"}`,
		);
		set({ sectionStart: loc, sectionEnd: null, sectionTracks: [] });
	},

	setSectionEnd: (loc, tracks) => {
		debugLog(
			"store",
			`setSectionEnd: ${loc ? `(${loc.gx},${loc.gy})` : "null"} tracks=${tracks.length}`,
		);
		set({ sectionEnd: loc, sectionTracks: tracks });
	},

	setSectionTracks: (tracks) => {
		set({ sectionTracks: tracks });
	},

	clearSectionSelection: () => {
		debugLog("store", "clearSectionSelection");
		set({ sectionStart: null, sectionEnd: null, sectionTracks: [] });
	},

	setDirectionStart: (loc) => {
		debugLog(
			"store",
			`setDirectionStart: ${loc ? `(${loc.gx},${loc.gy})` : "null"}`,
		);
		set({ directionStart: loc });
	},

	setDirectionMode: (mode) => {
		debugLog("store", `setDirectionMode: ${mode}`);
		// A pending start belongs to the gesture being abandoned — switching what
		// the second click would do mid-gesture would surprise.
		set({ directionMode: mode, directionStart: null });
	},
}));
