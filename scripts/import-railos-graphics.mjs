#!/usr/bin/env node
// fallow-ignore-file unused-file

/**
 * Imports railway-dot-exe (RailOS) graphics into public/graphics under our
 * camelCase names.
 *
 * The source is a folder of SVGs converted from railway-dot-exe's Borland.res
 * bitmaps, named after their resource (BM68GREEN, BM7STRAIGHT, LCTOPHOR, …).
 * Those bitmaps paint their background white, so white pixels are dropped and
 * the rest is re-encoded in the same rect-per-run form as png-to-svg.mjs,
 * which keeps the files recolourable by svgColors.ts.
 *
 * Usage:
 *   node scripts/import-railos-graphics.mjs <railos-svg-dir> [output-dir]
 *
 * Default output-dir is packages/app/public/graphics.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INPUT_DIR = process.argv[2];
const OUTPUT_DIR = process.argv[3] ?? join(ROOT, "packages/app/public/graphics");

if (!INPUT_DIR) {
	console.error("usage: import-railos-graphics.mjs <railos-svg-dir> [output-dir]");
	process.exit(2);
}

/** Background colour of the railway-dot-exe bitmaps (drawn transparent). */
const BACKGROUND = "#ffffff";

// ── Name mapping: railway-dot-exe resource → our file ────────────────────

/** Signal SpeedTags (68–75) → our direction suffix (matches signal*.svg). */
const SIGNAL_DIRS = {
	68: "Right",
	69: "Left",
	70: "Up",
	71: "Down",
	72: "LeftUp",
	73: "RightUp",
	74: "LeftDown",
	75: "RightDown",
};

/**
 * Points SpeedTags → our switch file stem and number. Matched by the rails
 * each piece joins (as import-railos.ts does), except 136–139, whose RailOS
 * links do not match our rails and were matched by their art instead.
 */
const POINTS = {
	...Object.fromEntries(
		Array.from({ length: 8 }, (_, i) => [7 + i, ["switchTight", i + 1]]),
	),
	...Object.fromEntries(
		Array.from({ length: 16 }, (_, i) => [28 + i, ["switch", i + 1]]),
	),
	132: ["switchSplit", 7],
	133: ["switchSplit", 1],
	134: ["switchSplit", 8],
	135: ["switchSplit", 2],
	136: ["switchSplit", 5],
	137: ["switchSplit", 4],
	138: ["switchSplit", 6],
	139: ["switchSplit", 3],
};

/**
 * Level-crossing pieces. Our H/V names the track's direction, so RailOS's
 * horizontal barriers (LC*HOR) are our vertical crossing. Top/Bottom and
 * Left/Right are the end tiles of a crossing wider than one tile, Plain the
 * middle; Manual is the green, manually-controlled variant.
 */
const LEVEL_CROSSINGS = {
	LCBOTHHORMAN: "levelCrossingVManual",
	LCBOTHVERMAN: "levelCrossingHManual",
	LCTOPHOR: "levelCrossingVTop",
	LCTOPHORMAN: "levelCrossingVTopManual",
	LCBOTHOR: "levelCrossingVBottom",
	LCBOTHORMAN: "levelCrossingVBottomManual",
	LCLHSVER: "levelCrossingHLeft",
	LCLHSVERMAN: "levelCrossingHLeftManual",
	LCRHSVER: "levelCrossingHRight",
	LCRHSVERMAN: "levelCrossingHRightManual",
	LCPLAIN: "levelCrossingPlain",
	LCPLAINMAN: "levelCrossingPlainManual",
};

/**
 * Directional families put the state after the direction (shuntRightRed);
 * numbered families put it before the number (bridgeSet1).
 */
