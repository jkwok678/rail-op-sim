/**
 * Reading and writing a {@link Timetable} as plain JSON.
 *
 * Unlike a {@link import("../map/map").Map_}, which is a graph of classes and
 * needs a real snapshot format, a `Timetable` is already plain data — so the
 * on-disk shape *is* the type, and this file is only the guard at the door.
 *
 * That guard is strict on purpose. An action whose `kind` this build does not
 * know is a parse error, not something to drop quietly: a service silently
 * missing its split would validate clean and then do the wrong thing on the
 * railway, which is worse than refusing to open the file.
 */

import { parseSimTime, type SimTime } from "./time";
import type {
	Action,
	ActionOf,
	Cell,
	Repeat,
	Service,
	Timetable,
	TrainSpec,
} from "./types";

/** Bump when the on-disk shape changes in a backwards-incompatible way. */
export const SERIALIZED_TIMETABLE_VERSION = 1;

/**
 * The on-disk shape. Identical to {@link Timetable} — named separately so a
 * future version can diverge without every caller having to care.
 */
export type SerializedTimetable = Timetable;

/** Thrown when a document cannot be read as a timetable. */
export class InvalidTimetableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidTimetableError";
	}
}

/** A timetable with nothing in it, ready for the editor to fill. */
export function createEmptyTimetable(
	startTime: SimTime = parseSimTime("00:00"),
): Timetable {
	return {
		version: SERIALIZED_TIMETABLE_VERSION,
		startTime,
		services: [],
	};
}

/** A sensible train for a new service, so the editor never opens on blanks. */
export function createDefaultTrainSpec(): TrainSpec {
	return {
		startSpeedKmh: 0,
		maxSpeedKmh: 120,
		massTonnes: 200,
		brakeForceTonnes: 100,
		powerKw: 2000,
	};
}

/**
 * Read `input` as a timetable, or throw {@link InvalidTimetableError} saying
 * what is wrong with it.
 *
 * Returns a fresh object rather than the input, so a caller cannot end up with
 * the parsed document and the live timetable sharing arrays.
 */
export function parseTimetable(input: unknown): Timetable {
	const doc = asRecord(input, "The file is not a timetable.");

	if (doc.version !== SERIALIZED_TIMETABLE_VERSION) {
		throw new InvalidTimetableError(
			`Unsupported timetable version: ${String(doc.version)} (expected ${SERIALIZED_TIMETABLE_VERSION}).`,
		);
	}
	const startTime = asTime(doc.startTime, "the timetable's start time");
	if (!Array.isArray(doc.services)) {
		throw new InvalidTimetableError("The file has no list of services.");
	}

	const timetable: Timetable = {
		version: SERIALIZED_TIMETABLE_VERSION,
		startTime,
		services: doc.services.map(parseService),
	};
	if (doc.title !== undefined) {
		timetable.title = asString(doc.title, "the timetable's title");
	}
	return timetable;
}

function parseService(input: unknown, index: number): Service {
	const where = `service ${index + 1}`;
	const doc = asRecord(input, `${where} is not a service.`);
	const ref = asString(doc.ref, `${where}'s headcode`);

	if (!Array.isArray(doc.actions)) {
		throw new InvalidTimetableError(`"${ref}" has no list of actions.`);
	}

	const service: Service = {
		ref,
		actions: doc.actions.map((action, i) => parseAction(action, ref, i)),
	};
	if (doc.description !== undefined) {
		service.description = asString(doc.description, `"${ref}"'s description`);
	}
	if (doc.train !== undefined) service.train = parseTrainSpec(doc.train, ref);
	if (doc.repeat !== undefined) service.repeat = parseRepeat(doc.repeat, ref);
	return service;
}

function parseTrainSpec(input: unknown, ref: string): TrainSpec {
	const doc = asRecord(input, `"${ref}"'s train type is not an object.`);
	const spec: TrainSpec = {
		startSpeedKmh: asNumber(doc.startSpeedKmh, `"${ref}"'s starting speed`),
		maxSpeedKmh: asNumber(doc.maxSpeedKmh, `"${ref}"'s maximum speed`),
		massTonnes: asNumber(doc.massTonnes, `"${ref}"'s mass`),
		brakeForceTonnes: asNumber(doc.brakeForceTonnes, `"${ref}"'s brake force`),
		powerKw: asNumber(doc.powerKw, `"${ref}"'s power`),
	};
	if (doc.signallerSpeedKmh !== undefined) {
		spec.signallerSpeedKmh = asNumber(
			doc.signallerSpeedKmh,
			`"${ref}"'s signaller speed`,
		);
	}
	return spec;
}

