/**
 * Translate a RailOS railway (.rly) and timetable (.ttb) into rail-op-sim's
 * documents, written as YAML.
 *
 *   .claude/skills/railway-author/scripts/run.sh \
 *     .claude/skills/railway-author/scripts/import-railos.ts \
 *     <in.rly> <in.ttb> <out-railway.yaml> <out-timetable.yaml>
 *
 * Formats follow railway-dot-exe: `TTrack::LoadTrack`, `TTextHandler::LoadText`
 * and `TOnePrefDir::LoadPrefDir` for the railway; ts-port/TIMETABLE-FORMAT.md
 * for the timetable. Track pieces are matched to our subtypes by their links,
 * never by name, so the mapping cannot drift from the art tables.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { stringify } from "../../../../packages/app/node_modules/yaml/dist/index.js";
import { Text } from "../../../../packages/shared/src/railway/element";
import {
	type ParapetType,
	Platform,
} from "../../../../packages/shared/src/railway/enums";
import type { Map_ } from "../../../../packages/shared/src/railway/map/map";
import { serializeMap } from "../../../../packages/shared/src/railway/map/map-serialization";
import type { SimTime } from "../../../../packages/shared/src/railway/timetable/time";
import type {
	Action,
	Cell,
	Service,
	Timetable,
	TrainSpec,
} from "../../../../packages/shared/src/railway/timetable/types";
import {
	hasErrors,
	validateTimetable,
} from "../../../../packages/shared/src/railway/timetable/validate";
import type { Track } from "../../../../packages/shared/src/railway/track/track";
import {
	getDirectedFlow,
	getLinksForSubtype,
	getRails,
	signalFacingExit,
	type TrackData,
	type TrackKind,
} from "../../../../packages/shared/src/railway/track/track-data";
import { createTrackData } from "../../../../packages/shared/src/railway/track/track-factory";
import {
	c,
	issueText,
	newRailway,
	pairPortals,
	place,
	railwayProblems,
} from "./authoring";

const [rlyPath, ttbPath, railwayOut, timetableOut] = process.argv.slice(2);
if (!rlyPath || !ttbPath || !railwayOut || !timetableOut) {
	console.error("usage: import-railos.ts <in.rly> <in.ttb> <out-railway.yaml> <out-timetable.yaml>");
	process.exitCode = 2;
	throw new Error("missing arguments");
}

// ============================================================================
// RailOS track pieces (TrackUnit.cpp TFixedTrackArray)
// ============================================================================

/** Links per SpeedTag, as compass codes (1 NW … 9 SE, 5 unused). */
const LINKS: number[][] = [
	[-1, -1, -1, -1],
	[4, 6, -1, -1], [2, 8, -1, -1], [6, 8, -1, -1], [4, 8, -1, -1], [2, 6, -1, -1], [2, 4, -1, -1],
	[4, 6, 4, 2], [6, 4, 6, 2], [4, 6, 4, 8], [6, 4, 6, 8], [8, 2, 8, 4], [8, 2, 8, 6], [2, 8, 2, 4], [2, 8, 2, 6],
	[4, 6, 2, 8], [1, 9, 3, 7],
	[-1, -1, -1, -1],
	[3, 7, -1, -1], [1, 9, -1, -1], [7, 6, -1, -1], [4, 9, -1, -1], [1, 6, -1, -1], [4, 3, -1, -1], [3, 8, -1, -1], [1, 8, -1, -1], [2, 9, -1, -1], [2, 7, -1, -1],
	[4, 6, 4, 3], [6, 4, 6, 1], [4, 6, 4, 9], [6, 4, 6, 7], [8, 2, 8, 1], [8, 2, 8, 3], [2, 8, 2, 7], [2, 8, 2, 9],
	[9, 1, 9, 2], [7, 3, 7, 2], [3, 7, 3, 8], [1, 9, 1, 8], [9, 1, 9, 4], [7, 3, 7, 6], [3, 7, 3, 4], [1, 9, 1, 6],
	[1, 9, 2, 8], [2, 8, 3, 7], [4, 6, 3, 7], [1, 9, 4, 6],
	[2, 8, 4, 6], [4, 6, 2, 8], [3, 7, 1, 9], [1, 9, 3, 7], [2, 8, 1, 9], [2, 8, 3, 7], [3, 7, 2, 8], [1, 9, 2, 8], [4, 6, 3, 7], [4, 6, 1, 9], [1, 9, 4, 6], [3, 7, 4, 6],
	[4, 6, -1, -1], [6, 4, -1, -1], [8, 2, -1, -1], [2, 8, -1, -1], [1, 9, -1, -1], [3, 7, -1, -1], [7, 3, -1, -1], [9, 1, -1, -1],
	[4, 6, -1, -1], [4, 6, -1, -1], [2, 8, -1, -1], [2, 8, -1, -1], [1, 9, -1, -1], [3, 7, -1, -1], [3, 7, -1, -1], [1, 9, -1, -1],
	[-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1],
	[4, 6, -1, -1], [6, 4, -1, -1], [8, 2, -1, -1], [2, 8, -1, -1], [1, 9, -1, -1], [3, 7, -1, -1], [7, 3, -1, -1], [9, 1, -1, -1],
	[4, 6, -1, -1], [6, 4, -1, -1], [8, 2, -1, -1], [2, 8, -1, -1], [1, 9, -1, -1], [3, 7, -1, -1], [7, 3, -1, -1], [9, 1, -1, -1],
	[-1, -1, -1, -1],
	...Array.from({ length: 28 }, () => [-1, -1, -1, -1]),
	[4, 6, -1, -1], [4, 6, -1, -1], [2, 8, -1, -1], [2, 8, -1, -1],
	[4, 6, -1, -1], [2, 8, -1, -1],
	[-1, -1, -1, -1],
	[8, 1, 8, 3], [4, 3, 4, 9], [2, 9, 2, 7], [6, 7, 6, 1], [9, 4, 9, 2], [7, 2, 7, 6], [1, 6, 1, 8], [3, 8, 3, 4],
	[3, 7, -1, -1], [3, 7, -1, -1], [1, 9, -1, -1], [1, 9, -1, -1],
	[-1, -1, -1, -1],
	[4, 6, -1, -1], [2, 8, -1, -1],
];

