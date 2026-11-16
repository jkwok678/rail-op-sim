import { describe, expect, it } from "vitest";
import { parseSimTime } from "../time";
import type { Action, Service, Timetable } from "../types";
import {
	hasErrors,
	issuesForService,
	type TimetableIssue,
	validateTimetableStructure,
} from "../validate";
import { TRAIN, timetable, twoServiceTimetable } from "./fixtures";

/** The codes reported, so a test can assert on identity rather than prose. */
function codes(issues: TimetableIssue[]): string[] {
	return issues.map((issue) => issue.code);
}

function structureCodes(tt: Timetable): string[] {
	return codes(validateTimetableStructure(tt));
}

/** A one-service timetable around `actions`, with a train spec when it needs one. */
function oneService(
	actions: Action[],
	extra: Partial<Service> = {},
): Timetable {
	return timetable([{ ref: "1A01", train: { ...TRAIN }, actions, ...extra }]);
}

const startNew: Action = {
	kind: "startNew",
	time: parseSimTime("06:00"),
	rear: { gx: 0, gy: 0 },
	front: { gx: 1, gy: 0 },
};
const finishRemainHere: Action = { kind: "finishRemainHere" };

/** An outward shuttle and the return that finishes it, one interval later. */
function linkedShuttle(): Timetable {
	const repeat = { intervalMinutes: 30, headcodeIncrement: 1, count: 2 };
	return timetable([
		{
			ref: "1A01",
			train: { ...TRAIN, startSpeedKmh: 0 },
			repeat,
			actions: [
				{
					kind: "startNewShuttle",
					time: parseSimTime("06:00"),
					rear: { gx: 0, gy: 0 },
					front: { gx: 1, gy: 0 },
					otherRef: "1A02",
				},
				{
					kind: "finishNewService",
					time: parseSimTime("06:10"),
					nextRef: "1A02",
				},
			],
		},
		{
			ref: "1A02",
			repeat,
			actions: [
				{
					kind: "startNewService",
					time: parseSimTime("06:10"),
					fromRef: "1A01",
				},
				{
					kind: "finishShuttleRemainHere",
					time: parseSimTime("06:30"),
					otherRef: "1A01",
				},
			],
		},
	]);
}

describe("validateTimetableStructure — a valid timetable", () => {
	it("reports nothing on a two-service timetable that hands a train over", () => {
		expect(validateTimetableStructure(twoServiceTimetable())).toEqual([]);
	});

	it("accepts a service that splits, with the portion that starts from it", () => {
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN },
				actions: [
					startNew,
					{
						kind: "frontSplit",
						time: parseSimTime("06:10"),
						newRef: "1A02",
					},
					finishRemainHere,
				],
			},
			{
				ref: "1A02",
				actions: [
					{
						kind: "startFromSplit",
						time: parseSimTime("06:10"),
						fromRef: "1A01",
					},
					finishRemainHere,
				],
			},
		]);
		expect(validateTimetableStructure(tt)).toEqual([]);
	});

	it("accepts a join, where one service waits and the other couples on", () => {
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN },
				actions: [
					startNew,
					{
						kind: "joinedBy",
						time: parseSimTime("06:20"),
						otherRef: "1A02",
					},
					finishRemainHere,
				],
			},
			{
				ref: "1A02",
				train: { ...TRAIN },
				actions: [
					{
						kind: "startNew",
						time: parseSimTime("06:05"),
						rear: { gx: 3, gy: 0 },
						front: { gx: 4, gy: 0 },
					},
					{
						kind: "finishJoin",
						time: parseSimTime("06:20"),
						otherRef: "1A01",
					},
				],
			},
		]);
		expect(validateTimetableStructure(tt)).toEqual([]);
	});
});

describe("validateTimetableStructure — the timetable itself", () => {
	it("unsupported-version: a version this build does not know", () => {
		const tt = { ...twoServiceTimetable(), version: 2 as unknown as 1 };
		expect(structureCodes(tt)).toContain("unsupported-version");
	});

	it("invalid-start-time: a start time that is not a time", () => {
		const tt = { ...twoServiceTimetable(), startTime: Number.NaN };
		expect(structureCodes(tt)).toContain("invalid-start-time");
	});

	it("no-services: an empty timetable warns rather than errors", () => {
		const issues = validateTimetableStructure(timetable([]));
		expect(codes(issues)).toEqual(["no-services"]);
		expect(hasErrors(issues)).toBe(false);
	});

	it("duplicate-ref: two services sharing a headcode", () => {
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN },
				actions: [startNew, finishRemainHere],
			},
			{
				ref: "1A01",
				train: { ...TRAIN },
				actions: [startNew, finishRemainHere],
			},
		]);
		expect(structureCodes(tt)).toContain("duplicate-ref");
	});
});

