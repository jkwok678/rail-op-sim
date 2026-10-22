/**
 * Authoring helpers for railway and timetable documents.
 *
 * A generator script builds a railway by calling the *real* model — `Map_`,
 * `addTrack`, `setPreferredDirectionsAlongPath`, `serializeMap` — rather than
 * writing `SerializedMap` JSON by hand. Hand-written JSON gets link masks,
 * preferred directions and shared label indices wrong in ways that only show
 * up as "the railway is not complete" in the editor; going through the model
 * makes those the model's problem, and `writeDocuments` refuses to save
 * anything the validator rejects.
 *
 * Everything here speaks *cells* (`{ gx, gy }`, +Y up), never the scaled
 * element coordinates the map stores — `cellToLocation` does that conversion
 * and nothing in a generator script should have to.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { Text } from "../../../../packages/shared/src/railway/element";
import type {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	SignalType,
	SwitchType,
} from "../../../../packages/shared/src/railway/enums";
import { Platform, StraightType } from "../../../../packages/shared/src/railway/enums";
import { Map_ } from "../../../../packages/shared/src/railway/map/map";
import type { PreferredDirectionIssue } from "../../../../packages/shared/src/railway/map/map-connectivity";
import {
	getConnectivityReport,
	LINK_OFFSETS,
	setPreferredDirectionsAlongPath,
} from "../../../../packages/shared/src/railway/map/map-connectivity";
import {
	deserializeMap,
	SERIALIZED_MAP_VERSION,
	serializeMap,
} from "../../../../packages/shared/src/railway/map/map-serialization";
import {
	cellToLocation,
	getLocationNames,
	trackAtCell,
} from "../../../../packages/shared/src/railway/timetable/locations";
import {
	parseTimetable,
	SERIALIZED_TIMETABLE_VERSION,
} from "../../../../packages/shared/src/railway/timetable/serialization";
import {
	formatSimTime,
	parseSimTime,
	type SimTime,
} from "../../../../packages/shared/src/railway/timetable/time";
import type {
	Cell,
	Service,
	Timetable,
} from "../../../../packages/shared/src/railway/timetable/types";
import {
	hasErrors,
	type TimetableIssue,
	validateTimetable,
} from "../../../../packages/shared/src/railway/timetable/validate";
import type { SignalAspectValue } from "../../../../packages/shared/src/railway/track/signal-aspects";
import { SignalAspect } from "../../../../packages/shared/src/railway/track/signal-aspects";
import type { TrackData } from "../../../../packages/shared/src/railway/track/track-data";
import type { Track } from "../../../../packages/shared/src/railway/track/track";

export type { Cell, Service, Timetable, TimetableIssue };
export { Platform, SignalAspect, parseSimTime, type SimTime };

/**
 * The `imageSize` the app's editor uses: one element coordinate per cell.
 *
 * `Map_` defaults to 16 (the RailOS sprite size) and the shared tests keep
 * that so a forgotten conversion shows up as a failure, but a document written
 * for the app must use 1 or every cell in it lands sixteen cells away.
 */
export const APP_IMAGE_SIZE = 1;

/** The font every generated label uses; nothing in the model depends on it. */
export const DEFAULT_FONT = { family: "sans-serif", pointSize: 12 };

/** A cell, so a generator can write `c(3, 0)` instead of the object literal. */
export function c(gx: number, gy: number): Cell {
	return { gx, gy };
}

/** Render a cell the way the validator's messages do. */
export function cellText(cell: Cell): string {
	return `(${cell.gx}, ${cell.gy})`;
}

// ============================================================================
// Building a railway
// ============================================================================

/** An empty map at the app's scale, ready for track. */
export function newRailway(imageSize: number = APP_IMAGE_SIZE): Map_ {
	const map = new Map_();
	map.setImageSize(imageSize);
	return map;
}

/** Put `data` in `cell`, converting to element coordinates on the way. */
export function place(map: Map_, cell: Cell, data: TrackData): Track {
	const { x, y } = cellToLocation(map, cell);
	return map.addTrack(data, x, y);
}

/** Plain track. Use {@link run} for more than one cell of it. */
export function straight(
	map: Map_,
	cell: Cell,
	subtype: StraightType,
	options: { levelCrossing?: boolean } = {},
): Track {
	return place(map, cell, {
		kind: "straight",
		subtype,
		platform1: false,
		platform2: false,
		levelCrossing: options.levelCrossing ?? false,
	});
}

/**
 * Fill every cell from `from` to `to` inclusive with straight track of the
 * right subtype, and answer the cells it filled.
 *
 * The run must be horizontal, vertical or exactly diagonal — anything else is
 * a mistake in the layout, not a shape to guess at.
 */
