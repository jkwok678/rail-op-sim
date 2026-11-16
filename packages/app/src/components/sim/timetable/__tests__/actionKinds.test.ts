import {
	type Action,
	FINISH_KINDS,
	INTERMEDIATE_KINDS,
	parseSimTime,
	START_KINDS,
} from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import {
	ACTION_KIND_OPTIONS,
	createAction,
	describeAction,
} from "#/components/sim/timetable/actionKinds";

const ALL_KINDS: Action["kind"][] = [
	...START_KINDS,
	...INTERMEDIATE_KINDS,
	...FINISH_KINDS,
];
const t = parseSimTime("07:15");

describe("createAction", () => {
	it.each(ALL_KINDS)("builds a %s of that kind", (kind) => {
		expect(createAction(kind).kind).toBe(kind);
	});

	it("places a new train facing along the row from the given cell", () => {
		expect(
			createAction("startNew", { time: t, cell: { gx: 3, gy: 4 } }),
		).toEqual({
			kind: "startNew",
			time: t,
			rear: { gx: 3, gy: 4 },
			front: { gx: 4, gy: 4 },
		});
	});

	it("seeds a stop's arrival and departure from the one time", () => {
		expect(createAction("stop", { time: t, location: "Ashfield" })).toEqual({
			kind: "stop",
			location: "Ashfield",
			arrive: t,
			depart: t,
		});
	});

	it("carries the other service into whichever field the kind names it", () => {
		const opts = { time: t, otherRef: "2B01" };
		expect(createAction("startNewService", opts)).toMatchObject({
			fromRef: "2B01",
		});
		expect(createAction("rearSplit", opts)).toMatchObject({ newRef: "2B01" });
		expect(createAction("joinedBy", opts)).toMatchObject({ otherRef: "2B01" });
		expect(createAction("finishNewService", opts)).toMatchObject({
			nextRef: "2B01",
		});
	});

	it("gives a remain-here finish no time", () => {
		expect(createAction("finishRemainHere")).toEqual({
			kind: "finishRemainHere",
		});
	});
});

describe("describeAction", () => {
	it.each(ALL_KINDS)("summarises a fresh %s without throwing", (kind) => {
		expect(describeAction(createAction(kind, { time: t }))).not.toBe("");
	});

	it("shows a stop's span and location", () => {
		expect(
			describeAction({
				kind: "stop",
				location: "Barton",
				arrive: parseSimTime("07:00"),
				depart: parseSimTime("07:02"),
			}),
		).toBe("07:00–07:02 Barton");
	});

	it("marks a stop with no location rather than leaving a blank", () => {
		expect(describeAction({ kind: "stop", location: "", depart: t })).toBe(
			"07:15 (nowhere)",
		);
	});

	it("lists every exit a train may leave by", () => {
		expect(
			describeAction({
				kind: "finishExit",
				time: t,
				exits: [
					{ gx: 0, gy: 1 },
					{ gx: 9, gy: 1 },
				],
			}),
		).toBe("07:15 exit (0, 1) or (9, 1)");
	});

	it("summarises a shuttle by the services it links", () => {
		expect(ACTION_KIND_OPTIONS.some((o) => o.kind === "startShuttle")).toBe(
			true,
		);
		expect(
			describeAction(
				createAction("startShuttle", { time: t, otherRef: "2B01" }),
			),
		).toBe("07:15 shuttle from 2B01 ↔ 2B01");
		expect(
			describeAction(
				createAction("finishShuttleRemainHere", { time: t, otherRef: "2B01" }),
			),
		).toBe("07:15 shuttle ↔ 2B01");
	});
});
