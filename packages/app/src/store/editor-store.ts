import {
	SignalAspect,
	type SignalAspectValue,
	type TrackKind,
} from "@rail-op-sim/shared";
import { create } from "zustand";
import { debugLog } from "#/lib/debugLogger";

/** The active editing tool. */
export type Tool = "select" | "add" | "delete" | "name" | "link";

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
}

export const useEditorStore = create<EditorState>((set) => ({
	tool: "select",
	selectedKind: null,
	selectedSubtype: null,
	selectedAspect: SignalAspect.FOUR_ASPECT,
	pendingTextLocation: null,
	pendingNameTarget: null,
	showLinkHighlights: false,

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
}));
