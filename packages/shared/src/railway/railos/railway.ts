/**
 * Translate a RailOS railway (.rly) into our map.
 *
 * The format follows railway-dot-exe: `TTrack::LoadTrack`,
 * `TTextHandler::LoadText` and `TOnePrefDir::LoadPrefDir`. Everything goes
 * through the real model — `addTrack`, `addPreferredDirection`,
 * `connectTwoLinkedTracks` — so link masks, shared labels and preferred
 * directions come out the way the editor would make them.
 */

import { defined } from "../../util/checked";
import { Text } from "../element";
import { type ParapetType, Platform } from "../enums";
import { Map_ } from "../map/map";
import { cellToLocation } from "../timetable/locations";
import type { Cell } from "../timetable/types";
import type { Track } from "../track/track";
import {
	getDirectedFlow,
	getRails,
	signalFacingExit,
	type TrackData,
	type TrackKind,
} from "../track/track-data";
import { createTrackData } from "../track/track-factory";
import {
	linkOf,
	linksOf,
	linksOfTag,
	type Piece,
	pairKey,
	pieceOf,
	SIGNAL_END,
	SUBTYPES,
	subtypeByLinks,
	switchSubtype,
} from "./pieces";

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

interface Rly {
	active: ActiveElement[];
	inactive: InactiveElement[];
	texts: RlyText[];
	prefDirs: RlyPrefDir[];
}

/** What {@link convertRailosRailway} made, and what it had to leave out. */
export interface RailosRailwayResult {
	/** The converted railway, at the app's scale (one element coordinate per cell). */
	map: Map_;
	/** Things RailOS has that we could not carry over, one sentence each. */
	warnings: string[];
	counts: { trackElements: number; otherElements: number; labels: number };
}

/** Thrown when the text is not a RailOS railway we can read. */
export class InvalidRailosFileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidRailosFileError";
	}
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
		if (Number.isNaN(n)) {
			throw new InvalidRailosFileError(
				`Not a RailOS railway: line ${this.i} should be a number, not "${s}".`,
			);
		}
		return n;
	}
	bool(): boolean {
		return this.int() !== 0;
	}
}

function readActive(lines: Lines): ActiveElement {
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
	return {
		tv,
		tag,
		h,
		v,
		partner,
		lengths,
		speeds,
		locationName,
		activeName,
		marker,
	};
}

