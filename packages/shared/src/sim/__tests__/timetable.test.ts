import { describe, expect, it } from "vitest";
import { defined } from "../../railway/__tests__/test-helpers";
import type { Action } from "../../railway/timetable/types";
import {
	repeatHeadcode,
	timetableEntries,
	timetableStepState,
} from "../timetable";
import {
	CELL,
	cell,
	engineFor,
	frontCell,
	line,
	nameCells,
	passingLoop,
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
		expect(defined(engine.state.runs[0], "runs[0]").status).toBe("done");
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
		expect(defined(engine.view().trains[0], "trains[0]").next).toBe(
			"dep Terminus 06:05",
		);
		const rows = engine.drainTimetables();
		expect(rows[defined(engine.view().trains[0], "trains[0]").id]).toEqual([
			{ time: "06:00", label: "start" },
			{ time: "06:05", label: "dep Terminus" },
			{ time: "06:10", label: "exit" },
		]);
		expect(engine.drainTimetables()).toEqual({});
		expect(
			timetableEntries(
				defined(
					rows[defined(engine.view().trains[0], "engine.view().trains[0]").id],
					"timetable rows",
				),
				defined(engine.view().trains[0], "trains[0]"),
			).map((e) => e.state),
		).toEqual(["done", "next", "upcoming"]);
		engine.advance(400);
		expect(defined(engine.view().trains[0], "trains[0]").next).toBe(
			"exit 06:10",
		);
		expect(engine.drainTimetables()).toEqual({});
		expect(
			timetableEntries(
				defined(
					rows[defined(engine.view().trains[0], "engine.view().trains[0]").id],
					"timetable rows",
				),
				defined(engine.view().trains[0], "trains[0]"),
			).map((e) => e.state),
		).toEqual(["done", "done", "next"]);
	});
});

/** Four platform cells named Bay, buffers beyond them: room for both portions. */
function bay() {
	const map = line("XPPPP]");
	nameCells(map, [1, 2, 3, 4], "Bay");
	return map;
}

/** A portion service that stays where the split left it. */
function portion(ref: string, fromRef: string) {
	return service(
		ref,
		[
			{ kind: "startFromSplit", time: t("06:00"), fromRef },
			{ kind: "finishRemainHere" },
		],
		{ train: undefined },
	);
}

