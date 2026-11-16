/**
 * The timetable data model.
 *
 * A timetable is a start time plus one {@link Service} per train working, and a
 * service is an ordered list of {@link Action}s: exactly one start, any number
 * of intermediates, exactly one finish. That shape comes from railway-dot-exe's
 * `.ttb` lines, and it is kept because it is the only one that can express what
 * a railway actually does — a service that splits mid-journey, changes
 * direction in a platform, or waits to be joined by another train.
 *
 * What is *not* kept is the representation. RailOS's model is the `.ttb` text
 * itself; here the text is a codec on the side and this object is the model, so
 * the editor, the validator, the serializer and (later) the engine all work on
 * one structure.
 */

import type { SimTime } from "./time";

/**
 * A grid cell on the map, in the app's own coordinates.
 *
 * Element positions on a {@link import("../map/map").Map_} are cells scaled by
 * its `imageSize`; {@link import("./locations").cellToLocation} does that
 * conversion, so nothing here has to know the scale.
 */
export interface Cell {
	gx: number;
	gy: number;
}

/**
 * A service's identifier, unique within a timetable. Up to 8 characters; the
 * last four are the headcode the train carries ("1A01"), the rest an optional
 * disambiguating prefix for two workings that share one.
 */
export type ServiceRef = string;

/** Longest a {@link ServiceRef} may be, matching RailOS's field width. */
export const MAX_SERVICE_REF_LENGTH = 8;

/**
 * The physical train, carried by the service that *creates* it. A service that
 * merely takes over an existing train (a follow-on, the far half of a split)
 * inherits the spec and carries only a headcode.
 */
export interface TrainSpec {
	/** Speed the train is moving at the moment it appears, usually 0. */
	startSpeedKmh: number;
	maxSpeedKmh: number;
	massTonnes: number;
	brakeForceTonnes: number;
	powerKw: number;
	/** Speed limit the train obeys once under signaller control, if capped. */
	signallerSpeedKmh?: number;
}

/**
 * Re-run this service on a fixed interval, RailOS's `R;mins;digits;count`.
 * Repeats are expanded by the engine at run time, never stored as extra
 * services — editing a shuttle should stay one row in the editor.
 */
export interface Repeat {
	intervalMinutes: number;
	/** Added to the numeric tail of the headcode for each repeat. */
	headcodeIncrement: number;
	/** How many further runs follow the first. */
	count: number;
}

/** Shared by every action: RailOS's `[W]` prefix, a warning rather than a stop. */
interface ActionBase {
	/** Announce this action to the signaller when it comes due. */
	warning?: boolean;
}

/**
 * How a service gets its train. Exactly one of these starts every service, and
 * it must be the first action.
 *
 * `startNew` puts a new train on the map at a rear/front pair of adjacent
 * cells — the pair is how RailOS records which way round the train is facing,
 * and the validator checks the two cells are joined track. The others take over
 * a train that is already running.
 */
export type StartAction = ActionBase &
	(
		| {
				kind: "startNew";
				time: SimTime;
				/** Cell the train's rear occupies; with `front`, sets its facing. */
				rear: Cell;
				front: Cell;
				/** Start under signaller control rather than to the timetable. */
				signallerControl?: boolean;
		  }
		| {
				/** This service is the portion another service split off. */
				kind: "startFromSplit";
				time: SimTime;
				fromRef: ServiceRef;
		  }
		| {
				/** This service takes over the train a finished service left. */
				kind: "startNewService";
				time: SimTime;
				fromRef: ServiceRef;
		  }
		| {
				/** Creates a train that will then shuttle back and forth. */
				kind: "startNewShuttle";
				time: SimTime;
				rear: Cell;
				front: Cell;
				/** The service this shuttle alternates with. */
				otherRef: ServiceRef;
		  }
		| {
				/**
				 * The first leg of a shuttle fed by a non-repeating service.
				 * `fromRef` is that feeder (`finishToShuttle`); `otherRef` is the
				 * service this one alternates with.
				 */
				kind: "startShuttle";
				time: SimTime;
				fromRef: ServiceRef;
				otherRef: ServiceRef;
		  }
		| {
				/** A non-shuttle service that takes the train off a finished shuttle. */
				kind: "startFromShuttle";
				time: SimTime;
				fromRef: ServiceRef;
		  }
	);

/**
 * Everything a service does between starting and finishing, in the order it
 * does it.
 *
 * A `stop` with both times is RailOS's `HH:MM;HH:MM;Location`; with one time it
 * is `HH:MM;Location`, whose single time means a departure when the stop is the
 * service's first location and an arrival otherwise — see
 * {@link import("./validate").validateTimetableStructure}.
 */
export type IntermediateAction = ActionBase &
	(
		| {
				kind: "stop";
				location: string;
				arrive?: SimTime;
				depart?: SimTime;
				/** Refuse to leave before this long at the platform has passed. */
				minDwellSeconds?: number;
		  }
		| { kind: "pass"; time: SimTime; location: string }
		| { kind: "changeDirection"; time: SimTime }
		| {
				/** Detach a portion; `newRef` is the service the portion becomes. */
				kind: "frontSplit" | "rearSplit";
				time: SimTime;
				newRef: ServiceRef;
		  }
		| {
				/** Wait here for `otherRef` to couple onto this train. */
				kind: "joinedBy";
				time: SimTime;
				otherRef: ServiceRef;
		  }
		| { kind: "changeDescription"; time: SimTime; description: string }
		| { kind: "changeMaxSpeed"; time: SimTime; maxSpeedKmh: number }
	);