if (LINKS.length !== 147) throw new Error(`LINKS has ${LINKS.length} rows`);

/** Which of a signal's two links carries the signal: the exit it protects. */
const SIGNAL_END: Record<number, 0 | 1> = { 68: 1, 69: 0, 70: 0, 71: 1, 72: 0, 73: 0, 74: 1, 75: 1 };

type Piece =
	| "simple" | "points" | "crossover" | "bridge" | "buffers" | "signal" | "platform"
	| "continuation" | "gap" | "concourse" | "parapet" | "arrow" | "footbridge"
	| "named" | "levelCrossing" | "unused";

function pieceOf(tag: number): Piece {
	if (tag >= 1 && tag <= 6) return "simple";
	if (tag >= 7 && tag <= 14) return "points";
	if (tag === 15 || tag === 16) return "crossover";
	if (tag >= 18 && tag <= 27) return "simple";
	if (tag >= 28 && tag <= 43) return "points";
	if (tag >= 44 && tag <= 47) return "crossover";
	if (tag >= 48 && tag <= 59) return "bridge";
	if (tag >= 60 && tag <= 67) return "buffers";
	if (tag >= 68 && tag <= 75) return "signal";
	if (tag >= 76 && tag <= 79) return "platform";
	if (tag >= 80 && tag <= 87) return "continuation";
	if (tag >= 88 && tag <= 95) return "gap";
	if (tag === 96) return "concourse";
	if (tag >= 97 && tag <= 124) return "parapet";
	if (tag >= 125 && tag <= 128) return "arrow";
	if (tag === 129 || tag === 130 || tag === 145 || tag === 146) return "footbridge";
	if (tag === 131) return "named";
	if (tag >= 132 && tag <= 139) return "points";
	if (tag >= 140 && tag <= 143) return "arrow";
	if (tag === 144) return "levelCrossing";
	return "unused";
}