function buildMapping() {
	const map = {};
	for (const [tag, dir] of Object.entries(SIGNAL_DIRS)) {
		map[`BM${tag}GREEN`] = `signal${dir}Green`;
		map[`BM${tag}YELLOW`] = `signal${dir}Yellow`;
		map[`BM${tag}DBLYELLOW`] = `signal${dir}DoubleYellow`;
		map[`BM${tag}CALLINGON`] = `signal${dir}CallingOn`;
		// RailOS's FailedSigTable / FailedGroundSigTable: a failed signal.
		map[`FSIG${tag}`] = `signal${dir}Failed`;
		map[`BM${tag}GROUNDDBLWHITE`] = `shunt${dir}White`;
		map[`FGSIG${tag}`] = `shunt${dir}Failed`;
	}
	for (const [tag, [stem, n]] of Object.entries(POINTS)) {
		// The points with a gap where the moving rail (RailOS's "fillet") goes;
		// operation draws this plus the one fillet the points lie for.
		map[`BM${tag}`] = `${stem}Gapped${n}`;
		if (stem === "switchSplit") {
			map[`BM${tag}LEFTFORK`] = `${stem}LeftFork${n}`;
			map[`BM${tag}RIGHTFORK`] = `${stem}RightFork${n}`;
		} else {
			map[`BM${tag}STRAIGHT`] = `${stem}Straight${n}`;
			map[`BM${tag}DIVERGING`] = `${stem}Diverging${n}`;
		}
	}
	Object.assign(map, LEVEL_CROSSINGS);
	return map;
}

// ── SVG re-encoding ──────────────────────────────────────────────────────

function parseAttr(svg, name) {
	const match = new RegExp(`${name}="(\\d+)"`).exec(svg);
	if (!match) throw new Error(`no ${name}`);
	return Number(match[1]);
}

function paintRect(px, x, y, rw, rh, value) {
	for (let j = 0; j < rh; j++) {
		for (let i = 0; i < rw; i++) px[y + j][x + i] = value;
	}
}

function readPixels(svg) {
	const w = parseAttr(svg, "width");
	const h = parseAttr(svg, "height");
	const px = Array.from({ length: h }, () => Array(w).fill(null));
	const rectRe =
		/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="(#[0-9a-fA-F]{6})"\s*\/>/g;
	for (const [, x, y, rw, rh, fill] of svg.matchAll(rectRe)) {
		const colour = fill.toLowerCase();
		paintRect(
			px,
			Number(x),
			Number(y),
			Number(rw),
			Number(rh),
			colour === BACKGROUND ? null : colour,
		);
	}
	return { w, h, px };
}

function appendRun(map, key, item) {
	const list = map.get(key);
	if (list) list.push(item);
	else map.set(key, [item]);
}

function runEnd(row, start, w, colour) {
	let x = start;
	while (x < w && row[x] === colour) x++;
	return x;
}

function collectRowRuns(row, y, w, byColour) {
	let x = 0;
	while (x < w) {
		const colour = row[x];
		if (!colour) {
			x++;
			continue;
		}
		const end = runEnd(row, x, w, colour);
		appendRun(byColour, colour, { x, y, w: end - x });
		x = end;
	}
}

function mergeGroupRuns(group, colour, rects) {
	let cur = { ...group[0], h: 1 };
	for (const next of group.slice(1)) {
		if (next.y === cur.y + cur.h) cur.h++;
		else {
			rects.push({ ...cur, colour });
			cur = { ...next, h: 1 };
		}
	}
	rects.push({ ...cur, colour });
}

function mergeColourRuns(colour, runs, rects) {
	const groups = new Map();
	for (const r of runs) appendRun(groups, `${r.x}|${r.w}`, r);
	for (const group of groups.values()) mergeGroupRuns(group, colour, rects);
}

/** Same encoding as png-to-svg.mjs: row runs, grouped by colour, merged down. */
function encode({ w, h, px }) {
	const byColour = new Map();
	for (let y = 0; y < h; y++) collectRowRuns(px[y], y, w, byColour);
	const rects = [];
	for (const [colour, runs] of byColour) mergeColourRuns(colour, runs, rects);
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">\n` +
		rects
			.map(
				(r) =>
					`  <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.colour}"/>`,
			)
			.join("\n") +
		"\n</svg>\n"
	);
}

// ── Main ─────────────────────────────────────────────────────────────────

const mapping = buildMapping();
mkdirSync(OUTPUT_DIR, { recursive: true });

let written = 0;
const missing = [];
for (const [source, target] of Object.entries(mapping)) {
	let svg;
	try {
		svg = readFileSync(join(INPUT_DIR, `${source}.svg`), "utf8");
	} catch {
		missing.push(source);
		continue;
	}
	writeFileSync(join(OUTPUT_DIR, `${target}.svg`), encode(readPixels(svg)), "utf8");
	written++;
}

console.log(`Wrote ${written} graphics to ${OUTPUT_DIR}`);
if (missing.length > 0) {
	console.error(`Missing from ${INPUT_DIR}: ${missing.join(", ")}`);
	process.exit(1);
}
