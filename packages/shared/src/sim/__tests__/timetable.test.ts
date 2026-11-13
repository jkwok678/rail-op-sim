import { describe, expect, it } from "vitest";
import type { Action } from "../../railway/timetable/types";
import {
	repeatHeadcode,
	timetableEntries,
	timetableStepState,
} from "../timetable";
import {
	cell,
	engineFor,
	line,
	nameCells,
	service,
	t,
	timetable,
} from "./fixtures";

/** Exits at 0 and 6, platforms Ashfield at 2 and Barton at 4. */
function twoStations() {
	const map = line("X-P-P-X");
	nameCells(map, [2], "Ashfield");
	nameCells(map, [4], "Barton");
	return map;
}

/** Exit at 0, a two-cell terminus platform at 3–4, buffers at 5. */
function terminus() {
	const map = line("X--PP]");
	nameCells(map, [3, 4], "Terminus");
	return map;
}

const enter = (time: string, rear = 0, front = 1): Action => ({
	kind: "startNew",
	time: t(time),
	rear: cell(rear),
	front: cell(front),
});

function runLog(
	map: ReturnType<typeof line>,
	tt: ReturnType<typeof timetable>,
	seconds = 3600,
) {
	const engine = engineFor(map, tt);
	engine.handle({ type: "run" });
	engine.advance(seconds);
	return { engine, log: engine.drainLog().map((l) => l.text) };
}

describe("a through service", () => {
	it("enters, calls at each station, and leaves on time", () => {
		const { engine, log } = runLog(
			twoStations(),
			timetable([
				service("1A01", [
					enter("06:00"),
					{
						kind: "stop",
						location: "Ashfield",
						arrive: t("06:01"),
						depart: t("06:02"),
					},
					{
						kind: "stop",
						location: "Barton",
						arrive: t("06:03"),
						depart: t("06:04"),
					},
					{ kind: "finishExit", time: t("06:05"), exits: [cell(6)] },
				]),
			]),
		);
		expect(log).toEqual([
			"06:00:00: 1A01 entered railway at (0, 0)",
			expect.stringMatching(/^06:00:\d\d: 1A01 arrived at Ashfield on time$/),
			"06:02:00: 1A01 departed from Ashfield on time",
			expect.stringMatching(/^06:02:\d\d: 1A01 arrived at Barton on time$/),
			"06:04:00: 1A01 departed from Barton on time",
			expect.stringMatching(
				/^06:04:\d\d: 1A01 left railway at \(6, 0\) on time$/,
			),
		]);
		expect(engine.state.trains).toHaveLength(0);
		expect(engine.state.counters).toMatchObject({
			onTimeArrivals: 2,
			onTimeDeps: 2,
			onTimeExits: 1,
		});
		expect(engine.state.runs[0].status).toBe("done");
	});

	it("passes a location it is booked to pass", () => {
		const { log } = runLog(
			twoStations(),
			timetable([
				service("1A01", [
					enter("06:00"),
					{ kind: "pass", time: t("06:00"), location: "Ashfield" },
					{ kind: "finishExit", time: t("06:05"), exits: [cell(6)] },
				]),
			]),
		);
		expect(log[1]).toMatch(/1A01 passed Ashfield on time$/);
	});

	it("logs a stop it ran past as missed", () => {
		const { engine, log } = runLog(
			twoStations(),
			timetable([
				service("1A01", [
					enter("06:00"),
					{
						kind: "stop",
						location: "Barton",
						arrive: t("06:03"),
						depart: t("06:04"),
					},
					{
						kind: "stop",
						location: "Ashfield",
						arrive: t("06:05"),
						depart: t("06:06"),
					},
					{ kind: "finishExit", time: t("06:10"), exits: [cell(6)] },
				]),
			]),
		);
		expect(log).toContain("06:00:00: 1A01 entered railway at (0, 0)");
		expect(
			log.some((l) => /ERROR: 1A01 missed its stop at Barton/.test(l)),
		).toBe(true);
		expect(engine.state.counters.missedStops).toBe(1);
	});

	it("reports leaving by an exit it was not booked to", () => {
		const { engine } = runLog(
			twoStations(),
			timetable([
				service("1A01", [
					enter("06:00"),
					{ kind: "finishExit", time: t("06:05"), exits: [cell(0)] },
				]),
			]),
		);
		expect(engine.state.counters.incorrectExits).toBe(1);
	});
});