function parseRepeat(input: unknown, ref: string): Repeat {
	const doc = asRecord(input, `"${ref}"'s repeat is not an object.`);
	return {
		intervalMinutes: asNumber(
			doc.intervalMinutes,
			`"${ref}"'s repeat interval`,
		),
		headcodeIncrement: asNumber(
			doc.headcodeIncrement,
			`"${ref}"'s headcode increment`,
		),
		count: asNumber(doc.count, `"${ref}"'s repeat count`),
	};
}

/**
 * One action's fields, each read with a message naming the action and field,
 * so the per-kind readers below are a line per field.
 */
interface ActionFields {
	time(): SimTime;
	ref(field: string): string;
	text(field: string, what: string): string;
	cell(field: string): Cell;
	doc: Record<string, unknown>;
	where: string;
}

/**
 * How to read each kind, keeping only the fields it declares. The mapped type
 * makes a kind added to the union a compile error here until it has a reader —
 * which is also what makes this table the list of kinds this build accepts.
 */
const ACTION_READERS: {
	[K in Action["kind"]]: (f: ActionFields) => ActionOf<K>;
} = {
	startNew: (f) => ({
		kind: "startNew",
		time: f.time(),
		rear: f.cell("rear"),
		front: f.cell("front"),
		...(f.doc.signallerControl === undefined
			? {}
			: {
					signallerControl: asBoolean(
						f.doc.signallerControl,
						`${f.where}'s signaller-control flag`,
					),
				}),
	}),
	startNewShuttle: (f) => ({
		kind: "startNewShuttle",
		time: f.time(),
		rear: f.cell("rear"),
		front: f.cell("front"),
		otherRef: f.ref("otherRef"),
	}),
	startFromSplit: (f) => ({
		kind: "startFromSplit",
		time: f.time(),
		fromRef: f.ref("fromRef"),
	}),
	startNewService: (f) => ({
		kind: "startNewService",
		time: f.time(),
		fromRef: f.ref("fromRef"),
	}),
	startShuttle: (f) => ({
		kind: "startShuttle",
		time: f.time(),
		fromRef: f.ref("fromRef"),
	}),
	startFromShuttle: (f) => ({
		kind: "startFromShuttle",
		time: f.time(),
		fromRef: f.ref("fromRef"),
	}),
	stop: readStop,
	pass: (f) => ({
		kind: "pass",
		time: f.time(),
		location: f.text("location", "location"),
	}),
	changeDirection: (f) => ({ kind: "changeDirection", time: f.time() }),
	frontSplit: (f) => ({
		kind: "frontSplit",
		time: f.time(),
		newRef: f.ref("newRef"),
	}),
	rearSplit: (f) => ({
		kind: "rearSplit",
		time: f.time(),
		newRef: f.ref("newRef"),
	}),
	joinedBy: (f) => ({
		kind: "joinedBy",
		time: f.time(),
		otherRef: f.ref("otherRef"),
	}),
	finishJoin: (f) => ({
		kind: "finishJoin",
		time: f.time(),
		otherRef: f.ref("otherRef"),
	}),
	changeDescription: (f) => ({
		kind: "changeDescription",
		time: f.time(),
		description: f.text("description", "description"),
	}),
	changeMaxSpeed: (f) => ({
		kind: "changeMaxSpeed",
		time: f.time(),
		maxSpeedKmh: asNumber(f.doc.maxSpeedKmh, `${f.where}'s maximum speed`),
	}),
	finishNewService: (f) => ({
		kind: "finishNewService",
		time: f.time(),
		nextRef: f.ref("nextRef"),
	}),
	finishRemainHere: () => ({ kind: "finishRemainHere" }),
	finishShuttleRemainHere: (f) => ({
		kind: "finishShuttleRemainHere",
		otherRef: f.ref("otherRef"),
	}),
	finishShuttleNewService: (f) => ({
		kind: "finishShuttleNewService",
		time: f.time(),
		nextRef: f.ref("nextRef"),
		otherRef: f.ref("otherRef"),
	}),
	finishExit: (f) => {
		if (!Array.isArray(f.doc.exits)) {
			throw new InvalidTimetableError(`${f.where} has no list of exits.`);
		}
		return {
			kind: "finishExit",
			time: f.time(),
			exits: f.doc.exits.map((cell, i) =>
				asCell(cell, `${f.where}'s exit ${i + 1}`),
			),
		};
	},
};

