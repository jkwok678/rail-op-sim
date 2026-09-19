import {
	createEmptyTimetable,
	parseSimTime,
	type Timetable,
} from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * The store is exercised with no map: the railway half of validation is the
 * shared package's business and is tested there, while what matters here is
 * that every mutator leaves the timetable and its issue list agreeing.
 */

const store = () => useTimetableStore.getState();

const twoServices = (): Timetable => ({
	version: 1,
	startTime: parseSimTime("05:00"),
	services: [
		{
			ref: "1A01",
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
					kind: "finishNewService",
					time: parseSimTime("06:30"),
					nextRef: "2B01",
				},
			],
		},
		{
			ref: "2B01",
			actions: [
				{
					kind: "startNewService",
					time: parseSimTime("06:30"),
					fromRef: "1A01",
				},
				{ kind: "finishRemainHere" },
			],
		},
	],
});

beforeEach(() => {
	useTimetableStore.setState({
		timetable: createEmptyTimetable(),
		selectedServiceRef: null,
		selectedActionIndex: null,
		issues: [],
		open: false,
		pendingCellPick: null,
		loadError: null,
	});
});

const codes = () => store().issues.map((i) => i.code);

describe("services", () => {
	it("adds a service, selects it, and gives it an unused headcode", () => {
		const first = store().addService(null);
		const second = store().addService(null);
		expect(first).toBe("1A01");
		expect(second).toBe("1A02");
		expect(store().selectedServiceRef).toBe("1A02");
		expect(store().timetable.services).toHaveLength(2);
	});

	it("reports the new service's faults immediately", () => {
		store().addService(null);
		// An empty service is not a valid one, and the editor should say so
		// before the user has to ask.
		expect(codes()).toContain("no-actions");
	});

	it("removes a service and clears the selection only if it was selected", () => {
		store().replaceTimetable(twoServices(), null);
		store().selectService("2B01");
		store().removeService("1A01", null);
		expect(store().selectedServiceRef).toBe("2B01");

		store().removeService("2B01", null);
		expect(store().selectedServiceRef).toBeNull();
	});

	it("reports the reference a deleted service leaves dangling", () => {
		store().replaceTimetable(twoServices(), null);
		expect(codes()).toEqual([]);
		store().removeService("2B01", null);
		expect(codes()).toContain("unknown-service-ref");
	});

	it("follows a renamed service with the selection", () => {
		store().replaceTimetable(twoServices(), null);
		store().selectService("1A01");
		store().updateService("1A01", { ref: "1A99" }, null);
		expect(store().selectedServiceRef).toBe("1A99");
		expect(store().timetable.services[0].ref).toBe("1A99");
	});
});

describe("actions", () => {
	it("appends by default and inserts at an index when given one", () => {
		store().replaceTimetable(twoServices(), null);
		store().addAction(
			"1A01",
			{ kind: "changeDirection", time: parseSimTime("06:00") },
			null,
			1,
		);
		expect(store().timetable.services[0].actions.map((a) => a.kind)).toEqual([
			"startNew",
			"changeDirection",
			"finishNewService",
		]);
	});

	it("updates one action and leaves the rest alone", () => {
		store().replaceTimetable(twoServices(), null);
		store().updateAction(
			"1A01",
			0,
			{
				kind: "startNew",
				time: parseSimTime("04:00"),
				rear: { gx: 0, gy: 0 },
				front: { gx: 1, gy: 0 },
			},
			null,
		);
		// 04:00 is before the timetable's own 05:00 start.
		expect(codes()).toContain("start-before-timetable");
		expect(store().timetable.services[1].actions).toHaveLength(2);
	});

	it("reorders actions and keeps the moved one selected", () => {
		store().replaceTimetable(twoServices(), null);
		store().selectAction(0);
		store().moveAction("1A01", 0, 1, null);
		expect(store().timetable.services[0].actions.map((a) => a.kind)).toEqual([
			"finishNewService",
			"startNew",
		]);
		expect(store().selectedActionIndex).toBe(1);
		// The service now finishes before it starts, which is exactly what the
		// flat action list exists to be able to report.
		expect(codes()).toContain("no-start");
	});

	it("refuses a move from outside the list rather than duplicating a row", () => {
		store().replaceTimetable(twoServices(), null);
		store().moveAction("1A01", 5, 0, null);
		expect(store().timetable.services[0].actions.map((a) => a.kind)).toEqual([
			"startNew",
			"finishNewService",
		]);
	});

	it("clamps a move past the end to the last row", () => {
		store().replaceTimetable(twoServices(), null);
		store().moveAction("1A01", 0, 9, null);
		expect(store().timetable.services[0].actions.map((a) => a.kind)).toEqual([
			"finishNewService",
			"startNew",
		]);
	});

	it("removes an action and drops a selection pointing at it", () => {
		store().replaceTimetable(twoServices(), null);
		store().selectAction(1);
		store().removeAction("1A01", 1, null);
		expect(store().selectedActionIndex).toBeNull();
		expect(codes()).toContain("no-finish");
	});
});