describe("a terminus turnaround", () => {
	it("arrives, becomes the next service, reverses and leaves", () => {
		const { engine, log } = runLog(
			terminus(),
			timetable([
				service("1A01", [
					enter("06:00"),
					{ kind: "stop", location: "Terminus", arrive: t("06:03") },
					{ kind: "finishNewService", time: t("06:05"), nextRef: "2B01" },
				]),
				{
					ref: "2B01",
					description: "Back out",
					actions: [
						{ kind: "startNewService", time: t("06:05"), fromRef: "1A01" },
						{ kind: "changeDirection", time: t("06:06") },
						{ kind: "stop", location: "Terminus", depart: t("06:08") },
						{ kind: "finishExit", time: t("06:12"), exits: [cell(0)] },
					],
				},
			]),
		);
		expect(log).toEqual([
			"06:00:00: 1A01 entered railway at (0, 0)",
			expect.stringMatching(/1A01 arrived at Terminus \d minutes? early$/),
			"06:05:00: 1A01 became new service 2B01 at Terminus",
			"06:06:00: 2B01 changed direction at Terminus",
			"06:08:00: 2B01 departed from Terminus on time",
			expect.stringMatching(
				/2B01 left railway at \(0, 0\) \d+ minutes? early$/,
			),
		]);
		expect(engine.state.trains).toHaveLength(0);
	});

	it("starts a train standing in the platform and keeps the minimum gap", () => {
		const { log } = runLog(
			terminus(),
			timetable([
				service("1A01", [
					enter("06:00", 3, 4),
					{ kind: "stop", location: "Terminus", depart: t("06:00") },
					{ kind: "finishRemainHere" },
				]),
			]),
			120,
		);
		expect(log[0]).toBe("06:00:00: 1A01 created at Terminus");
		// Never before 30 s after the last action.
		expect(log[1]).toBe("06:00:30: 1A01 departed from Terminus on time");
	});
});

describe("repeats and blocked entries", () => {
	it("runs each repeat with its own headcode", () => {
		const { log } = runLog(
			twoStations(),
			timetable([
				service(
					"1A01",
					[
						enter("06:00"),
						{ kind: "finishExit", time: t("06:05"), exits: [cell(6)] },
					],
					{ repeat: { intervalMinutes: 10, headcodeIncrement: 2, count: 1 } },
				),
			]),
		);
		expect(log.filter((l) => l.includes("entered railway"))).toEqual([
			"06:00:00: 1A01 entered railway at (0, 0)",
			"06:10:00: 1A03 entered railway at (0, 0)",
		]);
	});

	it("waits for a blocked entry and reports it once", () => {
		const { engine, log } = runLog(
			twoStations(),
			timetable([
				service("1A01", [enter("06:00", 1, 2), { kind: "finishRemainHere" }]),
				service("1B01", [enter("06:00", 1, 2), { kind: "finishRemainHere" }]),
			]),
			300,
		);
		expect(log.filter((l) => l.includes("unable to start"))).toHaveLength(1);
		expect(engine.state.trains).toHaveLength(1);
	});

	it("advances a headcode's last two digits", () => {
		const svc = service("2C98", [], {
			repeat: { intervalMinutes: 5, headcodeIncrement: 1, count: 3 },
		});
		expect([0, 1, 2, 3].map((r) => repeatHeadcode(svc, r))).toEqual([
			"2C98",
			"2C99",
			"2C00",
			"2C01",
		]);
	});
});

describe("the train list", () => {
	it("says what each train does next", () => {
		const engine = engineFor(
			terminus(),
			timetable([
				service("1A01", [
					enter("06:00", 3, 4),
					{ kind: "stop", location: "Terminus", depart: t("06:05") },
					{ kind: "finishExit", time: t("06:10"), exits: [cell(0)] },
				]),
			]),
		);
		engine.handle({ type: "run" });
		engine.advance(1);
		expect(engine.view().trains[0].next).toBe("dep Terminus 06:05");
		const rows = engine.drainTimetables();
		expect(rows[engine.view().trains[0].id]).toEqual([
			{ time: "06:00", label: "start" },
			{ time: "06:05", label: "dep Terminus" },
			{ time: "06:10", label: "exit" },
		]);
		expect(engine.drainTimetables()).toEqual({});
		expect(
			timetableEntries(
				rows[engine.view().trains[0].id],
				engine.view().trains[0],
			).map((e) => e.state),
		).toEqual(["done", "next", "upcoming"]);
		engine.advance(400);
		expect(engine.view().trains[0].next).toBe("exit 06:10");
		expect(engine.drainTimetables()).toEqual({});
		expect(
			timetableEntries(
				rows[engine.view().trains[0].id],
				engine.view().trains[0],
			).map((e) => e.state),
		).toEqual(["done", "done", "next"]);
	});
});

describe("timetableStepState", () => {
	it("marks passed steps done and the current step next", () => {
		expect(timetableStepState(0, 1, false, "running")).toBe("done");
		expect(timetableStepState(1, 1, false, "running")).toBe("next");
		expect(timetableStepState(2, 1, false, "running")).toBe("upcoming");
	});

	it("has no next step once crashed", () => {
		expect(timetableStepState(1, 1, false, "crashed")).toBe("upcoming");
	});

	it("finishes every step when the working is done and the train finished", () => {
		expect(timetableStepState(2, 1, true, "finished")).toBe("done");
		expect(timetableStepState(2, 1, true, "running")).toBe("upcoming");
	});
});
