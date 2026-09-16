import { FloppyDisk, FolderOpen } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { useShortcutDisplay } from "#/hooks/useShortcutDisplay";
import { loadMap, saveMap } from "#/lib/mapActions";
import { useEditorStore } from "#/store/editor-store";

/**
 * Footer Save/Load buttons. The work itself lives in `lib/mapActions` so these
 * buttons and their hotkeys run the same code.
 */
export function SaveLoadControls() {
	const saveKey = useShortcutDisplay("save");
	const loadKey = useShortcutDisplay("load");
	const saveFormat = useEditorStore((s) => s.saveFormat);
	const formatLabel = saveFormat === "yaml" ? "YAML" : "JSON";
	const saveLabel = `Save map as ${formatLabel}`;

	return (
		<>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={saveMap}
				aria-label={saveLabel}
				title={saveKey ? `${saveLabel} (${saveKey})` : saveLabel}
			>
				<FloppyDisk />
			</Button>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={loadMap}
				aria-label="Load map from JSON or YAML"
				title={
					loadKey
						? `Load map from JSON or YAML (${loadKey})`
						: "Load map from JSON or YAML"
				}
			>
				<FolderOpen />
			</Button>
		</>
	);
}
