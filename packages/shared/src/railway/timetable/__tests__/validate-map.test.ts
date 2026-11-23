import { describe, expect, it } from "vitest";
import { itemAt } from "../../../util/checked";
import { StraightType } from "../../enums";
import { Map_ } from "../../map/map";
import { parseSimTime } from "../time";
import type { Action, Timetable } from "../types";
import {
	type TimetableIssue,
	validateTimetable,
	validateTimetableAgainstMap,
} from "../validate";
import {
	CELL,
	completeRailwayFixture,
	railwayFixture,
	TRAIN,
	timetable,
	twoServiceTimetable,
} from "./fixtures";

function codes(issues: TimetableIssue[]): string[] {
	return issues.map((issue) => issue.code);
}

/** A one-service timetable around `actions`, for the map checks. */
function oneService(actions: Action[]): Timetable {
	return timetable([{ ref: "1A01", train: { ...TRAIN }, actions }]);
}

const finishRemainHere: Action = { kind: "finishRemainHere" };

/** A start on the two adjacent cells the fixture's running line provides. */
function startAt(rearGx: number, frontGx: number): Action {
	return {
		kind: "startNew",
		time: parseSimTime("06:00"),
		rear: { gx: rearGx, gy: 0 },
		front: { gx: frontGx, gy: 0 },
	};
}

describe("validateTimetableAgainstMap — a valid timetable", () => {
	it("reports nothing against the railway it was written for", () => {
		const map = completeRailwayFixture();
		expect(validateTimetableAgainstMap(twoServiceTimetable(), map)).toEqual([]);
	});
});

describe("validateTimetableAgainstMap — locations", () => {
	it("unknown-location: a stop at a place that is not on the railway", () => {
		const tt = oneService([
			startAt(0, 1),
			{ kind: "stop", location: "Camford", arrive: parseSimTime("06:10") },
			finishRemainHere,
		]);
		const issues = validateTimetableAgainstMap(tt, completeRailwayFixture());
		expect(codes(issues)).toEqual(["unknown-location"]);
		expect(issues[0]).toMatchObject({ serviceRef: "1A01", actionIndex: 1 });
	});

	it("unknown-location: renaming a platform on the map invalidates the services booked to it", () => {
		const map = completeRailwayFixture();
		const barton = map.getTrackAt(3 * CELL, 0);
		barton?.getText()?.setReadableText("Barchester");

		const issues = validateTimetableAgainstMap(twoServiceTimetable(), map);
		expect(codes(issues)).toEqual(["unknown-location"]);
	});

	it("checks a pass the same way it checks a stop", () => {
		const tt = oneService([
			startAt(0, 1),
			{ kind: "pass", time: parseSimTime("06:10"), location: "Camford" },
			finishRemainHere,
		]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["unknown-location"]);
	});
});

describe("validateTimetableAgainstMap — start positions", () => {
	it("accepts a rear/front pair on two joined cells", () => {
		const tt = oneService([startAt(0, 1), finishRemainHere]);
		expect(validateTimetableAgainstMap(tt, completeRailwayFixture())).toEqual(
			[],
		);
	});

	it("start-not-track: a train placed on an empty cell", () => {
		const tt = oneService([
			{
				kind: "startNew",
				time: parseSimTime("06:00"),
				rear: { gx: 0, gy: 9 },
				front: { gx: 1, gy: 9 },
			},
			finishRemainHere,
		]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["start-not-track"]);
	});

	it("start-same-cell: a train with its rear and front in one cell", () => {
		const tt = oneService([startAt(1, 1), finishRemainHere]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["start-same-cell"]);
	});

	it("start-not-adjacent: a train stretched across two cells that do not touch", () => {
		const tt = oneService([startAt(0, 3), finishRemainHere]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["start-not-adjacent"]);
	});

	it("start-on-exit: a train facing off the end of the map", () => {
		const tt = oneService([startAt(4, 5), finishRemainHere]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["start-on-exit"]);
	});

	it("allows a train backed onto an exit, which only its rear occupies", () => {
		const tt = oneService([startAt(5, 4), finishRemainHere]);
		expect(validateTimetableAgainstMap(tt, completeRailwayFixture())).toEqual(
			[],
		);
	});

	it("start-on-level-crossing: a train left standing across a road", () => {
		const map = completeRailwayFixture();
		// Cell 0 is plain running line — the map refuses a crossing on a
		// platform, so cell 1 would silently stay clear.
		map.addLevelCrossing(0 * CELL, 0);
		const tt = oneService([startAt(0, 1), finishRemainHere]);
		expect(codes(validateTimetableAgainstMap(tt, map))).toContain(
			"start-on-level-crossing",
		);
	});

	it("start-not-joined: two neighbouring cells whose track does not connect", () => {
		// A vertical straight beside a horizontal one is next door without
		// joining it — the same distinction the connectivity report draws.
		const map = railwayFixture();
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			2 * CELL,
			1 * CELL,
		);
		map.makeTrackList();
		const tt = oneService([
			{
				kind: "startNew",
				time: parseSimTime("06:00"),
				rear: { gx: 2, gy: 0 },
				front: { gx: 2, gy: 1 },
			},
			finishRemainHere,
		]);
		expect(codes(validateTimetableAgainstMap(tt, map))).toContain(
			"start-not-joined",
		);
	});
});

