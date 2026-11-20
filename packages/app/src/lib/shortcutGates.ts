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
	/** Operate mode: at least one train can currently be called on (§5.13). */
	canCallOn?: boolean;
	/** Operate mode: a train control dialog (reminder, skip, new service) is open. */
	trainDialogOpen?: boolean;
}

/**
 * Railway tools and undo/redo — the map is read-only outside railway mode, so
 * nothing that edits it can be reachable by key while its toolbar is off screen.
 */
function railwayExceptions(
	state: ShortcutGateState,
	overlayOpen: boolean,
): Partial<Record<ShortcutId, boolean>> {
	const editingRailway = state.mode === "railway";
	const toolsLive = !overlayOpen && editingRailway;
	return {
		toolSelect: toolsLive,
		toolAdd: toolsLive,
		toolText: toolsLive,
		toolLink: toolsLive,
		toolSection: toolsLive,
		toolDirection: toolsLive && state.railwayConnected,
		toggleEraseMode: toolsLive && state.tool === "direction",
		undo: editingRailway && state.canUndo,
		redo: editingRailway && state.canRedo,
	};
}

/** Signalling keys — live only while the operate panel is on screen. */
function operateExceptions(
	state: ShortcutGateState,
	overlayOpen: boolean,
): Partial<Record<ShortcutId, boolean>> {
	const operateLive = !overlayOpen && state.mode === "operate";
	return {
		operateRunPause: operateLive,
		operateSlower: operateLive,
		operateFaster: operateLive,
		routeAuto: operateLive,
		routeAutoAll: operateLive,
		routePreferred: operateLive,
		routeUnrestricted: operateLive,
		routeCallOn: operateLive && Boolean(state.canCallOn),
		routeCancel: operateLive,
		operateLog: operateLive,
	};
}

/**
 * Timetable list keys — live only while the docked editor is on screen and
 * never during a cell-pick, where Escape cancels the gesture.
 */
function timetableExceptions(
	state: ShortcutGateState,
	overlayOpen: boolean,
): Partial<Record<ShortcutId, boolean>> {
	const timetableLive =
		!overlayOpen && state.mode === "timetable" && !state.timetablePicking;
	return {
		prevService: timetableLive && state.timetableCanStep,
		nextService: timetableLive && state.timetableCanStep,
		nextIssue: timetableLive && state.timetableCanNextIssue,
		moveActionUp: timetableLive && state.timetableCanMoveUp,
		moveActionDown: timetableLive && state.timetableCanMoveDown,
	};
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
	const typingDialogOpen =
		state.editDialogOpen || Boolean(state.trainDialogOpen);
	const overlayOpen = typingDialogOpen || state.shortcutsOpen;
	// Leaving a session throws it away, so the keys that switch mode are dead
	// while operating: R and T sit among the signalling keys, and a slip would
	// end the session. The switcher's buttons remain the way out.
	const modeKeysLive = !overlayOpen && state.mode !== "operate";

	/** Where a shortcut differs from the default of "not behind an overlay". */
	const exceptions: Partial<Record<ShortcutId, boolean>> = {
		...railwayExceptions(state, overlayOpen),
		...operateExceptions(state, overlayOpen),
		...timetableExceptions(state, overlayOpen),
		// A gated mode's key stays live: `setMode` refuses it and raises the
		// switcher's notice saying why, where a dead key would just do nothing.
		modeRailway: modeKeysLive,
		modeTimetable: modeKeysLive,
		modeOperate: !overlayOpen,
		// The key that opens the reference has to close it again, so it can't be
		// gated on the overlay it controls — only on the edit dialogs, where the
		// user is typing.
		help: !typingDialogOpen,
		// Escape has to work *because* an overlay is open. Save and load are
		// modified combos so they stay live behind overlays, except while
		// operating — where neither document is being edited and loading would
		// swap the map underneath the running worker session.
		escape: true,
		save: state.mode !== "operate",
		load: state.mode !== "operate",
	};

	return Object.fromEntries(
		SHORTCUT_ORDER.map((id) => [id, exceptions[id] ?? !overlayOpen]),
	) as Record<ShortcutId, boolean>;
}
