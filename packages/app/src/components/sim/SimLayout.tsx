import { Moon, Sun } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/useTheme";
import { AddPalette } from "./AddPalette";
import { SimCanvas } from "./SimCanvas";
import { Toolbar } from "./Toolbar";

/**
 * Full-screen simulation layout — the PixiJS canvas fills the entire viewport.
 */
export function SimLayout() {
	const { theme, toggle } = useTheme();

	return (
		<div className="h-dvh w-full grid grid-rows-[1fr_auto]">
			<div className="relative overflow-hidden">
				<SimCanvas />
				<Toolbar />
				<AddPalette />
			</div>
			<footer className="h-7 border-t border-border bg-muted/30 flex items-center justify-between px-3 text-[11px] text-muted-foreground select-none">
				<span className="inline-flex items-center gap-1.5">
					<span className="size-1.5 rounded-full bg-lagoon" />
					Ready
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
