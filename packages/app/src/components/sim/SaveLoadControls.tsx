import { FloppyDisk, FolderOpen } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { useShortcutDisplay } from "#/hooks/useShortcutDisplay";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";

/**
 * Footer Save/Load buttons, acting on the current mode's document. The work
 * itself lives in `lib/documentActions` so these buttons and their hotkeys run
 * the same code.
 */
export function SaveLoadControls() {
	const saveKey = useShortcutDisplay("save");
	const loadKey = useShortcutDisplay("load");
	const saveFormat = useEditorStore((s) => s.saveFormat);
	const mode = useModeStore((s) => s.mode);
	const noun = mode === "timetable" ? "timetable" : "map";
	const formatLabel = saveFormat === "yaml" ? "YAML" : "JSON";
	const saveLabel = `Save ${noun} as ${formatLabel}`;
	const loadLabel = `Load ${noun} from JSON or YAML`;

	return (
		<>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={saveDocument}
				aria-label={saveLabel}
				title={saveKey ? `${saveLabel} (${saveKey})` : saveLabel}
			>
				<FloppyDisk />
			</Button>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={() => void loadDocument()}
				aria-label={loadLabel}
				title={loadKey ? `${loadLabel} (${loadKey})` : loadLabel}
			>
				<FolderOpen />
			</Button>
		</>
	);
}
