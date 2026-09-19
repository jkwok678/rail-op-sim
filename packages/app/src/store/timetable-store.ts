import {
	type Action,
	createEmptyTimetable,
	type Map as Map_,
	type Service,
	type ServiceRef,
	type Timetable,
	type TimetableIssue,
	validateTimetable,
} from "@rail-op-sim/shared";
import { create } from "zustand";
import { debugLog } from "#/lib/debugLogger";

/**
 * The timetable being edited, separate from `editor-store`.
 *
 * Two stores rather than one because they answer different questions:
 * `editor-store` is about placing things on a map, this is about a document
 * laid over it. They meet in exactly two places — the map is passed in to
 * validate against, and {@link TimetableState.pendingCellPick} borrows the
 * canvas for one click.
 *
 * Every mutator re-validates. The issue list is derived state that has to be
 * right after each keystroke for the editor to mark rows live, and deriving it
 * here rather than in the components is what stops three panels computing it
 * three different ways.
 */

/** Which cell field on which action a canvas click is about to fill. */
export interface PendingCellPick {
	serviceRef: ServiceRef;
	actionIndex: number;
	field: "rear" | "front" | "exit";
	/**
	 * Which entry of `finishExit.exits` to replace; appended when past the end.
	 * Ignored for `rear` and `front`.
	 */
	exitIndex?: number;
}

export interface TimetableState {
	timetable: Timetable;
	/** The service shown in the detail panel, or null when none is selected. */
	selectedServiceRef: ServiceRef | null;
	/** The action highlighted within that service, or null. */
	selectedActionIndex: number | null;
	/** Everything currently wrong, refreshed by every mutator. */
	issues: TimetableIssue[];
	/** Whether the editor panel is on screen. */
	open: boolean;
	/**
	 * Set while the editor is waiting for a click on the canvas to fill a cell
	 * field. The placement controller checks this before its tool dispatch, so
	 * "pick on map" needs no tool of its own.
	 */
	pendingCellPick: PendingCellPick | null;
	/** A message about the last failed load, shown until it is dismissed. */
	loadError: string | null;

	setOpen: (open: boolean) => void;
	toggleOpen: () => void;
	selectService: (ref: ServiceRef | null) => void;
	selectAction: (index: number | null) => void;

	/** Add a service, select it, and return the ref it was given. */
	addService: (map: Map_ | null, ref?: ServiceRef) => ServiceRef;
	removeService: (ref: ServiceRef, map: Map_ | null) => void;
	updateService: (
		ref: ServiceRef,
		patch: Partial<Omit<Service, "actions">>,
		map: Map_ | null,
	) => void;

	addAction: (
		ref: ServiceRef,
		action: Action,
		map: Map_ | null,
		index?: number,
	) => void;
	updateAction: (
		ref: ServiceRef,
		index: number,
		action: Action,
		map: Map_ | null,
	) => void;
	removeAction: (ref: ServiceRef, index: number, map: Map_ | null) => void;
	/** Move an action within its service, clamped to the list. */
	moveAction: (
		ref: ServiceRef,
		from: number,
		to: number,
		map: Map_ | null,
	) => void;

	setStartTime: (startTime: number, map: Map_ | null) => void;
	setTitle: (title: string, map: Map_ | null) => void;
	replaceTimetable: (timetable: Timetable, map: Map_ | null) => void;
	/** Re-run validation without changing the timetable — for when the map does. */
	revalidate: (map: Map_ | null) => void;

	beginCellPick: (pick: PendingCellPick) => void;
	cancelCellPick: () => void;
	/** Fill the pending field with `cell` and clear the pick. */
	completeCellPick: (
		cell: { gx: number; gy: number },
		map: Map_ | null,
	) => void;

	setLoadError: (message: string | null) => void;
}

/** A ref not yet in use, counting up from 1A01 the way a working timetable does. */
function nextServiceRef(timetable: Timetable): ServiceRef {
	const taken = new Set(timetable.services.map((s) => s.ref));
	for (let n = 1; n < 1000; n++) {
		const ref = `1A${String(n).padStart(2, "0")}`;
		if (!taken.has(ref)) return ref;
	}
	return `1A${timetable.services.length}`;
}

