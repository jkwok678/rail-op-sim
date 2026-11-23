import type { Action, ActionOf, Cell, ServiceRef } from "@rail-op-sim/shared";
import { formatSimTime, parseSimTime } from "@rail-op-sim/shared";

/**
 * What the editor can add to a service, and what a fresh one of each looks
 * like.
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
	{
		kind: "startNewShuttle",
		label: "Start a new shuttle train",
		group: "Start",
	},
	{ kind: "startShuttle", label: "Start shuttle from feeder", group: "Start" },
	{
		kind: "startFromShuttle",
		label: "Take over from a shuttle",
		group: "Start",
	},

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
	{
		kind: "finishToShuttle",
		label: "Hand over to a shuttle",
		group: "Finish",
	},
	{
		kind: "finishShuttleRemainHere",
		label: "Repeat shuttle or remain here",
		group: "Finish",
	},
	{
		kind: "finishShuttleNewService",
		label: "Repeat shuttle or hand over",
		group: "Finish",
	},
];

/** The groups in the order the picker shows them. */
export const ACTION_KIND_GROUPS: ActionKindOption["group"][] = [
	"Start",
	"Along the way",
	"Finish",
];

/** The picker's label for a kind, falling back to the raw kind. */
export function actionKindLabel(kind: Action["kind"]): string {
	return ACTION_KIND_OPTIONS.find((o) => o.kind === kind)?.label ?? kind;
}

/** What a fresh action is seeded from; {@link createAction} fills the gaps. */
interface ActionSeed {
	time: number;
	location: string;
	ref: ServiceRef;
	cell: Cell;
	next: Cell;
}

/**
 * How to build a fresh action of each kind. A table rather than a switch so
 * every kind is one short line, and the mapped type makes a kind added to the
 * union a compile error here until it is given a seed.
 */
const SEEDS: { [K in Action["kind"]]: (s: ActionSeed) => ActionOf<K> } = {
	startNew: ({ time, cell, next }) => ({
		kind: "startNew",
		time,
		rear: cell,
		front: next,
	}),
	startNewService: ({ time, ref }) => ({
		kind: "startNewService",
		time,
		fromRef: ref,
	}),
	startFromSplit: ({ time, ref }) => ({
		kind: "startFromSplit",
		time,
		fromRef: ref,
	}),
	startShuttle: ({ time, ref }) => ({
		kind: "startShuttle",
		time,
		fromRef: ref,
		otherRef: ref,
	}),
	startFromShuttle: ({ time, ref }) => ({
		kind: "startFromShuttle",
		time,
		fromRef: ref,
	}),
	startNewShuttle: ({ time, cell, next, ref }) => ({
		kind: "startNewShuttle",
		time,
		rear: cell,
		front: next,
		otherRef: ref,
	}),
	stop: ({ time, location }) => ({
		kind: "stop",
		location,
		arrive: time,
		depart: time,
	}),
	pass: ({ time, location }) => ({ kind: "pass", time, location }),
	changeDirection: ({ time }) => ({ kind: "changeDirection", time }),
	frontSplit: ({ time, ref }) => ({ kind: "frontSplit", time, newRef: ref }),
	rearSplit: ({ time, ref }) => ({ kind: "rearSplit", time, newRef: ref }),
	joinedBy: ({ time, ref }) => ({ kind: "joinedBy", time, otherRef: ref }),
	finishJoin: ({ time, ref }) => ({ kind: "finishJoin", time, otherRef: ref }),
	changeDescription: ({ time }) => ({
		kind: "changeDescription",
		time,
		description: "",
	}),
	changeMaxSpeed: ({ time }) => ({
		kind: "changeMaxSpeed",
		time,
		maxSpeedKmh: 120,
	}),
	finishNewService: ({ time, ref }) => ({
		kind: "finishNewService",
		time,
		nextRef: ref,
	}),
	finishToShuttle: ({ time, ref }) => ({
		kind: "finishToShuttle",
		time,
		nextRef: ref,
	}),
	finishExit: ({ time }) => ({ kind: "finishExit", time, exits: [] }),
	finishRemainHere: () => ({ kind: "finishRemainHere" }),
	finishShuttleRemainHere: ({ time, ref }) => ({
		kind: "finishShuttleRemainHere",
		time,
		otherRef: ref,
	}),
	finishShuttleNewService: ({ time, ref }) => ({
		kind: "finishShuttleNewService",
		time,
		nextRef: ref,
		otherRef: ref,
	}),
};

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
		time?: number | undefined;
		location?: string | undefined;
		otherRef?: ServiceRef | undefined;
		cell?: Cell | undefined;
	} = {},
): Action {
	const cell = options.cell ?? { gx: 0, gy: 0 };
	return SEEDS[kind]({
		time: options.time ?? parseSimTime("06:00"),
		location: options.location ?? "",
		ref: options.otherRef ?? "",
		cell,
		next: { gx: cell.gx + 1, gy: cell.gy },
	});
}