describe("validateTimetableStructure — a service's identity", () => {
	it("empty-ref: a service with no headcode", () => {
		const tt = oneService([startNew, finishRemainHere], { ref: "  " });
		expect(structureCodes(tt)).toContain("empty-ref");
	});

	it("ref-too-long: a headcode over eight characters", () => {
		const tt = oneService([startNew, finishRemainHere], {
			ref: "123456789",
		});
		expect(structureCodes(tt)).toContain("ref-too-long");
	});
});

describe("validateTimetableStructure — the shape of a service", () => {
	it("no-actions: a service that does nothing", () => {
		expect(structureCodes(oneService([]))).toContain("no-actions");
	});

	it("no-start: a service that does not begin with a start action", () => {
		const tt = oneService([
			{ kind: "stop", location: "Ashfield", depart: parseSimTime("06:00") },
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("no-start");
	});

	it("no-finish: a service that never ends", () => {
		const tt = oneService([
			startNew,
			{ kind: "stop", location: "Ashfield", arrive: parseSimTime("06:05") },
		]);
		expect(structureCodes(tt)).toContain("no-finish");
	});

	it("start-not-first: a second start part-way through", () => {
		const tt = oneService([
			startNew,
			{
				kind: "startNew",
				time: parseSimTime("06:05"),
				rear: { gx: 2, gy: 0 },
				front: { gx: 3, gy: 0 },
			},
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("start-not-first");
	});

	it("action-after-finish: a service that carries on after finishing", () => {
		const tt = oneService([
			startNew,
			{ kind: "finishRemainHere" },
			{ kind: "stop", location: "Barton", arrive: parseSimTime("06:30") },
		]);
		expect(structureCodes(tt)).toContain("action-after-finish");
	});

	it("shuttle-needs-repeat: a shuttle with nothing to repeat", () => {
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN, startSpeedKmh: 0 },
				actions: [
					{
						kind: "startNewShuttle",
						time: parseSimTime("06:00"),
						rear: { gx: 0, gy: 0 },
						front: { gx: 1, gy: 0 },
						otherRef: "1A01",
					},
					{
						kind: "finishShuttleRemainHere",
						time: parseSimTime("06:30"),
						otherRef: "1A01",
					},
				],
			},
		]);
		expect(structureCodes(tt)).toContain("shuttle-needs-repeat");
	});

	it("accepts a shuttle pair that names each other and repeats together", () => {
		expect(structureCodes(linkedShuttle())).not.toContain("shuttle-time");
		expect(hasErrors(validateTimetableStructure(linkedShuttle()))).toBe(false);
	});

	it("shuttle-time: the first return is not one interval after the start", () => {
		const tt = linkedShuttle();
		const finish = tt.services[1].actions[1];
		if (finish.kind !== "finishShuttleRemainHere") {
			throw new Error("expected a shuttle finish");
		}
		finish.time = parseSimTime("06:40");
		expect(structureCodes(tt)).toContain("shuttle-time");
	});

	it("shuttle-start-speed: a shuttle train that is already moving", () => {
		const tt = linkedShuttle();
		const train = tt.services[0].train;
		if (!train) throw new Error("expected a train");
		train.startSpeedKmh = 40;
		expect(structureCodes(tt)).toContain("shuttle-start-speed");
	});

	it("shuttle-no-repeat: a feeder that also repeats", () => {
		const tt = timetable([
			{
				ref: "1A00",
				train: { ...TRAIN },
				repeat: { intervalMinutes: 10, headcodeIncrement: 1, count: 1 },
				actions: [
					startNew,
					{
						kind: "finishToShuttle",
						time: parseSimTime("06:10"),
						nextRef: "1A01",
					},
				],
			},
		]);
		expect(structureCodes(tt)).toContain("shuttle-no-repeat");
	});

	it("shuttle-repeat-mismatch: alternating shuttle halves with different repeats", () => {
		const tt = linkedShuttle();
		tt.services[1].repeat = {
			intervalMinutes: 20,
			headcodeIncrement: 1,
			count: 2,
		};
		expect(structureCodes(tt)).toContain("shuttle-repeat-mismatch");
	});

	it("shuttle-integrity: a shuttle whose chain leaves the loop instead of returning", () => {
		const repeat = { intervalMinutes: 30, headcodeIncrement: 1, count: 2 };
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN, startSpeedKmh: 0 },
				repeat,
				actions: [
					{
						kind: "startNewShuttle",
						time: parseSimTime("06:00"),
						rear: { gx: 0, gy: 0 },
						front: { gx: 1, gy: 0 },
						otherRef: "1A02",
					},
					// Points to 1A03 which simply terminates instead of leading to 1A02.
					{
						kind: "finishNewService",
						time: parseSimTime("06:10"),
						nextRef: "1A03",
					},
				],
			},
			{
				ref: "1A03",
				actions: [
					{
						kind: "startNewService",
						time: parseSimTime("06:10"),
						fromRef: "1A01",
					},
					finishRemainHere,
				],
			},
			{
				ref: "1A02",
				repeat,
				actions: [
					startNew,
					{
						kind: "finishShuttleRemainHere",
						time: parseSimTime("06:30"),
						otherRef: "1A01",
					},
				],
			},
		]);
		expect(structureCodes(tt)).toContain("shuttle-integrity");
	});

	it("unmatched-reference: one-sided shuttle links in both feeder and tail directions", () => {
		const repeat = { intervalMinutes: 30, headcodeIncrement: 1, count: 1 };
		// 1) startShuttle whose named feeder does not finishToShuttle to it.
		const badFeeder = timetable([
			{
				ref: "1A00",
				train: { ...TRAIN },
				actions: [startNew, finishRemainHere],
			},
			{
				ref: "1A01",
				repeat,
				actions: [
					{
						kind: "startShuttle",
						time: parseSimTime("06:00"),
						fromRef: "1A00",
						otherRef: "1A01",
					},
					{
						kind: "finishShuttleRemainHere",
						time: parseSimTime("06:30"),
						otherRef: "1A01",
					},
				],
			},
		]);
		const feederIssues = validateTimetableStructure(badFeeder);
		expect(codes(issuesForService(feederIssues, "1A01"))).toContain(
			"unmatched-reference",
		);

		// 2) startFromShuttle whose named shuttle does not finishShuttleNewService to it.
		const badTail = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN, startSpeedKmh: 0 },
				repeat,
				actions: [
					{
						kind: "startNewShuttle",
						time: parseSimTime("06:00"),
						rear: { gx: 0, gy: 0 },
						front: { gx: 1, gy: 0 },
						otherRef: "1A01",
					},
					{
						kind: "finishShuttleRemainHere",
						time: parseSimTime("06:30"),
						otherRef: "1A01",
					},
				],
			},
			{
				ref: "1B01",
				actions: [
					{
						kind: "startFromShuttle",
						time: parseSimTime("07:00"),
						fromRef: "1A01",
					},
					finishRemainHere,
				],
			},
		]);
		const tailIssues = validateTimetableStructure(badTail);
		expect(codes(issuesForService(tailIssues, "1B01"))).toContain(
			"unmatched-reference",
		);
	});

	it("shuttle-time: non-repeating tail service starts at the wrong time after last repeat", () => {
		const repeat = { intervalMinutes: 30, headcodeIncrement: 1, count: 2 };
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN, startSpeedKmh: 0 },
				repeat,
				actions: [
					{
						kind: "startNewShuttle",
						time: parseSimTime("06:00"),
						rear: { gx: 0, gy: 0 },
						front: { gx: 1, gy: 0 },
						otherRef: "1A01",
					},
					{
						kind: "finishShuttleNewService",
						time: parseSimTime("06:30"),
						otherRef: "1A01",
						nextRef: "1B01",
					},
				],
			},
			{
				ref: "1B01",
				actions: [
					{
						kind: "startFromShuttle",
						// Last repeat of 1A01 finishes at 06:30 + 2 * 30m = 07:30; 07:35 is off.
						time: parseSimTime("07:35"),
						fromRef: "1A01",
					},
					finishRemainHere,
				],
			},
		]);
		expect(structureCodes(tt)).toContain("shuttle-time");
	});
});

