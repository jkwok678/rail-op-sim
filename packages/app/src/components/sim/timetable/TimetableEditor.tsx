import { ArrowDown, ArrowUp, Plus, Trash } from "@phosphor-icons/react";
import {
	type Action,
	actionTime,
	createDefaultTrainSpec,
	createsTrain,
	formatSimTime,
	getLocationNames,
	isStartAction,
	issuesForService,
	MAX_SERVICE_REF_LENGTH,
	type Service,
	type ServiceRef,
	type TimetableIssue,
	type TrainSpec,
} from "@rail-op-sim/shared";
import { type Ref, useEffect, useMemo, useRef } from "react";
import { Button } from "#/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { PlacementController } from "#/engine/PlacementController";
import { useEditorStore } from "#/store/editor-store";
import {
	type PendingCellPick,
	useTimetableStore,
} from "#/store/timetable-store";
import { ActionForm } from "./ActionForm";
import {
	ACTION_KIND_GROUPS,
	ACTION_KIND_OPTIONS,
	actionKindLabel,
	createAction,
	describeAction,
} from "./actionKinds";
import { NumberField, TextField, TimeField } from "./fields";

/**
 * The timetable editor: services on the left, the selected one on the right,
 * its issues underneath.
 *
 * The whole of timetable mode's UI, docked beside the canvas rather than over
 * it — "pick on map" needs the canvas clickable while the editor is open, and
 * a docked panel can never cover the cell being picked. The layout mounts it
 * only in timetable mode; saving and loading go through the footer, which acts
 * on the current mode's document.
 *
 * The map is reached through the singleton placement controller, the way the
 * other panels do, and passed into every mutator so the store can re-validate
 * against it without importing pixi itself.
 */
export function TimetableEditor() {
	const timetable = useTimetableStore((s) => s.timetable);
	const issues = useTimetableStore((s) => s.issues);
	const selectedServiceRef = useTimetableStore((s) => s.selectedServiceRef);
	const selectedActionIndex = useTimetableStore((s) => s.selectedActionIndex);
	const pendingCellPick = useTimetableStore((s) => s.pendingCellPick);
	const loadError = useTimetableStore((s) => s.loadError);
	const store = useTimetableStore.getState;

	// Recomputed when the map's completeness summary changes, which the
	// controller republishes after every map edit — including a rename, which is
	// exactly what can invalidate a location.
	const trackStatus = useEditorStore((s) => s.trackStatus);
	const locations = useMemo(() => {
		const map = PlacementController.instance?.map;
		// `trackStatus` is the controller's own change signal: it republishes the
		// summary after every map edit, a rename included, so depending on it is
		// what makes this list follow a platform that was renamed underneath a
		// service booked to it.
		if (!map || !trackStatus) return [];
		return getLocationNames(map);
	}, [trackStatus]);

	const map = PlacementController.instance?.map ?? null;
	const selected = timetable.services.find((s) => s.ref === selectedServiceRef);

	return (
		<aside
			aria-label="Timetable editor"
			className="flex w-[34rem] shrink-0 flex-col border-l border-border bg-background text-xs"
		>
			<Header />

			{loadError ? (
				<div
					role="alert"
					className="flex items-start gap-2 border-b border-border bg-destructive/10 px-3 py-1.5 text-[10px] text-destructive"
				>
					<span className="flex-1">{loadError}</span>
					<button
						type="button"
						className="underline"
						onClick={() => store().setLoadError(null)}
					>
						Dismiss
					</button>
				</div>
			) : null}

			<div className="flex min-h-0 flex-1">
				<ServiceList
					services={timetable.services}
					issues={issues}
					selectedRef={selectedServiceRef}
					onSelect={(ref) => store().selectService(ref)}
					onAdd={() => store().addService(map)}
					onRemove={(ref) => store().removeService(ref, map)}
				/>

				<div className="flex min-w-0 flex-1 flex-col">
					{selected ? (
						<ServiceDetail
							service={selected}
							locations={locations}
							otherRefs={timetable.services
								.map((s) => s.ref)
								.filter((ref) => ref !== selected.ref)}
							selectedActionIndex={selectedActionIndex}
							pendingCellPick={pendingCellPick}
						/>
					) : (
						<p className="p-3 text-muted-foreground">
							{timetable.services.length === 0
								? "No services yet. Add one to begin."
								: "Choose a service on the left."}
						</p>
					)}

					<IssuePanel
						issues={selected ? issuesForService(issues, selected.ref) : issues}
						onSelect={(index) => store().selectAction(index)}
					/>
				</div>
			</div>
		</aside>
	);
}

