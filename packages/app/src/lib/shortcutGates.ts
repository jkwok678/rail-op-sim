import { SHORTCUT_ORDER, type ShortcutId } from "#/lib/shortcuts";
import type { Tool } from "#/store/editor-store";
import type { AppMode } from "#/store/mode-store";

/** The editor state a shortcut's availability depends on. */
export interface ShortcutGateState {
	mode: AppMode;
	tool: Tool;
	canUndo: boolean;
	canRedo: boolean;
	/** Every link joined and every portal paired: the direction tool's gate. */
	railwayConnected: boolean;
	/** The railway is not yet complete enough to timetable. */
	timetableBlocked: boolean;
	/** The text or name dialog is open, with the user typing in it. */
	editDialogOpen: boolean;
	/** The shortcuts reference is open. */
	shortcutsOpen: boolean;
	/** `[` and `]` have another service to select. */
	timetableCanStep: boolean;
	/** Alt+Up has an action it can move. */
	timetableCanMoveUp: boolean;
	/** Alt+Down has an action it can move. */
	timetableCanMoveDown: boolean;
	/** `N` has a problem it can land on. */
	timetableCanNextIssue: boolean;
	/** A canvas cell-pick is waiting; list keys stay out of it. */
	timetablePicking: boolean;
}

/**
 * Which shortcuts are live right now. Mirrors the toolbar's own disabled states
 * so a key is never able to do what its button refuses to.
 *
 * Kept out of the hook so the rules can be read, and tested, as a table rather
 * than through a rendered keyboard.
 */
export function liveShortcuts(
	state: ShortcutGateState,
): Record<ShortcutId, boolean> {
	// Single-key shortcuts must not fire behind an overlay. The two edit dialogs
	// put focus in an <input>, so `ignoreInputs` usually covers them, but not
	// once the user tabs to a button — and the shortcuts overlay has no input at
	// all, so every letter and digit would otherwise reach the canvas behind it.
	const overlayOpen = state.editDialogOpen || state.shortcutsOpen;
	// The map is read-only outside railway mode, so nothing that edits it — a
	// tool, erase mode, the map's undo history — can be reachable by key while
	// the toolbar that offers them is off screen.
	const editingRailway = state.mode === "railway";
	const toolsLive = !overlayOpen && editingRailway;
	// The timetable keys drive the docked editor. They exist only while that
	// editor is the mode on screen, and never during a cell-pick — Escape is
	// how that gesture is cancelled.
	const timetableLive =
		!overlayOpen && state.mode === "timetable" && !state.timetablePicking;

	/** Where a shortcut differs from the default of "not behind an overlay". */
	const exceptions: Partial<Record<ShortcutId, boolean>> = {
		toolSelect: toolsLive,
		toolAdd: toolsLive,
		toolText: toolsLive,
		toolLink: toolsLive,
		toolSection: toolsLive,
		toolDirection: toolsLive && state.railwayConnected,
		toggleEraseMode: toolsLive && state.tool === "direction",
		// Mirrors the switcher: the timetable needs a railway that is
		// operationally complete, not merely joined.
		modeTimetable: !overlayOpen && !state.timetableBlocked,
		prevService: timetableLive && state.timetableCanStep,
		nextService: timetableLive && state.timetableCanStep,
		nextIssue: timetableLive && state.timetableCanNextIssue,
		moveActionUp: timetableLive && state.timetableCanMoveUp,
		moveActionDown: timetableLive && state.timetableCanMoveDown,
		undo: editingRailway && state.canUndo,
		redo: editingRailway && state.canRedo,
		// The key that opens the reference has to close it again, so it can't be
		// gated on the overlay it controls — only on the edit dialogs, where the
		// user is typing.
		help: !state.editDialogOpen,
		// Escape has to work *because* an overlay is open, and the modified
		// shortcuts are unambiguous enough to leave live.
		escape: true,
		save: true,
		load: true,
	};

	return Object.fromEntries(
		SHORTCUT_ORDER.map((id) => [id, exceptions[id] ?? !overlayOpen]),
	) as Record<ShortcutId, boolean>;
}