export function run(map: Map_, from: Cell, to: Cell): Cell[] {
	const dx = Math.sign(to.gx - from.gx);
	const dy = Math.sign(to.gy - from.gy);
	const steps = Math.max(Math.abs(to.gx - from.gx), Math.abs(to.gy - from.gy));
	if (
		dx !== 0 &&
		dy !== 0 &&
		Math.abs(to.gx - from.gx) !== Math.abs(to.gy - from.gy)
	) {
		throw new Error(
			`run ${cellText(from)} → ${cellText(to)} is neither straight nor diagonal.`,
		);
	}

	const subtype =
		dy === 0
			? StraightType.STRAIGHTH
			: dx === 0
				? StraightType.STRAIGHTV
				: dx === dy
					? StraightType.STRAIGHTRIGHTUP
					: StraightType.STRAIGHTLEFTUP;

	const cells: Cell[] = [];
	for (let i = 0; i <= steps; i++) {
		const cell = c(from.gx + dx * i, from.gy + dy * i);
		straight(map, cell, subtype);
		cells.push(cell);
	}
	return cells;
}

/** A way off the map. Its subtype names the side the track continues on. */
export function exit(map: Map_, cell: Cell, subtype: ExitType): Track {
	return place(map, cell, { kind: "exit", subtype });
}

/** A dead end. Its subtype names the side the track continues on. */
export function buffer(map: Map_, cell: Cell, subtype: BufferType): Track {
	return place(map, cell, {
		kind: "buffer",
		subtype,
		platform1: false,
		platform2: false,
	});
}

export function curve(map: Map_, cell: Cell, subtype: CurvedType): Track {
	return place(map, cell, { kind: "curved", subtype });
}

export function points(map: Map_, cell: Cell, subtype: SwitchType): Track {
	return place(map, cell, {
		kind: "switch",
		subtype,
		platform1: false,
		platform2: false,
	});
}

export function directed(map: Map_, cell: Cell, subtype: DirectedType): Track {
	return place(map, cell, {
		kind: "directed",
		subtype,
		platform1: false,
		platform2: false,
	});
}

export function signal(
	map: Map_,
	cell: Cell,
	subtype: SignalType,
	aspect: SignalAspectValue = SignalAspect.THREE_ASPECT,
): Track {
	return place(map, cell, {
		kind: "signal",
		subtype,
		aspect,
		platform1: false,
		platform2: false,
	});
}

export function crossover(
	map: Map_,
	cell: Cell,
	subtype: CrossoverType,
): Track {
	return place(map, cell, { kind: "crossover", subtype });
}

export function flyover(map: Map_, cell: Cell, subtype: FlyoverType): Track {
	return place(map, cell, { kind: "flyover", subtype });
}

/** A bridge or underpass. Needs a name, like a platform does. */
export function bridgeUnderpass(
	map: Map_,
	cell: Cell,
	subtype: BridgeUnderpassType,
): Track {
	return place(map, cell, {
		kind: "bridgeUnderpass",
		subtype,
		platform1: false,
		platform2: false,
	});
}

/**
 * One mouth of a portal. Both mouths must be placed and then paired with
 * {@link pairPortals}, or the railway will never be connected.
 */
export function portal(map: Map_, cell: Cell, subtype: LinkedType): Track {
	return place(map, cell, { kind: "linked", subtype });
}

/** Wire two portal mouths to each other. */
export function pairPortals(map: Map_, a: Cell, b: Cell): void {
	const first = cellToLocation(map, a);
	const second = cellToLocation(map, b);
	map.connectTwoLinkedTracks(first.x, first.y);
	map.connectTwoLinkedTracks(second.x, second.y);
}

/**
 * Add a platform to the track in `cell`.
 *
 * `side` has to suit the track's orientation — UP/DOWN for horizontal track,
 * LEFT/RIGHT for vertical — and the map silently ignores a mismatch, so this
 * checks the platform actually arrived.
 */
export function platform(map: Map_, cell: Cell, side: Platform): void {
	const track = trackAtCell(map, cell);
	if (!track) throw new Error(`No track at ${cellText(cell)} for a platform.`);
	const { x, y } = cellToLocation(map, cell);
	map.addPlatform(side, x, y);
	if (!track.hasPlatform()) {
		throw new Error(
			`${side} platform refused at ${cellText(cell)} — wrong side for ${String(
				track.data.subtype,
			)}, or the cell has a level crossing or a linked named location.`,
		);
	}
}

/**
 * Give every cell in `cells` one shared label.
 *
 * Sharing is what makes several platforms one station: `getLocationNames`
 * reads the label off each track, and a timetable booked to the name may use
 * any of them. The `Text` goes into the map's own list as well as onto the
 * tracks, which is how `serializeMap` preserves the sharing by index.
 */
