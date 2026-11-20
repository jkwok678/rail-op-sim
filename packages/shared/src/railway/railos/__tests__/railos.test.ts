import { describe, expect, it } from "vitest";
import {
	convertRailosRailway,
	convertRailosTimetable,
	InvalidRailosFileError,
} from "..";

// Whole-file conversions of the Lea Valley pair in test-data, compared field
// for field with the reference YAML, are in the app's fixtures test: this
// package has neither Node's file APIs nor a YAML parser to read them with.

/** A .ttb is NUL-separated entries: header text, start time, services, end. */
const ttb = (...entries: string[]) =>
	["RailOS timetable", "06:00", ...entries, ""].join("\0");

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
			ttb(
				"1A01;Bad,06:10;Snt;nonsense",
				"1A02;Good,06:10;Snt;1-0 2-0,Frh",
			),
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
		expect(() =>
			convertRailosRailway(
				[
					"v2.0",
					"0",
					"0",
					"0",
					"**Active elements**",
					"0",
					"**Inactive elements**",
					"0",
					"0",
				].join("\n"),
			),
		).toThrow(/no track/);
	});
});