describe("the timetable as a whole", () => {
	it("re-validates when the start time moves past a service", () => {
		store().replaceTimetable(twoServices(), null);
		expect(codes()).toEqual([]);
		store().setStartTime(parseSimTime("07:00"), null);
		expect(codes()).toContain("start-before-timetable");
	});

	it("selects the first service of a loaded timetable and clears any pick", () => {
		store().beginCellPick({
			serviceRef: "1A01",
			actionIndex: 0,
			field: "rear",
		});
		store().replaceTimetable(twoServices(), null);
		expect(store().selectedServiceRef).toBe("1A01");
		expect(store().pendingCellPick).toBeNull();
		expect(store().issues).toEqual([]);
	});

	it("revalidate re-checks without touching the timetable", () => {
		store().replaceTimetable(twoServices(), null);
		const before = store().timetable;
		store().revalidate(null);
		expect(store().timetable).toBe(before);
	});
});

describe("picking a cell on the map", () => {
	beforeEach(() => {
		store().replaceTimetable(twoServices(), null);
	});

	it("fills the field the pick names", () => {
		store().beginCellPick({
			serviceRef: "1A01",
			actionIndex: 0,
			field: "front",
		});
		store().completeCellPick({ gx: 4, gy: 2 }, null);

		const action = store().timetable.services[0].actions[0];
		if (action.kind !== "startNew") throw new Error("wrong kind");
		expect(action.front).toEqual({ gx: 4, gy: 2 });
		expect(action.rear).toEqual({ gx: 0, gy: 0 });
		expect(store().pendingCellPick).toBeNull();
	});

	it("appends an exit when the pick points past the end of the list", () => {
		store().updateAction(
			"2B01",
			1,
			{ kind: "finishExit", time: parseSimTime("06:40"), exits: [] },
			null,
		);
		store().beginCellPick({
			serviceRef: "2B01",
			actionIndex: 1,
			field: "exit",
		});
		store().completeCellPick({ gx: 5, gy: 0 }, null);

		const action = store().timetable.services[1].actions[1];
		if (action.kind !== "finishExit") throw new Error("wrong kind");
		expect(action.exits).toEqual([{ gx: 5, gy: 0 }]);
	});

	it("replaces the exit a pick names by index", () => {
		store().updateAction(
			"2B01",
			1,
			{
				kind: "finishExit",
				time: parseSimTime("06:40"),
				exits: [
					{ gx: 1, gy: 1 },
					{ gx: 2, gy: 2 },
				],
			},
			null,
		);
		store().beginCellPick({
			serviceRef: "2B01",
			actionIndex: 1,
			field: "exit",
			exitIndex: 0,
		});
		store().completeCellPick({ gx: 9, gy: 9 }, null);

		const action = store().timetable.services[1].actions[1];
		if (action.kind !== "finishExit") throw new Error("wrong kind");
		expect(action.exits).toEqual([
			{ gx: 9, gy: 9 },
			{ gx: 2, gy: 2 },
		]);
	});

	it("leaves an action of the wrong kind untouched", () => {
		// The action changed under the gesture; writing a `rear` onto a finish
		// would be worse than doing nothing.
		store().beginCellPick({
			serviceRef: "1A01",
			actionIndex: 1,
			field: "rear",
		});
		store().completeCellPick({ gx: 3, gy: 3 }, null);
		expect(store().timetable.services[0].actions[1]).toEqual({
			kind: "finishNewService",
			time: parseSimTime("06:30"),
			nextRef: "2B01",
		});
	});

	it("does nothing when no pick is armed", () => {
		const before = store().timetable;
		store().completeCellPick({ gx: 1, gy: 1 }, null);
		expect(store().timetable).toBe(before);
	});

	it("abandons the pick when the editor closes", () => {
		store().setOpen(true);
		store().beginCellPick({
			serviceRef: "1A01",
			actionIndex: 0,
			field: "rear",
		});
		store().setOpen(false);
		expect(store().pendingCellPick).toBeNull();
	});
});
