import { describe, expect, it } from "vitest";
import { itemAt } from "../../../util/checked";
import {
	convertRailosRailway,
	convertRailosTimetable,
	InvalidRailosFileError,
} from "..";
import { pieceOf } from "../pieces";

// Whole-file conversions of the Lea Valley pair in test-data, compared field
// for field with the reference YAML, are in the app's fixtures test: this
// package has neither Node's file APIs nor a YAML parser to read them with.

/** A .ttb is NUL-separated entries: header text, start time, services, end. */
const ttb = (...entries: string[]) =>
	["RailOS timetable", "06:00", ...entries, ""].join("\0");

interface ActiveInput {
	tv: number;
	tag: number;
	h: number;
	v: number;
	partner?: number;
	lengths?: [number, number];
	speeds?: [number, number];
	locationName?: string;
	activeName?: string;
	marker?: string;
}

interface InactiveInput {
	tag: number;
	h: number;
	v: number;
	name?: string;
}

interface TextInput {
	x: number;
	y: number;
	text: string;
	font?: string;
	size?: number;
}

interface PrefDirInput {
	tv: number;
	eLink: number;
	xLink: number;
}

function extraActiveFields(el: ActiveInput): string[] {
	const piece = pieceOf(el.tag);
	if (piece === "gap") return ["0", String(el.partner ?? -1)];
	if (piece === "signal") return ["0", "0"];
	if (piece === "points") return ["0"];
	return [];
}

function activeLines(el: ActiveInput): string[] {
	const [l0, l1] = el.lengths ?? [100, 100];
	const [s0, s1] = el.speeds ?? [100, 100];
	return [
		String(el.tv),
		String(el.tag),
		String(el.h),
		String(el.v),
		...extraActiveFields(el),
		String(l0),
		String(l1),
		String(s0),
		String(s1),
		el.locationName ?? "",
		el.activeName ?? "",
		el.marker ?? "",
	];
}

function inactiveLines(el: InactiveInput, idx: number): string[] {
	return [
		String(idx),
		String(el.tag),
		String(el.h),
		String(el.v),
		el.name ?? "",
		"",
	];
}

function textLines(t: TextInput): string[] {
	return [
		String(t.x),
		String(t.y),
		t.text,
		t.font ?? "Arial",
		String(t.size ?? 10),
		"0",
		"0",
		"0",
	];
}

function prefDirLines(p: PrefDirInput, idx: number): string[] {
	return [
		String(idx),
		String(p.tv),
		String(p.eLink),
		"0",
		String(p.xLink),
		"0",
		"0",
		"0",
		"0",
		"0",
		"1",
		"",
	];
}

function buildRly(opts: {
	active?: ActiveInput[];
	inactive?: InactiveInput[];
	texts?: TextInput[];
	prefDirs?: PrefDirInput[];
}): string {
	const active = opts.active ?? [];
	const inactive = opts.inactive ?? [];
	const texts = opts.texts ?? [];
	const prefDirs = opts.prefDirs ?? [];
	return [
		"v2.0",
		"0",
		"0",
		String(active.length),
		"**Active elements**",
		...active.flatMap(activeLines),
		String(inactive.length),
		"**Inactive elements**",
		...inactive.flatMap(inactiveLines),
		String(texts.length),
		...texts.flatMap(textLines),
		String(prefDirs.length),
		...prefDirs.flatMap(prefDirLines),
	].join("\n");
}

