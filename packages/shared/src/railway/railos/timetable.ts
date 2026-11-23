/**
 * Translate a RailOS timetable (.ttb) into ours, following
 * railway-dot-exe's ts-port/TIMETABLE-FORMAT.md.
 *
 * The timetable is converted on its own — it names cells and locations, not
 * track — so it can be checked against whichever railway it lands on.
 */

import { SERIALIZED_TIMETABLE_VERSION } from "../timetable/serialization";
import type { SimTime } from "../timetable/time";
import type {
	Action,
	Cell,
	Service,
	Timetable,
	TrainSpec,
} from "../timetable/types";
import { InvalidRailosFileError, railosCell } from "./railway";

/** What {@link convertRailosTimetable} made, and what it had to leave out. */
export interface RailosTimetableResult {
	timetable: Timetable;
	/** Entries skipped or renamed, one sentence each. */
	warnings: string[];
}

const COMMANDS = new Set(
	"Snt Sfs Sns Sns-fsh Snt-sh Sns-sh pas jbo fsp rsp cdt dsc cms Fns Fjo Fer Frh-sh Fns-sh F-nshs Frh".split(
		" ",
	),
);

const stripSpaces = (s: string): string =>
	s.trim().replace(/\s*([,;])\s*/g, "$1");

const timeOf = (s: string): SimTime | null => {
	const m = /^(\d\d):([0-5]\d)/.exec(s);
	return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 : null;
};

/** RailOS element ID ("57-N4") → our cell. N marks a negative number. */
function cellFromId(id: string): Cell {
	const m = /^(N?)(\d+)-(N?)(\d+)$/.exec(id.trim());
	if (!m) throw new Error(`bad element ID "${id}"`);
	const h = (m[1] ? -1 : 1) * Number(m[2]);
	const v = (m[3] ? -1 : 1) * Number(m[4]);
	return railosCell(h, v);
}

function trainSpec(parts: string[]): TrainSpec | undefined {
	if (parts.length < 7) return undefined;
	const n = (i: number) => Number(parts[i]);
	return {
		startSpeedKmh: n(2),
		maxSpeedKmh: n(3),
		massTonnes: n(4),
		brakeForceTonnes: n(5),
		powerKw: n(6),
		...(parts.length > 7 ? { signallerSpeedKmh: n(7) } : {}),
	};
}

/** A stop with both times, or a lone time — a departure first, else an arrival. */
function parseStop(
	time: SimTime,
	rest: string,
	seenLocation: boolean,
	w: { warning?: true },
): Action {
	const second = timeOf(rest);
	if (second !== null) {
		const [location = "", dwell] = rest.slice(6).split(";");
		return {
			kind: "stop",
			location,
			arrive: time,
			depart: second,
			...(dwell ? { minDwellSeconds: Number(dwell) } : {}),
			...w,
		};
	}
	const [location = "", dwell] = rest.split(";");
	const single = seenLocation ? { arrive: time } : { depart: time };
	return {
		kind: "stop",
		location,
		...single,
		...(dwell ? { minDwellSeconds: Number(dwell) } : {}),
		...w,
	};
}

function startCells(ids: string): { rear: Cell; front: Cell } {
	const [rear = "", front = ""] = ids.split(" ");
	return { rear: cellFromId(rear), front: cellFromId(front) };
}

type CommandParser = (
	time: SimTime,
	third: string,
	fourth: string,
	w: { warning?: true },
) => Action;

const COMMAND_PARSERS: Readonly<Record<string, CommandParser>> = {
	Snt: (time, third, fourth, w) => ({
		kind: "startNew",
		time,
		...startCells(third),
		...(fourth === "S" ? { signallerControl: true } : {}),
		...w,
	}),
	Sns: (time, third, _fourth, w) => ({
		kind: "startNewService",
		time,
		fromRef: third,
		...w,
	}),
	Sfs: (time, third, _fourth, w) => ({
		kind: "startFromSplit",
		time,
		fromRef: third,
		...w,
	}),
	pas: (time, third, _fourth, w) => ({
		kind: "pass",
		time,
		location: third,
		...w,
	}),
	cdt: (time, _third, _fourth, w) => ({
		kind: "changeDirection",
		time,
		...w,
	}),
	dsc: (time, third, _fourth, w) => ({
		kind: "changeDescription",
		time,
		description: third,
		...w,
	}),
	cms: (time, third, _fourth, w) => ({
		kind: "changeMaxSpeed",
		time,
		maxSpeedKmh: Number(third),
		...w,
	}),
	fsp: (time, third, _fourth, w) => ({
		kind: "frontSplit",
		time,
		newRef: third,
		...w,
	}),
	rsp: (time, third, _fourth, w) => ({
		kind: "rearSplit",
		time,
		newRef: third,
		...w,
	}),
	jbo: (time, third, _fourth, w) => ({
		kind: "joinedBy",
		time,
		otherRef: third,
		...w,
	}),
	"Snt-sh": (time, third, fourth, w) => ({
		kind: "startNewShuttle",
		time,
		...startCells(third),
		otherRef: fourth,
		...w,
	}),
	"Sns-sh": (time, third, fourth, w) => ({
		kind: "startShuttle",
		time,
		fromRef: fourth,
		otherRef: third,
		...w,
	}),
	"Sns-fsh": (time, third, _fourth, w) => ({
		kind: "startFromShuttle",
		time,
		fromRef: third,
		...w,
	}),
	"F-nshs": (time, third, _fourth, w) => ({
		kind: "finishToShuttle",
		time,
		nextRef: third,
		...w,
	}),
	Fns: (time, third, _fourth, w) => ({
		kind: "finishNewService",
		time,
		nextRef: third,
		...w,
	}),
	Fjo: (time, third, _fourth, w) => ({
		kind: "finishJoin",
		time,
		otherRef: third,
		...w,
	}),
	Fer: (time, third, _fourth, w) => ({
		kind: "finishExit",
		time,
		exits: third.split(" ").filter(Boolean).map(cellFromId),
		...w,
	}),
	"Frh-sh": (time, third, _fourth, w) => ({
		kind: "finishShuttleRemainHere",
		time,
		otherRef: third,
		...w,
	}),
	"Fns-sh": (time, third, fourth, w) => ({
		kind: "finishShuttleNewService",
		time,
		otherRef: third,
		nextRef: fourth,
		...w,
	}),
};