/** Title and start time. */
function Header() {
	const timetable = useTimetableStore((s) => s.timetable);
	const setTitle = useTimetableStore((s) => s.setTitle);
	const setStartTime = useTimetableStore((s) => s.setStartTime);
	const map = PlacementController.instance?.map ?? null;

	return (
		<div className="flex items-end gap-2 border-b border-border p-2">
			<div className="flex-1">
				<TextField
					label="Timetable"
					value={timetable.title ?? ""}
					placeholder="Untitled"
					onCommit={(title) => setTitle(title, map)}
				/>
			</div>
			<div className="w-24">
				<TimeField
					label="Day starts"
					value={timetable.startTime}
					onCommit={(startTime) => setStartTime(startTime, map)}
				/>
			</div>
		</div>
	);
}

/** The left column: every service, with what is wrong with it. */
function ServiceList({
	services,
	issues,
	selectedRef,
	onSelect,
	onAdd,
	onRemove,
}: {
	services: Service[];
	issues: TimetableIssue[];
	selectedRef: ServiceRef | null;
	onSelect: (ref: ServiceRef) => void;
	onAdd: () => void;
	onRemove: (ref: ServiceRef) => void;
}) {
	// Keep the service `[` / `]` landed on inside the column.
	const selectedRow = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (selectedRef)
			selectedRow.current?.scrollIntoView?.({ block: "nearest" });
	}, [selectedRef]);

	return (
		<div className="flex w-48 shrink-0 flex-col border-r border-border">
			<div className="flex-1 overflow-y-auto">
				{services.map((service) => {
					const errors = issuesForService(issues, service.ref).filter(
						(i) => i.severity === "error",
					).length;
					const selected = service.ref === selectedRef;
					return (
						<div
							key={service.ref}
							ref={selected ? selectedRow : undefined}
							className={`group flex items-center gap-1 border-b border-border/50 px-2 py-1 ${
								selected ? "bg-accent" : ""
							}`}
						>
							<button
								type="button"
								className="min-w-0 flex-1 text-left"
								onClick={() => onSelect(service.ref)}
								aria-current={selected}
							>
								<span className="block truncate font-medium">
									{service.ref || "(no headcode)"}
								</span>
								<span className="block truncate text-[10px] text-muted-foreground">
									{summariseService(service)}
								</span>
							</button>
							{errors > 0 ? (
								<span
									className="shrink-0 bg-destructive/15 px-1 text-[10px] text-destructive tabular-nums"
									title={`${errors} ${errors === 1 ? "problem" : "problems"}`}
								>
									{errors}
								</span>
							) : null}
							<Button
								variant="ghost"
								size="icon-xs"
								className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
								aria-label={`Delete ${service.ref}`}
								onClick={() => onRemove(service.ref)}
							>
								<Trash />
							</Button>
						</div>
					);
				})}
			</div>
			<Button variant="outline" size="xs" className="m-2" onClick={onAdd}>
				<Plus /> Add a service
			</Button>
		</div>
	);
}

/** Where a service runs from and to, and when it starts. */
function summariseService(service: Service): string {
	const locations = service.actions
		.map((a) => (a.kind === "stop" || a.kind === "pass" ? a.location : null))
		.filter((name): name is string => Boolean(name));
	const first = service.actions[0];
	const time = first ? actionTime(first) : null;
	const when = time === null ? "" : `${formatSimTime(time)} `;

	if (locations.length === 0) return `${when}${service.description ?? "—"}`;
	if (locations.length === 1) return `${when}${locations[0]}`;
	return `${when}${locations[0]} → ${locations[locations.length - 1]}`;
}

