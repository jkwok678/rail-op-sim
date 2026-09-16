import { PlacementController } from "#/engine/PlacementController";
import { debugLog } from "#/lib/debugLogger";
import { downloadMap, pickAndReadMapFile } from "#/lib/mapFile";

/**
 * Save and load, shared by the footer buttons and their hotkeys so the two paths
 * can't drift — the same reason the zoom commands live in `viewportActions`.
 *
 * Both reach the map through the singleton {@link PlacementController}, the way
 * the dialogs do.
 */

export function saveMap(): void {
	const controller = PlacementController.instance;
	if (!controller) return;
	downloadMap(controller.serialize());
	debugLog("saveload", "saved map to file");
}

export async function loadMap(): Promise<void> {
	try {
		// The picker has to be opened from the user gesture that got us here — a
		// keydown carries user activation, so the hotkey path works too.
		const data = await pickAndReadMapFile();
		if (!data) return; // picker cancelled
		const controller = PlacementController.instance;
		if (!controller) return;
		controller.loadFromData(data);
		debugLog("saveload", "loaded map from file");
	} catch (err) {
		console.error("mapActions: failed to load map file", err);
	}
}
