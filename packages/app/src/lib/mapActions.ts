import { PlacementController } from "#/editor/PlacementController";
import { debugLog } from "#/lib/debugLogger";
import { downloadMap, type LoadedMapFile } from "#/lib/mapFile";
import { useEditorStore } from "#/store/editor-store";

/**
 * Map save and apply helpers, shared by the footer buttons and their hotkeys
 * so the two paths can't drift — the same reason the zoom commands live in
 * `viewportActions`.
 *
 * Both reach the map through the singleton {@link PlacementController}, the way
 * the dialogs do. The encoding (JSON or YAML) comes from the store so a save
 * matches the last load, or whatever the settings row currently says.
 */

export function saveMap(): void {
	const controller = PlacementController.instance;
	if (!controller) return;
	const format = useEditorStore.getState().saveFormat;
	downloadMap(controller.serialize(), { format });
	debugLog("saveload", `saved map to file (${format})`);
}

/** Put an already-parsed map on the canvas and remember its encoding. */
export function applyLoadedMap(loaded: LoadedMapFile): void {
	const controller = PlacementController.instance;
	if (!controller) return;
	controller.loadFromData(loaded.data);
	// Keep the next save in the same encoding the file used, so a YAML map
	// doesn't get rewritten as JSON (or the other way) on the first Cmd+S.
	useEditorStore.getState().setSaveFormat(loaded.format);
	debugLog("saveload", `loaded map from file (${loaded.format})`);
}