/** A time and a service reference, the shape most row summaries take. */
const timed = (time: number, text: string): string =>
	`${formatSimTime(time)} ${text}`;

/**
 * Each kind's list-row summary.
 */
const DESCRIBERS: { [K in Action["kind"]]?: (a: ActionOf<K>) => string } = {
	stop: (a) => {
		const times = [a.arrive, a.depart]
			.filter((t): t is number => t !== undefined)
			.map((t) => formatSimTime(t))
			.join("–");
		return `${times} ${a.location || "(nowhere)"}`.trim();
	},
	pass: (a) => timed(a.time, `pass ${a.location || "(nowhere)"}`),
	startNew: (a) => timed(a.time, `new train at (${a.rear.gx}, ${a.rear.gy})`),
	startNewService: (a) => timed(a.time, `from ${a.fromRef || "—"}`),
	startFromSplit: (a) => timed(a.time, `from ${a.fromRef || "—"}`),
	startNewShuttle: (a) => timed(a.time, `shuttle ↔ ${a.otherRef || "—"}`),
	startShuttle: (a) =>
		timed(a.time, `shuttle from ${a.fromRef || "—"} ↔ ${a.otherRef || "—"}`),
	startFromShuttle: (a) => timed(a.time, `from shuttle ${a.fromRef || "—"}`),
	frontSplit: (a) => timed(a.time, `split → ${a.newRef || "—"}`),
	rearSplit: (a) => timed(a.time, `split → ${a.newRef || "—"}`),
	joinedBy: (a) => timed(a.time, `joined by ${a.otherRef || "—"}`),
	finishJoin: (a) => timed(a.time, `join ${a.otherRef || "—"}`),
	finishNewService: (a) => timed(a.time, `→ ${a.nextRef || "—"}`),
	finishToShuttle: (a) => timed(a.time, `→ shuttle ${a.nextRef || "—"}`),
	finishExit: (a) =>
		timed(
			a.time,
			`exit ${a.exits.map((c) => `(${c.gx}, ${c.gy})`).join(" or ") || "—"}`,
		),
	finishRemainHere: () => "remain here",
	finishShuttleRemainHere: (a) =>
		timed(a.time, `shuttle ↔ ${a.otherRef || "—"}`),
	finishShuttleNewService: (a) =>
		timed(a.time, `shuttle ↔ ${a.otherRef || "—"} → ${a.nextRef || "—"}`),
	changeDescription: (a) => timed(a.time, `"${a.description}"`),
	changeMaxSpeed: (a) => timed(a.time, `max ${a.maxSpeedKmh} km/h`),
};

/**
 * A one-line summary of an action, for the list row: what it does, where, and
 * when. Keeps the list readable without opening each row's form.
 */
export function describeAction(action: Action): string {
	const describe = DESCRIBERS[action.kind] as
		| ((a: Action) => string)
		| undefined;
	return describe ? describe(action) : actionKindLabel(action.kind);
}