function parseCommand(
	word: string,
	time: SimTime,
	third: string | undefined,
	fourth: string | undefined,
	w: { warning?: true },
): Action {
	const parser = COMMAND_PARSERS[word];
	if (!parser) throw new Error(`Unsupported timetable action "${word}"`);
	// A missing field reads as empty; validation reports what it should be.
	return parser(time, third ?? "", fourth ?? "", w);
}

function parseAction(field: string, seenLocation: boolean): Action {
	const warning = field.startsWith("W");
	const text = warning ? field.slice(1) : field;
	const w: { warning?: true } = warning ? { warning: true } : {};
	if (text === "Frh") return { kind: "finishRemainHere", ...w };

	const time = timeOf(text);
	if (time === null) throw new Error(`no time in "${field}"`);
	const rest = text.slice(6);
	const [word = "", third, fourth] = rest.split(";");
	if (timeOf(rest) !== null || !COMMANDS.has(word)) {
		return parseStop(time, rest, seenLocation, w);
	}
	return parseCommand(word, time, third, fourth, w);
}

function parseService(entry: string): Service {
	const fields = stripSpaces(entry)
		.split(",")
		.filter((f) => f !== "");
	const info = (fields[0] ?? "").split(";");
	const actions: Action[] = [];
	let repeat: Service["repeat"];
	let seen = false;
	for (const field of fields.slice(1)) {
		if (field.startsWith("R;")) {
			const [, mins, digits, count] = field.split(";").map(Number);
			if (mins === undefined || digits === undefined || count === undefined) {
				throw new Error(`incomplete repeat "${field}"`);
			}
			repeat = { intervalMinutes: mins, headcodeIncrement: digits, count };
			continue;
		}
		const action = parseAction(field, seen);
		if (action.kind === "stop" || action.kind === "pass") seen = true;
		actions.push(action);
	}
	// Keys in the order the editor writes them.
	const spec = trainSpec(info);
	return {
		ref: info[0] ?? "",
		...(info[1] ? { description: info[1] } : {}),
		...(spec ? { train: spec } : {}),
		actions,
		...(repeat ? { repeat } : {}),
	};
}

function uniqueRef(ref: string, seen: Set<string>): string {
	if (!seen.has(ref)) return ref;
	for (let n = 2; ; n++) {
		const prefix = `${n}-`;
		const candidate = `${prefix}${ref.slice(-(8 - prefix.length))}`;
		if (!seen.has(candidate)) return candidate;
	}
}

/**
 * Convert the text of a RailOS `.ttb` file into a timetable.
 *
 * Like {@link convertRailosRailway}, the caller decodes the Latin-1 file.
 * An entry that cannot be read is skipped with a warning rather than failing
 * the whole timetable; a file with no start time at all throws
 * {@link InvalidRailosFileError}.
 */
export function convertRailosTimetable(
	text: string,
	options: { title?: string } = {},
): RailosTimetableResult {
	const warnings: string[] = [];
	const entries = text.split("\0");
	const i = entries.findIndex((e) => timeOf(stripSpaces(e)) !== null);
	const first = entries[i];
	if (first === undefined) {
		throw new InvalidRailosFileError(
			"Not a RailOS timetable: no start time found.",
		);
	}
	const startTime = timeOf(stripSpaces(first)) as SimTime;
	const services: Service[] = [];
	const seenRefs = new Set<string>();
	for (const raw of entries.slice(i + 1)) {
		const entry = stripSpaces(raw);
		if (entry === "" || /^,*$/.test(entry)) break;
		if (entry.startsWith("*")) continue;
		try {
			const service = parseService(entry);
			const ref = uniqueRef(service.ref, seenRefs);
			if (ref !== service.ref) {
				warnings.push(
					`duplicate service ref "${service.ref}" renamed to "${ref}".`,
				);
				service.ref = ref;
			}
			seenRefs.add(ref);
			services.push(service);
		} catch (error) {
			warnings.push(
				`timetable entry "${entry.slice(0, 40)}…": ${(error as Error).message}; skipped.`,
			);
		}
	}
	return {
		timetable: {
			version: SERIALIZED_TIMETABLE_VERSION,
			...(options.title ? { title: options.title } : {}),
			startTime,
			services,
		},
		warnings,
	};
}
