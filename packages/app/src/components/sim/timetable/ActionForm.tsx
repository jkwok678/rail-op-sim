import { Plus, Trash } from "@phosphor-icons/react";
import type {
	Action,
	ActionOf,
	Cell,
	ServiceRef,
	SimTime,
} from "@rail-op-sim/shared";
import type { ReactNode } from "react";
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
 * One file with a table of renderers rather than a component per kind: the
 * kinds share almost everything (a time, sometimes a location, sometimes a
 * service reference), and fifteen near-identical files would hide that. What
 * differs between two kinds should be visible side by side.
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

/** What each kind's renderer is handed: its own action, and the shared fields. */
interface FieldKit<A extends Action> {
	action: A;
	/** Edit some fields of the action, keeping its kind. */
	patch(changes: Partial<A>): void;
	refField(
		label: string,
		value: string,
		commit: (ref: ServiceRef) => void,
	): ReactNode;
	locationField(value: string, commit: (name: string) => void): ReactNode;
	cellField(
		label: string,
		field: PendingCellPick["field"],
		value: Cell,
		commit: (cell: Cell) => void,
		exitIndex?: number,
	): ReactNode;
}

type Renderer<K extends Action["kind"]> = (
	kit: FieldKit<ActionOf<K>>,
) => ReactNode;

/** The time field nearly every kind leads with. */
function timeField<A extends Action & { time: SimTime }>(kit: FieldKit<A>) {
	return (
		<TimeField
			label="Time"
			value={kit.action.time}
			onCommit={(time) => kit.patch({ time } as Partial<A>)}
		/>
	);
}

const startNewFields: Renderer<"startNew" | "startNewShuttle"> = (kit) => (
	<>
		{timeField(kit)}
		{/* Rear then front: the pair is what sets which way the train faces,
		    and reading it in that order matches the map. */}
		{kit.cellField("Rear", "rear", kit.action.rear, (rear) =>
			kit.patch({ rear }),
		)}
		{kit.cellField("Front", "front", kit.action.front, (front) =>
			kit.patch({ front }),
		)}
	</>
);

const fromRefFields: Renderer<
	"startNewService" | "startFromSplit" | "startShuttle" | "startFromShuttle"
> = (kit) => (
	<>
		{timeField(kit)}
		{kit.refField("From service", kit.action.fromRef, (fromRef) =>
			kit.patch({ fromRef }),
		)}
	</>
);

const splitFields: Renderer<"frontSplit" | "rearSplit"> = (kit) => (
	<>
		{timeField(kit)}
		{kit.refField("Portion becomes", kit.action.newRef, (newRef) =>
			kit.patch({ newRef }),
		)}
	</>
);

const otherRefField = (
	kit: FieldKit<
		ActionOf<"joinedBy" | "finishJoin" | "finishShuttleRemainHere">
	>,
) =>
	kit.refField("Other service", kit.action.otherRef, (otherRef) =>
		kit.patch({ otherRef }),
	);

const joinFields: Renderer<"joinedBy" | "finishJoin"> = (kit) => (
	<>
		{timeField(kit)}
		{otherRefField(kit)}
	</>
);

const nextRefFields: Renderer<
	"finishNewService" | "finishShuttleNewService"
> = (kit) => (
	<>
		{timeField(kit)}
		{kit.refField("Next service", kit.action.nextRef, (nextRef) =>
			kit.patch({ nextRef }),
		)}
	</>
);

const stopFields: Renderer<"stop"> = (kit) => (
	<>
		{kit.locationField(kit.action.location, (location) =>
			kit.patch({ location }),
		)}
		{/* Both times are optional: one alone is RailOS's single-time stop,
		    which the validator reads as a departure at the first location and
		    an arrival anywhere else. */}
		<div className="grid grid-cols-2 gap-1.5">
			<TimeField
				label="Arrive"
				value={kit.action.arrive}
				onCommit={(arrive) => kit.patch({ arrive })}
			/>
			<TimeField
				label="Depart"
				value={kit.action.depart}
				onCommit={(depart) => kit.patch({ depart })}
			/>
		</div>
		<NumberField
			label="Minimum dwell (s)"
			value={kit.action.minDwellSeconds ?? 0}
			min={0}
			onCommit={(minDwellSeconds) => kit.patch({ minDwellSeconds })}
		/>
	</>
);

