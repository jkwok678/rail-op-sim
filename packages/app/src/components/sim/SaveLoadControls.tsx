import { FloppyDisk, FolderOpen } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { useShortcutDisplay } from "#/hooks/useShortcutDisplay";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import type { MapFileFormat } from "#/lib/mapFile";
import { useEditorStore } from "#/store/editor-store";
import { type AppMode, useModeStore } from "#/store/mode-store";

/** Accessible labels for Save and Load in each mode. */
function actionLabels(mode: AppMode, saveFormat: MapFileFormat) {
	if (mode === "operate") {
		return {
			save: "Save — leave operate mode to save the railway or timetable",
			load: "Load — leave operate mode to load a railway or timetable",
		};
	}
	const format = saveFormat === "yaml" ? "YAML" : "JSON";
	if (mode === "timetable") {
		return {
			save: `Save timetable as ${format}`,
			load: "Load timetable from JSON or YAML",
		};
	}
	return {
		save: `Save map as ${format}`,
		load: "Load railway and/or timetable from JSON or YAML (select both to load together)",
	};
}

interface ActionButtonProps {
	label: string;
	shortcut: string;
	disabled: boolean;
	onClick: () => void;
	children: ReactNode;
}

/**
 * Footer icon button for Save or Load. Disabled `<Button>` sets
 * `pointer-events: none`, which suppresses native title tooltips, so when
 * disabled we move the title onto a wrapping `<span>` and omit the shortcut.
 */
function ActionButton({
	label,
	shortcut,
	disabled,
	onClick,
	children,
}: ActionButtonProps) {
	const title = !disabled && shortcut ? `${label} (${shortcut})` : label;
	const button = (
		<Button
			variant="ghost"
			size="icon-xs"
			disabled={disabled}
			onClick={onClick}
			aria-label={label}
			title={disabled ? undefined : title}
		>
			{children}
		</Button>
	);
	return disabled ? (
		<span className="inline-flex" title={title}>
			{button}
		</span>
	) : (
		button
	);
}

/**
 * Footer Save/Load buttons, acting on the current mode's document. The work
 * itself lives in `lib/documentActions` so these buttons and their hotkeys run
 * the same code. Both are disabled in operate mode, where neither document is
 * being edited and loading would swap the map underneath the running session.
 */
export function SaveLoadControls() {
	const saveKey = useShortcutDisplay("save");
	const loadKey = useShortcutDisplay("load");
	const saveFormat = useEditorStore((s) => s.saveFormat);
	const mode = useModeStore((s) => s.mode);
	const operating = mode === "operate";
	const labels = actionLabels(mode, saveFormat);

	return (
		<>
			<ActionButton
				label={labels.save}
				shortcut={saveKey}
				disabled={operating}
				onClick={saveDocument}
			>
				<FloppyDisk />
			</ActionButton>
			<ActionButton
				label={labels.load}
				shortcut={loadKey}
				disabled={operating}
				onClick={() => void loadDocument()}
			>
				<FolderOpen />
			</ActionButton>
		</>
	);
}
