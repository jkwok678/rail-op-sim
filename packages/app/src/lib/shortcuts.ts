import {
	formatForDisplay,
	type RegisterableHotkey,
} from "@tanstack/react-hotkeys";

/**
 * The single source of truth for every keyboard shortcut in the editor.
 *
 * Nothing outside this file contains a literal key string. The hotkey hook binds
 * from it, the toolbar renders its badges from it, and the `?` overlay lists it —
 * so a key can never drift from what the UI says the key is. Adding a shortcut is
 * an entry here plus a case in the hook's dispatch.
 */

/** Stable identifier for a shortcut, used to look one up from a binding site. */
export type ShortcutId =
	| "toolSelect"
	| "toolAdd"
	| "toolText"
	| "toolLink"
	| "toolSection"
	| "toolDirection"
	| "toggleEraseMode"
	| "toggleGrid"
	| "toggleLinkHighlights"
	| "toggleDirections"
	| "toggleTrackInfo"
	| "zoomIn"
	| "zoomOut"
	| "fitToView"
	| "save"
	| "load"
	| "undo"
	| "redo"
	| "help"
	| "escape"
	| "applySection";

/** Heading a shortcut is listed under in the reference overlay. */
export type ShortcutGroup =
	| "Tools"
	| "View"
	| "Edit"
	| "File"
	| "Display"
	| "Help";

export interface Shortcut {
	id: ShortcutId;
	/** What gets registered. A string, or the object form for keys the string union rejects. */
	hotkey: RegisterableHotkey;
	/**
	 * Badge text, when `formatForDisplay` reads badly for this key. Set for the
	 * object-form hotkeys, whose formatting would show the modifier separately.
	 */
	display?: string;
	/** What the overlay row and the tooltip say the key does. */
	label: string;
	group: ShortcutGroup;
	/**
	 * Bound somewhere other than the global hook (currently only the section
	 * panel, which scopes its Enter to itself). Excluded from the global
	 * uniqueness check, since a scoped key may reuse a global one.
	 */
	scoped?: boolean;
}

export const SHORTCUTS: Record<ShortcutId, Shortcut> = {
	// Tools — digits in the order the toolbar lists them, so it reads 1-6 top to
	// bottom.
	toolSelect: {
		id: "toolSelect",
		hotkey: "1",
		label: "Select",
		group: "Tools",
	},
	toolAdd: { id: "toolAdd", hotkey: "2", label: "Add track", group: "Tools" },
	toolText: { id: "toolText", hotkey: "3", label: "Add text", group: "Tools" },
	toolLink: { id: "toolLink", hotkey: "4", label: "Link", group: "Tools" },
	toolSection: {
		id: "toolSection",
		hotkey: "5",
		label: "Set speed & length",
		group: "Tools",
	},
	toolDirection: {
		id: "toolDirection",
		hotkey: "6",
		label: "Set direction",
		group: "Tools",
	},
	toggleEraseMode: {
		id: "toggleEraseMode",
		hotkey: "E",
		label: "Erase directions (direction tool)",
		group: "Tools",
	},

	// Display toggles — plain mnemonic letters, free because the tools took the
	// digits.
	toggleGrid: {
		id: "toggleGrid",
		hotkey: "G",
		label: "Show grid",
		group: "Display",
	},
	toggleLinkHighlights: {
		id: "toggleLinkHighlights",
		hotkey: "L",
		label: "Show link highlights",
		group: "Display",
	},
	toggleDirections: {
		id: "toggleDirections",
		hotkey: "D",
		label: "Show direction arrows",
		group: "Display",
	},
	toggleTrackInfo: {
		id: "toggleTrackInfo",
		hotkey: "I",
		label: "Show track info",
		group: "Display",
	},

	// View. Deliberately unmodified: Ctrl/Cmd +/-/0 are UA-level browser zoom and
	// preventDefault does not reliably cancel them, so a modified binding would
	// zoom the page *and* the canvas.
	zoomIn: { id: "zoomIn", hotkey: "=", label: "Zoom in", group: "View" },
	zoomOut: { id: "zoomOut", hotkey: "-", label: "Zoom out", group: "View" },
	fitToView: {
		id: "fitToView",
		hotkey: "F",
		label: "Fit to view",
		group: "View",
	},

	// File.
	save: { id: "save", hotkey: "Mod+S", label: "Save map", group: "File" },
	load: { id: "load", hotkey: "Mod+O", label: "Load map", group: "File" },

	// Edit.
	undo: { id: "undo", hotkey: "Mod+Z", label: "Undo", group: "Edit" },
	redo: { id: "redo", hotkey: "Mod+Shift+Z", label: "Redo", group: "Edit" },
	escape: {
		id: "escape",
		hotkey: "Escape",
		label: "Cancel / back out",
		group: "Edit",
	},
	applySection: {
		id: "applySection",
		hotkey: "Enter",
		label: "Apply section edit",
		group: "Edit",
		scoped: true,
	},

	// Help. The string union types Shift combos as `Shift+${NonPunctuationKey}`,
	// so "Shift+/" will not compile; the object form is the library's sanctioned
	// way out, and matches event.key === "?" directly.
	help: {
		id: "help",
		hotkey: { key: "?", shift: true },
		display: "?",
		label: "Keyboard shortcuts",
		group: "Help",
	},
};