/** The right column: one service's identity, train, and actions. */
function ServiceDetail({
	service,
	locations,
	otherRefs,
	selectedActionIndex,
	pendingCellPick,
}: {
	service: Service;
	locations: string[];
	otherRefs: ServiceRef[];
	selectedActionIndex: number | null;
	pendingCellPick: PendingCellPick | null;
}) {
	const store = useTimetableStore.getState;
	const map = PlacementController.instance?.map ?? null;
	const first = service.actions[0];
	// Keep the action Alt+arrows landed on inside the column.
	const selectedActionRow = useRef<HTMLLIElement>(null);
	useEffect(() => {
		if (selectedActionIndex !== null) {
			selectedActionRow.current?.scrollIntoView?.({ block: "nearest" });
		}
	}, [selectedActionIndex]);
	// A train spec belongs to the service that *creates* a train; a follow-on
	// inherits one, so showing the fields would invite filling in something the
	// engine will ignore.
	const needsTrain = Boolean(
		first && isStartAction(first) && createsTrain(first),
	);

	return (
		<div className="min-h-0 flex-1 overflow-y-auto p-2">
			<div className="flex gap-2">
				<div className="w-28">
					<TextField
						label="Headcode"
						value={service.ref}
						maxLength={MAX_SERVICE_REF_LENGTH}
						onCommit={(ref) => store().updateService(service.ref, { ref }, map)}
					/>
				</div>
				<div className="flex-1">
					<TextField
						label="Description"
						value={service.description ?? ""}
						placeholder="Ashfield to Barton"
						onCommit={(description) =>
							store().updateService(service.ref, { description }, map)
						}
					/>
				</div>
			</div>

			{needsTrain ? (
				<TrainSpecFields
					spec={service.train ?? createDefaultTrainSpec()}
					onCommit={(train) =>
						store().updateService(service.ref, { train }, map)
					}
				/>
			) : null}

			<div className="mt-3 mb-1 flex items-center justify-between">
				<span className="font-medium">Actions</span>
				<AddActionButton service={service} />
			</div>

			{service.actions.length === 0 ? (
				<p className="text-[10px] text-muted-foreground italic">
					A service needs a start, and a finish.
				</p>
			) : null}

			<ol className="space-y-1">
				{service.actions.map((action, index) => (
					<ActionRow
						// Actions are positional and two rows can be identical while
						// being edited, so the index is their only stable identity.
						// biome-ignore lint/suspicious/noArrayIndexKey: positional list
						key={index}
						service={service}
						action={action}
						index={index}
						expanded={selectedActionIndex === index}
						scrollRef={
							selectedActionIndex === index ? selectedActionRow : undefined
						}
						locations={locations}
						otherRefs={otherRefs}
						pendingCellPick={
							pendingCellPick?.serviceRef === service.ref &&
							pendingCellPick.actionIndex === index
								? pendingCellPick
								: null
						}
					/>
				))}
			</ol>
		</div>
	);
}

/** The physical train, shown only for a service that puts one on the map. */
function TrainSpecFields({
	spec,
	onCommit,
}: {
	spec: TrainSpec;
	onCommit: (spec: TrainSpec) => void;
}) {
	const set = (changes: Partial<TrainSpec>): void =>
		onCommit({ ...spec, ...changes });

	return (
		<fieldset className="mt-2 border border-border p-2">
			<legend className="px-1 text-[10px] text-muted-foreground">Train</legend>
			<div className="grid grid-cols-3 gap-1.5">
				<NumberField
					label="Start (km/h)"
					value={spec.startSpeedKmh}
					min={0}
					onCommit={(startSpeedKmh) => set({ startSpeedKmh })}
				/>
				<NumberField
					label="Max (km/h)"
					value={spec.maxSpeedKmh}
					min={1}
					onCommit={(maxSpeedKmh) => set({ maxSpeedKmh })}
				/>
				<NumberField
					label="Mass (t)"
					value={spec.massTonnes}
					min={1}
					onCommit={(massTonnes) => set({ massTonnes })}
				/>
				<NumberField
					label="Brake (t)"
					value={spec.brakeForceTonnes}
					min={1}
					onCommit={(brakeForceTonnes) => set({ brakeForceTonnes })}
				/>
				<NumberField
					label="Power (kW)"
					value={spec.powerKw}
					min={1}
					onCommit={(powerKw) => set({ powerKw })}
				/>
				<NumberField
					label="Signaller (km/h)"
					value={spec.signallerSpeedKmh ?? 0}
					min={0}
					onCommit={(value) =>
						set({ signallerSpeedKmh: value > 0 ? value : undefined })
					}
				/>
			</div>
		</fieldset>
	);
}