/** RailOS compass code (screen y down) → our link index (+Y up). */
function linkOf(compass: number): number {
	const [dx, dyScreen] = [
		[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1],
	][compass];
	const dy = -dyScreen;
	return (1 - dy) * 3 + (dx + 1);
}

const linksOf = (tag: number): number[] =>
	LINKS[tag].filter((l) => l > 0).map(linkOf);

/** Every subtype of `kind`, from the link table (the factory validates names). */
const SUBTYPES: Record<TrackKind, string[]> = {
	straight: ["STRAIGHTH", "STRAIGHTV", "STRAIGHTLEFTUP", "STRAIGHTRIGHTUP"],
	directed: [
		"DIRECTEDLEFT", "DIRECTEDRIGHT", "DIRECTEDUP", "DIRECTEDDOWN",
		"DIRECTEDLEFTUP", "DIRECTEDRIGHTDOWN", "DIRECTEDRIGHTUP", "DIRECTEDLEFTDOWN",
	],
	curved: [
		"TIGHTCURVE1", "TIGHTCURVE2", "TIGHTCURVE3", "TIGHTCURVE4",
		...Array.from({ length: 8 }, (_, i) => `CURVE${i + 1}`),
	],
	linked: ["LINKLEFT", "LINKRIGHT", "LINKUP", "LINKDOWN", "LINKLEFTUP", "LINKRIGHTDOWN", "LINKLEFTDOWN", "LINKRIGHTUP"],
	exit: ["EXITLEFT", "EXITRIGHT", "EXITUP", "EXITDOWN", "EXITLEFTUP", "EXITRIGHTUP", "EXITLEFTDOWN", "EXITRIGHTDOWN"],
	buffer: ["BUFFERLEFT", "BUFFERRIGHT", "BUFFERUP", "BUFFERDOWN", "BUFFERLEFTUP", "BUFFERRIGHTUP", "BUFFERLEFTDOWN", "BUFFERRIGHTDOWN"],
	signal: ["SIGNALLEFT", "SIGNALRIGHT", "SIGNALUP", "SIGNALDOWN", "SIGNALLEFTUP", "SIGNALRIGHTDOWN", "SIGNALRIGHTUP", "SIGNALLEFTDOWN"],
	bridgeUnderpass: ["BRIDGE1", "UNDERPASS1", "BRIDGE2", "UNDERPASS2"],
	switch: [
		...Array.from({ length: 8 }, (_, i) => `SWITCHTIGHT${i + 1}`),
		...Array.from({ length: 8 }, (_, i) => `SWITCHSPLIT${i + 1}`),
		...Array.from({ length: 16 }, (_, i) => `SWITCH${i + 1}`),
	],
	crossover: Array.from({ length: 6 }, (_, i) => `CROSSOVER${i + 1}`),
	flyover: Array.from({ length: 12 }, (_, i) => `FLYOVER${i + 1}`),
};

const sameSet = (a: number[], b: number[]): boolean =>
	a.length === b.length && a.every((x) => b.includes(x));