describe("convertRailosTimetable", () => {
	it("reads the start time and each service's actions", () => {
		const { timetable, warnings } = convertRailosTimetable(
			ttb(
				"1A01;Up train,06:10;Snt;1-N2 2-N2,06:12;06:13;Halt,06:20;pas;Junction,06:30;Fer;9-N2",
			),
			{ title: "Test" },
		);
		expect(warnings).toEqual([]);
		expect(timetable).toEqual({
			version: 1,
			title: "Test",
			startTime: 6 * 3600,
			services: [
				{
					ref: "1A01",
					description: "Up train",
					actions: [
						{
							kind: "startNew",
							time: 6 * 3600 + 600,
							rear: { gx: 1, gy: 2 },
							front: { gx: 2, gy: 2 },
						},
						{
							kind: "stop",
							location: "Halt",
							arrive: 6 * 3600 + 720,
							depart: 6 * 3600 + 780,
						},
						{ kind: "pass", time: 6 * 3600 + 1200, location: "Junction" },
						{
							kind: "finishExit",
							time: 6 * 3600 + 1800,
							exits: [{ gx: 9, gy: 2 }],
						},
					],
				},
			],
		});
	});

	it("handles all timetable commands, warnings, train specs, repeats, and single-time stops", () => {
		const { timetable, warnings } = convertRailosTimetable(
			ttb(
				"* comment line",
				"1B01;Express;40;120;200;80;1500;30,W06:00;Snt;0-0 1-0;S,06:02;Start;30,06:04;cdt,06:05;dsc;Fast,06:06;cms;90,06:07;fsp;1B02,06:08;rsp;1B03,06:09;jbo;1B04,06:10;End;20,06:15;Fns;1B05,R;30;2;3",
				"1B02;Split,06:07;Sfs;1B01,06:12;Fjo;1B01",
				"1B05;Next,06:15;Sns;1B01,06:20;F-nshs;1B06",
				"1B06;Shuttle,06:20;Snt-sh;0-0 1-0;1B07,06:25;Frh-sh;1B07",
				"1B07;Shuttle2,06:25;Sns-sh;1B06;1B05,06:30;Fns-sh;1B06;1B08",
				"1B08;FromShuttle,06:30;Sns-fsh;1B07,WFrh",
			),
		);
		expect(warnings).toEqual([]);
		expect(timetable.services).toHaveLength(6);
		expect(itemAt(timetable.services, 0).train).toEqual({
			startSpeedKmh: 40,
			maxSpeedKmh: 120,
			massTonnes: 200,
			brakeForceTonnes: 80,
			powerKw: 1500,
			signallerSpeedKmh: 30,
		});
		expect(itemAt(timetable.services, 0).repeat).toEqual({
			intervalMinutes: 30,
			headcodeIncrement: 2,
			count: 3,
		});
		expect(itemAt(timetable.services, 0).actions.map((a) => a.kind)).toEqual([
			"startNew",
			"stop",
			"changeDirection",
			"changeDescription",
			"changeMaxSpeed",
			"frontSplit",
			"rearSplit",
			"joinedBy",
			"stop",
			"finishNewService",
		]);
		expect(itemAt(timetable.services, 5).actions.map((a) => a.kind)).toEqual([
			"startFromShuttle",
			"finishRemainHere",
		]);
	});

	it("renames a repeated ref, and each run keeps its own warnings", () => {
		const text = ttb(
			"1A01;First,06:10;Snt;1-0 2-0,Frh",
			"1A01;Second,07:10;Snt;1-0 2-0,Frh",
		);
		const first = convertRailosTimetable(text);
		const second = convertRailosTimetable(text);
		expect(first.timetable.services.map((s) => s.ref)).toEqual([
			"1A01",
			"2-1A01",
		]);
		expect(first.warnings).toEqual([
			'duplicate service ref "1A01" renamed to "2-1A01".',
		]);
		expect(second.warnings).toEqual(first.warnings);
	});

	it("skips an entry it cannot read, with a warning", () => {
		const { timetable, warnings } = convertRailosTimetable(
			ttb("1A01;Bad,06:10;Snt;nonsense", "1A02;Good,06:10;Snt;1-0 2-0,Frh"),
		);
		expect(timetable.services.map((s) => s.ref)).toEqual(["1A02"]);
		expect(warnings).toHaveLength(1);
	});

	it("refuses text with no start time", () => {
		expect(() => convertRailosTimetable("not a timetable")).toThrow(
			InvalidRailosFileError,
		);
	});
});