describe("validateTimetableAgainstMap — exits", () => {
	it("accepts a finish at an exit cell", () => {
		const tt = oneService([
			startAt(0, 1),
			{
				kind: "finishExit",
				time: parseSimTime("06:30"),
				exits: [{ gx: 5, gy: 0 }],
			},
		]);
		expect(validateTimetableAgainstMap(tt, completeRailwayFixture())).toEqual(
			[],
		);
	});

	it("no-exit: a service leaving the map without saying where", () => {
		const tt = oneService([
			startAt(0, 1),
			{ kind: "finishExit", time: parseSimTime("06:30"), exits: [] },
		]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["no-exit"]);
	});

	it("exit-not-track: an exit cell with nothing in it", () => {
		const tt = oneService([
			startAt(0, 1),
			{
				kind: "finishExit",
				time: parseSimTime("06:30"),
				exits: [{ gx: 9, gy: 9 }],
			},
		]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["exit-not-track"]);
	});

	it("exit-not-exit: leaving the map through the middle of the running line", () => {
		const tt = oneService([
			startAt(0, 1),
			{
				kind: "finishExit",
				time: parseSimTime("06:30"),
				exits: [{ gx: 3, gy: 0 }],
			},
		]);
		expect(
			codes(validateTimetableAgainstMap(tt, completeRailwayFixture())),
		).toEqual(["exit-not-exit"]);
	});
});

describe("validateTimetableAgainstMap — the state of the railway", () => {
	it("railway-incomplete: warns when the railway is not ready to operate", () => {
		// railwayFixture has no preferred directions, so it is joined but not
		// complete — the state the editor refuses to open on.
		const issues = validateTimetableAgainstMap(
			twoServiceTimetable(),
			railwayFixture(),
		);
		expect(codes(issues)).toEqual(["railway-incomplete"]);
		expect(itemAt(issues, 0).severity).toBe("warning");
	});

	it("says nothing about completeness once the railway is complete", () => {
		const issues = validateTimetableAgainstMap(
			twoServiceTimetable(),
			completeRailwayFixture(),
		);
		expect(codes(issues)).not.toContain("railway-incomplete");
	});

	it("reports every location as unknown on an empty map", () => {
		const issues = validateTimetableAgainstMap(
			twoServiceTimetable(),
			new Map_(),
		);
		expect(codes(issues).filter((c) => c === "unknown-location")).toHaveLength(
			3,
		);
	});
});

describe("validateTimetable", () => {
	it("runs the structural half alone when no railway is given", () => {
		const tt = oneService([
			startAt(0, 1),
			{ kind: "stop", location: "Camford", arrive: parseSimTime("06:10") },
			finishRemainHere,
		]);
		// "Camford" is unknown to the fixture railway but unknowable without one.
		expect(validateTimetable(tt)).toEqual([]);
		expect(codes(validateTimetable(tt, completeRailwayFixture()))).toEqual([
			"unknown-location",
		]);
	});

	it("puts the structural issues before the railway ones", () => {
		const tt = oneService([
			startAt(0, 1),
			{ kind: "stop", location: "Camford" },
			finishRemainHere,
		]);
		expect(codes(validateTimetable(tt, completeRailwayFixture()))).toEqual([
			"stop-without-time",
			"unknown-location",
		]);
	});

	it("treats a null map as no map, so a caller can pass one straight through", () => {
		expect(validateTimetable(twoServiceTimetable(), null)).toEqual([]);
	});
});