/** The kind picker, which adds a seeded action of whatever is chosen. */
function AddActionButton({ service }: { service: Service }) {
	const store = useTimetableStore.getState;
	const map = PlacementController.instance?.map ?? null;

	const add = (kind: Action["kind"]): void => {
		// Seed the new action from the one before it, so a stopping pattern is
		// built by changing a time rather than typing every field again.
		const previous = service.actions[service.actions.length - 1];
		const previousTime = previous ? actionTime(previous) : null;
		const action = createAction(kind, {
			time: previousTime ?? undefined,
		});
		store().addAction(service.ref, action, map);
		store().selectAction(service.actions.length);
	};

	return (
		<Select value="" onValueChange={(kind) => add(kind as Action["kind"])}>
			<SelectTrigger size="sm" className="w-48" aria-label="Add an action">
				<SelectValue placeholder="Add an action…" />
			</SelectTrigger>
			<SelectContent>
				{ACTION_KIND_GROUPS.map((group) => (
					<SelectGroup key={group}>
						<SelectLabel>{group}</SelectLabel>
						{ACTION_KIND_OPTIONS.filter((o) => o.group === group).map((o) => (
							<SelectItem key={o.kind} value={o.kind}>
								{o.label}
							</SelectItem>
						))}
					</SelectGroup>
				))}
			</SelectContent>
		</Select>
	);
}

/** One action: a summary line that expands into its fields. */
function ActionRow({
	service,
	action,
	index,
	expanded,
	scrollRef,
	locations,
	otherRefs,
	pendingCellPick,
}: {
	service: Service;
	action: Action;
	index: number;
	expanded: boolean;
	/** Set on the selected row so a key that moves the selection can scroll to it. */
	scrollRef?: Ref<HTMLLIElement>;
	locations: string[];
	otherRefs: ServiceRef[];
	pendingCellPick: PendingCellPick | null;
}) {
	const store = useTimetableStore.getState;
	const map = PlacementController.instance?.map ?? null;
	const last = service.actions.length - 1;

	return (
		<li ref={scrollRef} className="border border-border">
			<div className="flex items-center gap-1 px-1.5 py-1">
				<button
					type="button"
					className="min-w-0 flex-1 text-left"
					onClick={() => store().selectAction(expanded ? null : index)}
					aria-expanded={expanded}
				>
					<span className="block truncate">
						<span className="text-muted-foreground">
							{actionKindLabel(action.kind)}
						</span>
						<span className="ml-1.5 tabular-nums">
							{describeAction(action)}
						</span>
					</span>
				</button>
				<Button
					variant="ghost"
					size="icon-xs"
					disabled={index === 0}
					aria-label={`Move ${actionKindLabel(action.kind)} up`}
					onClick={() => store().moveAction(service.ref, index, index - 1, map)}
				>
					<ArrowUp />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					disabled={index === last}
					aria-label={`Move ${actionKindLabel(action.kind)} down`}
					onClick={() => store().moveAction(service.ref, index, index + 1, map)}
				>
					<ArrowDown />
				</Button>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label={`Remove ${actionKindLabel(action.kind)}`}
					onClick={() => store().removeAction(service.ref, index, map)}
				>
					<Trash />
				</Button>
			</div>

			{expanded ? (
				<div className="space-y-1.5 border-t border-border/50 p-1.5">
					<ActionForm
						action={action}
						locations={locations}
						otherRefs={otherRefs}
						pendingPick={pendingCellPick}
						onChange={(next) =>
							store().updateAction(service.ref, index, next, map)
						}
						onPick={(field, exitIndex) =>
							store().beginCellPick({
								serviceRef: service.ref,
								actionIndex: index,
								field,
								exitIndex,
							})
						}
					/>
				</div>
			) : null}
		</li>
	);
}

/** Everything wrong with the selected service, clickable through to the row. */
function IssuePanel({
	issues,
	onSelect,
}: {
	issues: TimetableIssue[];
	onSelect: (index: number | null) => void;
}) {
	if (issues.length === 0) {
		return (
			<div className="border-t border-border px-2 py-1 text-[10px] text-muted-foreground">
				No problems.
			</div>
		);
	}

	return (
		<ul className="max-h-28 shrink-0 overflow-y-auto border-t border-border">
			{issues.map((issue, i) => (
				// Issues are derived, positional and can repeat (one service can
				// break the same rule twice), so the index is their only identity.
				// biome-ignore lint/suspicious/noArrayIndexKey: derived positional list
				<li key={i}>
					<button
						type="button"
						className={`block w-full px-2 py-0.5 text-left text-[10px] ${
							issue.severity === "error"
								? "text-destructive"
								: "text-amber-600 dark:text-amber-400"
						}`}
						onClick={() => onSelect(issue.actionIndex ?? null)}
					>
						{issue.message}
					</button>
				</li>
			))}
		</ul>
	);
}