/**
 * Registration order for the global `useHotkeys` array.
 *
 * `useHotkeys` keys each registration by its array index, so a row that
 * disappears re-registers every row after it. Always emit one row per entry here,
 * in this order, and express conditionality through `enabled` instead of
 * filtering. `applySection` is absent because the section panel binds it.
 */
export const SHORTCUT_ORDER: ShortcutId[] = [
	"toolSelect",
	"toolAdd",
	"toolText",
	"toolLink",
	"toolSection",
	"toolDirection",
	"toggleEraseMode",
	"toggleGrid",
	"toggleLinkHighlights",
	"toggleDirections",
	"toggleTrackInfo",
	"zoomIn",
	"zoomOut",
	"fitToView",
	"save",
	"load",
	"undo",
	"redo",
	"help",
	"escape",
];

/** Headings for the reference overlay, in the order it shows them. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
	"Tools",
	"Edit",
	"View",
	"Display",
	"File",
	"Help",
];

/** The shortcuts in a group, in registry order. */
export function shortcutsInGroup(group: ShortcutGroup): Shortcut[] {
	return Object.values(SHORTCUTS).filter((s) => s.group === group);
}

/**
 * Badge text for a shortcut — "⌘ S" on mac, "Ctrl+S" elsewhere.
 *
 * Pass `platform` to keep the result deterministic; left out, the library sniffs
 * `navigator`, which returns "linux" during SSR and mismatches on hydration.
 */
export function shortcutDisplay(
	id: ShortcutId,
	platform?: "mac" | "windows" | "linux",
): string {
	const shortcut = SHORTCUTS[id];
	if (shortcut.display) return shortcut.display;
	return formatForDisplay(shortcut.hotkey, platform ? { platform } : {});
}

/**
 * Separator handed to the formatter purely so the result can be split back
 * apart. A real one ("+" or " ") is ambiguous, because a key can *be* "-" or a
 * space; this can't collide with any key name.
 */
const SEGMENT_SEPARATOR = "\u0000";

/**
 * A shortcut's keys as separate caps — ["⌘", "S"] rather than "⌘ S" — so a combo
 * renders as one badge per key instead of a single wide one.
 */
export function shortcutKeys(
	id: ShortcutId,
	platform?: "mac" | "windows" | "linux",
): string[] {
	const shortcut = SHORTCUTS[id];
	if (shortcut.display) return [shortcut.display];
	return formatForDisplay(shortcut.hotkey, {
		...(platform ? { platform } : {}),
		separatorToken: SEGMENT_SEPARATOR,
	}).split(SEGMENT_SEPARATOR);
}

/** Whether a shortcut's badge text depends on the platform (i.e. uses Mod). */
export function isPlatformDependent(id: ShortcutId): boolean {
	const { hotkey, display } = SHORTCUTS[id];
	if (display) return false;
	return typeof hotkey === "string" && hotkey.includes("Mod");
}
