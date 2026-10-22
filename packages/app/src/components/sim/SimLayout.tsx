import { useEffect, useState } from "react";
import { useEditorHotkeys } from "#/hooks/useEditorHotkeys";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { AddPalette } from "./AddPalette";
import { ModeSwitcher } from "./ModeSwitcher";
import { NameElementDialog } from "./NameElementDialog";
import { SectionEditPanel } from "./SectionEditPanel";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { SimCanvas } from "./SimCanvas";
import { StatusBar } from "./StatusBar";
import { TextInputDialog } from "./TextInputDialog";
import { Toolbar } from "./Toolbar";
import { TrackInfoTooltip } from "./TrackInfoTooltip";
import { TimetableEditor } from "./timetable/TimetableEditor";

/**
 * Full-screen simulation layout — the PixiJS canvas fills the viewport, less
 * the timetable editor docked beside it in timetable mode.
 *
 * The railway tools are mounted only in railway mode: in timetable mode the
 * map is a read-only backdrop, and a toolbar that can't be used shouldn't be
 * on screen pretending otherwise.
 */
export function SimLayout() {
	useEditorHotkeys();
	const pendingNameTarget = useEditorStore((s) => s.pendingNameTarget);
	const pendingText = useEditorStore((s) => s.pendingText);
	const mode = useModeStore((s) => s.mode);

	const [nameDialogOpen, setNameDialogOpen] = useState(false);
	const [textDialogOpen, setTextDialogOpen] = useState(false);

	// Derive dialog visibility from the store so there is a single source of
	// truth.  When `pendingNameTarget` is set the dialog opens; when it is
	// cleared (by handleConfirm/handleCancel) the dialog closes.
	useEffect(() => {
		setNameDialogOpen(Boolean(pendingNameTarget));
	}, [pendingNameTarget]);

	// Same pattern for the Text tool's dialog.
	useEffect(() => {
		setTextDialogOpen(Boolean(pendingText));
	}, [pendingText]);

	return (
		<div className="h-dvh w-full grid grid-rows-[1fr_auto]">
			<div className="flex min-h-0">
				<div className="relative min-w-0 flex-1 overflow-hidden">
					<SimCanvas />
					<ModeSwitcher />
					{mode === "railway" ? (
						<>
							<Toolbar />
							<AddPalette />
							<SectionEditPanel />
						</>
					) : null}
					<NameElementDialog
						open={nameDialogOpen}
						onOpenChange={setNameDialogOpen}
					/>
					<TextInputDialog
						open={textDialogOpen}
						onOpenChange={setTextDialogOpen}
					/>
					<ShortcutsDialog />
					<TrackInfoTooltip />
				</div>
				{mode === "timetable" ? <TimetableEditor /> : null}
			</div>
			<StatusBar />
		</div>
	);
}
