import { Keyboard, Moon, Sun } from "@phosphor-icons/react";
import { useMemo } from "react";
import { Button } from "#/components/ui/button";
import { useTheme } from "#/hooks/useTheme";
import { describeConnectivity } from "#/lib/connectivity";
import { useEditorStore } from "#/store/editor-store";
import { SaveLoadControls } from "./SaveLoadControls";
import { SettingsMenu } from "./SettingsMenu";

/** What the theme button offers: the other theme, never the current one. */
const THEME_SWITCH = {
	light: { label: "Switch to dark mode", Icon: Moon },
	dark: { label: "Switch to light mode", Icon: Sun },
};

/**
 * The footer: how complete the railway is, any hint from the direction tool,
 * and the document and display controls.
 */
export function StatusBar() {
	const { theme, toggle } = useTheme();
	const trackStatus = useEditorStore((s) => s.trackStatus);
	const tool = useEditorStore((s) => s.tool);
	const directionHint = useEditorStore((s) => s.directionHint);
	const toggleShortcuts = useEditorStore((s) => s.toggleShortcuts);

	// Derive connectivity status from the plain summary the placement controller
	// publishes to the store. No pixi/controller access here, so this component
	// stays safe to render on the server.
	const connectivity = useMemo(
		() => describeConnectivity(trackStatus),
		[trackStatus],
	);
	const themeSwitch = THEME_SWITCH[theme];

	return (
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
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={toggleShortcuts}
					aria-label="Keyboard shortcuts"
					title="Keyboard shortcuts (?)"
				>
					<Keyboard />
				</Button>
				<SaveLoadControls />
				<SettingsMenu />
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={toggle}
					aria-label={themeSwitch.label}
				>
					<themeSwitch.Icon />
				</Button>
			</div>
		</footer>
	);
}
