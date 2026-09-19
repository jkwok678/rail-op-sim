import { Clock } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { useShortcutDisplay } from "#/hooks/useShortcutDisplay";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * The footer button that opens the timetable editor.
 *
 * Disabled until the railway is complete — not merely joined. A timetable
 * books trains to named platforms and runs them along preferred directions, so
 * a railway missing either cannot be timetabled against in any useful way, and
 * the editor would open onto a list of locations that does not exist yet.
 *
 * The reason is in the tooltip rather than only in the disabled state, and the
 * button is wrapped in a focusable span while disabled — a disabled `<button>`
 * swallows pointer events, so the tooltip would never fire. Same arrangement
 * as the direction tool in the toolbar.
 */
export function TimetableControls() {
	const complete = useEditorStore((s) => s.trackStatus?.complete ?? false);
	const total = useEditorStore((s) => s.trackStatus?.total ?? 0);
	const open = useTimetableStore((s) => s.open);
	const toggleOpen = useTimetableStore((s) => s.toggleOpen);
	const key = useShortcutDisplay("toggleTimetable");

	// Once open, the button has to be able to close it again, whatever the map
	// has done in the meantime.
	const disabled = !complete && !open;
	const label = "Timetable editor";
	const reason =
		total === 0
			? "Build a railway first"
			: "Finish the railway first — every element named and directed";

	const button = (
		<Button
			variant={open ? "secondary" : "ghost"}
			size="icon-xs"
			onClick={toggleOpen}
			disabled={disabled}
			aria-pressed={open}
			aria-label={disabled ? `${label} — ${reason}` : label}
		>
			<Clock />
		</Button>
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				{disabled ? <span tabIndex={-1}>{button}</span> : button}
			</TooltipTrigger>
			<TooltipContent>
				{disabled ? reason : key ? `${label} (${key})` : label}
			</TooltipContent>
		</Tooltip>
	);
}
