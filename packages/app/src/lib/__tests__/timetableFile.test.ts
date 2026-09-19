import {
	createEmptyTimetable,
	InvalidTimetableError,
	parseSimTime,
	type Timetable,
} from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import {
	encodeTimetable,
	parseTimetableText,
	timetableFileName,
} from "#/lib/timetableFile";

const sample: Timetable = {
	version: 1,
	title: "Weekday service",
	startTime: parseSimTime("05:00"),
	services: [
		{
			ref: "1A01",
			description: "Ashfield to Barton",
			train: {
				startSpeedKmh: 0,
				maxSpeedKmh: 120,
				massTonnes: 200,
				brakeForceTonnes: 100,
				powerKw: 2000,
			},
			actions: [
				{
					kind: "startNew",
					time: parseSimTime("05:55"),
					rear: { gx: 0, gy: 0 },
					front: { gx: 1, gy: 0 },
				},
				{
					kind: "stop",
					location: "Ashfield",
					arrive: parseSimTime("06:00"),
					depart: parseSimTime("06:02"),
				},
				{
					kind: "finishExit",
					time: parseSimTime("06:30"),
					exits: [{ gx: 5, gy: 0 }],
				},
			],
		},
	],
};

describe("encodeTimetable / parseTimetableText", () => {
	it("round-trips JSON", () => {
		const text = encodeTimetable(sample, "json");
		expect(text).toContain('"version": 1');
		expect(parseTimetableText(text, "json")).toEqual(sample);
	});

	it("round-trips YAML", () => {
		const text = encodeTimetable(sample, "yaml");
		expect(text).toMatch(/^version: 1\b/m);
		expect(text).toContain("ref: 1A01");
		expect(parseTimetableText(text, "yaml")).toEqual(sample);
	});

	it("loads a JSON document read as YAML (YAML 1.2 is a JSON superset)", () => {
		expect(parseTimetableText(encodeTimetable(sample, "json"), "yaml")).toEqual(
			sample,
		);
	});

	it("round-trips an empty timetable", () => {
		const empty = createEmptyTimetable(parseSimTime("04:00"));
		expect(parseTimetableText(encodeTimetable(empty, "yaml"), "yaml")).toEqual(
			empty,
		);
	});

	it("rejects malformed JSON and YAML as an InvalidTimetableError", () => {
		expect(() => parseTimetableText("{", "json")).toThrow(
			InvalidTimetableError,
		);
		expect(() => parseTimetableText("{", "json")).toThrow("not valid JSON");
		expect(() => parseTimetableText("version: [", "yaml")).toThrow(
			"not valid YAML",
		);
	});

	it("rejects a well-formed document that is not a timetable", () => {
		expect(() => parseTimetableText("{}", "json")).toThrow(
			"Unsupported timetable version",
		);
	});

	it("rejects a hand-edited file with an action kind this build cannot run", () => {
		const text = encodeTimetable(sample, "json").replace(
			'"kind": "stop"',
			'"kind": "teleport"',
		);
		expect(() => parseTimetableText(text, "json")).toThrow(
			/unknown kind "teleport"/,
		);
	});
});

describe("timetableFileName", () => {
	it("matches the encoding, and is not the map's name", () => {
		expect(timetableFileName("json")).toBe("timetable.json");
		expect(timetableFileName("yaml")).toBe("timetable.yaml");
	});
});
