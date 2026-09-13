import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/useTheme";
import { useEditorStore } from "#/store/editor-store";
import { AddPalette } from "./AddPalette";
import { NameElementDialog } from "./NameElementDialog";
import { SaveLoadControls } from "./SaveLoadControls";
import { SectionEditPanel } from "./SectionEditPanel";
import { SettingsMenu } from "./SettingsMenu";
import { SimCanvas } from "./SimCanvas";
import { TextInputDialog } from "./TextInputDialog";
import { Toolbar } from "./Toolbar";
import { TrackInfoTooltip } from "./TrackInfoTooltip";

/**
 * Full-screen simulation layout — the PixiJS canvas fills the entire viewport.
 */
export function SimLayout() {
	const { theme, toggle } = useTheme();
	const pendingNameTarget = useEditorStore((s) => s.pendingNameTarget);
	const pendingText = useEditorStore((s) => s.pendingText);
	const trackStatus = useEditorStore((s) => s.trackStatus);
	const tool = useEditorStore((s) => s.tool);
	const directionHint = useEditorStore((s) => s.directionHint);

	const [nameDialogOpen, setNameDialogOpen] = useState(false);
	const [textDialogOpen, setTextDialogOpen] = useState(false);

	// Derive dialog visibility from the store so there is a single source of
	// truth.  When `pendingNameTarget` is set the dialog opens; when it is
	// cleared (by handleConfirm/handleCancel) the dialog closes.
	useEffect(() => {
		if (pendingNameTarget) {
			setNameDialogOpen(true);
		} else {
			setNameDialogOpen(false);
		}
	}, [pendingNameTarget]);

	// Same pattern for the Text tool's dialog.
	useEffect(() => {
		if (pendingText) {
			setTextDialogOpen(true);
		} else {
			setTextDialogOpen(false);
		}
	}, [pendingText]);

	// Derive connectivity status from the plain summary the placement controller
	// publishes to the store. No pixi/controller access here, so this component
	// stays safe to render on the server.
	const connectivity = useMemo(() => {
		if (!trackStatus) {
			return { label: "Loading…", color: "bg-muted-foreground" };
		}
		const { total, dangling, unpairedLinked, firstIssue } = trackStatus;
		const tracks = `${total} ${total === 1 ? "track" : "tracks"}`;

		if (total === 0) {
			return { label: "No tracks", color: "bg-muted-foreground" };
		}
		if (trackStatus.connected) {
			return { label: `${tracks} · all connected`, color: "bg-lagoon" };
		}

		// Name each fault and where to start looking, rather than just saying
		// something is wrong.
		const faults: string[] = [];
		if (dangling > 0) {
			faults.push(`${dangling} with open ends`);
		}
		if (unpairedLinked > 0) {
			faults.push(
				`${unpairedLinked} unpaired ${unpairedLinked === 1 ? "portal" : "portals"}`,
			);
		}
		const where = firstIssue
			? ` · first at (${firstIssue.gx}, ${firstIssue.gy})`
			: "";

		return {
			label: `${tracks} · ${faults.join(", ") || "incomplete"}${where}`,
			color: "bg-amber-500",
		};
	}, [trackStatus]);

	return (
		<div className="h-dvh w-full grid grid-rows-[1fr_auto]">
			<div className="relative overflow-hidden">
				<SimCanvas />
				<Toolbar />
				<AddPalette />
				<SectionEditPanel />
				<NameElementDialog
					open={nameDialogOpen}
					onOpenChange={setNameDialogOpen}
				/>
				<TextInputDialog
					open={textDialogOpen}
					onOpenChange={setTextDialogOpen}
				/>
				<TrackInfoTooltip />
			</div>
			<footer className="h-7 border-t border-border bg-muted/30 flex items-center justify-between px-3 text-[11px] text-muted-foreground select-none">
				<span className="inline-flex items-center gap-1.5">
					<span className={`size-1.5 rounded-full ${connectivity.color}`} />
					{connectivity.label}
					{tool === "direction" && directionHint ? (
						<span className="text-amber-600 dark:text-amber-400">
							· {directionHint}
						</span>
					) : null}
				</span>
				<div className="flex items-center gap-1">
					<SaveLoadControls />
					<SettingsMenu />
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={toggle}
						aria-label={
							theme === "light" ? "Switch to dark mode" : "Switch to light mode"
						}
					>
						{theme === "light" ? <Moon /> : <Sun />}
					</Button>
				</div>
			</footer>
		</div>
	);
}
