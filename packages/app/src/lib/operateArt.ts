import {
	type BarrierState,
	getRails,
	SignalAspect,
	type SimView,
} from "@rail-op-sim/shared";
import { SHUNT_SVG_MAP, SVG_MAP } from "#/lib/svgMap";
import { signalLamp } from "#/renderer/operateGeometry";

/**
 * Which graphics a signal or a set of points shows while the railway is
 * operating, after RailOS (TrackUnit.cpp `SigTable…` and `PlotPoints`).
 *
 * - A main signal swaps its art for one lit red, yellow, double yellow or
 *   green; a shunt signal for two reds or two whites.
 * - Points are drawn as RailOS draws them in operation: the points with a gap
 *   where the moving rail goes ("Gapped"), plus that rail for the way they
 *   lie (straight or diverging; left or right fork for split points).
 *
 * Every result is a list of files in `public/graphics/`, drawn bottom to top
 * in place of the cell's usual art. Pure — no pixi — so it can be tested.
 */

const pairKey = (a: number, b: number): string =>
	a < b ? `${a}-${b}` : `${b}-${a}`;

/**
 * The two links of each RailOS fillet, per switch subtype: first the straight
 * (or left-fork) rail, then the diverging (or right-fork) one. From the
 * points' link table in railway-dot-exe's TrackUnit.cpp.
 */
const FILLET_LINKS: Record<string, [[number, number], [number, number]]> = {
	SWITCHTIGHT1: [
		[3, 5],
		[3, 1],
	],
	SWITCHTIGHT2: [
		[5, 3],
		[5, 1],
	],
	SWITCHTIGHT3: [
		[3, 5],
		[3, 7],
	],
	SWITCHTIGHT4: [
		[5, 3],
		[5, 7],
	],
	SWITCHTIGHT5: [
		[7, 1],
		[7, 3],
	],
	SWITCHTIGHT6: [
		[7, 1],
		[7, 5],
	],
	SWITCHTIGHT7: [
		[1, 7],
		[1, 3],
	],
	SWITCHTIGHT8: [
		[1, 7],
		[1, 5],
	],
	SWITCH1: [
		[3, 5],
		[3, 2],
	],
	SWITCH2: [
		[5, 3],
		[5, 0],
	],
	SWITCH3: [
		[3, 5],
		[3, 8],
	],
	SWITCH4: [
		[5, 3],
		[5, 6],
	],
	SWITCH5: [
		[7, 1],
		[7, 0],
	],
	SWITCH6: [
		[7, 1],
		[7, 2],
	],
	SWITCH7: [
		[1, 7],
		[1, 6],
	],
	SWITCH8: [
		[1, 7],
		[1, 8],
	],
	SWITCH9: [
		[8, 0],
		[8, 1],
	],
	SWITCH10: [
		[6, 2],
		[6, 1],
	],
	SWITCH11: [
		[2, 6],
		[2, 7],
	],
	SWITCH12: [
		[0, 8],
		[0, 7],
	],
	SWITCH13: [
		[8, 0],
		[8, 3],
	],
	SWITCH14: [
		[6, 2],
		[6, 5],
	],
	SWITCH15: [
		[2, 6],
		[2, 3],
	],
	SWITCH16: [
		[0, 8],
		[0, 5],
	],
	SWITCHSPLIT1: [
		[3, 2],
		[3, 8],
	],
	SWITCHSPLIT2: [
		[5, 6],
		[5, 0],
	],
	SWITCHSPLIT3: [
		[2, 7],
		[2, 3],
	],
	SWITCHSPLIT4: [
		[6, 1],
		[6, 5],
	],
	SWITCHSPLIT5: [
		[8, 3],
		[8, 1],
	],
	SWITCHSPLIT6: [
		[0, 5],
		[0, 7],
	],
	SWITCHSPLIT7: [
		[7, 0],
		[7, 2],
	],
	SWITCHSPLIT8: [
		[1, 8],
		[1, 6],
	],
};

/**
 * For each switch subtype, which fillet (0 or 1) each of our rails shows.
 *
 * A rail is matched to the fillet that joins the same two links. A rail that
 * matches neither takes the fillet the other rail left over: our SWITCHSPLIT3–6
 * pair their links differently from RailOS for the same art.
 */
const FILLET_BY_RAIL: Record<string, Map<string, 0 | 1>> = Object.fromEntries(
	Object.entries(FILLET_LINKS).map(([subtype, fillets]) => {
		const keys = fillets.map(([a, b]) => pairKey(a, b));
		const rails = getRails("switch", subtype as never).map((r) =>
			pairKey(r.a, r.b),
		);
		const byRail = new Map<string, 0 | 1>();
		for (const rail of rails) {
			const i = keys.indexOf(rail);
			if (i === 0 || i === 1) byRail.set(rail, i);
		}
		for (const rail of rails) {
			if (byRail.has(rail)) continue;
			const taken = new Set(byRail.values());
			byRail.set(rail, taken.has(0) ? 1 : 0);
		}
		return [subtype, byRail];
	}),
);

const stem = (file: string): string => file.replace(/\.svg$/, "");

