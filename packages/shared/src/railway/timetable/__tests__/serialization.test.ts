import { describe, expect, it } from "vitest";
import {
	createDefaultTrainSpec,
	createEmptyTimetable,
	InvalidTimetableError,
	parseTimetable,
	SERIALIZED_TIMETABLE_VERSION,
} from "../serialization";
import { parseSimTime } from "../time";
import type { Timetable } from "../types";
import { validateTimetableStructure } from "../validate";
import { TRAIN, timetable, twoServiceTimetable } from "./fixtures";

/** JSON round trip, the way a saved file comes back. */
function roundTrip(tt: Timetable): Timetable {
	return parseTimetable(JSON.parse(JSON.stringify(tt)));
}

describe("createEmptyTimetable", () => {
	it("is a valid, empty timetable at the current version", () => {
		const tt = createEmptyTimetable(parseSimTime("05:00"));
		expect(tt).toEqual({
			version: SERIALIZED_TIMETABLE_VERSION,
			startTime: parseSimTime("05:00"),
			services: [],
		});
		// Empty is a warning, never an error — a new timetable is not broken.
		expect(
			validateTimetableStructure(tt).every((i) => i.severity === "warning"),
		).toBe(true);
	});

	it("starts at midnight when no start time is given", () => {
		expect(createEmptyTimetable().startTime).toBe(0);
	});
});

describe("createDefaultTrainSpec", () => {
	it("is a train the validator accepts", () => {
		const tt = timetable([
			{
				ref: "1A01",
				train: createDefaultTrainSpec(),
				actions: [
					{
						kind: "startNew",
						time: parseSimTime("06:00"),
						rear: { gx: 0, gy: 0 },
						front: { gx: 1, gy: 0 },
					},
					{ kind: "finishRemainHere" },
				],
			},
		]);
		expect(validateTimetableStructure(tt)).toEqual([]);
	});
});

describe("parseTimetable — round trips", () => {
	it("returns a two-service timetable unchanged", () => {
		const original = twoServiceTimetable();
		expect(roundTrip(original)).toEqual(original);
	});

	it("keeps every optional field that was set", () => {
		const original: Timetable = {
			version: 1,
			title: "Weekday service",
			startTime: parseSimTime("05:00"),
			services: [
				{
					ref: "1A01",
					description: "The early one",
					train: { ...TRAIN, signallerSpeedKmh: 40 },
					repeat: { intervalMinutes: 30, headcodeIncrement: 2, count: 3 },
					actions: [
						{
							kind: "startNew",
							warning: true,
							time: parseSimTime("06:00"),
							rear: { gx: 0, gy: 0 },
							front: { gx: 1, gy: 0 },
							signallerControl: true,
						},
						{
							kind: "stop",
							location: "Ashfield",
							arrive: parseSimTime("06:05"),
							depart: parseSimTime("06:07"),
							minDwellSeconds: 60,
						},
						{ kind: "changeDirection", time: parseSimTime("06:08") },
						{
							kind: "changeDescription",
							time: parseSimTime("06:09"),
							description: "now the late one",
						},
						{
							kind: "changeMaxSpeed",
							time: parseSimTime("06:10"),
							maxSpeedKmh: 60,
						},
						{ kind: "pass", time: parseSimTime("06:11"), location: "Barton" },
						{
							kind: "finishExit",
							time: parseSimTime("06:30"),
							exits: [
								{ gx: 5, gy: 0 },
								{ gx: -1, gy: 0 },
							],
						},
					],
				},
			],
		};
		expect(roundTrip(original)).toEqual(original);
	});

	it("drops nothing and adds nothing for a service with no optional fields", () => {
		const original = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN },
				actions: [
					{
						kind: "startNew",
						time: parseSimTime("06:00"),
						rear: { gx: 0, gy: 0 },
						front: { gx: 1, gy: 0 },
					},
					{ kind: "finishRemainHere" },
				],
			},
		]);
		const parsed = roundTrip(original);
		expect(parsed).toEqual(original);
		expect(Object.hasOwn(parsed.services[0], "description")).toBe(false);
		expect(Object.hasOwn(parsed.services[0].actions[1], "warning")).toBe(false);
	});

	it("refuses to share arrays with the document it parsed", () => {
		const doc = JSON.parse(JSON.stringify(twoServiceTimetable()));
		const parsed = parseTimetable(doc);
		expect(parsed.services).not.toBe(doc.services);
		expect(parsed.services[0].actions).not.toBe(doc.services[0].actions);
	});

	it("accepts a hand-written clock time in place of seconds", () => {
		const doc = {
			version: 1,
			startTime: "05:00",
			services: [
				{
					ref: "1A01",
					train: { ...TRAIN },
					actions: [
						{
							kind: "startNew",
							time: "06:00",
							rear: { gx: 0, gy: 0 },
							front: { gx: 1, gy: 0 },
						},
						{ kind: "finishRemainHere" },
					],
				},
			],
		};
		const parsed = parseTimetable(doc);
		expect(parsed.startTime).toBe(parseSimTime("05:00"));
		const start = parsed.services[0].actions[0];
		if (start.kind !== "startNew") throw new Error("wrong kind");
		expect(start.time).toBe(parseSimTime("06:00"));
	});
});

