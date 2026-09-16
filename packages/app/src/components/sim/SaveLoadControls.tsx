import { FloppyDisk, FolderOpen } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { useShortcutDisplay } from "#/hooks/useShortcutDisplay";
import { loadMap, saveMap } from "#/lib/mapActions";

/**
 * Footer Save/Load buttons. The work itself lives in `lib/mapActions` so these
 * buttons and their hotkeys run the same code.
 */
export function SaveLoadControls() {
	const saveKey = useShortcutDisplay("save");
	const loadKey = useShortcutDisplay("load");

	return (
		<>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={saveMap}
				aria-label="Save map to file"
				title={saveKey ? `Save map to file (${saveKey})` : "Save map to file"}
			>
				<FloppyDisk />
			</Button>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={loadMap}
				aria-label="Load map from file"
				title={
					loadKey ? `Load map from file (${loadKey})` : "Load map from file"
				}
			>
				<FolderOpen />
			</Button>
		</>
	);
}
