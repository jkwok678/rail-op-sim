import { Clock, Path, Train } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { KbdGroup } from "#/components/ui/kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { useShortcutKeys } from "#/hooks/useShortcutDisplay";
import type { ShortcutId } from "#/lib/shortcuts";
import {
	type AppMode,
	useBlockedReasons,
	useModeStore,
} from "#/store/mode-store";

const MODES: {
	mode: AppMode;
	label: string;
	Icon: typeof Path;
	shortcut: ShortcutId;
}[] = [
	{ mode: "railway", label: "Railway", Icon: Path, shortcut: "modeRailway" },
	{
		mode: "timetable",
		label: "Timetable",
		Icon: Clock,
		shortcut: "modeTimetable",
	},
	{ mode: "operate", label: "Operate", Icon: Train, shortcut: "modeOperate" },
];

/**
 * The segmented control at the top of the canvas that says which document is
 * being edited, and switches it.
 *
 * Timetable is locked until the railway is complete, and Operate until there
 * is also a timetable without errors, with the reason in the tooltip. A locked
 * mode is `aria-disabled` rather than `disabled`: it stays focusable, so the
 * tooltip fires on hover and focus without a wrapper, and a click still
 * reaches `setMode`, which refuses it and raises the notice saying why — a
 * dead button explains nothing to someone who did not hover it.
 */
export function ModeSwitcher() {
	const mode = useModeStore((s) => s.mode);
	const setMode = useModeStore((s) => s.setMode);
	const blocked = useBlockedReasons();

	return (
		<div
			role="radiogroup"
			aria-label="Mode"
			className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1 rounded-xl border bg-background/95 p-1 shadow-sm backdrop-blur-sm"
		>
			{MODES.map(({ mode: m, label, Icon, shortcut }) => {
				const active = mode === m;
				const reason = active ? null : blocked[m];
				const button = (
					<Button
						role="radio"
						aria-checked={active}
						variant={active ? "secondary" : "ghost"}
						size="sm"
						aria-disabled={reason !== null}
						className="aria-disabled:opacity-50"
						onClick={() => setMode(m)}
					>
						<Icon />
						{label}
					</Button>
				);
				return (
					<Tooltip key={m}>
						<TooltipTrigger asChild>{button}</TooltipTrigger>
						{/* No badge while operating: the mode keys are off there, so
						    a slip can't end the session. */}
						<ModeTip
							shortcut={reason || mode === "operate" ? undefined : shortcut}
						>
							{reason ?? `${label} mode`}
						</ModeTip>
					</Tooltip>
				);
			})}
		</div>
	);
}

/** Tooltip body with the shortcut badge alongside it, as in the toolbar. */
function ModeTip({
	children,
	shortcut,
}: {
	children: React.ReactNode;
	shortcut?: ShortcutId;
}) {
	// Hooks can't be conditional, so always resolve and decide at render.
	const keys = useShortcutKeys(shortcut ?? "modeRailway");
	return (
		<TooltipContent side="bottom">
			<span>{children}</span>
			<KbdGroup keys={shortcut ? keys : []} />
		</TooltipContent>
	);
}