const exitFields: Renderer<"finishExit"> = (kit) => {
	const { exits } = kit.action;
	const setExit = (index: number, cell: Cell): void => {
		kit.patch({ exits: exits.map((c, i) => (i === index ? cell : c)) });
	};
	return (
		<>
			{timeField(kit)}
			{/* Several exits are allowed, and any one of them finishes the
			    service — so a diverted train still ends its day properly. */}
			{exits.map((exit, index) => (
				<div
					// Exits are positional and may repeat while being edited, so the
					// index is the only stable identity a row has.
					// biome-ignore lint/suspicious/noArrayIndexKey: positional list
					key={index}
					className="flex items-end gap-1"
				>
					<div className="flex-1">
						{kit.cellField(
							`Exit ${index + 1}`,
							"exit",
							exit,
							(cell) => setExit(index, cell),
							index,
						)}
					</div>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`Remove exit ${index + 1}`}
						onClick={() =>
							kit.patch({ exits: exits.filter((_, i) => i !== index) })
						}
					>
						<Trash />
					</Button>
				</div>
			))}
			<Button
				variant="outline"
				size="xs"
				onClick={() => kit.patch({ exits: [...exits, { gx: 0, gy: 0 }] })}
			>
				<Plus /> Add an exit
			</Button>
		</>
	);
};

/**
 * Every kind's fields. The mapped type makes a kind added to the union a
 * compile error here until it has a form.
 */
const RENDERERS: { [K in Action["kind"]]: Renderer<K> } = {
	startNew: startNewFields,
	startNewShuttle: startNewFields,
	startNewService: fromRefFields,
	startFromSplit: fromRefFields,
	startShuttle: fromRefFields,
	startFromShuttle: fromRefFields,
	stop: stopFields,
	pass: (kit) => (
		<>
			{timeField(kit)}
			{kit.locationField(kit.action.location, (location) =>
				kit.patch({ location }),
			)}
		</>
	),
	changeDirection: timeField,
	frontSplit: splitFields,
	rearSplit: splitFields,
	joinedBy: joinFields,
	finishJoin: joinFields,
	finishShuttleRemainHere: otherRefField,
	changeDescription: (kit) => (
		<>
			{timeField(kit)}
			<TextField
				label="New description"
				value={kit.action.description}
				onCommit={(description) => kit.patch({ description })}
			/>
		</>
	),
	changeMaxSpeed: (kit) => (
		<>
			{timeField(kit)}
			<NumberField
				label="Maximum speed (km/h)"
				value={kit.action.maxSpeedKmh}
				min={1}
				onCommit={(maxSpeedKmh) => kit.patch({ maxSpeedKmh })}
			/>
		</>
	),
	finishNewService: nextRefFields,
	finishShuttleNewService: nextRefFields,
	finishExit: exitFields,
	// The one action with nothing to set: a train staying put has no time to
	// be late for and nowhere else to be.
	finishRemainHere: () => (
		<p className="text-[10px] text-muted-foreground italic">
			The train stays where the last action left it, under the signaller.
		</p>
	),
};

export function ActionForm({
	action,
	onChange,
	locations,
	otherRefs,
	onPick,
	pendingPick,
}: ActionFormProps) {
	const picking = (field: PendingCellPick["field"], exitIndex?: number) =>
		pendingPick?.field === field &&
		(field !== "exit" || pendingPick.exitIndex === exitIndex);

	const kit: FieldKit<Action> = {
		action,
		patch: (changes) => onChange({ ...action, ...changes } as Action),
		refField: (label, value, commit) => (
			<ChoiceField
				label={label}
				value={value}
				options={otherRefs}
				onCommit={commit}
				emptyHint="No other services to refer to yet."
			/>
		),
		locationField: (value, commit) => (
			<ChoiceField
				label="Location"
				value={value}
				options={locations}
				onCommit={commit}
				emptyHint="This railway has no named platforms."
			/>
		),
		cellField: (label, field, value, commit, exitIndex) => (
			<CellField
				label={label}
				value={value}
				onCommit={commit}
				onPick={() => onPick(field, exitIndex)}
				picking={picking(field, exitIndex)}
			/>
		),
	};

	const render = RENDERERS[action.kind] as Renderer<Action["kind"]>;
	return render(kit);
}