export const useTimetableStore = create<TimetableState>((set, get) => {
	/**
	 * Apply `change` to the timetable and re-validate in one update.
	 *
	 * Every mutator goes through here, so no path can leave the issue list
	 * describing a timetable that no longer exists.
	 */
	const commit = (
		map: Map_ | null,
		change: (timetable: Timetable) => Timetable,
	): void => {
		set((state) => {
			const timetable = change(state.timetable);
			return { timetable, issues: validateTimetable(timetable, map) };
		});
	};

	/** Replace one service by ref, leaving the rest of the timetable alone. */
	const mapService = (
		timetable: Timetable,
		ref: ServiceRef,
		change: (service: Service) => Service,
	): Timetable => ({
		...timetable,
		services: timetable.services.map((service) =>
			service.ref === ref ? change(service) : service,
		),
	});

	return {
		timetable: createEmptyTimetable(),
		selectedServiceRef: null,
		selectedActionIndex: null,
		issues: [],
		open: false,
		pendingCellPick: null,
		loadError: null,

		setOpen: (open) => {
			debugLog("store", `timetable setOpen: ${open}`);
			// Closing the editor abandons a pick it started — the canvas should not
			// keep waiting for a click on behalf of a panel that is gone.
			set(open ? { open } : { open, pendingCellPick: null });
		},
		toggleOpen: () => get().setOpen(!get().open),

		selectService: (ref) => {
			set({
				selectedServiceRef: ref,
				// The action index belongs to the service being left.
				selectedActionIndex: null,
				pendingCellPick: null,
			});
		},
		selectAction: (index) => set({ selectedActionIndex: index }),

		addService: (map, ref) => {
			const newRef = ref ?? nextServiceRef(get().timetable);
			commit(map, (timetable) => ({
				...timetable,
				services: [...timetable.services, { ref: newRef, actions: [] }],
			}));
			set({ selectedServiceRef: newRef, selectedActionIndex: null });
			debugLog("store", `timetable addService: ${newRef}`);
			return newRef;
		},

		removeService: (ref, map) => {
			commit(map, (timetable) => ({
				...timetable,
				services: timetable.services.filter((s) => s.ref !== ref),
			}));
			// Only the deleted service loses its selection; deleting another one
			// should not throw the user out of what they were editing.
			set((state) =>
				state.selectedServiceRef === ref
					? { selectedServiceRef: null, selectedActionIndex: null }
					: {},
			);
			debugLog("store", `timetable removeService: ${ref}`);
		},

		updateService: (ref, patch, map) => {
			commit(map, (timetable) =>
				mapService(timetable, ref, (service) => ({ ...service, ...patch })),
			);
			// A rename moves the selection with the service the user is editing.
			if (patch.ref !== undefined && patch.ref !== ref) {
				set((state) =>
					state.selectedServiceRef === ref
						? { selectedServiceRef: patch.ref as ServiceRef }
						: {},
				);
			}
		},

		addAction: (ref, action, map, index) => {
			commit(map, (timetable) =>
				mapService(timetable, ref, (service) => {
					const at = index ?? service.actions.length;
					const actions = [...service.actions];
					actions.splice(Math.max(0, Math.min(at, actions.length)), 0, action);
					return { ...service, actions };
				}),
			);
			debugLog("store", `timetable addAction: ${ref} ${action.kind}`);
		},

		updateAction: (ref, index, action, map) => {
			commit(map, (timetable) =>
				mapService(timetable, ref, (service) => ({
					...service,
					actions: service.actions.map((a, i) => (i === index ? action : a)),
				})),
			);
		},

		removeAction: (ref, index, map) => {
			commit(map, (timetable) =>
				mapService(timetable, ref, (service) => ({
					...service,
					actions: service.actions.filter((_, i) => i !== index),
				})),
			);
			set((state) =>
				state.selectedActionIndex === index
					? { selectedActionIndex: null }
					: {},
			);
		},

		moveAction: (ref, from, to, map) => {
			commit(map, (timetable) =>
				mapService(timetable, ref, (service) => {
					const actions = [...service.actions];
					if (from < 0 || from >= actions.length) return service;
					const target = Math.max(0, Math.min(to, actions.length - 1));
					const [moved] = actions.splice(from, 1);
					actions.splice(target, 0, moved);
					return { ...service, actions };
				}),
			);
			// Follow the action the user just moved, not the row it vacated.
			set((state) =>
				state.selectedActionIndex === from ? { selectedActionIndex: to } : {},
			);
		},

		setStartTime: (startTime, map) => {
			commit(map, (timetable) => ({ ...timetable, startTime }));
		},

		setTitle: (title, map) => {
			commit(map, (timetable) => ({ ...timetable, title }));
		},

		replaceTimetable: (timetable, map) => {
			set({
				timetable,
				issues: validateTimetable(timetable, map),
				selectedServiceRef: timetable.services[0]?.ref ?? null,
				selectedActionIndex: null,
				pendingCellPick: null,
				loadError: null,
			});
			debugLog(
				"store",
				`timetable replaceTimetable: ${timetable.services.length} services`,
			);
		},

		revalidate: (map) => {
			set((state) => ({ issues: validateTimetable(state.timetable, map) }));
		},

		beginCellPick: (pick) => {
			debugLog(
				"store",
				`timetable beginCellPick: ${pick.serviceRef}[${pick.actionIndex}].${pick.field}`,
			);
			set({ pendingCellPick: pick });
		},

		cancelCellPick: () => set({ pendingCellPick: null }),

		completeCellPick: (cell, map) => {
			const pick = get().pendingCellPick;
			if (!pick) return;
			commit(map, (timetable) =>
				mapService(timetable, pick.serviceRef, (service) => ({
					...service,
					actions: service.actions.map((action, i) =>
						i === pick.actionIndex ? fillCell(action, pick, cell) : action,
					),
				})),
			);
			set({ pendingCellPick: null });
			debugLog(
				"store",
				`timetable completeCellPick: (${cell.gx},${cell.gy}) into ${pick.field}`,
			);
		},

		setLoadError: (message) => set({ loadError: message }),
	};
});

/**
 * Put `cell` into the field `pick` names, if the action has it.
 *
 * An action of the wrong kind is returned untouched rather than coerced: the
 * pick was started from a field on *this* action, so a mismatch means the
 * action changed underneath the gesture, and quietly writing a `rear` onto a
 * stop would be worse than doing nothing.
 */
function fillCell(
	action: Action,
	pick: PendingCellPick,
	cell: { gx: number; gy: number },
): Action {
	if (pick.field === "rear" || pick.field === "front") {
		if (action.kind !== "startNew" && action.kind !== "startNewShuttle") {
			return action;
		}
		return { ...action, [pick.field]: cell };
	}
	if (action.kind !== "finishExit") return action;
	const exits = [...action.exits];
	const at = pick.exitIndex ?? exits.length;
	if (at >= exits.length) exits.push(cell);
	else exits[at] = cell;
	return { ...action, exits };
}
