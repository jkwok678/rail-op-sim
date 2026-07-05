import { FloppyDisk, FolderOpen } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { PlacementController } from "#/engine/PlacementController";
import { debugLog } from "#/lib/debugLogger";
import { downloadMap, pickAndReadMapFile } from "#/lib/mapFile";

/**
 * Footer Save/Load buttons. Save downloads the current map as a JSON file; Load
 * opens a file picker and rebuilds the map via the placement controller. Both
 * read the singleton {@link PlacementController} instance, mirroring how the
 * naming dialogs reach the map.
 */
export function SaveLoadControls() {
	const handleSave = () => {
		const controller = PlacementController.instance;
		if (!controller) return;
		downloadMap(controller.serialize());
		debugLog("saveload", "saved map to file");
	};

	const handleLoad = async () => {
		try {
			const data = await pickAndReadMapFile();
			if (!data) return; // picker cancelled
			const controller = PlacementController.instance;
			if (!controller) return;
			controller.loadFromData(data);
			debugLog("saveload", "loaded map from file");
		} catch (err) {
			console.error("SaveLoadControls: failed to load map file", err);
		}
	};

	return (
		<>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={handleSave}
				aria-label="Save map to file"
			>
				<FloppyDisk />
			</Button>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={handleLoad}
				aria-label="Load map from file"
			>
				<FolderOpen />
			</Button>
		</>
	);
}