export function name(map: Map_, cells: Cell[], label: string): Text {
	if (cells.length === 0) throw new Error(`Nothing to label "${label}".`);
	const anchor = cellToLocation(map, cells[0]);
	const text = new Text(anchor.x, anchor.y, label, { ...DEFAULT_FONT });
	map.addText(text);
	for (const cell of cells) {
		const track = trackAtCell(map, cell);
		if (!track) throw new Error(`No track at ${cellText(cell)} to label.`);
		track.setText(text);
	}
	return text;
}

/** A named location element (a station building, not a place a train calls). */
export function namedLocation(map: Map_, cell: Cell, label: string): void {
	const { x, y } = cellToLocation(map, cell);
	map.createAddNamedLocation(x, y);
	const element = map.getNamedLocationAt(x, y);
	if (!element) throw new Error(`No named location placed at ${cellText(cell)}.`);
	const text = new Text(x, y, label, { ...DEFAULT_FONT });
	map.addText(text);
	element.setText(text);
}

// ============================================================================
// Preferred directions
// ============================================================================

/**
 * Set preferred directions along the path from `from` to `to`.
 *
 * Every track needs a direction pair before `isRailwayComplete` is true, and
 * a line worked in both directions needs {@link directBothWays}. Throws rather
 * than returning null: a route that cannot be found is a layout mistake, and
 * the generator should stop at it rather than write an incomplete railway.
 */
export function direct(map: Map_, from: Cell, to: Cell): void {
	const start = trackAtCell(map, from);
	const end = trackAtCell(map, to);
	if (!start) throw new Error(`No track at ${cellText(from)} to route from.`);
	if (!end) throw new Error(`No track at ${cellText(to)} to route to.`);

	const result = setPreferredDirectionsAlongPath(map, start, end);
	if (result === null) {
		throw new Error(
			`No path from ${cellText(from)} to ${cellText(to)} — the track between them is not joined, or a one-way section points the other way.`,
		);
	}
	if (result.facingSwitchEndpoint) {
		throw new Error(
			`The route ${cellText(from)} → ${cellText(to)} starts or ends on the facing end of a switch; route from the plain track beyond it instead.`,
		);
	}
}

/** {@link direct} both ways along the same path, for a bidirectional line. */
export function directBothWays(map: Map_, a: Cell, b: Cell): void {
	direct(map, a, b);
	direct(map, b, a);
}

// ============================================================================
// Checking
// ============================================================================

/** Cell of a track, for reporting. */
function trackCell(map: Map_, track: Track): Cell {
	const step = map.getImageSize();
	return c(track.getLocationX() / step, track.getLocationY() / step);
}

/**
 * Everything wrong with `map`, in the words the editor would use, or an empty
 * array when the railway is complete.
 */
export function railwayProblems(map: Map_): string[] {
	const report = getConnectivityReport(map);
	const problems: string[] = [];

	if (report.total === 0) problems.push("The railway has no track.");

	for (const { track, links } of report.dangling) {
		const at = trackCell(map, track);
		const where = links
			.map((link) => {
				const [dx, dy] = LINK_OFFSETS[link];
				return `link ${link} → ${cellText(c(at.gx + dx, at.gy + dy))}`;
			})
			.join(", ");
		problems.push(
			`${cellText(at)} ${String(track.data.subtype)}: nothing joins back at ${where}.`,
		);
	}
	for (const track of report.unpairedLinked) {
		problems.push(`${cellText(trackCell(map, track))}: portal with no partner.`);
	}
	for (const element of report.unnamed) {
		const at = c(
			element.getLocationX() / map.getImageSize(),
			element.getLocationY() / map.getImageSize(),
		);
		problems.push(`${cellText(at)}: needs a name (platform, bridge or location).`);
	}
	for (const track of report.undirected) {
		problems.push(
			`${cellText(trackCell(map, track))}: no preferred direction — include it in a direct() route.`,
		);
	}
	for (const issue of report.brokenRoutes as PreferredDirectionIssue[]) {
		problems.push(
			`${cellText(trackCell(map, issue.track))}: preferred direction ${issue.pair.entry}→${issue.pair.exit} is broken (${issue.reason}).`,
		);
	}
	return problems;
}

/** Print what is wrong with `map`, or confirm it is complete. */
export function reportRailway(map: Map_): void {
	const problems = railwayProblems(map);
	if (problems.length === 0) {
		console.log(
			`Railway complete: ${getConnectivityReport(map).total} tracks, locations: ${
				getLocationNames(map).join(", ") || "(none)"
			}`,
		);
		return;
	}
	console.error(`Railway is not complete (${problems.length} problems):`);
	for (const problem of problems) console.error(`  - ${problem}`);
}