function readRly(text: string): Rly {
	const lines = new Lines(text.split("\n"));
	lines.str(); // version
	lines.int(); // home H
	lines.int(); // home V
	const active: ActiveElement[] = [];
	const nActive = lines.int();
	lines.str(); // **Active elements**
	for (let k = 0; k < nActive; k++) active.push(readActive(lines));
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

/** RailOS (H, V) — screen y down — to our cell (+Y up). */
export const railosCell = (h: number, v: number): Cell => ({ gx: h, gy: -v });
const where = (h: number, v: number): string => `RailOS (${h}, ${v})`;

/** The editor's scale: one element coordinate per cell. */
const APP_IMAGE_SIZE = 1;
/** RailOS's pixels per cell, for free-standing label positions. */
const RAILOS_CELL_PIXELS = 16;

const PLATFORM_SIDE: Readonly<Record<number, Platform>> = {
	76: Platform.UP,
	77: Platform.DOWN,
	78: Platform.LEFT,
	79: Platform.RIGHT,
};

/**
 * Our PARAPETn for RailOS tags 97–124, matched by graphic. The numbering is
 * not tag − 96: the two sets order their blocks of five differently.
 */
// biome-ignore format: one row per RailOS block of tags
const PARAPET_NUMBER: readonly number[] = [
	1, 2, 3, 4, 5, // 97–101
	11, 12, 13, 14, 15, // 102–106
	21, 22, 23, 24, // 107–110
	6, 7, 8, 9, 10, // 111–115
	16, 17, 18, 19, 20, // 116–120
	25, 26, 27, 28, // 121–124
];

/** One conversion run, so warnings never leak from one file into the next. */
class RailwayBuilder {
	readonly warnings: string[] = [];
	readonly map = new Map_();

	constructor(private readonly rly: Rly) {
		this.map.setImageSize(APP_IMAGE_SIZE);
	}

	build(): Map_ {
		const byTv = new Map<number, Track>();
		const elementByTv = new Map<number, ActiveElement>();
		this.map.deferPreferredDirectionRevalidation(() => {
			for (const el of this.rly.active) {
				const data = this.trackDataFor(el);
				if (!data) {
					this.warnings.push(
						`${where(el.h, el.v)}: no equivalent for RailOS piece ${el.tag}; skipped.`,
					);
					continue;
				}
				const { x, y } = cellToLocation(this.map, railosCell(el.h, el.v));
				const track = this.map.addTrack(data, x, y);
				applyFigures(track, el);
				byTv.set(el.tv, track);
				elementByTv.set(el.tv, el);
			}
			this.pairGaps(elementByTv);
			for (const p of this.rly.prefDirs) {
				const track = byTv.get(p.tv);
				if (track && !track.addPreferredDirection(p.entry, p.exit)) {
					const el = elementByTv.get(p.tv) as ActiveElement;
					this.warnings.push(
						`${where(el.h, el.v)}: preferred direction ${p.entry}→${p.exit} not valid here; dropped.`,
					);
				}
			}
		});
		this.placeInactive();
		this.nameEverything();
		this.map.makeTrackList();
		return this.map;
	}

	/** Gap jumps pair with the element their Conn[0] names. */
	private pairGaps(elementByTv: Map<number, ActiveElement>): void {
		const paired = new Set<number>();
		for (const el of this.rly.active) {
			if (el.partner === null || paired.has(el.tv)) continue;
			const other = elementByTv.get(el.partner);
			if (!other) continue;
			for (const mouth of [el, other]) {
				const { x, y } = cellToLocation(this.map, railosCell(mouth.h, mouth.v));
				this.map.connectTwoLinkedTracks(x, y);
			}
			paired.add(el.tv).add(other.tv);
		}
	}

	private trackDataFor(el: ActiveElement): TrackData | null {
		const links = linksOf(el.tag);
		const piece = pieceOf(el.tag);
		if (piece === "arrow") return this.arrowData(el, links);
		return TRACK_BUILDERS[piece]?.(el, links) ?? null;
	}

	/**
	 * One-way arrows: take the sense from the preferred direction through the
	 * cell, falling back to plain straight track when there is none.
	 */
	private arrowData(el: ActiveElement, links: number[]): TrackData | null {
		const pairs = this.rly.prefDirs.filter((p) => p.tv === el.tv);
		const one = pairs.length === 1 ? pairs[0] : null;
		const directed = one
			? SUBTYPES.directed.find((s) => {
					const flow = getDirectedFlow(s as never);
					return flow?.entry === one.entry && flow.exit === one.exit;
				})
			: undefined;
		if (directed) return createTrackData("directed", directed);
		this.warnings.push(
			`${where(el.h, el.v)}: one-way arrow has ${pairs.length} preferred directions; imported as two-way straight track.`,
		);
		const straight = subtypeByLinks("straight", links);
		return straight ? createTrackData("straight", straight) : null;
	}

	private placeInactive(): void {
		for (const el of this.rly.inactive) {
			const { x, y } = cellToLocation(this.map, railosCell(el.h, el.v));
			const piece = pieceOf(el.tag);
			if (piece === "platform") {
				const track = this.map.getTrackAt(x, y);
				this.map.addPlatform(
					defined(PLATFORM_SIDE[el.tag], "platform side"),
					x,
					y,
				);
				if (!track?.hasPlatform()) {
					this.warnings.push(
						`${where(el.h, el.v)}: platform could not be added to the track there.`,
					);
				}
			} else if (piece === "concourse") {
				this.map.createAddConcourse(x, y);
			} else if (piece === "parapet") {
				this.map.createAddParapet(
					`PARAPET${PARAPET_NUMBER[el.tag - 97]}` as ParapetType,
					x,
					y,
				);
			} else if (piece === "named") {
				this.map.createAddNamedLocation(x, y);
				if (!this.map.getNamedLocationAt(x, y)) {
					this.warnings.push(
						`${where(el.h, el.v)}: named location could not be placed there.`,
					);
				}
			} else if (piece === "levelCrossing") {
				this.map.addLevelCrossing(x, y);
			}
		}
	}

	/**
	 * One Text per location name, shared by every element carrying it — the way
	 * the editor names a station spanning several cells. Where RailOS has a free
	 * label with the same words it becomes that Text, keeping its position.
	 */
	private nameEverything(): void {
		const map = this.map;
		const freeTexts = new Map<string, RlyText>();
		for (const t of this.rly.texts)
			if (!freeTexts.has(t.text)) freeTexts.set(t.text, t);
		const texts = new Map<string, Text>();
		const used = new Set<RlyText>();

		const textFor = (name: string, fallback: Cell): Text => {
			const existing = texts.get(name);
			if (existing) return existing;
			const free = freeTexts.get(name);
			if (free) used.add(free);
			const text = free
				? freeText(free)
				: new Text(fallback.gx, fallback.gy, name, {
						family: "sans-serif",
						pointSize: 10,
					});
			map.addText(text);
			texts.set(name, text);
			return text;
		};

		this.nameInactive(textFor);
		this.nameActive(textFor);

		// The rest of RailOS's labels stand on their own.
		for (const t of this.rly.texts) if (!used.has(t)) map.addText(freeText(t));
	}

	private nameInactive(textFor: (name: string, fallback: Cell) => Text): void {
		for (const el of this.rly.inactive) {
			const piece = pieceOf(el.tag);
			if (!el.name || (piece !== "named" && piece !== "concourse")) continue;
			const cell = railosCell(el.h, el.v);
			const target =
				piece === "named"
					? this.map.getNamedLocationAt(cell.gx, cell.gy)
					: this.map.getElementAt(cell.gx, cell.gy);
			(target as { setText?: (t: Text) => void } | null)?.setText?.(
				textFor(el.name, cell),
			);
		}
	}

	private nameActive(textFor: (name: string, fallback: Cell) => Text): void {
		for (const el of this.rly.active) {
			const cell = railosCell(el.h, el.v);
			const track = this.map.getTrackAt(cell.gx, cell.gy);
			if (!track) continue;
			const bridge = track.data.kind === "bridgeUnderpass";
			if (!track.hasPlatform() && !track.hasLinkedNamedLocation() && !bridge)
				continue;
			const name =
				el.activeName ||
				el.locationName ||
				(bridge ? `Footbridge (${cell.gx}, ${cell.gy})` : "");
			if (name) track.setText(textFor(name, cell));
		}
	}
}

function byLinks(kind: TrackKind, links: number[]): TrackData | null {
	const subtype = subtypeByLinks(kind, links);
	return subtype ? createTrackData(kind, subtype) : null;
}

const TRACK_BUILDERS: Partial<
	Record<Piece, (el: ActiveElement, links: number[]) => TrackData | null>
> = {
	simple: (_el, links) =>
		byLinks("straight", links) ?? byLinks("curved", links),
	points: (el) => {
		const s = switchSubtype(el.tag);
		return s ? createTrackData("switch", s) : null;
	},
	crossover: (_el, links) => byLinks("crossover", links),
	bridge: (_el, links) => byLinks("flyover", links),
	buffers: (_el, links) => byLinks("buffer", links.slice(1, 2)),
	continuation: (_el, links) => byLinks("exit", links.slice(1, 2)),
	gap: (_el, links) => byLinks("linked", links.slice(1, 2)),
	signal: (el, links) => {
		const end = SIGNAL_END[el.tag];
		const exit = end === undefined ? undefined : links[end];
		const s = SUBTYPES.signal.find(
			(st) => signalFacingExit(st as never) === exit,
		);
		return s
			? createTrackData("signal", s, { aspect: signalAspect(el.marker) })
			: null;
	},
	footbridge: (el) => {
		const over = el.tag === 129 || el.tag === 130;
		const vertical = el.tag === 130 || el.tag === 146;
		return createTrackData(
			"bridgeUnderpass",
			`${over ? "BRIDGE" : "UNDERPASS"}${vertical ? 2 : 1}`,
		);
	},
};

function freeText(t: RlyText): Text {
	return new Text(t.x / RAILOS_CELL_PIXELS, -t.y / RAILOS_CELL_PIXELS, t.text, {
		family: t.font,
		pointSize: t.size,
	});
}

/** RailOS signal marker → aspect count. */
function signalAspect(marker: string): number {
	const m = marker[0];
	return m === "3" ? 3 : m === "2" ? 2 : m === "G" ? 1 : 4;
}

/** RailOS lengths/speeds onto our main and secondary paths. */
function applyFigures(track: Track, el: ActiveElement): void {
	const clampSpeed = (s: number) => Math.max(10, Math.min(400, s));
	const rails = getRails(track.data.kind, track.data.subtype);
	let main: 0 | 1 = 0;
	if (rails.length === 2) {
		const [a, b] = linksOfTag(el.tag).slice(0, 2).map(linkOf);
		const first =
			a === undefined || b === undefined
				? undefined
				: rails.find((r) => pairKey(r.a, r.b) === pairKey(a, b));
		main = first && !first.secondary ? 0 : 1;
	}
	if (el.lengths[main] > 0) track.setTrackMainLength(el.lengths[main]);
	if (el.speeds[main] > 0) track.setTrackMainSpeed(clampSpeed(el.speeds[main]));
	if (rails.length === 2) {
		const other = main === 0 ? 1 : 0;
		if (el.lengths[other] > 0) track.setTrackSecondaryLength(el.lengths[other]);
		if (el.speeds[other] > 0)
			track.setTrackSecondarySpeed(clampSpeed(el.speeds[other]));
	}
}

/**
 * Convert the text of a RailOS `.rly` file into a railway.
 *
 * The caller decodes the file: RailOS writes Latin-1, so read it with
 * `TextDecoder("latin1")` (browser) or `readFileSync(path, "latin1")` (Node).
 * Throws {@link InvalidRailosFileError} when the text is not a railway.
 */
export function convertRailosRailway(text: string): RailosRailwayResult {
	const rly = readRly(text);
	if (rly.active.length === 0) {
		throw new InvalidRailosFileError("The RailOS railway has no track.");
	}
	const builder = new RailwayBuilder(rly);
	const map = builder.build();
	return {
		map,
		warnings: builder.warnings,
		counts: {
			trackElements: rly.active.length,
			otherElements: rly.inactive.length,
			labels: rly.texts.length,
		},
	};
}
