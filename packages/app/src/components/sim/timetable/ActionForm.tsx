import { Plus, Trash } from "@phosphor-icons/react";
import type { Action, Cell, ServiceRef } from "@rail-op-sim/shared";
import { Button } from "#/components/ui/button";
import type { PendingCellPick } from "#/store/timetable-store";
import {
	CellField,
	ChoiceField,
	NumberField,
	TextField,
	TimeField,
} from "./fields";

/**
 * The fields for one action, chosen by its kind.
 *
 * One component with a switch rather than a component per kind: the kinds
 * share almost everything (a time, sometimes a location, sometimes a service
 * reference), and fifteen near-identical files would hide that. What differs
 * between two kinds should be visible side by side.
 */

export interface ActionFormProps {
	action: Action;
	/** Replace the action with an edited copy. */
	onChange: (action: Action) => void;
	/** Locations on the railway, for the location fields. */
	locations: string[];
	/** Other services in the timetable, for the reference fields. */
	otherRefs: ServiceRef[];
	/** Arm the canvas to fill one of this action's cell fields. */
	onPick: (field: PendingCellPick["field"], exitIndex?: number) => void;
	/** The pick currently armed, if it belongs to this action. */
	pendingPick: PendingCellPick | null;
}

export function ActionForm({
	action,
	onChange,
	locations,
	otherRefs,
	onPick,
	pendingPick,
}: ActionFormProps) {
	/** Edit one field of the action, keeping its kind. */
	const patch = <T extends Action>(changes: Partial<T>): void => {
		onChange({ ...action, ...changes } as Action);
	};

	const picking = (field: PendingCellPick["field"], exitIndex?: number) =>
		pendingPick?.field === field &&
		(field !== "exit" || pendingPick.exitIndex === exitIndex);

	const refField = (
		label: string,
		value: string,
		commit: (ref: ServiceRef) => void,
	) => (
		<ChoiceField
			label={label}
			value={value}
			options={otherRefs}
			onCommit={commit}
			emptyHint="No other services to refer to yet."
		/>
	);

	const locationField = (value: string, commit: (name: string) => void) => (
		<ChoiceField
			label="Location"
			value={value}
			options={locations}
			onCommit={commit}
			emptyHint="This railway has no named platforms."
		/>
	);

	switch (action.kind) {
		case "startNew":
		case "startNewShuttle":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					{/* Rear then front: the pair is what sets which way the train
					    faces, and reading it in that order matches the map. */}
					<CellField
						label="Rear"
						value={action.rear}
						onCommit={(rear: Cell) => patch({ rear })}
						onPick={() => onPick("rear")}
						picking={picking("rear")}
					/>
					<CellField
						label="Front"
						value={action.front}
						onCommit={(front: Cell) => patch({ front })}
						onPick={() => onPick("front")}
						picking={picking("front")}
					/>
				</>
			);

		case "startNewService":
		case "startFromSplit":
		case "startShuttle":
		case "startFromShuttle":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					{refField("From service", action.fromRef, (fromRef) =>
						patch({ fromRef }),
					)}
				</>
			);

		case "stop":
			return (
				<>
					{locationField(action.location, (location) => patch({ location }))}
					{/* Both times are optional: one alone is RailOS's single-time
					    stop, which the validator reads as a departure at the first
					    location and an arrival anywhere else. */}
					<div className="grid grid-cols-2 gap-1.5">
						<TimeField
							label="Arrive"
							value={action.arrive}
							onCommit={(arrive) => patch({ arrive })}
						/>
						<TimeField
							label="Depart"
							value={action.depart}
							onCommit={(depart) => patch({ depart })}
						/>
					</div>
					<NumberField
						label="Minimum dwell (s)"
						value={action.minDwellSeconds ?? 0}
						min={0}
						onCommit={(minDwellSeconds) => patch({ minDwellSeconds })}
					/>
				</>
			);

		case "pass":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					{locationField(action.location, (location) => patch({ location }))}
				</>
			);

		case "changeDirection":
			return (
				<TimeField
					label="Time"
					value={action.time}
					onCommit={(time) => patch({ time })}
				/>
			);

		case "frontSplit":
		case "rearSplit":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					{refField("Portion becomes", action.newRef, (newRef) =>
						patch({ newRef }),
					)}
				</>
			);

		case "joinedBy":
		case "finishJoin":
		case "finishShuttleRemainHere":
			return (
				<>
					{action.kind !== "finishShuttleRemainHere" ? (
						<TimeField
							label="Time"
							value={action.time}
							onCommit={(time) => patch({ time })}
						/>
					) : null}
					{refField("Other service", action.otherRef, (otherRef) =>
						patch({ otherRef }),
					)}
				</>
			);

		case "changeDescription":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					<TextField
						label="New description"
						value={action.description}
						onCommit={(description) => patch({ description })}
					/>
				</>
			);

		case "changeMaxSpeed":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					<NumberField
						label="Maximum speed (km/h)"
						value={action.maxSpeedKmh}
						min={1}
						onCommit={(maxSpeedKmh) => patch({ maxSpeedKmh })}
					/>
				</>
			);

		case "finishNewService":
		case "finishShuttleNewService":
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					{refField("Next service", action.nextRef, (nextRef) =>
						patch({ nextRef }),
					)}
				</>
			);

		case "finishExit": {
			const setExit = (index: number, cell: Cell): void => {
				patch({ exits: action.exits.map((c, i) => (i === index ? cell : c)) });
			};
			return (
				<>
					<TimeField
						label="Time"
						value={action.time}
						onCommit={(time) => patch({ time })}
					/>
					{/* Several exits are allowed, and any one of them finishes the
					    service — so a diverted train still ends its day properly. */}
					{action.exits.map((exit, index) => (
						<div
							// Exits are positional and may repeat while being edited, so
							// the index is the only stable identity a row has.
							// biome-ignore lint/suspicious/noArrayIndexKey: positional list
							key={index}
							className="flex items-end gap-1"
						>
							<div className="flex-1">
								<CellField
									label={`Exit ${index + 1}`}
									value={exit}
									onCommit={(cell) => setExit(index, cell)}
									onPick={() => onPick("exit", index)}
									picking={picking("exit", index)}
								/>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={`Remove exit ${index + 1}`}
								onClick={() =>
									patch({ exits: action.exits.filter((_, i) => i !== index) })
								}
							>
								<Trash />
							</Button>
						</div>
					))}
					<Button
						variant="outline"
						size="xs"
						onClick={() =>
							patch({ exits: [...action.exits, { gx: 0, gy: 0 }] })
						}
					>
						<Plus /> Add an exit
					</Button>
				</>
			);
		}

		case "finishRemainHere":
			// The one action with nothing to set: a train staying put has no time
			// to be late for and nowhere else to be.
			return (
				<p className="text-[10px] text-muted-foreground italic">
					The train stays where the last action left it, under the signaller.
				</p>
			);
	}
}