const pairKey = (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`);

function subtypeByLinks(kind: TrackKind, links: number[]): string | null {
	return SUBTYPES[kind].find((s) => sameSet(getLinksForSubtype(kind, s as never), links)) ?? null;
}

/** A switch whose two rails are exactly the RailOS piece's two paths. */
function switchSubtype(tag: number): string | null {
	const [a, b, cc, d] = LINKS[tag].map(linkOf);
	const want = [pairKey(a, b), pairKey(cc, d)].sort();
	return (
		SUBTYPES.switch.find((s) => {
			const rails = getRails("switch", s as never).map((r) => pairKey(r.a, r.b)).sort();
			return rails.length === 2 && rails[0] === want[0] && rails[1] === want[1];
		}) ?? null
	);
}

// ============================================================================
// Reading the .rly
// ============================================================================

interface ActiveElement {
	tv: number;
	tag: number;
	h: number;
	v: number;
	partner: number | null;
	lengths: [number, number];
	speeds: [number, number];
	locationName: string;
	activeName: string;
	marker: string;
}

interface InactiveElement {
	tag: number;
	h: number;
	v: number;
	name: string;
}

interface RlyText {
	x: number;
	y: number;
	text: string;
	font: string;
	size: number;
}

interface RlyPrefDir {
	tv: number;
	entry: number;
	exit: number;
}

class Lines {
	private i = 0;
	constructor(private readonly lines: string[]) {}
	str(): string {
		return (this.lines[this.i++] ?? "").replace(/\r|\0/g, "").trimEnd();
	}
	int(): number {
		const s = this.str().trim();
		const n = Number.parseInt(s, 10);
		if (Number.isNaN(n)) throw new Error(`line ${this.i}: expected a number, got "${s}"`);
		return n;
	}
	bool(): boolean {
		return this.int() !== 0;
	}
}

function readRly(path: string) {
	const lines = new Lines(readFileSync(path, "latin1").split("\n"));
	lines.str(); // version
	lines.int(); // home H
	lines.int(); // home V
	const active: ActiveElement[] = [];
	const nActive = lines.int();
	lines.str(); // **Active elements**
	for (let k = 0; k < nActive; k++) {
		const tv = lines.int();
		const tag = lines.int();
		const h = lines.int();
		const v = lines.int();
		let partner: number | null = null;
		const piece = pieceOf(tag);
		if (piece === "gap") {
			lines.int(); // ConnLinkPos[0]
			partner = lines.int();
		}
		if (piece === "signal" || piece === "points") lines.int(); // attribute
		if (piece === "signal") lines.int(); // calling-on
		const lengths: [number, number] = [lines.int(), lines.int()];
		const speeds: [number, number] = [lines.int(), lines.int()];
		const locationName = lines.str();
		const activeName = lines.str();
		const marker = lines.str();
		active.push({ tv, tag, h, v, partner, lengths, speeds, locationName, activeName, marker });
	}
	const inactive: InactiveElement[] = [];
	const nInactive = lines.int();
	lines.str(); // **Inactive elements**
	for (let k = 0; k < nInactive; k++) {
		lines.int();
		const tag = lines.int();
		const h = lines.int();
		const v = lines.int();
		const name = lines.str();
		lines.str(); // marker
		inactive.push({ tag, h, v, name });
	}
	const texts: RlyText[] = [];
	const nTexts = lines.int();
	for (let k = 0; k < nTexts; k++) {
		const x = lines.int();
		const y = lines.int();
		const text = lines.str();
		const font = lines.str();
		const size = lines.int();
		lines.int(); // colour
		lines.int(); // charset
		lines.int(); // style
		texts.push({ x, y, text, font, size });
	}
	const prefDirs: RlyPrefDir[] = [];
	const nPref = lines.int();
	for (let k = 0; k < nPref; k++) {
		lines.int(); // position in PrefDirVector
		const tv = lines.int();
		const eLink = lines.int();
		lines.int(); // ELinkPos
		const xLink = lines.int();
		lines.int(); // XLinkPos
		lines.int(); // EXNumber
		lines.int(); // CheckCount
		lines.bool(); // IsARoute
		lines.bool(); // AutoSignals
		lines.bool(); // PrefDirRoute
		lines.str(); // marker
		prefDirs.push({ tv, entry: linkOf(eLink), exit: linkOf(xLink) });
	}
	return { active, inactive, texts, prefDirs };
}

// ============================================================================
// Building the map
// ============================================================================

const warnings: string[] = [];
const cellOf = (h: number, v: number): Cell => c(h, -v);
const where = (h: number, v: number): string => `RailOS (${h}, ${v})`;

function trackDataFor(el: ActiveElement, prefs: RlyPrefDir[]): TrackData | null {
	const links = linksOf(el.tag);
	const aspect = (): number => {
		const m = el.marker[0];
		return m === "3" ? 3 : m === "2" ? 2 : m === "G" ? 1 : 4;
	};
	switch (pieceOf(el.tag)) {
		case "simple": {
			const straight = subtypeByLinks("straight", links);
			if (straight) return createTrackData("straight", straight);
			const curve = subtypeByLinks("curved", links);
			return curve ? createTrackData("curved", curve) : null;
		}
		case "arrow": {
			// One-way arrows: take the sense from the preferred direction through
			// the cell, falling back to plain straight track when there is none.
			const pairs = prefs.filter((p) => p.tv === el.tv);
			const one = pairs.length === 1 ? pairs[0] : null;
			const directed = one
				? SUBTYPES.directed.find((s) => {
						const flow = getDirectedFlow(s as never);
						return flow?.entry === one.entry && flow.exit === one.exit;
					})
				: undefined;
			if (directed) return createTrackData("directed", directed);
			warnings.push(
				`${where(el.h, el.v)}: one-way arrow has ${pairs.length} preferred directions; imported as two-way straight track.`,
			);
			const straight = subtypeByLinks("straight", links);
			return straight ? createTrackData("straight", straight) : null;
		}
		case "points": {
			const s = switchSubtype(el.tag);
			return s ? createTrackData("switch", s) : null;
		}
		case "crossover": {
			const s = subtypeByLinks("crossover", links);
			return s ? createTrackData("crossover", s) : null;
		}
		case "bridge": {
			const s = subtypeByLinks("flyover", links);
			return s ? createTrackData("flyover", s) : null;
		}
		case "buffers": {
			const s = subtypeByLinks("buffer", [links[1]]);
			return s ? createTrackData("buffer", s) : null;
		}
		case "continuation": {
			const s = subtypeByLinks("exit", [links[1]]);
			return s ? createTrackData("exit", s) : null;
		}
		case "gap": {
			const s = subtypeByLinks("linked", [links[1]]);
			return s ? createTrackData("linked", s) : null;
		}
		case "signal": {
			const exit = links[SIGNAL_END[el.tag]];
			const s = SUBTYPES.signal.find((st) => signalFacingExit(st as never) === exit);
			return s ? createTrackData("signal", s, { aspect: aspect() }) : null;
		}
		case "footbridge": {
			const over = el.tag === 129 || el.tag === 130;
			const vertical = el.tag === 130 || el.tag === 146;
			return createTrackData(
				"bridgeUnderpass",
				`${over ? "BRIDGE" : "UNDERPASS"}${vertical ? 2 : 1}`,
			);
		}
		default:
			return null;
	}
}

/** RailOS lengths/speeds onto our main and secondary paths. */
function applyFigures(track: Track, el: ActiveElement): void {
	const clampSpeed = (s: number) => Math.max(10, Math.min(400, s));
	const rails = getRails(track.data.kind, track.data.subtype);
	let main = 0;
	if (rails.length === 2) {
		const [a, b] = LINKS[el.tag].slice(0, 2).map(linkOf);
		const first = rails.find((r) => pairKey(r.a, r.b) === pairKey(a, b));
		main = first && !first.secondary ? 0 : 1;
	}
	if (el.lengths[main] > 0) track.setTrackMainLength(el.lengths[main]);
	if (el.speeds[main] > 0) track.setTrackMainSpeed(clampSpeed(el.speeds[main]));
	if (rails.length === 2) {
		const other = 1 - main;
		if (el.lengths[other] > 0) track.setTrackSecondaryLength(el.lengths[other]);
		if (el.speeds[other] > 0) track.setTrackSecondarySpeed(clampSpeed(el.speeds[other]));
	}
}

const PLATFORM_SIDE: Record<number, Platform> = {
	76: Platform.UP,
	77: Platform.DOWN,
	78: Platform.LEFT,
	79: Platform.RIGHT,
};

/**
 * Our PARAPETn for RailOS tags 97–124, matched by graphic. The numbering is
 * not tag − 96: the two sets order their blocks of five differently.
 */
const PARAPET_NUMBER: readonly number[] = [
	1, 2, 3, 4, 5, // 97–101
	11, 12, 13, 14, 15, // 102–106
	21, 22, 23, 24, // 107–110
	6, 7, 8, 9, 10, // 111–115
	16, 17, 18, 19, 20, // 116–120
	25, 26, 27, 28, // 121–124
];

function buildMap(rly: ReturnType<typeof readRly>): Map_ {
	const map = newRailway();
	const byTv = new Map<number, Track>();
	const elementByTv = new Map<number, ActiveElement>();

	map.deferPreferredDirectionRevalidation(() => {
		for (const el of rly.active) {
			const data = trackDataFor(el, rly.prefDirs);
			if (!data) {
				warnings.push(`${where(el.h, el.v)}: no equivalent for RailOS piece ${el.tag}; skipped.`);
				continue;
			}
			const track = place(map, cellOf(el.h, el.v), data);
			applyFigures(track, el);
			byTv.set(el.tv, track);
			elementByTv.set(el.tv, el);
		}

		// Gap jumps pair with the element their Conn[0] names.
		const paired = new Set<number>();
		for (const el of rly.active) {
			if (el.partner === null || paired.has(el.tv)) continue;
			const other = elementByTv.get(el.partner);
			if (!other) continue;
			pairPortals(map, cellOf(el.h, el.v), cellOf(other.h, other.v));
			paired.add(el.tv).add(other.tv);
		}

		for (const p of rly.prefDirs) {
			const track = byTv.get(p.tv);
			if (track && !track.addPreferredDirection(p.entry, p.exit)) {
				const el = elementByTv.get(p.tv) as ActiveElement;
				warnings.push(`${where(el.h, el.v)}: preferred direction ${p.entry}→${p.exit} not valid here; dropped.`);
			}
		}
	});

	placeInactive(map, rly.inactive);
	nameEverything(map, rly);
	map.makeTrackList();
	return map;
}

function placeInactive(map: Map_, inactive: InactiveElement[]): void {
	for (const el of inactive) {
		const { gx: x, gy: y } = cellOf(el.h, el.v);
		const piece = pieceOf(el.tag);
		if (piece === "platform") {
			const track = map.getTrackAt(x, y);
			map.addPlatform(PLATFORM_SIDE[el.tag], x, y);
			if (!track?.hasPlatform()) {
				warnings.push(`${where(el.h, el.v)}: platform could not be added to the track there.`);
			}
		} else if (piece === "concourse") {
			map.createAddConcourse(x, y);
		} else if (piece === "parapet") {
			map.createAddParapet(`PARAPET${PARAPET_NUMBER[el.tag - 97]}` as ParapetType, x, y);
		} else if (piece === "named") {
			map.createAddNamedLocation(x, y);
			if (!map.getNamedLocationAt(x, y)) {
				warnings.push(`${where(el.h, el.v)}: named location could not be placed there.`);
			}
		} else if (piece === "levelCrossing") {
			map.addLevelCrossing(x, y);
		}
	}
}

/**
 * One Text per location name, shared by every element carrying it — the way
 * the editor names a station spanning several cells. Where RailOS has a free
 * label with the same words it becomes that Text, keeping its position.
 */
function nameEverything(map: Map_, rly: ReturnType<typeof readRly>): void {
	const freeTexts = new Map<string, RlyText>();
	for (const t of rly.texts) if (!freeTexts.has(t.text)) freeTexts.set(t.text, t);
	const texts = new Map<string, Text>();
	const used = new Set<RlyText>();

	const textFor = (name: string, fallback: Cell): Text => {
		let text = texts.get(name);
		if (text) return text;
		const free = freeTexts.get(name);
		if (free) used.add(free);
		text = free
			? new Text(free.x / 16, -free.y / 16, name, { family: free.font, pointSize: free.size })
			: new Text(fallback.gx, fallback.gy, name, { family: "sans-serif", pointSize: 10 });
		map.addText(text);
		texts.set(name, text);
		return text;
	};

	for (const el of rly.inactive) {
		const piece = pieceOf(el.tag);
		if (!el.name || !["named", "concourse"].includes(piece)) continue;
		const cell = cellOf(el.h, el.v);
		const target =
			piece === "named" ? map.getNamedLocationAt(cell.gx, cell.gy) : map.getElementAt(cell.gx, cell.gy);
		(target as { setText?: (t: Text) => void } | null)?.setText?.(textFor(el.name, cell));
	}
	for (const el of rly.active) {
		const cell = cellOf(el.h, el.v);
		const track = map.getTrackAt(cell.gx, cell.gy);
		if (!track) continue;
		const needs = track.hasPlatform() || track.hasLinkedNamedLocation() || track.data.kind === "bridgeUnderpass";
		if (!needs) continue;
		const name =
			el.activeName ||
			el.locationName ||
			(track.data.kind === "bridgeUnderpass" ? `Footbridge (${cell.gx}, ${cell.gy})` : "");
		if (name) track.setText(textFor(name, cell));
	}

	// The rest of RailOS's labels stand on their own.
	for (const t of rly.texts) {
		if (used.has(t)) continue;
		map.addText(new Text(t.x / 16, -t.y / 16, t.text, { family: t.font, pointSize: t.size }));
	}
}

// ============================================================================
// Reading the .ttb
// ============================================================================

const COMMANDS = new Set(
	"Snt Sfs Sns Sns-fsh Snt-sh Sns-sh pas jbo fsp rsp cdt dsc cms Fns Fjo Fer Frh-sh Fns-sh F-nshs Frh".split(" "),
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
	return cellOf(h, v);
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

function parseAction(field: string, seenLocation: () => boolean): Action {
	let text = field;
	const warning = text.startsWith("W");
	if (warning) text = text.slice(1);
	const w = warning ? { warning: true } : {};
	if (text === "Frh") return { kind: "finishRemainHere", ...w };

	const time = timeOf(text);
	if (time === null) throw new Error(`no time in "${field}"`);
	const rest = text.slice(6);
	const second = timeOf(rest);
	if (second !== null) {
		const [, location, dwell] = rest.slice(6).length ? ["", ...rest.slice(6).split(";")] : ["", ""];
		return {
			kind: "stop",
			location,
			arrive: time,
			depart: second,
			...(dwell ? { minDwellSeconds: Number(dwell) } : {}),
			...w,
		};
	}
	const [word, third, fourth] = rest.split(";");
	if (!COMMANDS.has(word)) {
		// A lone time: a departure at the service's first location, else an arrival.
		const single = seenLocation() ? { arrive: time } : { depart: time };
		return { kind: "stop", location: word, ...single, ...(third ? { minDwellSeconds: Number(third) } : {}), ...w };
	}
	switch (word) {
		case "Snt": {
			const [rear, front] = third.split(" ");
			return {
				kind: "startNew",
				time,
				rear: cellFromId(rear),
				front: cellFromId(front),
				...(fourth === "S" ? { signallerControl: true } : {}),
				...w,
			};
		}
		case "Sns":
			return { kind: "startNewService", time, fromRef: third, ...w };
		case "Sfs":
			return { kind: "startFromSplit", time, fromRef: third, ...w };
		case "pas":
			return { kind: "pass", time, location: third, ...w };
		case "cdt":
			return { kind: "changeDirection", time, ...w };
		case "dsc":
			return { kind: "changeDescription", time, description: third, ...w };
		case "cms":
			return { kind: "changeMaxSpeed", time, maxSpeedKmh: Number(third), ...w };
		case "fsp":
			return { kind: "frontSplit", time, newRef: third, ...w };
		case "rsp":
			return { kind: "rearSplit", time, newRef: third, ...w };
		case "jbo":
			return { kind: "joinedBy", time, otherRef: third, ...w };
		case "Snt-sh": {
			const [rear, front] = third.split(" ");
			return {
				kind: "startNewShuttle",
				time,
				rear: cellFromId(rear),
				front: cellFromId(front),
				otherRef: fourth,
				...w,
			};
		}
		case "Sns-sh":
			return { kind: "startShuttle", time, fromRef: fourth, otherRef: third, ...w };
		case "Sns-fsh":
			return { kind: "startFromShuttle", time, fromRef: third, ...w };
		case "F-nshs":
			return { kind: "finishToShuttle", time, nextRef: third, ...w };
		case "Fns":
			return { kind: "finishNewService", time, nextRef: third, ...w };
		case "Fjo":
			return { kind: "finishJoin", time, otherRef: third, ...w };
		case "Fer":
			return { kind: "finishExit", time, exits: third.split(" ").filter(Boolean).map(cellFromId), ...w };
		case "Frh-sh":
			return { kind: "finishShuttleRemainHere", time, otherRef: third, ...w };
		case "Fns-sh":
			return { kind: "finishShuttleNewService", time, otherRef: third, nextRef: fourth, ...w };
		default:
			throw new Error(`Unsupported timetable action "${word}"`);
	}
}

function parseService(entry: string): Service {
	const fields = stripSpaces(entry).split(",").filter((f) => f !== "");
	const info = fields[0].split(";");
	const actions: Action[] = [];
	let repeat: Service["repeat"];
	let seen = false;
	for (const field of fields.slice(1)) {
		if (field.startsWith("R;")) {
			const [, mins, digits, count] = field.split(";").map(Number);
			repeat = { intervalMinutes: mins, headcodeIncrement: digits, count };
			continue;
		}
		const action = parseAction(field, () => seen);
		if (action.kind === "stop" || action.kind === "pass") seen = true;
		actions.push(action);
	}
	// Keys in the order the editor writes them.
	const spec = trainSpec(info);
	return {
		ref: info[0],
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

function readTtb(path: string): Timetable {
	const entries = readFileSync(path, "latin1").split("\0");
	let i = entries.findIndex((e) => timeOf(stripSpaces(e)) !== null);
	if (i < 0) throw new Error("no start time");
	const startTime = timeOf(stripSpaces(entries[i])) as SimTime;
	const services: Service[] = [];
	const seenRefs = new Set<string>();
	for (i++; i < entries.length; i++) {
		const entry = stripSpaces(entries[i]);
		if (entry === "" || /^,*$/.test(entry)) break;
		if (entry.startsWith("*")) continue;
		try {
			const service = parseService(entry);
			const ref = uniqueRef(service.ref, seenRefs);
			if (ref !== service.ref) {
				warnings.push(`duplicate service ref "${service.ref}" renamed to "${ref}".`);
				service.ref = ref;
			}
			seenRefs.add(ref);
			services.push(service);
		} catch (error) {
			warnings.push(`timetable entry "${entry.slice(0, 40)}…": ${(error as Error).message}; skipped.`);
		}
	}
	return { version: 1, startTime, services };
}

// ============================================================================
// Go
// ============================================================================

const rly = readRly(rlyPath);
const map = buildMap(rly);
const parsed = readTtb(ttbPath);
const title = ttbPath.split("/").pop()?.replace(/\.ttb$/i, "");
const timetable: Timetable = { version: 1, ...(title ? { title } : {}), startTime: parsed.startTime, services: parsed.services };

const yamlOptions = { indent: 2, lineWidth: 0, aliasDuplicateObjects: false };
writeFileSync(railwayOut, stringify(serializeMap(map), yamlOptions));
writeFileSync(timetableOut, stringify(timetable, yamlOptions));

const problems = railwayProblems(map);
const issues = validateTimetable(timetable, map);
console.log(`Railway: ${rly.active.length} track elements, ${rly.inactive.length} others, ${rly.texts.length} labels.`);
console.log(`Timetable: ${timetable.services.length} services.`);
for (const w of warnings) console.log(`  warning: ${w}`);
console.log(problems.length ? `Railway has ${problems.length} problems:` : "Railway complete.");
for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
const errors = issues.filter((x) => x.severity === "error");
console.log(hasErrors(issues) ? `Timetable has ${errors.length} errors:` : `Timetable valid (${issues.length} warnings).`);
for (const x of errors.slice(0, 40)) console.log(`  - ${issueText(x)}`);
console.log(`Wrote ${railwayOut}\nWrote ${timetableOut}`);