/** A stop's times are each optional, so it is the one reader with branches. */
function readStop(f: ActionFields): ActionOf<"stop"> {
	const stop: ActionOf<"stop"> = {
		kind: "stop",
		location: f.text("location", "location"),
	};
	if (f.doc.arrive !== undefined) {
		stop.arrive = asTime(f.doc.arrive, `${f.where}'s arrival`);
	}
	if (f.doc.depart !== undefined) {
		stop.depart = asTime(f.doc.depart, `${f.where}'s departure`);
	}
	if (f.doc.minDwellSeconds !== undefined) {
		stop.minDwellSeconds = asNumber(
			f.doc.minDwellSeconds,
			`${f.where}'s minimum dwell`,
		);
	}
	return stop;
}

function isKnownKind(kind: string): kind is Action["kind"] {
	return Object.hasOwn(ACTION_READERS, kind);
}

/**
 * Read one action, keeping only the fields its `kind` declares.
 *
 * Rebuilding field by field rather than spreading the input is what makes the
 * result trustworthy: a document cannot smuggle an extra property past the
 * type, and a missing one is caught here rather than surfacing as `undefined`
 * somewhere in the engine.
 */
function parseAction(input: unknown, ref: string, index: number): Action {
	const where = `action ${index + 1} of "${ref}"`;
	const doc = asRecord(input, `${where} is not an action.`);
	const kind = asString(doc.kind, `${where}'s kind`);

	if (!isKnownKind(kind)) {
		throw new InvalidTimetableError(`${where} has an unknown kind "${kind}".`);
	}

	const fields: ActionFields = {
		doc,
		where,
		time: () => asTime(doc.time, `${where}'s time`),
		ref: (field) => asString(doc[field], `${where}'s ${field}`),
		text: (field, what) => asString(doc[field], `${where}'s ${what}`),
		cell: (field) => asCell(doc[field], `${where}'s ${field}`),
	};
	const read = ACTION_READERS[kind] as (f: ActionFields) => Action;
	const action = read(fields);
	if (doc.warning !== undefined) {
		action.warning = asBoolean(doc.warning, `${where}'s warning flag`);
	}
	return action;
}

// ── Field readers ───────────────────────────────────────────────────────
//
// Each names the field it is reading, so a rejected file says which field
// rather than only that something was wrong somewhere.

function asRecord(value: unknown, message: string): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new InvalidTimetableError(message);
	}
	return value as Record<string, unknown>;
}

function asString(value: unknown, what: string): string {
	if (typeof value !== "string") {
		throw new InvalidTimetableError(`Expected ${what} to be text.`);
	}
	return value;
}

function asNumber(value: unknown, what: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new InvalidTimetableError(`Expected ${what} to be a number.`);
	}
	return value;
}

function asBoolean(value: unknown, what: string): boolean {
	if (typeof value !== "boolean") {
		throw new InvalidTimetableError(`Expected ${what} to be true or false.`);
	}
	return value;
}

/** A time is stored as seconds; text is accepted so a file can be hand-edited. */
function asTime(value: unknown, what: string): SimTime {
	if (typeof value === "string") {
		try {
			return parseSimTime(value);
		} catch {
			throw new InvalidTimetableError(`Expected ${what} to be a clock time.`);
		}
	}
	const seconds = asNumber(value, what);
	if (seconds < 0) {
		throw new InvalidTimetableError(`Expected ${what} not to be negative.`);
	}
	return seconds;
}

function asCell(value: unknown, what: string): Cell {
	const doc = asRecord(value, `Expected ${what} to be a grid cell.`);
	return {
		gx: asNumber(doc.gx, `${what}'s x`),
		gy: asNumber(doc.gy, `${what}'s y`),
	};
}