describe("validateTimetableStructure — the train spec", () => {
	it("missing-train: a service that creates a train without saying what it is", () => {
		const tt = timetable([
			{ ref: "1A01", actions: [startNew, finishRemainHere] },
		]);
		expect(structureCodes(tt)).toContain("missing-train");
	});

	it("unused-train: a follow-on carrying a spec warns, since RailOS ignores it", () => {
		const tt = twoServiceTimetable();
		tt.services[1].train = { ...TRAIN };
		const issues = validateTimetableStructure(tt);
		expect(codes(issues)).toEqual(["unused-train"]);
		expect(hasErrors(issues)).toBe(false);
	});

	it("train-spec: a mass of zero", () => {
		const tt = oneService([startNew, finishRemainHere], {
			train: { ...TRAIN, massTonnes: 0 },
		});
		expect(structureCodes(tt)).toContain("train-spec");
	});

	it("train-spec: a train starting above its own maximum speed", () => {
		const tt = oneService([startNew, finishRemainHere], {
			train: { ...TRAIN, startSpeedKmh: 200, maxSpeedKmh: 120 },
		});
		expect(structureCodes(tt)).toContain("train-spec");
	});
});

describe("validateTimetableStructure — times", () => {
	it("start-before-timetable: a train appearing before the day begins", () => {
		const tt = timetable(
			[
				{
					ref: "1A01",
					train: { ...TRAIN },
					actions: [
						{ ...startNew, time: parseSimTime("04:00") } as Action,
						finishRemainHere,
					],
				},
			],
			parseSimTime("05:00"),
		);
		expect(structureCodes(tt)).toContain("start-before-timetable");
	});

	it("time-goes-backwards: a stop booked before the one ahead of it", () => {
		const tt = oneService([
			startNew,
			{ kind: "stop", location: "Ashfield", depart: parseSimTime("06:10") },
			{ kind: "stop", location: "Barton", arrive: parseSimTime("06:05") },
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("time-goes-backwards");
	});

	it("depart-before-arrive: a stop that leaves before it gets there", () => {
		const tt = oneService([
			startNew,
			{
				kind: "stop",
				location: "Ashfield",
				arrive: parseSimTime("06:10"),
				depart: parseSimTime("06:05"),
			},
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("depart-before-arrive");
	});

	it("stop-without-time: a stop with neither an arrival nor a departure", () => {
		const tt = oneService([
			startNew,
			{ kind: "stop", location: "Ashfield" },
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("stop-without-time");
	});

	it("invalid-dwell: a negative minimum dwell", () => {
		const tt = oneService([
			startNew,
			{
				kind: "stop",
				location: "Ashfield",
				arrive: parseSimTime("06:05"),
				minDwellSeconds: -30,
			},
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("invalid-dwell");
	});

	it("invalid-time: an action booked at something that is not a time", () => {
		const tt = oneService([
			startNew,
			{ kind: "changeDirection", time: Number.NaN },
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toContain("invalid-time");
	});

	it("reads a lone time at the first location as a departure, not an arrival", () => {
		// 06:00 is when the train leaves Ashfield, so the 06:05 arrival at Barton
		// is in order. Reading it as an arrival would be fine too here — what this
		// pins is that the *start* time may precede it without complaint.
		const tt = oneService([
			{ ...startNew, time: parseSimTime("05:58") } as Action,
			{ kind: "stop", location: "Ashfield", depart: parseSimTime("06:00") },
			{ kind: "stop", location: "Barton", arrive: parseSimTime("06:05") },
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toEqual([]);
	});

	it("lets an overnight service run past midnight without going backwards", () => {
		const tt = oneService([
			{ ...startNew, time: parseSimTime("23:45") } as Action,
			{ kind: "stop", location: "Ashfield", depart: parseSimTime("23:50") },
			{ kind: "stop", location: "Barton", arrive: parseSimTime("25:10") },
			finishRemainHere,
		]);
		expect(structureCodes(tt)).toEqual([]);
	});
});

describe("validateTimetableStructure — repeats", () => {
	const repeating = (repeat: Service["repeat"], ref = "1A01"): Timetable =>
		oneService([startNew, finishRemainHere], { ref, repeat });

	it("accepts a well-formed repeat", () => {
		const tt = repeating({
			intervalMinutes: 30,
			headcodeIncrement: 2,
			count: 4,
		});
		expect(structureCodes(tt)).toEqual([]);
	});

	it("repeat-interval: a repeat with no interval", () => {
		const tt = repeating({
			intervalMinutes: 0,
			headcodeIncrement: 1,
			count: 2,
		});
		expect(structureCodes(tt)).toContain("repeat-interval");
	});

	it("repeat-count: a repeat that never runs again", () => {
		const tt = repeating({
			intervalMinutes: 30,
			headcodeIncrement: 1,
			count: 0,
		});
		expect(structureCodes(tt)).toContain("repeat-count");
	});

	it("repeat-increment: a negative headcode increment", () => {
		const tt = repeating({
			intervalMinutes: 30,
			headcodeIncrement: -1,
			count: 2,
		});
		expect(structureCodes(tt)).toContain("repeat-increment");
	});

	it("repeat-headcode: incrementing a headcode that does not end in digits", () => {
		const tt = repeating(
			{ intervalMinutes: 30, headcodeIncrement: 1, count: 2 },
			"1A0X",
		);
		expect(structureCodes(tt)).toContain("repeat-headcode");
	});
});

describe("validateTimetableStructure — references between services", () => {
	it("unknown-service-ref: handing over to a service that is not there", () => {
		const tt = twoServiceTimetable();
		tt.services.pop();
		const issues = validateTimetableStructure(tt);
		expect(codes(issues)).toContain("unknown-service-ref");
		expect(issues[0].serviceRef).toBe("1A01");
	});

	it("self-reference: a service handing over to itself", () => {
		const tt = oneService([
			startNew,
			{
				kind: "finishNewService",
				time: parseSimTime("06:30"),
				nextRef: "1A01",
			},
		]);
		expect(structureCodes(tt)).toContain("self-reference");
	});

	it("unmatched-reference: a hand-over the successor does not take up", () => {
		const tt = twoServiceTimetable();
		tt.services[1].actions[0] = {
			kind: "startNew",
			time: parseSimTime("06:12"),
			rear: { gx: 3, gy: 0 },
			front: { gx: 4, gy: 0 },
		};
		tt.services[1].train = { ...TRAIN };
		expect(structureCodes(tt)).toContain("unmatched-reference");
	});

	it("unmatched-reference: a take-over with no hand-over behind it", () => {
		const tt = twoServiceTimetable();
		// 1A01 now ends by itself, leaving 2B01 waiting for a train that is
		// never handed over.
		tt.services[0].actions[3] = { kind: "finishRemainHere" };
		const issues = validateTimetableStructure(tt);
		expect(codes(issues)).toContain("unmatched-reference");
		expect(issuesForService(issues, "2B01")).toHaveLength(1);
	});

	it("reference-time-mismatch: two ends of a hand-over booked at different times", () => {
		const tt = twoServiceTimetable();
		const takeOver = tt.services[1].actions[0];
		if (takeOver.kind !== "startNewService") throw new Error("bad fixture");
		takeOver.time = parseSimTime("06:15");
		expect(structureCodes(tt)).toContain("reference-time-mismatch");
	});

	it("ambiguous-reference: a service that takes over from the same train twice", () => {
		const tt = timetable([
			{
				ref: "1A01",
				train: { ...TRAIN },
				actions: [
					startNew,
					{
						kind: "frontSplit",
						time: parseSimTime("06:10"),
						newRef: "1A02",
					},
					finishRemainHere,
				],
			},
			{
				ref: "1A02",
				actions: [
					{
						kind: "startFromSplit",
						time: parseSimTime("06:10"),
						fromRef: "1A01",
					},
					{
						kind: "startFromSplit",
						time: parseSimTime("06:10"),
						fromRef: "1A01",
					},
					finishRemainHere,
				],
			},
		]);
		expect(structureCodes(tt)).toContain("ambiguous-reference");
	});
});

describe("issue addressing", () => {
	it("points at the service and the action a problem belongs to", () => {
		const tt = oneService([
			startNew,
			{ kind: "stop", location: "Ashfield", depart: parseSimTime("06:10") },
			{ kind: "stop", location: "Barton", arrive: parseSimTime("06:05") },
			finishRemainHere,
		]);
		const issue = validateTimetableStructure(tt).find(
			(i) => i.code === "time-goes-backwards",
		);
		expect(issue).toMatchObject({ serviceRef: "1A01", actionIndex: 2 });
	});

	it("issuesForService picks out one service's issues", () => {
		const tt = twoServiceTimetable();
		// A fault in the first service's train, which the second does not share.
		tt.services[0].train = { ...TRAIN, powerKw: 0 };
		const issues = validateTimetableStructure(tt);
		expect(issuesForService(issues, "2B01")).toEqual([]);
		expect(codes(issuesForService(issues, "1A01"))).toEqual(["train-spec"]);
	});
});
