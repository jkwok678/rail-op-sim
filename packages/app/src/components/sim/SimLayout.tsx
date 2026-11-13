import { useEffect, useState } from "react";
import { useEditorHotkeys } from "#/hooks/useEditorHotkeys";
import { useOperateSession } from "#/hooks/useOperateSession";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";
import { AddPalette } from "./AddPalette";
import { ModeSwitcher } from "./ModeSwitcher";
import { NameElementDialog } from "./NameElementDialog";
import { OperatePanel } from "./operate/OperatePanel";
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
 * the timetable editor or the operate panel docked beside it in those modes.
 *
 * The railway tools are mounted only in railway mode: in timetable mode the
 * map is a read-only backdrop, and a toolbar that can't be used shouldn't be
 * on screen pretending otherwise.
 */
export function SimLayout() {
	useEditorHotkeys();
	useOperateSession();
	const pendingNameTarget = useEditorStore((s) => s.pendingNameTarget);
	const pendingText = useEditorStore((s) => s.pendingText);
	const mode = useModeStore((s) => s.mode);
	const loadError = useTimetableStore((s) => s.loadError);

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
							{loadError ? (
								<div
									role="alert"
									className="absolute bottom-4 left-1/2 z-10 flex max-w-md -translate-x-1/2 items-start gap-2 rounded-xl border border-destructive/30 bg-background/95 px-3 py-1.5 text-xs text-destructive shadow-sm backdrop-blur-sm"
								>
									<span className="flex-1">{loadError}</span>
									<button
										type="button"
										className="underline"
										onClick={() =>
											useTimetableStore.getState().setLoadError(null)
										}
									>
										Dismiss
									</button>
								</div>
							) : null}
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
				{mode === "operate" ? <OperatePanel /> : null}
			</div>
			<StatusBar />
		</div>
	);
}