describe("convertRailosRailway", () => {
	it("refuses text that is not a railway", () => {
		expect(() => convertRailosRailway("hello\nworld\n")).toThrow(
			InvalidRailosFileError,
		);
	});

	it("refuses a railway with no track", () => {
		expect(() => convertRailosRailway(buildRly({}))).toThrow(/no track/);
	});

	it("converts active tracks, gaps, preferred directions, inactive elements, and labels", () => {
		const rly = buildRly({
			active: [
				{
					tv: 0,
					tag: 1,
					h: 0,
					v: 0,
					lengths: [150, 100],
					speeds: [80, 100],
					activeName: "Central",
				},
				{ tv: 1, tag: 3, h: 1, v: 0 },
				{
					tv: 2,
					tag: 7,
					h: 2,
					v: 0,
					lengths: [120, 60],
					speeds: [110, 40],
				},
				{ tv: 3, tag: 15, h: 3, v: 0, lengths: [90, 80], speeds: [70, 50] },
				{ tv: 4, tag: 48, h: 4, v: 0, lengths: [100, 100], speeds: [90, 60] },
				{ tv: 5, tag: 60, h: 5, v: 0 },
				{ tv: 6, tag: 68, h: 6, v: 0, marker: "3" },
				{ tv: 7, tag: 69, h: 7, v: 0, marker: "2" },
				{ tv: 8, tag: 70, h: 8, v: 0, marker: "G" },
				{ tv: 9, tag: 80, h: 9, v: 0 },
				{ tv: 10, tag: 88, h: 10, v: 0, partner: 11 },
				{ tv: 11, tag: 89, h: 12, v: 0, partner: 10 },
				{ tv: 12, tag: 125, h: 13, v: 0 },
				{ tv: 13, tag: 125, h: 14, v: 0 },
				{ tv: 14, tag: 129, h: 15, v: 0 },
				{ tv: 15, tag: 146, h: 16, v: 0, locationName: "Subway" },
				{ tv: 16, tag: 0, h: 17, v: 0 }, // unused piece -> warning
			],
			inactive: [
				{ tag: 76, h: 0, v: 0 }, // platform on straight track
				{ tag: 76, h: 30, v: 0 }, // orphaned platform -> warning
				{ tag: 96, h: 0, v: -1, name: "Central" }, // concourse reusing label
				{ tag: 97, h: 1, v: -1 }, // parapet
				{ tag: 131, h: 5, v: -1, name: "Depot" }, // named location
				{ tag: 144, h: 0, v: 0 }, // level crossing on track
			],
			texts: [
				{ x: 0, y: 0, text: "Central" },
				{ x: 32, y: -16, text: "Standalone Note" },
			],
			prefDirs: [
				{ tv: 12, eLink: 4, xLink: 6 }, // valid for arrow -> directed
				{ tv: 0, eLink: 2, xLink: 8 }, // invalid for horizontal track -> warning
			],
		});

		const { map, warnings, counts } = convertRailosRailway(rly);
		expect(counts).toEqual({
			trackElements: 17,
			otherElements: 6,
			labels: 2,
		});

		// Straight track with custom figures + platform + level crossing + shared label.
		const straight = map.getTrackAt(0, 0);
		expect(straight?.getTrackMainLength()).toBe(150);
		expect(straight?.getTrackMainSpeed()).toBe(80);
		expect(straight?.hasPlatform()).toBe(true);
		expect(straight?.getText()?.getReadableText()).toBe("Central");

		// Two-path switch carries main and secondary speeds/lengths.
		const points = map.getTrackAt(2, 0);
		expect(points?.data.kind).toBe("switch");
		expect(points?.getTrackMainLength()).toBe(120);
		expect(points?.getTrackSecondaryLength()).toBe(60);

		// Paired gaps link to each other.
		expect(map.getTrackAt(10, 0)?.isLinked()).toBe(true);
		expect(map.getTrackAt(12, 0)?.isLinked()).toBe(true);

		// Arrow with 1 prefDir becomes directed; arrow with 0 falls back to straight.
		expect(map.getTrackAt(13, 0)?.data.kind).toBe("directed");
		expect(map.getTrackAt(14, 0)?.data.kind).toBe("straight");

		// Signals preserve aspect count from marker.
		expect(map.getTrackAt(6, 0)?.getAspect()).toBe(3);
		expect(map.getTrackAt(7, 0)?.getAspect()).toBe(2);
		expect(map.getTrackAt(8, 0)?.getAspect()).toBe(1);

		// Footbridges get either fallback name or explicit name.
		expect(map.getTrackAt(15, 0)?.getText()?.getReadableText()).toBe(
			"Footbridge (15, 0)",
		);
		expect(map.getTrackAt(16, 0)?.getText()?.getReadableText()).toBe("Subway");

		// Inactive named location and standalone free text are preserved.
		expect(map.getNamedLocationAt(5, 1)?.getText()?.getReadableText()).toBe(
			"Depot",
		);
		expect(
			map.getTextList().some((t) => t.getReadableText() === "Standalone Note"),
		).toBe(true);

		// Warnings capture unknown piece, undirected arrow, bad prefDir, orphaned platform.
		expect(warnings.some((w) => w.includes("piece 0"))).toBe(true);
		expect(warnings.some((w) => w.includes("one-way arrow"))).toBe(true);
		expect(warnings.some((w) => w.includes("preferred direction"))).toBe(true);
		expect(
			warnings.some((w) => w.includes("platform could not be added")),
		).toBe(true);
	});
});
