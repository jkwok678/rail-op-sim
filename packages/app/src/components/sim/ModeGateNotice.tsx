import { useEffect } from "react";
import { Button } from "#/components/ui/button";
import {
	type AppMode,
	useBlockedReasons,
	useModeStore,
} from "#/store/mode-store";

const MODE_LABEL: Record<AppMode, string> = {
	railway: "Railway",
	timetable: "Timetable",
	operate: "Operate",
};

/**
 * Says why a mode the user just tried to enter is locked.
 *
 * The switcher's tooltip needs a hover and the mode hotkeys have no surface at
 * all, so a refused switch would otherwise look like nothing happened. The
 * reason is read live, not copied when the switch was refused: when the user
 * fixes the cause the notice clears itself instead of lingering as a stale
 * complaint. When the blocker is only the timetable and the timetable editor
 * is itself reachable, it offers to open it.
 */
export function ModeGateNotice() {
	const notice = useModeStore((s) => s.blockedNotice);
	const dismiss = useModeStore((s) => s.dismissBlockedNotice);
	const setMode = useModeStore((s) => s.setMode);
	const blocked = useBlockedReasons();
	const reason = notice ? blocked[notice] : null;

	useEffect(() => {
		if (notice && !reason) dismiss();
	}, [notice, reason, dismiss]);

	if (!notice || !reason) return null;

	const canFixInTimetable = notice === "operate" && blocked.timetable === null;

	return (
		<div
			role="status"
			className="absolute left-1/2 top-16 z-10 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-background/95 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm"
		>
			<span className="flex-1">
				{MODE_LABEL[notice]} is locked — {reason}
			</span>
			{canFixInTimetable ? (
				<Button
					variant="outline"
					size="xs"
					onClick={() => setMode("timetable")}
				>
					Open timetable
				</Button>
			) : null}
			<button type="button" className="underline" onClick={dismiss}>
				Dismiss
			</button>
		</div>
	);
}
