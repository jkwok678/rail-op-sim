/**
 * RailOS track pieces (TrackUnit.cpp `TFixedTrackArray`) and how each maps to
 * one of our track kinds and subtypes.
 *
 * Pieces are matched to our subtypes by their links, never by name, so the
 * mapping cannot drift from the art tables.
 */

import type { TrackKind } from "../track/track-data";
import { getLinksForSubtype, getRails } from "../track/track-data";

/** Links per SpeedTag, as compass codes (1 NW … 9 SE, 5 unused). */
// biome-ignore format: rows follow RailOS's TFixedTrackArray groups
export const LINKS: readonly (readonly number[])[] = [
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
export const SIGNAL_END: Readonly<Record<number, 0 | 1>> = {
	68: 1,
	69: 0,
	70: 0,
	71: 1,
	72: 0,
	73: 0,
	74: 1,
	75: 1,
};

export type Piece =
	| "simple"
	| "points"
	| "crossover"
	| "bridge"
	| "buffers"
	| "signal"
	| "platform"
	| "continuation"
	| "gap"
	| "concourse"
	| "parapet"
	| "arrow"
	| "footbridge"
	| "named"
	| "levelCrossing"
	| "unused";

const PIECE_RANGES: readonly (readonly [number, number, Piece])[] = [
	[1, 6, "simple"],
	[7, 14, "points"],
	[15, 16, "crossover"],
	[18, 27, "simple"],
	[28, 43, "points"],
	[44, 47, "crossover"],
	[48, 59, "bridge"],
	[60, 67, "buffers"],
	[68, 75, "signal"],
	[76, 79, "platform"],
	[80, 87, "continuation"],
	[88, 95, "gap"],
	[96, 96, "concourse"],
	[97, 124, "parapet"],
	[125, 128, "arrow"],
	[129, 130, "footbridge"],
	[131, 131, "named"],
	[132, 139, "points"],
	[140, 143, "arrow"],
	[144, 144, "levelCrossing"],
	[145, 146, "footbridge"],
];

export function pieceOf(tag: number): Piece {
	for (const [lo, hi, piece] of PIECE_RANGES) {
		if (tag >= lo && tag <= hi) return piece;
	}
	return "unused";
}

const COMPASS_OFFSETS: readonly (readonly [number, number])[] = [
	[0, 0],
	[-1, -1],
	[0, -1],
	[1, -1],
	[-1, 0],
	[0, 0],
	[1, 0],
	[-1, 1],
	[0, 1],
	[1, 1],
];

/** RailOS compass code (screen y down) → our link index (+Y up). */
export function linkOf(compass: number): number {
	const [dx, dyScreen] = COMPASS_OFFSETS[compass];
	const dy = -dyScreen;
	return (1 - dy) * 3 + (dx + 1);
}

/** The links a piece uses, as our link indices. */
export const linksOf = (tag: number): number[] =>
	LINKS[tag].filter((l) => l > 0).map(linkOf);

/** Every subtype of `kind`, from the link table (the factory validates names). */
export const SUBTYPES: Readonly<Record<TrackKind, readonly string[]>> = {
	straight: ["STRAIGHTH", "STRAIGHTV", "STRAIGHTLEFTUP", "STRAIGHTRIGHTUP"],
	directed: [
		"DIRECTEDLEFT",
		"DIRECTEDRIGHT",
		"DIRECTEDUP",
		"DIRECTEDDOWN",
		"DIRECTEDLEFTUP",
		"DIRECTEDRIGHTDOWN",
		"DIRECTEDRIGHTUP",
		"DIRECTEDLEFTDOWN",
	],
	curved: [
		"TIGHTCURVE1",
		"TIGHTCURVE2",
		"TIGHTCURVE3",
		"TIGHTCURVE4",
		...Array.from({ length: 8 }, (_, i) => `CURVE${i + 1}`),
	],
	linked: [
		"LINKLEFT",
		"LINKRIGHT",
		"LINKUP",
		"LINKDOWN",
		"LINKLEFTUP",
		"LINKRIGHTDOWN",
		"LINKLEFTDOWN",
		"LINKRIGHTUP",
	],
	exit: [
		"EXITLEFT",
		"EXITRIGHT",
		"EXITUP",
		"EXITDOWN",
		"EXITLEFTUP",
		"EXITRIGHTUP",
		"EXITLEFTDOWN",
		"EXITRIGHTDOWN",
	],
	buffer: [
		"BUFFERLEFT",
		"BUFFERRIGHT",
		"BUFFERUP",
		"BUFFERDOWN",
		"BUFFERLEFTUP",
		"BUFFERRIGHTUP",
		"BUFFERLEFTDOWN",
		"BUFFERRIGHTDOWN",
	],
	signal: [
		"SIGNALLEFT",
		"SIGNALRIGHT",
		"SIGNALUP",
		"SIGNALDOWN",
		"SIGNALLEFTUP",
		"SIGNALRIGHTDOWN",
		"SIGNALRIGHTUP",
		"SIGNALLEFTDOWN",
	],
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

export const pairKey = (a: number, b: number): string =>
	a < b ? `${a}-${b}` : `${b}-${a}`;

export function subtypeByLinks(
	kind: TrackKind,
	links: number[],
): string | null {
	return (
		SUBTYPES[kind].find((s) =>
			sameSet(getLinksForSubtype(kind, s as never), links),
		) ?? null
	);
}

/** A switch whose two rails are exactly the RailOS piece's two paths. */
export function switchSubtype(tag: number): string | null {
	const [a, b, cc, d] = LINKS[tag].map(linkOf);
	const want = [pairKey(a, b), pairKey(cc, d)].sort();
	return (
		SUBTYPES.switch.find((s) => {
			const rails = getRails("switch", s as never)
				.map((r) => pairKey(r.a, r.b))
				.sort();
			return rails.length === 2 && rails[0] === want[0] && rails[1] === want[1];
		}) ?? null
	);
}
