import {
	SignalAspect,
	type SignalAspectValue,
	type TrackKind,
} from "@rail-op-sim/shared";
import { create } from "zustand";
import { debugLog } from "#/lib/debugLogger";

/** The active editing tool. */
export type Tool = "select" | "add" | "delete" | "name" | "link" | "section";

/** Non-track element types placeable from the Add palette. */
export type ElementKind =
	| "namedLocation"
	| "concourse"
	| "parapet"
	| "text"
	| "platform"
	| "levelCrossing";

/** Element types that can be named with the "name" tool. */
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
	 * World coordinates where the user clicked to place text.
	 * When non-null, the text input dialog opens to collect content.
	 */
	pendingTextLocation: { x: number; y: number } | null;

	/**
	 * Grid coordinates and element kind of the element the user clicked with the
	 * "name" tool. When non-null, the NameElementDialog opens to set/change/delete
	 * its label.
	 */
	pendingNameTarget: { gx: number; gy: number; kind: NameableKind } | null;

	/** Whether the linked track highlight overlay is visible. */
	showLinkHighlights: boolean;

	/** Whether hovering the canvas shows a floating track-info tooltip. */
	showTrackInfo: boolean;

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
	trackStatus: { total: number; connected: boolean } | null;

	/** Switch the active tool. Leaving "add" clears the palette selection. */
	setTool: (tool: Tool) => void;
	/** Choose a category (clears any subtype). Pass null to go back to categories. */
	selectKind: (kind: AddKind | null) => void;
	/** Choose the subtype to place. */
	selectSubtype: (subtype: string | null) => void;
	/** Set the signal aspect type. */
	setAspect: (aspect: SignalAspectValue) => void;
	/** Store the world-coordinate location where text should be placed, triggering the dialog. */
	setPendingTextLocation: (loc: { x: number; y: number } | null) => void;
	/** Store the grid-coordinate target for the "name" tool, triggering the dialog. */
	setPendingNameTarget: (loc: { gx: number; gy: number; kind: NameableKind } | null) => void;
	/** Toggle the linked track highlight overlay on/off. */
	toggleLinkHighlights: () => void;
	/** Toggle the hover track-info tooltip on/off (clears any hover when off). */
	toggleShowTrackInfo: () => void;
	/** Push (or clear) the track-info snapshot for the tooltip to render. */
	setHoveredTrackInfo: (info: HoveredTrackInfo | null) => void;
	/** Push a freshly-computed track connectivity summary for the UI to read. */
	setTrackStatus: (status: { total: number; connected: boolean } | null) => void;

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
}

export const useEditorStore = create<EditorState>((set) => ({
	tool: "select",
	selectedKind: null,
	selectedSubtype: null,
	selectedAspect: SignalAspect.FOUR_ASPECT,
	pendingTextLocation: null,
	pendingNameTarget: null,
	showLinkHighlights: false,
	showTrackInfo: false,
	hoveredTrackInfo: null,
	trackStatus: null,
	sectionStart: null,
	sectionEnd: null,
	sectionTracks: [],

	setTool: (tool) => {
		debugLog("store", `setTool: ${tool}`);
		set(
			tool === "add"
				? { tool, pendingNameTarget: null }
				: {
						tool,
						selectedKind: null,
						selectedSubtype: null,
						pendingNameTarget: null,
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

	setPendingTextLocation: (loc) => {
		debugLog(
			"store",
			`setPendingTextLocation: ${loc ? `(${loc.x.toFixed(1)},${loc.y.toFixed(1)})` : "null"}`,
		);
		set({ pendingTextLocation: loc });
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
	toggleShowTrackInfo: () =>
		set((s) => ({
			showTrackInfo: !s.showTrackInfo,
			hoveredTrackInfo: s.showTrackInfo ? null : s.hoveredTrackInfo,
		})),
	setHoveredTrackInfo: (info) => set({ hoveredTrackInfo: info }),
	setTrackStatus: (status) => set({ trackStatus: status }),

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
}));