/** The files a signal shows for an aspect, or null for an unknown subtype. */
export function signalArt(
	subtype: string,
	aspect: number,
	capability: number,
	callingOn = false,
): string[] | null {
	const lamp = signalLamp(aspect, capability);
	if (capability === SignalAspect.SHUNT) {
		const red = SHUNT_SVG_MAP[subtype];
		if (!red) return null;
		return [
			lamp === "red" && !callingOn
				? red
				: red.replace(/Red\.svg$/, "White.svg"),
		];
	}
	const base = SVG_MAP[subtype];
	if (!base || !subtype.startsWith("SIGNAL")) return null;
	if (callingOn) {
		return [base, `${stem(base)}CallingOn.svg`];
	}
	switch (lamp) {
		case "red":
			return [base];
		case "yellow":
			return [`${stem(base)}Yellow.svg`];
		case "doubleYellow":
			return [`${stem(base)}DoubleYellow.svg`];
		default:
			return [`${stem(base)}Green.svg`];
	}
}

const SWITCH_FILE = /^(switchTight|switchSplit|switch)(\d+)\.svg$/;

/**
 * The files a set of points shows lying on rail `a`–`b`: the gapped points,
 * then the rail they lie for. Null for an unknown subtype or rail.
 */
export function pointsArt(
	subtype: string,
	a: number,
	b: number,
): string[] | null {
	const match = SVG_MAP[subtype]?.match(SWITCH_FILE);
	const fillet = FILLET_BY_RAIL[subtype]?.get(pairKey(a, b));
	if (!match || fillet === undefined) return null;
	const [, family, n] = match;
	const split = family === "switchSplit";
	const leg =
		fillet === 0
			? split
				? "LeftFork"
				: "Straight"
			: split
				? "RightFork"
				: "Diverging";
	return [`${family}Gapped${n}.svg`, `${family}${leg}${n}.svg`];
}

/** Grid cell key, as the track layer keys its sprites. */
export const cellKey = (gx: number, gy: number): string => `${gx},${gy}`;

/**
 * The art every signal and set of points shows in `view`, keyed by cell.
 * Cells left out keep their usual art.
 */
export function operateArt(view: SimView | null): Map<string, string[]> {
	const art = new Map<string, string[]>();
	if (!view) return art;
	for (const s of view.signals) {
		const files = signalArt(s.subtype, s.aspect, s.aspects, s.callingOn);
		if (files) art.set(cellKey(s.gx, s.gy), files);
	}
	for (const p of view.points) {
		const files = pointsArt(p.subtype, p.a, p.b);
		if (files) art.set(cellKey(p.gx, p.gy), files);
	}
	return art;
}

/**
 * The tile a level-crossing cell shows with its barriers down, open to trains
 * (RailOS's `PlotLoweredLinkedLevelCrossingBarriers`): the barriers turn to
 * lie along the track. A crossing over several tracks side by side has its
 * barriers on the outer tracks' outer sides only, with plain road between.
 * Null for a diagonal crossing, which RailOS has no art for.
 */
export function openCrossingTile(
	subtype: string,
	index: number,
	count: number,
): string | null {
	// Our H/V name the track, so a horizontal track's lowered barriers are
	// the vertical crossing's art, and stack top to bottom.
	const family =
		subtype === "STRAIGHTH"
			? { only: "V", first: "VTop", last: "VBottom" }
			: subtype === "STRAIGHTV"
				? { only: "H", first: "HLeft", last: "HRight" }
				: null;
	if (!family) return null;
	const part =
		count === 1
			? family.only
			: index === 0
				? family.first
				: index === count - 1
					? family.last
					: "Plain";
	return `levelCrossing${part}.svg`;
}

/** Whether a crossing shows its open-to-trains art, given the flash phase. */
const showsOpen = (barriers: BarrierState, flashOn: boolean): boolean =>
	barriers === "down" ||
	((barriers === "lowering" || barriers === "raising") && flashOn);

/**
 * The art each level-crossing cell shows in `view`, keyed by cell. Barriers
 * up keep the usual crossing art; down shows {@link openCrossingTile}; on the
 * move the two alternate with `flashOn`, as RailOS flashes them.
 */
export function crossingArt(
	view: SimView | null,
	flashOn: boolean,
): Map<string, string> {
	const art = new Map<string, string>();
	if (!view) return art;
	for (const lc of view.levelCrossings) {
		if (!showsOpen(lc.barriers, flashOn)) continue;
		lc.cells.forEach(({ gx, gy }, i) => {
			const file = openCrossingTile(lc.subtype, i, lc.cells.length);
			if (file) art.set(cellKey(gx, gy), file);
		});
	}
	return art;
}

/** Whether any level crossing in `view` has its barriers on the move. */
export const crossingsChanging = (view: SimView | null): boolean =>
	view?.levelCrossings.some(
		(lc) => lc.barriers === "lowering" || lc.barriers === "raising",
	) ?? false;

/** Every file {@link operateArt} can ask for, to preload before operating. */
export const OPERATE_ART_FILES: readonly string[] = (() => {
	const files = new Set<string>();
	for (const subtype of Object.keys(SHUNT_SVG_MAP)) {
		for (const capability of [1, 2, 3, 4]) {
			for (let aspect = 0; aspect <= 3; aspect++) {
				for (const co of [false, true]) {
					for (const f of signalArt(subtype, aspect, capability, co) ?? []) {
						files.add(f);
					}
				}
			}
		}
	}
	for (const subtype of Object.keys(FILLET_LINKS)) {
		for (const r of getRails("switch", subtype as never)) {
			for (const f of pointsArt(subtype, r.a, r.b) ?? []) files.add(f);
		}
	}
	for (const subtype of ["STRAIGHTH", "STRAIGHTV"]) {
		for (const [i, n] of [
			[0, 1],
			[0, 3],
			[1, 3],
			[2, 3],
		]) {
			const f = openCrossingTile(subtype, i, n);
			if (f) files.add(f);
		}
	}
	return [...files];
})();
