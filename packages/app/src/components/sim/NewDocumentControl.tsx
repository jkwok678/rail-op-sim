import { FilePlus } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { clearTimetable, newRailway } from "#/lib/documentActions";
import { useModeStore } from "#/store/mode-store";

/** What the button does in each editing mode. Operate edits nothing. */
const ACTIONS = {
	railway: {
		label: "New railway",
		title: "Start a new railway?",
		description:
			"This clears the map and its timetable. It cannot be undone — save first if you want to keep them.",
		confirm: "Start new railway",
		run: newRailway,
	},
	timetable: {
		label: "Clear timetable",
		title: "Clear the timetable?",
		description:
			"This removes every service. The railway stays. It cannot be undone — save first if you want to keep it.",
		confirm: "Remove all services",
		run: clearTimetable,
	},
} as const;

/**
 * Footer button to start over. The session is autosaved and restored on
 * refresh, so without this there is no way back to an empty canvas short of
 * clearing site data. Asks first, since nothing it throws away can be undone.
 */
export function NewDocumentControl() {
	const mode = useModeStore((s) => s.mode);
	const [open, setOpen] = useState(false);
	if (mode === "operate") return null;
	const action = ACTIONS[mode];

	const confirm = () => {
		action.run();
		setOpen(false);
	};

	return (
		<>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={() => setOpen(true)}
				aria-label={action.label}
				title={action.label}
			>
				<FilePlus />
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					showCloseButton={false}
					// Keep Escape from also reaching the editor's Escape cascade.
					onEscapeKeyDown={(e) => e.stopPropagation()}
				>
					<DialogHeader>
						<DialogTitle>{action.title}</DialogTitle>
						<DialogDescription>{action.description}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" size="sm" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" size="sm" onClick={confirm}>
							{action.confirm}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
