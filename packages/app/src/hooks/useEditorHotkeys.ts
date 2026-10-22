import { type UseHotkeyDefinition, useHotkeys } from "@tanstack/react-hotkeys";
import { PlacementController } from "#/engine/PlacementController";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import { resolveEscape } from "#/lib/escape";
import { SHORTCUT_ORDER, SHORTCUTS, type ShortcutId } from "#/lib/shortcuts";
import { fitToView, zoomIn, zoomOut } from "#/lib/viewportActions";
import { useEditorStore } from "#/store/editor-store";
import { timetableBlockedReason, useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Bind the editor's keyboard shortcuts. Mount once, from the layout that owns
 * the canvas.
 *
 * Every key comes from the `SHORTCUTS` registry — this file says what a shortcut
 * *does*, never what it is called — so the keys, the toolbar badges and the `?`
 * overlay cannot disagree.
 *
 * Reaches the document through the singleton placement controller, the same way
 * the dialogs and the save/load controls do — the map lives there, not in the
 * store.
 *
 * Only the state that gates a binding is subscribed to; callbacks read the rest
 * through `getState()`, since the library re-syncs them every render and a
 * subscription to (say) the hovered track would re-render this on every pointer
 * move for nothing.
 */
export function useEditorHotkeys(): void {
	const tool = useEditorStore((s) => s.tool);
	const canUndo = useEditorStore((s) => s.canUndo);
	const canRedo = useEditorStore((s) => s.canRedo);
	const railwayConnected = useEditorStore(
		(s) => s.trackStatus?.connected ?? false,
	);
	const timetableBlocked = useEditorStore(
		(s) => timetableBlockedReason(s.trackStatus) !== null,
	);
	const mode = useModeStore((s) => s.mode);
	const pendingText = useEditorStore((s) => s.pendingText);
	const pendingNameTarget = useEditorStore((s) => s.pendingNameTarget);
	const showShortcuts = useEditorStore((s) => s.showShortcuts);

	// Single-key shortcuts must not fire behind an overlay. The two edit dialogs
	// put focus in an <input>, so `ignoreInputs` usually covers them, but not once
	// the user tabs to a button — and the shortcuts overlay has no input at all,
	// so every letter and digit would otherwise reach the canvas behind it.
	const overlayOpen = Boolean(
		pendingText || pendingNameTarget || showShortcuts,
	);

	/** Escape's target depends on state; `resolveEscape` decides, this applies. */
	const runEscape = (): void => {
		const state = useEditorStore.getState();
		const timetable = useTimetableStore.getState();
		const action = resolveEscape({
			...state,
			timetableCellPick: timetable.pendingCellPick,
		});
		switch (action.type) {
			case "cancelCellPick":
				timetable.cancelCellPick();
				break;
			case "cancelSection":
				// Both halves: the store action alone leaves the pixi highlight on
				// screen, which is why the panel's Cancel button does the same pair.
				state.clearSectionSelection();
				PlacementController.instance?.clearSectionHighlight();
				break;
			case "cancelDirection":
				state.setDirectionStart(null);
				break;
			case "paletteBack":
				state.selectKind(null);
				break;
			case "resetTool":
				state.setTool("select");
				break;
			case "none":
				break;
		}
	};

	/** What each shortcut does. Keys live in the registry, behaviour lives here. */
	const run: Record<ShortcutId, () => void> = {
		toolSelect: () => useEditorStore.getState().setTool("select"),
		toolAdd: () => useEditorStore.getState().setTool("add"),
		toolText: () => useEditorStore.getState().setTool("text"),
		toolLink: () => useEditorStore.getState().setTool("link"),
		toolSection: () => useEditorStore.getState().setTool("section"),
		toolDirection: () => useEditorStore.getState().setTool("direction"),
		toggleEraseMode: () => {
			const s = useEditorStore.getState();
			s.setDirectionMode(s.directionMode === "erase" ? "set" : "erase");
		},

		toggleGrid: () => useEditorStore.getState().toggleShowGrid(),
		toggleLinkHighlights: () =>
			useEditorStore.getState().toggleLinkHighlights(),
		toggleDirections: () => useEditorStore.getState().toggleShowDirections(),
		toggleTrackInfo: () => useEditorStore.getState().toggleShowTrackInfo(),

		modeRailway: () => useModeStore.getState().setMode("railway"),
		modeTimetable: () => useModeStore.getState().setMode("timetable"),

		zoomIn: () => zoomIn(PlacementController.instance?.viewport),
		zoomOut: () => zoomOut(PlacementController.instance?.viewport),
		fitToView: () => fitToView(PlacementController.instance?.viewport),

		save: () => saveDocument(),
		load: () => void loadDocument(),

		undo: () => PlacementController.instance?.undo(),
		redo: () => PlacementController.instance?.redo(),

		help: () => useEditorStore.getState().toggleShortcuts(),
		escape: runEscape,

		// Bound by SectionEditPanel, which owns the values being applied.
		applySection: () => {},
	};

	/**
	 * Which shortcuts are live right now. Mirrors the toolbar's own disabled
	 * states so a key is never able to do what its button refuses to.
	 */
	const enabledFor = (id: ShortcutId): boolean => {
		// The map is read-only outside railway mode, so nothing that edits it —
		// a tool, erase mode, the map's undo history — can be reachable by key
		// while the toolbar that offers them is off screen.
		const editingRailway = mode === "railway";
		switch (id) {
			case "toolSelect":
			case "toolAdd":
			case "toolText":
			case "toolLink":
			case "toolSection":
				return !overlayOpen && editingRailway;
			case "toolDirection":
				return !overlayOpen && editingRailway && railwayConnected;
			case "toggleEraseMode":
				return !overlayOpen && editingRailway && tool === "direction";
			// Mirrors the switcher: the timetable needs a railway that is
			// operationally complete, not merely joined.
			case "modeTimetable":
				return !overlayOpen && !timetableBlocked;
			case "undo":
				return editingRailway && canUndo;
			case "redo":
				return editingRailway && canRedo;
			// The key that opens the reference has to close it again, so it can't
			// be gated on the overlay it controls — only on the edit dialogs, where
			// the user is typing.
			case "help":
				return !pendingText && !pendingNameTarget;
			// Escape has to work *because* an overlay is open, and the modified
			// shortcuts are unambiguous enough to leave live.
			case "escape":
			case "save":
			case "load":
				return true;
			default:
				return !overlayOpen;
		}
	};

	// One row per registry entry, always, in registry order: `useHotkeys` keys
	// registrations by array index, so a row that disappears would re-register
	// every row after it. Conditionality goes through `enabled`, which only
	// suppresses firing.
	const definitions: UseHotkeyDefinition[] = SHORTCUT_ORDER.map((id) => {
		const shortcut = SHORTCUTS[id];
		return {
			hotkey: shortcut.hotkey,
			callback: () => run[id](),
			options: {
				// Has to be set explicitly: it defaults to false for Ctrl/Meta combos,
				// so without this Mod+Z would fire while the user is typing in the name
				// or text dialog and undo a map edit instead of their keystroke.
				// Escape is the deliberate exception — it must reach us from inside an
				// input to cancel the gesture the input belongs to.
				ignoreInputs: id !== "escape",
				enabled: enabledFor(id),
				meta: { name: shortcut.label, description: shortcut.label },
			},
		};
	});

	useHotkeys(definitions);
}
