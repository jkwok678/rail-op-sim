import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/useTheme";
import { useEditorStore } from "#/store/editor-store";
import { AddPalette } from "./AddPalette";
import { NameElementDialog } from "./NameElementDialog";
import { SimCanvas } from "./SimCanvas";
import { Toolbar } from "./Toolbar";

/**
 * Full-screen simulation layout — the PixiJS canvas fills the entire viewport.
 */
export function SimLayout() {
	const { theme, toggle } = useTheme();
	const pendingNameTarget = useEditorStore((s) => s.pendingNameTarget);
	const trackStatus = useEditorStore((s) => s.trackStatus);

	const [nameDialogOpen, setNameDialogOpen] = useState(false);

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

	// Derive connectivity status from the plain summary the placement controller
	// publishes to the store. No pixi/controller access here, so this component
	// stays safe to render on the server.
	const connectivity = useMemo(() => {
		if (!trackStatus) {
			return { label: "Loading…", color: "bg-muted-foreground" };
		}
		if (trackStatus.total === 0) {
			return { label: "No tracks", color: "bg-muted-foreground" };
		}
		if (trackStatus.connected) {
			return { label: "All tracks connected", color: "bg-lagoon" };
		}
		return { label: "Tracks disconnected", color: "bg-amber-500" };
	}, [trackStatus]);

	return (
		<div className="h-dvh w-full grid grid-rows-[1fr_auto]">
			<div className="relative overflow-hidden">
				<SimCanvas />
				<Toolbar />
				<AddPalette />
				<NameElementDialog
					open={nameDialogOpen}
					onOpenChange={setNameDialogOpen}
				/>
			</div>
			<footer className="h-7 border-t border-border bg-muted/30 flex items-center justify-between px-3 text-[11px] text-muted-foreground select-none">
				<span className="inline-flex items-center gap-1.5">
					<span className={`size-1.5 rounded-full ${connectivity.color}`} />
					{connectivity.label}
				</span>
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
			</footer>
		</div>
	);
}
