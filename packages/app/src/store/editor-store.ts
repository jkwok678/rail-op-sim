import {
	SignalAspect,
	type SignalAspectValue,
	type TrackKind,
	type TrainTimetableEntry,
} from "@rail-op-sim/shared";
import { create } from "zustand";
import { debugLog } from "#/lib/debugLogger";
import type { MapFileFormat } from "#/lib/mapFile";
import { DEFAULT_ZOOM } from "#/lib/zoomConstants";

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
	/**
	 * Second path's speed/length on the kinds that have one (switch, crossover,
	 * flyover); null elsewhere. Without it the tooltip would show a switch's
	 * main figures as if they were the whole track.
	 */
	secondarySpeed: number | null;
	secondaryLength: number | null;
	/** Aspect capability label, signals only ("4-aspect"); null otherwise. */
	aspectLabel: string | null;
	gx: number;
	gy: number;
	/** Viewport coordinates of the pointer (for fixed-position rendering). */
	screenX: number;
	screenY: number;
};

/**
 * Plain-data snapshot of the train under the pointer, pushed by the placement
 * controller when "show train info" or "show train timetable" is enabled. Kept
 * serialisable (no pixi/model references) so it can live in the store and be
 * read by the tooltip.
 */
export type HoveredTrainInfo = {
	headcode: string;
	description: string | null;
	/** Present when "Show train info" is enabled; null when only "Show train timetable" is enabled. */
	statusLabel: string | null;
	next: string | null;
	/** True when "Show train info" is enabled and train is under signaller control. */
	signallerControl: boolean;
	/** Reminder text when "Show train info" is enabled and a reminder is set. */
	reminder: string | null;
	/** Present when "Show train timetable" is enabled; null when only "Show train info" is enabled. */
	timetable: TrainTimetableEntry[] | null;
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
	/**
	 * True when every active link joins a neighbour and every portal is paired.
	 * This is the gate for the direction tool; full operational readiness is
	 * {@link complete}.
	 */
	connected: boolean;
	/**
	 * True when the railway is ready: connected, every nameable element named,
	 * and preferred directions set on every track with none broken.
	 */
	complete: boolean;
	/** Tracks with an active link that does not join a neighbour. */
	dangling: number;
	/** Linked tracks (portals) with no partner. */
	unpairedLinked: number;
	/** Nameable elements still missing a label. */
	unnamed: number;
	/** Tracks with no preferred-direction pair set. */
	undirected: number;
	/** Preferred-direction pairs that do not continue through the map. */
	brokenRoutes: number;
	/** Grid location of the first offending element, for "first at (x, y)". */
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

	/** Whether hovering a train on the canvas shows a floating train-info tooltip. */
	showTrainInfo: boolean;

	/** Whether hovering a train on the canvas shows its timetable in the tooltip. */
	showTrainTimetable: boolean;

	/** Whether the graph-paper grid behind the tracks is visible. */
	showGrid: boolean;

	/**
	 * Encoding used by Save (and remembered from the last successful Load so a
	 * YAML map isn't rewritten as JSON on the next Cmd+S). JSON is the default.
	 */
	saveFormat: MapFileFormat;

	/**
	 * Counts every history publish — each undoable map commit, undo, redo and
	 * load. `canUndo` and the labels often stay the same across commits, so this
	 * is what autosave watches to know the map changed.
	 */
	historyRevision: number;

	/** When the session was last autosaved, and whether the latest attempt failed. */
	autosave: { lastSavedAt: number | null; error: boolean };

	/**
	 * Whether the keyboard-shortcut reference overlay is open. Lives in the store
	 * rather than in the layout's local state so the Escape cascade can see it —
	 * it is one of the things Escape has to yield to.
	 */
	showShortcuts: boolean;

	/**
	 * Plain-data snapshot of the track currently under the pointer, or null when
	 * the pointer isn't over a track (or the feature is disabled).
	 */
	hoveredTrackInfo: HoveredTrackInfo | null;

	/**
	 * Plain-data snapshot of the train currently under the pointer, or null when
	 * the pointer isn't over a train (or the feature is disabled).
	 */
	hoveredTrainInfo: HoveredTrainInfo | null;

	/**
	 * Track connectivity summary, recomputed by the (pixi-owning) placement
	 * controller after every map mutation and pushed here as plain data.
	 * `null` means the map isn't ready yet. Keeping this as serialisable data —
	 * rather than reaching into the controller/pixi — keeps the SSR module graph
	 * free of browser-only code.
	 */
	trackStatus: TrackStatus | null;

	/**
	 * Mirror of the placement controller's undo stack, pushed as plain data after
	 * every edit — same arrangement as {@link trackStatus}: the controller owns
	 * the document, the store carries only what the UI has to render.
	 */
	canUndo: boolean;
	canRedo: boolean;
	/** Name of the edit the undo button would reverse (null when disabled). */
	undoLabel: string | null;
	/** Name of the edit the redo button would re-apply (null when disabled). */
	redoLabel: string | null;

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
	/** Toggle the hover train-info tooltip on/off (clears hover when neither train toggle is on). */
	toggleShowTrainInfo: () => void;
	/** Toggle the hover train-timetable tooltip on/off (clears hover when neither train toggle is on). */
	toggleShowTrainTimetable: () => void;
	/** Toggle the ground grid on/off. */
	toggleShowGrid: () => void;
	/** Choose JSON or YAML for the next Save. */
	setSaveFormat: (format: MapFileFormat) => void;
	/** Toggle the keyboard-shortcut reference overlay. */
	toggleShortcuts: () => void;
	/** Open or close the keyboard-shortcut reference overlay. */
	setShortcuts: (open: boolean) => void;
	/** Record the outcome of an autosave attempt. */
	setAutosave: (autosave: {
		lastSavedAt: number | null;
		error: boolean;
	}) => void;
	/** Push (or clear) the track-info snapshot for the tooltip to render. */
	setHoveredTrackInfo: (info: HoveredTrackInfo | null) => void;
	/** Push (or clear) the train-info snapshot for the tooltip to render. */
	setHoveredTrainInfo: (info: HoveredTrainInfo | null) => void;
	/** Push a freshly-computed track connectivity summary for the UI to read. */
	setTrackStatus: (status: TrackStatus | null) => void;
	/** Push a fresh undo/redo summary for the toolbar to read. */
	setHistoryState: (state: {
		canUndo: boolean;
		canRedo: boolean;
		undoLabel: string | null;
		redoLabel: string | null;
	}) => void;

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

	/**
	 * Hint for the direction tool (e.g. "click past the switch"). Shown in the
	 * footer while the gesture is still open. Null when there is nothing to say.
	 */
	directionHint: string | null;
	/** Set (or clear) the direction-tool hint. */
	setDirectionHint: (hint: string | null) => void;

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
	showTrainInfo: false,
	showTrainTimetable: false,
	showGrid: true,
	saveFormat: "json",
	autosave: { lastSavedAt: null, error: false },
	showShortcuts: false,
	hoveredTrackInfo: null,
	hoveredTrainInfo: null,
	trackStatus: null,
	historyRevision: 0,
	canUndo: false,
	canRedo: false,
	undoLabel: null,
	redoLabel: null,
	zoom: DEFAULT_ZOOM,
	toolbarPos: { x: 16, y: 16 },
	sectionStart: null,
	sectionEnd: null,
	sectionTracks: [],
	directionStart: null,
	directionHint: null,
	directionMode: "set",

	setTool: (tool) => {
		debugLog("store", `setTool: ${tool}`);
		// Picking any tool cancels the one being left, whatever it was: a
		// half-made two-click gesture and an open dialog belong to the old tool,
		// and a section selection keeps its edit panel on screen over the canvas
		// (swallowing clicks meant for the new tool) for as long as it is set.
		set({
			tool,
			pendingNameTarget: null,
			pendingText: null,
			sectionStart: null,
			sectionEnd: null,
			sectionTracks: [],
			directionStart: null,
			directionHint: null,
			// Erase mode is disarmed too: a destructive mode should not be lying
			// in wait when the direction tool is picked up again later.
			directionMode: "set",
			// The Add palette's selection is the exception — it survives a trip to
			// another tool and back, so returning to Add resumes with the same
			// track ready to place.
			...(tool === "add" ? {} : { selectedKind: null, selectedSubtype: null }),
		});
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
	toggleShowTrainInfo: () =>
		set((s) => {
			const next = !s.showTrainInfo;
			return {
				showTrainInfo: next,
				hoveredTrainInfo:
					!next && !s.showTrainTimetable ? null : s.hoveredTrainInfo,
			};
		}),
	toggleShowTrainTimetable: () =>
		set((s) => {
			const next = !s.showTrainTimetable;
			return {
				showTrainTimetable: next,
				hoveredTrainInfo: !next && !s.showTrainInfo ? null : s.hoveredTrainInfo,
			};
		}),
	toggleShowGrid: () => set((s) => ({ showGrid: !s.showGrid })),
	setSaveFormat: (format) => {
		debugLog("store", `setSaveFormat: ${format}`);
		set({ saveFormat: format });
	},
	setAutosave: (autosave) => set({ autosave }),
	toggleShortcuts: () => set((s) => ({ showShortcuts: !s.showShortcuts })),
	setShortcuts: (open) => set({ showShortcuts: open }),
	setHoveredTrackInfo: (info) => set({ hoveredTrackInfo: info }),
	setHoveredTrainInfo: (info) => set({ hoveredTrainInfo: info }),
	setTrackStatus: (status) => set({ trackStatus: status }),
	setHistoryState: (state) =>
		set((s) => ({ ...state, historyRevision: s.historyRevision + 1 })),
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
		// Clearing the start also drops any "click past the switch" hint — the
		// gesture that produced it is over (cancel, success, or empty-cell).
		set({ directionStart: loc, ...(loc ? {} : { directionHint: null }) });
	},

	setDirectionHint: (hint) => {
		debugLog("store", `setDirectionHint: ${hint ?? "null"}`);
		set({ directionHint: hint });
	},

	setDirectionMode: (mode) => {
		debugLog("store", `setDirectionMode: ${mode}`);
		// A pending start belongs to the gesture being abandoned — switching what
		// the second click would do mid-gesture would surprise.
		set({ directionMode: mode, directionStart: null, directionHint: null });
	},
}));