describe("splits and joins", () => {
	it("splits the front off onto the cells ahead and halves the train", () => {
		const { engine, log } = runLog(
			bay(),
			timetable([
				service("1A01", [
					enter("06:00", 1, 2),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
			]),
			60,
		);
		const rear = engine.state.trains.find((tr) => tr.headcode === "1A01");
		const front = engine.state.trains.find((tr) => tr.headcode === "2B01");
		if (!rear || !front)
			throw new Error("the split did not create both portions");
		expect(frontCell(engine, rear).gx).toBe(2);
		expect(frontCell(engine, front).gx).toBe(4);
		expect(rear.massKg).toBe(100_000);
		expect(front.massKg).toBe(100_000);
		expect(front.powerW).toBe(rear.powerW);
		expect(front.brakeRate).toBe(rear.brakeRate);
		expect(rear.lengthM).toBe(100);
		expect(front.lengthM).toBe(100);
		expect(log).toContain(
			"06:00:30: 1A01 split mass%-Power% = 50-50 from front to 2B01 at Bay",
		);
		expect(log).toContain("06:00:30: 2B01 created at Bay");
	});

	it("splits the rear off and leaves the continuing train at the front", () => {
		const { engine, log } = runLog(
			bay(),
			timetable([
				service("1A01", [
					enter("06:00", 1, 2),
					{ kind: "rearSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
			]),
			60,
		);
		const rear = engine.state.trains.find((tr) => tr.headcode === "2B01");
		const front = engine.state.trains.find((tr) => tr.headcode === "1A01");
		if (!rear || !front)
			throw new Error("the split did not create both portions");
		expect(frontCell(engine, rear).gx).toBe(2);
		expect(frontCell(engine, front).gx).toBe(4);
		expect(log).toContain(
			"06:00:30: 1A01 split mass%-Power% = 50-50 from rear to 2B01 at Bay",
		);
	});

	it("holds a split where the location has no room for two trains", () => {
		const map = line("XPP");
		nameCells(map, [1, 2], "Short");
		const { engine, log } = runLog(
			map,
			timetable([
				service("1A01", [
					enter("06:00", 1, 2),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
			]),
			120,
		);
		expect(engine.state.trains).toHaveLength(1);
		expect(
			log.filter((l) => l.includes("failed to split - location too short")),
		).toEqual([
			"06:00:30 ERROR: 1A01 failed to split - location too short at Short",
		]);
	});

	it("holds a split while another train stands on the cells it needs", () => {
		const { engine, log } = runLog(
			bay(),
			timetable([
				service("1A01", [
					enter("06:00", 1, 2),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
				service("1C01", [enter("06:00", 3, 4), { kind: "finishRemainHere" }]),
			]),
			120,
		);
		expect(engine.state.trains.map((tr) => tr.headcode).sort()).toEqual([
			"1A01",
			"1C01",
		]);
		expect(log.filter((l) => l.includes("unable to split"))).toEqual([
			"06:00:30 WARNING: 1A01 unable to split - other train obstructing at Bay",
		]);
	});

	it("lets the front portion leave before the rear when the dwell is long", () => {
		const map = line("X-PPPP]");
		nameCells(map, [2, 3, 4, 5], "Bay");
		const depart = {
			kind: "stop" as const,
			location: "Bay",
			depart: t("06:00"),
			minDwellSeconds: 120,
		};
		const { log } = runLog(
			map,
			timetable([
				service("1A01", [
					enter("06:00"),
					{ kind: "stop", location: "Bay", arrive: t("06:00") },
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					depart,
					{ kind: "finishRemainHere" },
				]),
				service(
					"2B01",
					[
						{ kind: "startFromSplit", time: t("06:00"), fromRef: "1A01" },
						depart,
						{ kind: "finishRemainHere" },
					],
					{ train: undefined },
				),
			]),
			600,
		);
		const at = (headcode: string) => {
			const entry = log.find((l) =>
				l.includes(`${headcode} departed from Bay`),
			);
			if (!entry) throw new Error(log.join("\n"));
			const [h = 0, m = 0, s = 0] = entry.slice(0, 8).split(":").map(Number);
			return h * 3600 + m * 60 + s;
		};
		expect(at("1A01") - at("2B01")).toBe(30);
	});

	it("couples an adjacent train on and drops it from the railway", () => {
		const { engine, log } = runLog(
			bay(),
			timetable([
				service("1A01", [
					enter("06:00", 1, 2),
					{ kind: "joinedBy", time: t("06:00"), otherRef: "1B01" },
					{ kind: "finishRemainHere" },
				]),
				service("1B01", [
					enter("06:00", 3, 4),
					{ kind: "finishJoin", time: t("06:00"), otherRef: "1A01" },
				]),
			]),
			60,
		);
		expect(engine.state.trains.map((tr) => tr.headcode)).toEqual(["1A01"]);
		expect(defined(engine.state.trains[0], "trains[0]").massKg).toBe(400_000);
		expect(defined(engine.state.trains[0], "trains[0]").powerW).toBe(4_000_000);
		expect(engine.state.runs.find((r) => r.ref === "1B01")?.status).toBe(
			"done",
		);
		expect(log).toContain("06:00:30: 1A01 joined by 1B01 at Bay");
	});

	it("counts a split the train ran past as a missed event", () => {
		const { engine, log } = runLog(
			twoStations(),
			timetable([
				service("1A01", [
					enter("06:00"),
					{ kind: "frontSplit", time: t("06:01"), newRef: "2B01" },
					{ kind: "finishExit", time: t("06:05"), exits: [cell(6)] },
				]),
				portion("2B01", "1A01"),
			]),
		);
		expect(engine.state.counters.otherMissedEvents).toBe(1);
		expect(log.some((l) => /ERROR: 1A01 failed to split at/.test(l))).toBe(
			true,
		);
	});

	it("halves lengthM on split and restores it when joined again", () => {
		const map = line("X-PPPPPP]");
		nameCells(map, [2, 3, 4, 5, 6, 7], "Bay");
		const { engine } = runLog(
			map,
			timetable([
				service("1A01", [
					enter("06:00", 2, 3),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "joinedBy", time: t("06:02"), otherRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				service(
					"2B01",
					[
						{ kind: "startFromSplit", time: t("06:00"), fromRef: "1A01" },
						{ kind: "finishJoin", time: t("06:02"), otherRef: "1A01" },
					],
					{ train: undefined },
				),
			]),
			180,
		);
		expect(engine.state.trains).toHaveLength(1);
		expect(defined(engine.state.trains[0], "trains[0]").lengthM).toBe(200);
	});

	it("resets extraDwell when setting off so the next stop uses normal dwell", () => {
		const map = line("X-PPPP--P-X");
		nameCells(map, [2, 3, 4, 5], "Bay");
		nameCells(map, [8], "Park");
		const { log } = runLog(
			map,
			timetable([
				service("1A01", [
					enter("06:00"),
					{ kind: "stop", location: "Bay", arrive: t("06:00") },
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{
						kind: "stop",
						location: "Bay",
						depart: t("06:00"),
						minDwellSeconds: 120,
					},
					{
						kind: "stop",
						location: "Park",
						arrive: t("06:00"),
						depart: t("06:00"),
						minDwellSeconds: 30,
					},
					{ kind: "finishExit", time: t("06:20"), exits: [cell(10)] },
				]),
				service(
					"2B01",
					[
						{ kind: "startFromSplit", time: t("06:00"), fromRef: "1A01" },
						{ kind: "stop", location: "Bay", depart: t("06:00") },
						{ kind: "finishExit", time: t("06:20"), exits: [cell(10)] },
					],
					{ train: undefined },
				),
			]),
			600,
		);
		const sec = (pattern: RegExp) => {
			const entry = log.find((l) => pattern.test(l));
			if (!entry) throw new Error(`Missing log ${pattern}:\n${log.join("\n")}`);
			const [h = 0, m = 0, s = 0] = entry.slice(0, 8).split(":").map(Number);
			return h * 3600 + m * 60 + s;
		};
		const parkArr = sec(/1A01 arrived at Park/);
		const parkDep = sec(/1A01 departed from Park/);
		expect(parkDep - parkArr).toBe(30);
	});

	it("merges signallerMaxSpeed, reminder, lengthM, and releases partner routes on couple", () => {
		const map = line("X--PPPP]");
		nameCells(map, [3, 4, 5, 6], "Bay");
		const engine = engineFor(
			map,
			timetable([
				service("1A01", [
					enter("06:00", 3, 4),
					{ kind: "joinedBy", time: t("06:00"), otherRef: "1B01" },
					{ kind: "finishRemainHere" },
				]),
				service("1B01", [
					enter("06:00", 5, 6),
					{ kind: "finishJoin", time: t("06:00"), otherRef: "1A01" },
				]),
			]),
		);
		engine.handle({ type: "run" });
		engine.advance(1);
		const lead = engine.state.trains.find((tr) => tr.headcode === "1A01");
		const partner = engine.state.trains.find((tr) => tr.headcode === "1B01");
		if (!lead || !partner) throw new Error("both trains expected");
		engine.state.routes.push({
			id: "r1",
			kind: "unrestricted",
			segs: [...partner.segs],
		});
		partner.signallerMaxSpeed = 50 / 3.6;
		engine.handle({
			type: "setReminder",
			trainId: partner.id,
			reminder: "Rear portion",
		});
		engine.advance(60);
		expect(engine.state.trains).toHaveLength(1);
		expect(lead.lengthM).toBe(400);
		expect(lead.signallerMaxSpeed).toBeCloseTo(50 / 3.6);
		expect(lead.reminder).toBe("Rear portion");
		expect(engine.state.routes).toHaveLength(0);
	});

	it("dwells an approaching finishJoin train behind its partner and couples (unobstructed)", () => {
		const map = line("X--PPPP]");
		nameCells(map, [3, 4, 5, 6], "Bay");
		const { engine, log } = runLog(
			map,
			timetable([
				service("1A01", [
					enter("06:00", 5, 6),
					{ kind: "joinedBy", time: t("06:00"), otherRef: "1B01" },
					{ kind: "finishRemainHere" },
				]),
				service("1B01", [
					enter("06:00", 0, 1),
					{ kind: "finishJoin", time: t("06:00"), otherRef: "1A01" },
				]),
			]),
			120,
		);
		expect(engine.state.trains.map((tr) => tr.headcode)).toEqual(["1A01"]);
		expect(log.some((l) => /1A01 joined by 1B01 at Bay/.test(l))).toBe(true);
	});

	it("lets a finishJoin train call on (§5.13) past a protecting red signal to couple in an occupied platform", () => {
		const map = line("X-<-PPPP]".replace("<", ">"));
		nameCells(map, [4, 5, 6, 7], "Bay");
		const engine = engineFor(
			map,
			timetable([
				service("1A01", [
					enter("06:00", 6, 7),
					{ kind: "joinedBy", time: t("06:00"), otherRef: "2B02" },
					{ kind: "finishRemainHere" },
				]),
				service("2B02", [
					enter("06:00", 0, 1),
					{ kind: "stop", location: "Bay", arrive: t("06:00") },
					{ kind: "finishJoin", time: t("06:00"), otherRef: "1A01" },
				]),
			]),
		);
		engine.handle({ type: "run" });
		engine.advance(60);
		const second = engine.view().trains.find((tr) => tr.headcode === "2B02");
		expect(second?.wait).toBe("signal");
		expect(second?.callingOnAllowed).toBe(true);

		expect(engine.handle({ type: "callOn", at: cell(2) })).toEqual({
			ok: true,
		});
		engine.advance(150);
		expect(engine.state.trains.map((tr) => tr.headcode)).toEqual(["1A01"]);
		expect(engine.state.counters.spads).toBe(0);
		expect(engine.state.counters.crashedTrains).toBe(0);
		const log = engine.drainLog().map((l) => l.text);
		expect(log.some((l) => /1A01 joined by 2B02 at Bay/.test(l))).toBe(true);
	});

	it("holds a split while points ahead lie against it, then splits once points are thrown", () => {
		const map = passingLoop();
		for (const gx of [3, 4, 6]) {
			const tr = map.getTrackAt(gx * CELL, 0);
			if (tr && tr.data.kind === "straight") tr.data.platform1 = true;
		}
		nameCells(map, [3, 4, 5, 6], "Loop");
		const engine = engineFor(
			map,
			timetable([
				service("1A01", [
					enter("06:00", 3, 4),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
			]),
		);
		engine.handle({ type: "run" });
		expect(engine.handle({ type: "togglePoints", at: cell(5) })).toEqual({
			ok: true,
		});
		engine.advance(45);
		expect(engine.state.trains).toHaveLength(1);
		let log = engine.drainLog().map((l) => l.text);
		expect(log.filter((l) => l.includes("unable to split"))).toEqual([
			"06:00:30 WARNING: 1A01 unable to split - points set wrongly at Loop",
		]);

		expect(engine.handle({ type: "togglePoints", at: cell(5) })).toEqual({
			ok: true,
		});
		engine.advance(30);
		expect(engine.state.trains.map((tr) => tr.headcode).sort()).toEqual([
			"1A01",
			"2B01",
		]);
		log = engine.drainLog().map((l) => l.text);
		expect(
			log.some((l) =>
				l.includes(
					"1A01 split mass%-Power% = 50-50 from front to 2B01 at Loop",
				),
			),
		).toBe(true);
	});

	it("uses the straddle and behind split layouts when space ahead is limited", () => {
		// straddle: 1 named cell ahead (cell 4) and 1 named cell behind (cell 1)
		const straddleMap = line("XPPPP]");
		nameCells(straddleMap, [1, 2, 3, 4], "Bay");
		const straddled = runLog(
			straddleMap,
			timetable([
				service("1A01", [
					enter("06:00", 2, 3),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
			]),
			60,
		);
		const sRear = straddled.engine.state.trains.find(
			(tr) => tr.headcode === "1A01",
		);
		const sFront = straddled.engine.state.trains.find(
			(tr) => tr.headcode === "2B01",
		);
		if (!sRear || !sFront) throw new Error("straddle split missing portion");
		expect(frontCell(straddled.engine, sRear).gx).toBe(2);
		expect(frontCell(straddled.engine, sFront).gx).toBe(4);

		// behind: 0 cells ahead (against buffer 5]), 2 named cells behind (1, 2)
		const behindMap = line("XPPPP]");
		nameCells(behindMap, [1, 2, 3, 4], "Bay");
		const behindRun = runLog(
			behindMap,
			timetable([
				service("1A01", [
					enter("06:00", 3, 4),
					{ kind: "frontSplit", time: t("06:00"), newRef: "2B01" },
					{ kind: "finishRemainHere" },
				]),
				portion("2B01", "1A01"),
			]),
			60,
		);
		const bRear = behindRun.engine.state.trains.find(
			(tr) => tr.headcode === "1A01",
		);
		const bFront = behindRun.engine.state.trains.find(
			(tr) => tr.headcode === "2B01",
		);
		if (!bRear || !bFront) throw new Error("behind split missing portion");
		expect(frontCell(behindRun.engine, bRear).gx).toBe(2);
		expect(frontCell(behindRun.engine, bFront).gx).toBe(4);
	});
});

describe("shuttles", () => {
	const shuttleRepeat = {
		intervalMinutes: 10,
		headcodeIncrement: 1,
		count: 1,
	};

	it("introduces one train, repeats it, then terminates", () => {
		const { engine, log } = runLog(
			bay(),
			timetable([
				service(
					"1A01",
					[
						{
							kind: "startNewShuttle",
							time: t("06:00"),
							rear: cell(1),
							front: cell(2),
							otherRef: "1A01",
						},
						{
							kind: "finishShuttleRemainHere",
							time: t("06:10"),
							otherRef: "1A01",
						},
					],
					{ repeat: shuttleRepeat },
				),
			]),
			1500,
		);
		expect(engine.state.runs).toHaveLength(1);
		expect(log).toContain("06:10:00: 1A01 became new service 1A02 at Bay");
		expect(log).toContain("06:20:00: 1A02 terminated at Bay");
		expect(engine.state.trains).toHaveLength(1);
	});

	it("hands a feeder over to the shuttle it names", () => {
		const { log } = runLog(
			bay(),
			timetable([
				service("1A00", [
					enter("06:00", 1, 2),
					{ kind: "finishToShuttle", time: t("06:00"), nextRef: "1A01" },
				]),
				service(
					"1A01",
					[
						{
							kind: "startShuttle",
							time: t("06:00"),
							fromRef: "1A00",
							otherRef: "1A02",
						},
						{ kind: "stop", location: "Bay", depart: t("06:05") },
						{ kind: "finishRemainHere" },
					],
					{ train: undefined },
				),
			]),
			120,
		);
		expect(log).toContain("06:00:30: 1A00 became new service 1A01 at Bay");
	});

	it("forms the non-repeating service after the last repeat", () => {
		const { log } = runLog(
			bay(),
			timetable([
				service(
					"1A01",
					[
						{
							kind: "startNewShuttle",
							time: t("06:00"),
							rear: cell(1),
							front: cell(2),
							otherRef: "1A01",
						},
						{
							kind: "finishShuttleNewService",
							time: t("06:10"),
							otherRef: "1A01",
							nextRef: "1B01",
						},
					],
					{ repeat: shuttleRepeat },
				),
				service(
					"1B01",
					[
						{
							kind: "startFromShuttle",
							time: t("06:20"),
							fromRef: "1A01",
						},
						{ kind: "finishRemainHere" },
					],
					{ train: undefined },
				),
			]),
			1500,
		);
		expect(log).toContain("06:10:00: 1A01 became new service 1A02 at Bay");
		expect(log).toContain("06:20:00: 1A02 became new service 1B01 at Bay");
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
