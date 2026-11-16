import { useEffect, useState } from "react";
import { ErrorBoundary } from "#/components/ErrorBoundary";
import { PanelCrash } from "#/components/PanelCrash";
import { useEditorHotkeys } from "#/hooks/useEditorHotkeys";
import { useOperateSession } from "#/hooks/useOperateSession";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";
import { AddPalette } from "./AddPalette";
import { CanvasCrash } from "./CanvasCrash";
import { ModeGateNotice } from "./ModeGateNotice";
import { ModeSwitcher } from "./ModeSwitcher";
import { NameElementDialog } from "./NameElementDialog";
import { OperatePanel } from "./operate/OperatePanel";
import { TrainContextMenu } from "./operate/TrainContextMenu";
import { TrainDialogs } from "./operate/TrainDialogs";
import { PaletteCrash, ToolbarCrash } from "./PanelFallbacks";
import { SectionEditPanel } from "./SectionEditPanel";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { SimCanvas } from "./SimCanvas";
import { StatusBar } from "./StatusBar";
import { TextInputDialog } from "./TextInputDialog";
import { Toolbar } from "./Toolbar";
import { TrackInfoTooltip } from "./TrackInfoTooltip";
import { TrainInfoTooltip } from "./TrainInfoTooltip";
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
					<ErrorBoundary
						name="The canvas"
						fallback={(args) => <CanvasCrash {...args} />}
					>
						<SimCanvas />
					</ErrorBoundary>
					<ErrorBoundary
						name="The mode switcher"
						fallback={(args) => (
							<PanelCrash
								name="The mode switcher"
								{...args}
								className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-xl border shadow-sm"
							/>
						)}
					>
						<ModeSwitcher />
					</ErrorBoundary>
					<ErrorBoundary name="The mode notice" fallback={() => null}>
						<ModeGateNotice />
					</ErrorBoundary>
					{mode === "railway" ? (
						<>
							<ErrorBoundary
								name="The toolbar"
								fallback={(args) => <ToolbarCrash {...args} />}
							>
								<Toolbar />
							</ErrorBoundary>
							<ErrorBoundary
								name="The add palette"
								fallback={(args) => <PaletteCrash {...args} />}
							>
								<AddPalette />
							</ErrorBoundary>
							<ErrorBoundary
								name="The section panel"
								fallback={(args) => (
									<PanelCrash
										name="The section panel"
										{...args}
										className="absolute right-4 top-16 z-10 w-80 border shadow-sm"
									/>
								)}
							>
								<SectionEditPanel />
							</ErrorBoundary>
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
					<ErrorBoundary name="The dialogs" fallback={() => null}>
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
						<TrainInfoTooltip />
					</ErrorBoundary>
				</div>
				{mode === "timetable" ? (
					<ErrorBoundary
						name="The timetable editor"
						fallback={(args) => (
							<PanelCrash
								name="The timetable editor"
								{...args}
								className="w-[34rem] shrink-0 border-l border-border"
							/>
						)}
					>
						<TimetableEditor />
					</ErrorBoundary>
				) : null}
				{mode === "operate" ? (
					<>
						<ErrorBoundary
							name="The operate panel"
							fallback={(args) => (
								<PanelCrash
									name="The operate panel"
									{...args}
									className="w-[24rem] shrink-0 border-l border-border"
								/>
							)}
						>
							<OperatePanel />
						</ErrorBoundary>
						{/* Nothing visible to fall back to: the menu and dialogs only
						    appear on demand, and leaving operate mode remounts them. */}
						<ErrorBoundary name="The train menu" fallback={() => null}>
							<TrainContextMenu />
							<TrainDialogs />
						</ErrorBoundary>
					</>
				) : null}
			</div>
			<ErrorBoundary
				name="The status bar"
				fallback={(args) => (
					<PanelCrash
						name="The status bar"
						{...args}
						className="h-7 flex-row items-center justify-between gap-3 overflow-hidden border-t border-border px-3 py-0 text-[11px]"
					/>
				)}
			>
				<StatusBar />
			</ErrorBoundary>
		</div>
	);
}
