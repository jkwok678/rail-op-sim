import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	ParapetType,
	SignalType,
	StraightType,
	SwitchType,
} from "@rail-op-sim/shared";
import { SVG_MAP } from "../svgMap";

/** Every track subtype enum — the full set the editor can place. */
const TRACK_ENUMS = {
	StraightType,
	DirectedType,
	CurvedType,
	LinkedType,
	ExitType,
	BufferType,
	SignalType,
	BridgeUnderpassType,
	SwitchType,
	CrossoverType,
	FlyoverType,
};

const ALL_TRACK_SUBTYPES = Object.values(TRACK_ENUMS).flatMap((e) =>
	Object.values(e),
) as string[];

/** Element keys that must exist in SVG_MAP (including Set/Unset variants). */
const ELEMENT_KEYS = [
	// Named Location
	"NAMEDLOCATION_SET",
	"NAMEDLOCATION_UNSET",
	// Concourse
	"CONCOURSE_SET",
	"CONCOURSE_UNSET",
	// Parapet (28 types)
	...Object.values(ParapetType),
	// Platform (4 sides × 2 variants each)
	"PLATFORM_LEFT_SET",
	"PLATFORM_LEFT_UNSET",
	"PLATFORM_RIGHT_SET",
	"PLATFORM_RIGHT_UNSET",
	"PLATFORM_UP_SET",
	"PLATFORM_UP_UNSET",
	"PLATFORM_DOWN_SET",
	"PLATFORM_DOWN_UNSET",
	// Bridge / Underpass Unset
	"BRIDGE1_UNSET",
	"BRIDGE2_UNSET",
	"UNDERPASS1_UNSET",
	"UNDERPASS2_UNSET",
	// Level Crossing
	"LEVELCROSSING",
	"LEVELCROSSING_H",
	"LEVELCROSSING_V",
	// Text sentinel
	"TEXT_ENTRY",
];

// Vitest runs with cwd = packages/app.
const GRAPHICS_DIR = resolve(process.cwd(), "public/graphics");

describe("SVG_MAP completeness", () => {
	it("maps every track subtype to a filename", () => {
		const missing = ALL_TRACK_SUBTYPES.filter((s) => !SVG_MAP[s]);
		expect(missing).toEqual([]);
	});

	it("points every track mapping at a file that exists on disk", () => {
		const broken = ALL_TRACK_SUBTYPES
			.map((s) => SVG_MAP[s])
			.filter((file) => file && !existsSync(resolve(GRAPHICS_DIR, file)));
		expect(broken).toEqual([]);
	});

	it("has no duplicate filenames across distinct track subtypes", () => {
		// A duplicate almost always means a copy-paste error in the map.
		const seen = new Map<string, string>();
		const dupes: string[] = [];
		for (const subtype of ALL_TRACK_SUBTYPES) {
			const file = SVG_MAP[subtype];
			const prev = seen.get(file);
			if (prev) dupes.push(`${file} (${prev} & ${subtype})`);
			else seen.set(file, subtype);
		}
		expect(dupes).toEqual([]);
	});

	it("maps every element key to a filename", () => {
		const missing = ELEMENT_KEYS.filter((k) => !SVG_MAP[k]);
		expect(missing).toEqual([]);
	});

	it("points every element mapping at a file that exists on disk", () => {
		const broken = ELEMENT_KEYS
			.map((k) => SVG_MAP[k])
			.filter((file) => file && !existsSync(resolve(GRAPHICS_DIR, file)));
		expect(broken).toEqual([]);
	});
});
