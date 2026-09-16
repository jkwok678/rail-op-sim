import { useHotkey } from "@tanstack/react-hotkeys";
import { PlacementController } from "#/engine/PlacementController";
import { useEditorStore } from "#/store/editor-store";

/**
 * Bind the editor's keyboard shortcuts. Mount once, from the layout that owns
 * the canvas.
 *
 * Reaches the document through the singleton placement controller, the same way
 * the dialogs and the save/load controls do — the map lives there, not in the
 * store.
 */
export function useEditorHotkeys(): void {
	const canUndo = useEditorStore((s) => s.canUndo);
	const canRedo = useEditorStore((s) => s.canRedo);

	// ignoreInputs has to be set explicitly. It defaults to false for Ctrl/Meta
	// combos, so without this Mod+Z would fire while the user is typing in the
	// name or text dialog and undo a map edit instead of their keystroke.
	// `enabled` only suppresses firing, so the binding stays in step with the
	// toolbar buttons without being torn down and rebuilt.
	useHotkey("Mod+Z", () => PlacementController.instance?.undo(), {
		ignoreInputs: true,
		enabled: canUndo,
	});

	useHotkey("Mod+Shift+Z", () => PlacementController.instance?.redo(), {
		ignoreInputs: true,
		enabled: canRedo,
	});
}