/** Render one validator issue the way the editor would show it. */
export function issueText(issue: TimetableIssue): string {
	const where = issue.serviceRef
		? ` [${issue.serviceRef}${
				issue.actionIndex === undefined ? "" : ` action ${issue.actionIndex}`
			}]`
		: "";
	return `${issue.severity}: ${issue.code}${where} — ${issue.message}`;
}

/** Print every issue in `issues`, or confirm there were none. */
export function reportTimetable(issues: TimetableIssue[]): void {
	if (issues.length === 0) {
		console.log("Timetable valid: no issues.");
		return;
	}
	for (const issue of issues) {
		const line = `  ${issueText(issue)}`;
		if (issue.severity === "error") console.error(line);
		else console.log(line);
	}
}

// ============================================================================
// Writing timetables
// ============================================================================

/** Shorthand for {@link parseSimTime}, so a generator reads as `at("06:10")`. */
export function at(text: string): SimTime {
	return parseSimTime(text);
}

/** A timetable with `version` filled in, so a generator states only its content. */
export function timetable(options: {
	startTime: SimTime;
	services: Service[];
	title?: string;
}): Timetable {
	return {
		version: SERIALIZED_TIMETABLE_VERSION,
		title: options.title,
		startTime: options.startTime,
		services: options.services,
	};
}

// ============================================================================
// Reading and writing files
// ============================================================================

/** Read a saved railway back into a `Map_`. JSON only; the app also reads YAML. */
export function loadRailway(path: string): Map_ {
	const data = JSON.parse(readFileSync(path, "utf8")) as {
		version?: number;
		imageSize?: number;
	};
	if (data.version !== SERIALIZED_MAP_VERSION) {
		throw new Error(
			`${path}: map version ${String(data.version)}, expected ${SERIALIZED_MAP_VERSION}.`,
		);
	}
	const map = new Map_();
	// deserializeMap sets imageSize from the document.
	deserializeMap(
		data as unknown as Parameters<typeof deserializeMap>[0],
		map,
	);
	map.makeTrackList();
	return map;
}

/** Read a saved timetable, with `parseTimetable`'s strictness. */
export function loadTimetable(path: string): Timetable {
	return parseTimetable(JSON.parse(readFileSync(path, "utf8")));
}

/**
 * Check both documents and write them only if they are sound.
 *
 * This is the whole point of generating rather than hand-writing: a document
 * that would make the editor say "the railway is not complete", or that the
 * timetable validator calls an error, never reaches disk. Warnings are printed
 * and do not stop the save.
 */
export function writeDocuments(options: {
	map: Map_;
	mapPath: string;
	timetable?: Timetable;
	timetablePath?: string;
	/** Save even when the railway is incomplete — for a work in progress. */
	allowIncompleteRailway?: boolean;
}): void {
	const { map, mapPath } = options;
	map.makeTrackList();

	const problems = railwayProblems(map);
	reportRailway(map);
	if (problems.length > 0 && !options.allowIncompleteRailway) {
		throw new Error(
			"Refusing to save: the railway is not complete (pass allowIncompleteRailway to override).",
		);
	}

	let issues: TimetableIssue[] = [];
	if (options.timetable) {
		issues = validateTimetable(options.timetable, map);
		reportTimetable(issues);
		if (hasErrors(issues)) {
			throw new Error("Refusing to save: the timetable has errors.");
		}
	}

	writeJson(mapPath, serializeMap(map));
	console.log(`Wrote ${mapPath}`);

	if (options.timetable && options.timetablePath) {
		writeJson(options.timetablePath, options.timetable);
		console.log(`Wrote ${options.timetablePath}`);
		const span = timetableSpan(options.timetable);
		if (span) console.log(`Timetable runs ${span}.`);
	}
}

/** First and last booked time in a timetable, for the summary line. */
function timetableSpan(tt: Timetable): string | null {
	const times: SimTime[] = [];
	for (const service of tt.services) {
		for (const action of service.actions) {
			if ("time" in action) times.push(action.time);
			if (action.kind === "stop") {
				if (action.arrive !== undefined) times.push(action.arrive);
				if (action.depart !== undefined) times.push(action.depart);
			}
		}
	}
	if (times.length === 0) return null;
	return `${formatSimTime(Math.min(...times))}–${formatSimTime(Math.max(...times))}`;
}

/** Write `data` as the same pretty JSON the editor's save produces. */
export function writeJson(path: string, data: unknown): void {
	const slash = path.lastIndexOf("/");
	if (slash > 0) mkdirSync(path.slice(0, slash), { recursive: true });
	writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}