/**
 * How a service ends. Exactly one of these finishes every service, and it must
 * be the last action. Only `finishRemainHere` and `finishExit` end the train's
 * day; the others hand it to another service.
 */
export type FinishAction = ActionBase &
	(
		| {
				/** Hand the train to `nextRef`, which starts where this one stopped. */
				kind: "finishNewService";
				time: SimTime;
				nextRef: ServiceRef;
		  }
		| {
				/** Couple onto `otherRef`, which is waiting with a `joinedBy`. */
				kind: "finishJoin";
				time: SimTime;
				otherRef: ServiceRef;
		  }
		| {
				/** Hand a non-repeating feeder to the shuttle `nextRef`. */
				kind: "finishToShuttle";
				time: SimTime;
				nextRef: ServiceRef;
		  }
		| {
				/**
				 * Stay where the last action left the train, under signaller control.
				 * The one finish with no time of its own — there is nothing to be late
				 * for.
				 */
				kind: "finishRemainHere";
		  }
		| {
				/** Leave the map. Any one of `exits` will do, so a diverted train still finishes. */
				kind: "finishExit";
				time: SimTime;
				exits: Cell[];
		  }
		| {
				/**
				 * Repeat back to the shuttle start `otherRef`. Once every repeat has
				 * run, terminate here.
				 */
				kind: "finishShuttleRemainHere";
				time: SimTime;
				otherRef: ServiceRef;
		  }
		| {
				/** End a shuttle by handing the train to an ordinary service. */
				kind: "finishShuttleNewService";
				time: SimTime;
				nextRef: ServiceRef;
				/** The shuttle service this one was alternating with. */
				otherRef: ServiceRef;
		  }
	);

export type Action = StartAction | IntermediateAction | FinishAction;

/**
 * The action of one `kind`, narrowed out of the union. An intersection rather
 * than `Extract`, because `frontSplit` and `rearSplit` share one member and
 * `Extract` would find neither.
 */
export type ActionOf<K extends Action["kind"]> = Action & { kind: K };

/** Every `kind` a {@link StartAction} can have. */
export const START_KINDS = [
	"startNew",
	"startFromSplit",
	"startNewService",
	"startNewShuttle",
	"startShuttle",
	"startFromShuttle",
] as const satisfies readonly StartAction["kind"][];

/** Every `kind` a {@link FinishAction} can have. */
export const FINISH_KINDS = [
	"finishNewService",
	"finishJoin",
	"finishToShuttle",
	"finishRemainHere",
	"finishExit",
	"finishShuttleRemainHere",
	"finishShuttleNewService",
] as const satisfies readonly FinishAction["kind"][];

/** Every `kind` an {@link IntermediateAction} can have. */
export const INTERMEDIATE_KINDS = [
	"stop",
	"pass",
	"changeDirection",
	"frontSplit",
	"rearSplit",
	"joinedBy",
	"changeDescription",
	"changeMaxSpeed",
] as const satisfies readonly IntermediateAction["kind"][];

/** Kinds that exist only as part of a shuttle. */
export const SHUTTLE_KINDS = [
	"startNewShuttle",
	"startShuttle",
	"startFromShuttle",
	"finishToShuttle",
	"finishShuttleRemainHere",
	"finishShuttleNewService",
] as const;

/** Start kinds that put a *new* train on the map, and so need a {@link TrainSpec}. */
export const TRAIN_CREATING_KINDS = [
	"startNew",
	"startNewShuttle",
] as const satisfies readonly StartAction["kind"][];

export function isStartAction(action: Action): action is StartAction {
	return (START_KINDS as readonly string[]).includes(action.kind);
}

export function isFinishAction(action: Action): action is FinishAction {
	return (FINISH_KINDS as readonly string[]).includes(action.kind);
}

export function isIntermediateAction(
	action: Action,
): action is IntermediateAction {
	return (INTERMEDIATE_KINDS as readonly string[]).includes(action.kind);
}

/** True for an action that only a shuttle uses. */
export function isShuttleAction(action: Action): boolean {
	return (SHUTTLE_KINDS as readonly string[]).includes(action.kind);
}

/** True when this start creates a train, so the service must carry a spec. */
export function createsTrain(action: Action): boolean {
	return (TRAIN_CREATING_KINDS as readonly string[]).includes(action.kind);
}

/**
 * The time an action is booked for, or `null` for the one action that has none
 * (`finishRemainHere` — a train staying put is never late).
 */
export function actionTime(action: Action): SimTime | null {
	if ("time" in action) return action.time;
	if (action.kind === "stop") return action.arrive ?? action.depart ?? null;
	return null;
}

/** The location an action happens at, or `null` when it is not location-bound. */
export function actionLocation(action: Action): string | null {
	if (action.kind === "stop" || action.kind === "pass") return action.location;
	return null;
}

/**
 * One train working: its identity, the train it may create, and what it does.
 *
 * `actions` is a flat list rather than `{ start, intermediates, finish }` so
 * the editor can reorder freely and the validator can *say* "a service must
 * start with a start action" — a shape that makes the mistake unrepresentable
 * also makes it unreportable, and the user still has to be told.
 */
export interface Service {
	ref: ServiceRef;
	description?: string;
	/** Required when — and only when — the first action {@link createsTrain}. */
	train?: TrainSpec;
	actions: Action[];
	repeat?: Repeat;
}

/** A whole timetable: when the day starts, and every service in it. */
export interface Timetable {
	version: 1;
	title?: string;
	/** No service may start before this. RailOS's first `.ttb` line. */
	startTime: SimTime;
	services: Service[];
}
