import type { TrainTimetableRow, TrainView } from "@rail-op-sim/shared";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { useOperateStore } from "#/store/operate-store";
import { simCommand } from "#/store/sim-bridge";

export function TrainDialogs() {
	const dialog = useOperateStore((s) => s.trainDialog);
	const closeTrainDialog = useOperateStore((s) => s.closeTrainDialog);
	const trains = useOperateStore((s) => s.view?.trains);
	const timetables = useOperateStore((s) => s.timetables);

	const train = dialog
		? (trains?.find((t) => t.id === dialog.trainId) ?? null)
		: null;

	if (!dialog || !train) return null;

	switch (dialog.kind) {
		case "skipActions":
			return (
				<SkipActionsDialog
					key={train.id}
					train={train}
					rows={timetables[train.id] ?? []}
					onClose={closeTrainDialog}
				/>
			);
		case "becomeNewService":
			return (
				<BecomeNewServiceDialog
					key={train.id}
					train={train}
					onClose={closeTrainDialog}
				/>
			);
		case "setReminder":
			return (
				<SetReminderDialog
					key={train.id}
					train={train}
					onClose={closeTrainDialog}
				/>
			);
		case "removeTrain":
			return (
				<RemoveTrainDialog
					key={train.id}
					train={train}
					onClose={closeTrainDialog}
				/>
			);
	}
}

function SkipActionsDialog({
	train,
	rows,
	onClose,
}: {
	train: TrainView;
	rows: readonly TrainTimetableRow[];
	onClose: () => void;
}) {
	const firstFuture = train.timetableIndex + 1;
	const lastSkippable = rows.length - 1;
	const candidates = rows
		.map((row, index) => ({ row, index }))
		.filter(({ index }) => index >= firstFuture && index < lastSkippable);
	const [selected, setSelected] = useState<number | null>(
		candidates[0]?.index ?? null,
	);

	const handleConfirm = () => {
		if (selected === null) return;
		void simCommand({
			type: "skipActions",
			trainId: train.id,
			toIndex: selected,
		});
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						Skip Timetabled Actions —{" "}
						<span className="font-mono">{train.headcode}</span>
					</DialogTitle>
					<DialogDescription>
						Choose the next timetabled action for this train to resume from.
					</DialogDescription>
				</DialogHeader>
				<div
					role="listbox"
					aria-label="Timetable actions"
					className="max-h-60 overflow-y-auto rounded-md border border-border p-1"
				>
					{candidates.length === 0 ? (
						<p className="p-2 text-xs text-muted-foreground">
							No later timetable actions available.
						</p>
					) : (
						candidates.map(({ row, index }) => (
							<button
								key={index}
								type="button"
								role="option"
								aria-selected={selected === index}
								onClick={() => setSelected(index)}
								className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs ${
									selected === index
										? "bg-accent font-medium text-accent-foreground"
										: "hover:bg-muted/60"
								}`}
							>
								<span className="w-24 shrink-0 font-mono text-muted-foreground tabular-nums">
									{row.time ?? "—"}
								</span>
								<span className="truncate">{row.label}</span>
							</button>
						))
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button
						size="sm"
						disabled={selected === null}
						onClick={handleConfirm}
					>
						Skip to selected
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function BecomeNewServiceDialog({
	train,
	onClose,
}: {
	train: TrainView;
	onClose: () => void;
}) {
	const followOn = train.followOnServiceRef;
	const handleConfirm = () => {
		void simCommand({
			type: "becomeNewService",
			trainId: train.id,
		});
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						Become Follow-On Service Early —{" "}
						<span className="font-mono">{train.headcode}</span>
					</DialogTitle>
					<DialogDescription>
						{followOn
							? `Skip remaining events on ${train.headcode} and become follow-on service ${followOn} at this location?`
							: "No follow-on service is available at this location."}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button size="sm" disabled={!followOn} onClick={handleConfirm}>
						Become {followOn ?? "service"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function RemoveTrainDialog({
	train,
	onClose,
}: {
	train: TrainView;
	onClose: () => void;
}) {
	const handleConfirm = () => {
		void simCommand({
			type: "removeTrain",
			trainId: train.id,
		});
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						Remove Train — <span className="font-mono">{train.headcode}</span>
					</DialogTitle>
					<DialogDescription>
						{train.headcode} will be removed from the railway. Proceed?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="destructive" size="sm" onClick={handleConfirm}>
						Remove train
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function SetReminderDialog({
	train,
	onClose,
}: {
	train: TrainView;
	onClose: () => void;
}) {
	const [text, setText] = useState(train.reminder ?? "");

	useEffect(() => {
		setText(train.reminder ?? "");
	}, [train.reminder]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		void simCommand({
			type: "setReminder",
			trainId: train.id,
			reminder: text.trim() || null,
		});
		onClose();
	};

	const handleClear = () => {
		void simCommand({
			type: "setReminder",
			trainId: train.id,
			reminder: null,
		});
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						Set Reminder — <span className="font-mono">{train.headcode}</span>
					</DialogTitle>
					<DialogDescription>
						Attach a short signaller note shown on the train list and tooltip.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						autoFocus
						placeholder="e.g. Hold at platform 2 for connection"
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>
					<DialogFooter>
						{train.reminder ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={handleClear}
							>
								Clear
							</Button>
						) : null}
						<Button type="button" variant="outline" size="sm" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" size="sm">
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