describe("parseTimetable — rejections", () => {
	const reject = (input: unknown, match: RegExp): void => {
		expect(() => parseTimetable(input)).toThrow(InvalidTimetableError);
		expect(() => parseTimetable(input)).toThrow(match);
	};

	it("rejects something that is not an object", () => {
		reject("not a timetable", /not a timetable/i);
		reject(null, /not a timetable/i);
		reject([], /not a timetable/i);
	});

	it("rejects a version this build does not understand", () => {
		reject(
			{ version: 2, startTime: 0, services: [] },
			/Unsupported timetable version: 2/,
		);
	});

	it("rejects a document with no services", () => {
		reject({ version: 1, startTime: 0 }, /no list of services/);
	});

	it("rejects a start time that is not a time", () => {
		reject(
			{ version: 1, startTime: "half past six", services: [] },
			/clock time/,
		);
		reject({ version: 1, startTime: -60, services: [] }, /negative/);
	});

	it("rejects an unknown action kind rather than dropping it", () => {
		// The dangerous case: a silently dropped split would validate clean and
		// then do the wrong thing on the railway.
		reject(
			{
				version: 1,
				startTime: 0,
				services: [{ ref: "1A01", actions: [{ kind: "teleport", time: 0 }] }],
			},
			/unknown kind "teleport"/,
		);
	});

	it("names the field that is wrong", () => {
		reject(
			{
				version: 1,
				startTime: 0,
				services: [
					{
						ref: "1A01",
						actions: [{ kind: "stop", location: 42, arrive: 0 }],
					},
				],
			},
			/action 1 of "1A01"'s location/,
		);
	});

	it("rejects a start position that is not a grid cell", () => {
		reject(
			{
				version: 1,
				startTime: 0,
				services: [
					{
						ref: "1A01",
						actions: [
							{
								kind: "startNew",
								time: 0,
								rear: { gx: 0 },
								front: { gx: 1, gy: 0 },
							},
						],
					},
				],
			},
			/rear's y/,
		);
	});

	it("rejects an exit finish with no list of exits", () => {
		reject(
			{
				version: 1,
				startTime: 0,
				services: [{ ref: "1A01", actions: [{ kind: "finishExit", time: 0 }] }],
			},
			/no list of exits/,
		);
	});

	it("rejects a service with no actions array", () => {
		reject(
			{ version: 1, startTime: 0, services: [{ ref: "1A01" }] },
			/"1A01" has no list of actions/,
		);
	});

	it("rejects a service with no headcode", () => {
		reject(
			{ version: 1, startTime: 0, services: [{ actions: [] }] },
			/service 1's headcode/,
		);
	});

	it("rejects a train spec with a missing field", () => {
		reject(
			{
				version: 1,
				startTime: 0,
				services: [{ ref: "1A01", actions: [], train: { startSpeedKmh: 0 } }],
			},
			/"1A01"'s maximum speed/,
		);
	});
});

describe("parseTimetable — what comes back is still checkable", () => {
	it("hands the validator a timetable it can judge", () => {
		const broken = {
			version: 1,
			startTime: parseSimTime("05:00"),
			services: [
				{
					ref: "1A01",
					actions: [
						{
							kind: "stop",
							location: "Ashfield",
							arrive: parseSimTime("06:00"),
						},
					],
				},
			],
		};
		// Parsing is shape, not sense: this is well-formed but has no start.
		const parsed = parseTimetable(broken);
		const codes = validateTimetableStructure(parsed).map((i) => i.code);
		expect(codes).toContain("no-start");
		expect(codes).toContain("no-finish");
	});
});
