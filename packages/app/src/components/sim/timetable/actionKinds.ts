import type { Action, Cell, ServiceRef } from "@rail-op-sim/shared";
import { formatSimTime, parseSimTime } from "@rail-op-sim/shared";

/**
 * What the editor can add to a service, and what a fresh one of each looks
 * like.
 *
 * The shuttle kinds are absent on purpose. They exist in the model so the union
 * is complete and a `.ttb` importer has somewhere to put them, but neither the
 * editor nor the engine handles them yet — and the validator says so, so a
 * timetable that acquires one some other way is reported rather than run.
 */

/** An action kind the editor offers, with the label the picker shows. */
export interface ActionKindOption {
	kind: Action["kind"];
	label: string;
	/** How the picker groups it — the three parts of a service. */
	group: "Start" | "Along the way" | "Finish";
}

export const ACTION_KIND_OPTIONS: ActionKindOption[] = [
	{ kind: "startNew", label: "Start a new train", group: "Start" },
	{
		kind: "startNewService",
		label: "Take over from another service",
		group: "Start",
	},
	{ kind: "startFromSplit", label: "Start as a split portion", group: "Start" },

	{ kind: "stop", label: "Stop at a location", group: "Along the way" },
	{ kind: "pass", label: "Pass a location", group: "Along the way" },
	{
		kind: "changeDirection",
		label: "Change direction",
		group: "Along the way",
	},
	{ kind: "frontSplit", label: "Split off the front", group: "Along the way" },
	{ kind: "rearSplit", label: "Split off the rear", group: "Along the way" },
	{ kind: "joinedBy", label: "Wait to be joined", group: "Along the way" },
	{
		kind: "changeDescription",
		label: "Change the description",
		group: "Along the way",
	},
	{
		kind: "changeMaxSpeed",
		label: "Change the maximum speed",
		group: "Along the way",
	},

	{
		kind: "finishNewService",
		label: "Hand over to a service",
		group: "Finish",
	},
	{ kind: "finishJoin", label: "Join another train", group: "Finish" },
	{ kind: "finishExit", label: "Leave the map", group: "Finish" },
	{ kind: "finishRemainHere", label: "Remain here", group: "Finish" },
];

/** The groups in the order the picker shows them. */
export const ACTION_KIND_GROUPS: ActionKindOption["group"][] = [
	"Start",
	"Along the way",
	"Finish",
];

/** The picker's label for a kind, falling back to the raw kind for shuttles. */
export function actionKindLabel(kind: Action["kind"]): string {
	return ACTION_KIND_OPTIONS.find((o) => o.kind === kind)?.label ?? kind;
}

/**
 * A blank action of `kind`, timed at `time` and placed at `cell`.
 *
 * Seeded rather than left empty so a newly added row is a *valid* action of
 * its kind wherever that is possible — the issue list should fill up as the
 * user makes mistakes, not the moment they add a row.
 */
export function createAction(
	kind: Action["kind"],
	options: {
		time?: number;
		location?: string;
		otherRef?: ServiceRef;
		cell?: Cell;
	} = {},
): Action {
	const time = options.time ?? parseSimTime("06:00");
	const location = options.location ?? "";
	const ref = options.otherRef ?? "";
	const cell = options.cell ?? { gx: 0, gy: 0 };
	const next = { gx: cell.gx + 1, gy: cell.gy };

	switch (kind) {
		case "startNew":
			return { kind, time, rear: cell, front: next };
		case "startNewService":
		case "startFromSplit":
		case "startShuttle":
		case "startFromShuttle":
			return { kind, time, fromRef: ref };
		case "startNewShuttle":
			return { kind, time, rear: cell, front: next, otherRef: ref };
		case "stop":
			return { kind, location, arrive: time, depart: time };
		case "pass":
			return { kind, time, location };
		case "changeDirection":
			return { kind, time };
		case "frontSplit":
		case "rearSplit":
			return { kind, time, newRef: ref };
		case "joinedBy":
		case "finishJoin":
			return { kind, time, otherRef: ref };
		case "changeDescription":
			return { kind, time, description: "" };
		case "changeMaxSpeed":
			return { kind, time, maxSpeedKmh: 120 };
		case "finishNewService":
			return { kind, time, nextRef: ref };
		case "finishExit":
			return { kind, time, exits: [] };
		case "finishRemainHere":
			return { kind };
		case "finishShuttleRemainHere":
			return { kind, otherRef: ref };
		case "finishShuttleNewService":
			return { kind, time, nextRef: ref, otherRef: ref };
	}
}

/**
 * A one-line summary of an action, for the list row: what it does, where, and
 * when. Keeps the list readable without opening each row's form.
 */
export function describeAction(action: Action): string {
	switch (action.kind) {
		case "stop": {
			const times = [action.arrive, action.depart]
				.filter((t): t is number => t !== undefined)
				.map((t) => formatSimTime(t))
				.join("–");
			return `${times} ${action.location || "(nowhere)"}`.trim();
		}
		case "pass":
			return `${formatSimTime(action.time)} pass ${action.location || "(nowhere)"}`;
		case "startNew":
			return `${formatSimTime(action.time)} new train at (${action.rear.gx}, ${action.rear.gy})`;
		case "startNewService":
		case "startFromSplit":
			return `${formatSimTime(action.time)} from ${action.fromRef || "—"}`;
		case "frontSplit":
		case "rearSplit":
			return `${formatSimTime(action.time)} split → ${action.newRef || "—"}`;
		case "joinedBy":
			return `${formatSimTime(action.time)} joined by ${action.otherRef || "—"}`;
		case "finishJoin":
			return `${formatSimTime(action.time)} join ${action.otherRef || "—"}`;
		case "finishNewService":
			return `${formatSimTime(action.time)} → ${action.nextRef || "—"}`;
		case "finishExit":
			return `${formatSimTime(action.time)} exit ${
				action.exits.map((c) => `(${c.gx}, ${c.gy})`).join(" or ") || "—"
			}`;
		case "finishRemainHere":
			return "remain here";
		case "changeDescription":
			return `${formatSimTime(action.time)} "${action.description}"`;
		case "changeMaxSpeed":
			return `${formatSimTime(action.time)} max ${action.maxSpeedKmh} km/h`;
		default:
			return actionKindLabel(action.kind);
	}
}
