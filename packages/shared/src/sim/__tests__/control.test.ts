import { describe, expect, it } from "vitest";
import {
	addTrain,
	cell,
	engineFor,
	frontCell,
	line,
	nameCells,
	runFor,
	service,
	t,
	timetable,
} from "./fixtures";

describe("signaller train control", () => {
	it("takes control of a moving train without braking, holds speed to signallerSpeedKmh, stops, moves forwards, and restores timetable", () => {
		const map = line("X--P--X");
		nameCells(map, [3], "Ashfield");
		const tt = timetable([
			service(
				"1A01",
				[
					{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
					{
						kind: "stop",
						location: "Ashfield",
						arrive: t("06:05"),
						depart: t("06:06"),
					},
					{ kind: "finishExit", time: t("06:10"), exits: [cell(6)] },
				],
				{
					train: {
						startSpeedKmh: 60,
						maxSpeedKmh: 120,
						signallerSpeedKmh: 40,
						massTonnes: 200,
						brakeForceTonnes: 100,
						powerKw: 2000,
					},
				},
			),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 1);

		const train = engine.state.trains[0];
		expect(train.status).toBe("running");

		expect(engine.handle({ type: "takeControl", trainId: train.id })).toEqual({
			ok: true,
		});
		expect(train.control.mode).toBe("signaller");
		if (train.control.mode === "signaller") {
			expect(train.control.order.kind).toBe("move");
			expect(train.control.restoreLocation).toBeNull();
		}
		expect(engine.handle({ type: "takeControl", trainId: train.id }).ok).toBe(
			false,
		);

		// Keeps moving under signaller control, capped at 40 km/h, and ignores Ashfield stop.
		runFor(engine, 15);
		expect(train.speed * 3.6).toBeLessThanOrEqual(40.1);
		expect(train.speed).toBeGreaterThan(5);

		// Cannot restore timetable control while moving.
		expect(
			engine.handle({ type: "restoreTimetable", trainId: train.id }).ok,
		).toBe(false);

		// Ordered to stop: decelerates smoothly to rest with wait: "signaller".
		expect(engine.handle({ type: "stop", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 25);
		expect(train.speed).toBe(0);
		expect(train.status).toBe("waiting");
		expect(train.wait).toBe("signaller");

		// Move forwards accelerates again, then stop halts again.
		expect(engine.handle({ type: "moveForwards", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 5);
		expect(train.speed).toBeGreaterThan(1);
		expect(engine.handle({ type: "stop", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 25);
		expect(train.speed).toBe(0);

		// Restoring timetable control en route works once stopped and releases speed cap.
		expect(
			engine.handle({ type: "restoreTimetable", trainId: train.id }),
		).toEqual({ ok: true });
		expect(train.control.mode).toBe("timetable");
		expect(train.wait).toBeNull();
		expect(
			engine.handle({ type: "restoreTimetable", trainId: train.id }).ok,
		).toBe(false);
	});

	it("only restores timetable control at the station where signaller control was taken", () => {
		const map = line("X--P--P--X");
		nameCells(map, [3], "Ashfield");
		nameCells(map, [6], "Barton");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(2), front: cell(3) },
				{
					kind: "stop",
					location: "Ashfield",
					arrive: t("06:00"),
					depart: t("06:05"),
				},
				{
					kind: "stop",
					location: "Barton",
					arrive: t("06:08"),
					depart: t("06:09"),
				},
				{ kind: "finishExit", time: t("06:15"), exits: [cell(9)] },
			]),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 1);

		const train = engine.state.trains[0];
		expect(train.working.at).toBe("Ashfield");
		expect(engine.handle({ type: "takeControl", trainId: train.id })).toEqual({
			ok: true,
		});
		expect(engine.view().trains[0].canRestoreTimetable).toBe(true);

		// Step two elements off Ashfield (now occupying cells 4 and 5, gx=5): cannot restore away from Ashfield.
		expect(engine.handle({ type: "stepForward", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 35);
		expect(engine.handle({ type: "stepForward", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 35);
		expect(train.speed).toBe(0);
		expect(frontCell(engine, train).gx).toBe(5);
		expect(engine.view().trains[0].canRestoreTimetable).toBe(false);
		expect(
			engine.handle({ type: "restoreTimetable", trainId: train.id }),
		).toEqual({
			ok: false,
			message: "Return train to Ashfield before restoring timetable control.",
		});

		// Reverse (now front at gx=4 facing left), step past Ashfield to gx=2 (occupying 3 and 2), reverse to original facing (front at gx=3), then restore.
		engine.handle({ type: "changeDirection", trainId: train.id });
		engine.handle({ type: "stepForward", trainId: train.id });
		runFor(engine, 35);
		expect(frontCell(engine, train).gx).toBe(3);
		engine.handle({ type: "stepForward", trainId: train.id });
		runFor(engine, 35);
		expect(frontCell(engine, train).gx).toBe(2);
		engine.handle({ type: "changeDirection", trainId: train.id });
		expect(frontCell(engine, train).gx).toBe(3);
		expect(
			engine.handle({ type: "restoreTimetable", trainId: train.id }),
		).toEqual({ ok: true });
		expect(train.status).toBe("dwelling");
	});

	it("supports startNew with signallerControl: true for on-track and exit starts", () => {
		const map = line("X--P--X");
		nameCells(map, [3], "Ashfield");
		const tt = timetable([
			service("1A01", [
				{
					kind: "startNew",
					time: t("06:00"),
					rear: cell(2),
					front: cell(3),
					signallerControl: true,
				},
				{ kind: "finishExit", time: t("06:10"), exits: [cell(6)] },
			]),
			service("1B02", [
				{
					kind: "startNew",
					time: t("06:00"),
					rear: cell(0),
					front: cell(1),
					signallerControl: true,
				},
				{ kind: "finishExit", time: t("06:12"), exits: [cell(6)] },
			]),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 1);

		const onTrack = engine.state.trains.find((tr) => tr.headcode === "1A01");
		const fromExit = engine.state.trains.find((tr) => tr.headcode === "1B02");
		expect(onTrack).toBeDefined();
		expect(fromExit).toBeDefined();
		expect(onTrack?.control.mode).toBe("signaller");
		if (onTrack?.control.mode === "signaller") {
			expect(onTrack.control.order.kind).toBe("stop");
		}
		expect(onTrack?.status).toBe("waiting");
		expect(onTrack?.wait).toBe("signaller");
		runFor(engine, 5);
		expect(onTrack?.speed).toBe(0);
		expect(fromExit?.control.mode).toBe("signaller");
		if (fromExit?.control.mode === "signaller") {
			expect(fromExit.control.order.kind).toBe("move");
		}
		expect(fromExit?.segs.length).toBeGreaterThan(0);
	});

	it("reverses a stationary train under signaller control and rejects invalid reversals", () => {
		const map = line("X----X");
		const engine = engineFor(map);
		const train = addTrain(engine, cell(2), cell(3));
		engine.handle({ type: "run" });

		// Refused without signaller control.
		expect(
			engine.handle({ type: "changeDirection", trainId: train.id }).ok,
		).toBe(false);

		engine.handle({ type: "takeControl", trainId: train.id });
		engine.handle({ type: "moveForwards", trainId: train.id });
		runFor(engine, 2);

		// Refused while moving.
		expect(train.speed).toBeGreaterThan(0);
		expect(
			engine.handle({ type: "changeDirection", trainId: train.id }).ok,
		).toBe(false);

		engine.handle({ type: "stop", trainId: train.id });
		runFor(engine, 25);
		expect(train.speed).toBe(0);

		const beforeExit = train.segs[train.segs.length - 1].exit;
		expect(
			engine.handle({ type: "changeDirection", trainId: train.id }),
		).toEqual({ ok: true });
		const afterExit = train.segs[train.segs.length - 1].exit;
		expect(afterExit).not.toBe(beforeExit);
	});

	it("steps forward one element at low speed and stops, refusing blocked paths", () => {
		const map = line("X-->--X");
		const engine = engineFor(map);
		const train = addTrain(engine, cell(1), cell(2));
		engine.handle({ type: "run" });
		engine.handle({ type: "stop", trainId: train.id }); // fails before takeControl
		expect(engine.handle({ type: "stepForward", trainId: train.id }).ok).toBe(
			false,
		);

		// Let train reach the red signal at gx=3 and stop there.
		runFor(engine, 15);
		expect(train.speed).toBe(0);
		expect(train.wait).toBe("signal");

		engine.handle({ type: "takeControl", trainId: train.id });
		// Refuses stepping past a red signal.
		expect(engine.handle({ type: "stepForward", trainId: train.id })).toEqual({
			ok: false,
			message: "Cannot step forward past a red signal.",
		});

		// Once signal clears (route set), wait refreshes to "signaller" and stepForward works.
		expect(
			engine.handle({
				type: "setRoute",
				from: cell(3),
				to: cell(6),
				kind: "preferred",
			}).ok,
		).toBe(true);
		runFor(engine, 1);
		expect(train.wait).toBe("signaller");

		expect(frontCell(engine, train).gx).toBe(2);
		expect(engine.handle({ type: "stepForward", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 40);
		expect(frontCell(engine, train).gx).toBe(3);
		expect(train.speed).toBe(0);
		expect(train.status).toBe("waiting");
		expect(train.wait).toBe("signaller");
		expect(train.control.mode).toBe("signaller");
		if (train.control.mode === "signaller") {
			expect(train.control.order.kind).toBe("stop");
		}
	});

	it("authorises passing a red signal without recording a SPAD and updates wait after reversing onto a red", () => {
		const map = line("X-->--X");
		const engine = engineFor(map);
		const train = addTrain(engine, cell(1), cell(2));
		engine.handle({ type: "run" });
		runFor(engine, 15);
		expect(train.status).toBe("waiting");
		expect(train.wait).toBe("signal");

		// Cannot pass red before taking signaller control.
		expect(engine.handle({ type: "passRed", trainId: train.id }).ok).toBe(
			false,
		);

		engine.handle({ type: "takeControl", trainId: train.id });
		expect(train.wait).toBe("signal");
		expect(engine.handle({ type: "passRed", trainId: train.id })).toEqual({
			ok: true,
		});
		runFor(engine, 20);
		expect(engine.state.counters.spads).toBe(0);
		expect(frontCell(engine, train).gx).toBeGreaterThanOrEqual(3);

		engine.handle({ type: "stop", trainId: train.id });
		runFor(engine, 25);
		expect(engine.handle({ type: "passRed", trainId: train.id }).ok).toBe(
			false,
		);
	});

	it("updates wait immediately when reversing onto a red signal under signaller stop", () => {
		const map = line("X--<--X");
		const engine = engineFor(map);
		const train = addTrain(engine, cell(4), cell(5));
		engine.handle({ type: "run" });
		engine.handle({ type: "takeControl", trainId: train.id });
		engine.handle({ type: "stop", trainId: train.id });
		runFor(engine, 25);
		expect(train.speed).toBe(0);
		expect(train.wait).toBe("signaller");

		// Reversing puts the front at cell(4) right before facing signal at cell(3).
		expect(
			engine.handle({ type: "changeDirection", trainId: train.id }),
		).toEqual({ ok: true });
		runFor(engine, 1);
		expect(train.wait).toBe("signal");
		expect(engine.handle({ type: "passRed", trainId: train.id })).toEqual({
			ok: true,
		});
	});

	it("requires signaller control and a standstill (unless crashed) to remove a train", () => {
		const map = line("X--P--X");
		nameCells(map, [3], "Ashfield");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
				{ kind: "finishRemainHere" },
			]),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 2);

		const train = engine.state.trains[0];
		expect(train.speed).toBeGreaterThan(0);
		// Refused under timetable control.
		expect(engine.handle({ type: "removeTrain", trainId: train.id })).toEqual({
			ok: false,
			message: "Take signaller control before removing a train.",
		});

		// Take control while moving -> still refused until stopped.
		engine.handle({ type: "takeControl", trainId: train.id });
		expect(engine.handle({ type: "removeTrain", trainId: train.id })).toEqual({
			ok: false,
			message: "Train must be stopped before removing it from the railway.",
		});

		engine.handle({ type: "stop", trainId: train.id });
		runFor(engine, 25);
		expect(engine.handle({ type: "removeTrain", trainId: train.id })).toEqual({
			ok: true,
		});
		expect(engine.state.trains).toHaveLength(0);
		expect(engine.state.runs[0].status).toBe("done");
	});

	it("joins two stopped trains only when both are under signaller control", () => {
		const map = line("X------X");
		const engine = engineFor(map);
		const frontTrain = addTrain(engine, cell(4), cell(5));
		const rearTrain = addTrain(engine, cell(2), cell(3));
		engine.handle({ type: "run" });
		// Take control of both immediately while both are stationary at (4,5) and (2,3).
		engine.handle({ type: "takeControl", trainId: frontTrain.id });
		engine.handle({ type: "takeControl", trainId: rearTrain.id });
		expect(frontTrain.speed).toBe(0);
		expect(rearTrain.speed).toBe(0);

		// Restore frontTrain to timetable to test refusal when front is in timetable mode.
		engine.handle({ type: "restoreTimetable", trainId: frontTrain.id });
		expect(
			engine.handle({ type: "signallerJoin", trainId: rearTrain.id }),
		).toEqual({
			ok: false,
			message:
				"The train ahead must be under signaller control before joining.",
		});

		engine.handle({ type: "takeControl", trainId: frontTrain.id });
		engine.handle({
			type: "setReminder",
			trainId: rearTrain.id,
			reminder: "Couple",
		});

		expect(
			engine.handle({ type: "signallerJoin", trainId: rearTrain.id }),
		).toEqual({ ok: true });
		expect(engine.state.trains).toHaveLength(1);
		expect(frontTrain.lengthM).toBe(400);
		expect(frontTrain.massKg).toBe(400_000);
		expect(frontTrain.reminder).toBe("Couple");
		expect(frontTrain.control.mode).toBe("signaller");
		expect(frontTrain.wait).toBe("signaller");
	});

	it("skips timetabled actions only while stopped in timetable mode and never to a finish action", () => {
		const map = line("X--P--P--X");
		nameCells(map, [3], "Ashfield");
		nameCells(map, [6], "Barton");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
				{
					kind: "stop",
					location: "Ashfield",
					arrive: t("06:02"),
					depart: t("06:03"),
				},
				{
					kind: "stop",
					location: "Barton",
					arrive: t("06:05"),
					depart: t("06:06"),
				},
				{ kind: "finishExit", time: t("06:10"), exits: [cell(9)] },
			]),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 2);

		const train = engine.state.trains[0];
		expect(train.speed).toBeGreaterThan(0);
		// Refused while moving.
		expect(
			engine.handle({ type: "skipActions", trainId: train.id, toIndex: 2 }),
		).toEqual({
			ok: false,
			message: "Train must be stopped before skipping timetabled actions.",
		});

		// Let train reach Ashfield and stop.
		runFor(engine, 60);
		expect(train.speed).toBe(0);
		expect(train.status).toBe("dwelling");

		// Refused under signaller control.
		engine.handle({ type: "takeControl", trainId: train.id });
		expect(
			engine.handle({ type: "skipActions", trainId: train.id, toIndex: 2 }),
		).toEqual({
			ok: false,
			message: "Restore timetable control before skipping timetabled actions.",
		});
		engine.handle({ type: "restoreTimetable", trainId: train.id });

		// Refused when jumping directly to a finish action (index 3).
		expect(
			engine.handle({ type: "skipActions", trainId: train.id, toIndex: 3 }),
		).toEqual({
			ok: false,
			message: "Cannot skip directly to a finish action.",
		});

		// Valid skip from index 1 (Ashfield) to index 2 (Barton).
		expect(
			engine.handle({ type: "skipActions", trainId: train.id, toIndex: 2 }),
		).toEqual({ ok: true });
		expect(train.working.index).toBe(2);
		expect(
			engine.handle({ type: "skipActions", trainId: train.id, toIndex: 1 }).ok,
		).toBe(false);
	});

	it("advances to booked follow-on service early at a matching stop without duplicating runs, and sets reminders", () => {
		const map = line("X--P--P--X");
		nameCells(map, [3], "Ashfield");
		nameCells(map, [6], "Barton");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(2), front: cell(3) },
				{
					kind: "stop",
					location: "Ashfield",
					arrive: t("06:00"),
					depart: t("06:02"),
				},
				{
					kind: "stop",
					location: "Barton",
					arrive: t("06:05"),
					depart: t("06:06"),
				},
				{ kind: "finishNewService", time: t("06:10"), nextRef: "2B99" },
			]),
			service(
				"2B99",
				[
					{ kind: "startNewService", time: t("06:10"), fromRef: "1A01" },
					{
						kind: "stop",
						location: "Ashfield",
						arrive: t("06:14"),
						depart: t("06:15"),
					},
					{ kind: "finishExit", time: t("06:20"), exits: [cell(9)] },
				],
				{ description: "Return service" },
			),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 1);
		engine.drainTimetables();

		const train = engine.state.trains[0];
		expect(train.working.at).toBe("Ashfield");
		expect(engine.view().trains[0].followOnServiceRef).toBe("2B99");

		// Set & clear reminder.
		expect(
			engine.handle({
				type: "setReminder",
				trainId: train.id,
				reminder: "  Hold for path  ",
			}),
		).toEqual({ ok: true });
		expect(engine.view().trains[0].reminder).toBe("Hold for path");
		expect(
			engine.handle({
				type: "setReminder",
				trainId: train.id,
				reminder: "   ",
			}),
		).toEqual({ ok: true });
		expect(engine.view().trains[0].reminder).toBeNull();

		// Cannot become follow-on service while under signaller control.
		engine.handle({ type: "takeControl", trainId: train.id });
		expect(
			engine.handle({ type: "becomeNewService", trainId: train.id }).ok,
		).toBe(false);
		engine.handle({ type: "restoreTimetable", trainId: train.id });

		// Become follow-on service 2B99 early at Ashfield and resume at its Ashfield stop.
		expect(
			engine.handle({ type: "becomeNewService", trainId: train.id }),
		).toEqual({ ok: true });
		expect(train.headcode).toBe("2B99");
		expect(train.description).toBe("Return service");
		expect(train.working.ref).toBe("2B99");
		expect(train.working.index).toBe(1);
		expect(train.working.at).toBe("Ashfield");
		expect(train.status).toBe("dwelling");
		expect(engine.state.runs).toHaveLength(1);
		const refreshed = engine.drainTimetables();
		expect(refreshed[train.id]).toBeDefined();
	});

	it("refuses becomeNewService when there is no follow-on or it does not call at current stop", () => {
		const map = line("X--P--P--X");
		nameCells(map, [3], "Ashfield");
		nameCells(map, [6], "Barton");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(2), front: cell(3) },
				{
					kind: "stop",
					location: "Ashfield",
					arrive: t("06:00"),
					depart: t("06:02"),
				},
				{ kind: "finishNewService", time: t("06:10"), nextRef: "2B99" },
			]),
			service("2B99", [
				{ kind: "startNewService", time: t("06:10"), fromRef: "1A01" },
				{
					kind: "stop",
					location: "Barton",
					arrive: t("06:14"),
					depart: t("06:15"),
				},
				{ kind: "finishExit", time: t("06:20"), exits: [cell(9)] },
			]),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 1);

		const train = engine.state.trains[0];
		expect(engine.view().trains[0].followOnServiceRef).toBeNull();
		expect(
			engine.handle({ type: "becomeNewService", trainId: train.id }),
		).toEqual({
			ok: false,
			message: "Follow-on service 2B99 does not call at Ashfield.",
		});
	});

	it("reverses direction when turning short over a skipped changeDirection onto a return service", () => {
		const map = line("X--P--P--X");
		nameCells(map, [3], "Ashfield");
		nameCells(map, [6], "Barton");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(2), front: cell(3) },
				{
					kind: "stop",
					location: "Ashfield",
					arrive: t("06:00"),
					depart: t("06:02"),
				},
				{
					kind: "stop",
					location: "Barton",
					arrive: t("06:05"),
					depart: t("06:06"),
				},
				{ kind: "changeDirection", time: t("06:07") },
				{ kind: "finishNewService", time: t("06:08"), nextRef: "2B99" },
			]),
			service("2B99", [
				{ kind: "startNewService", time: t("06:08"), fromRef: "1A01" },
				{
					kind: "stop",
					location: "Ashfield",
					arrive: t("06:10"),
					depart: t("06:11"),
				},
				{ kind: "finishExit", time: t("06:15"), exits: [cell(0)] },
			]),
		]);
		const engine = engineFor(map, tt);
		engine.handle({ type: "run" });
		runFor(engine, 1);

		const train = engine.state.trains[0];
		expect(frontCell(engine, train).gx).toBe(3);

		// Turn short at Ashfield before Barton & changeDirection: train reverses to face left.
		expect(
			engine.handle({ type: "becomeNewService", trainId: train.id }),
		).toEqual({ ok: true });
		expect(train.headcode).toBe("2B99");
		expect(frontCell(engine, train).gx).toBe(2);

		// Advance past 06:11 departure: train departs left toward cell(0) and exits cleanly.
		runFor(engine, 720);
		expect(engine.state.trains).toHaveLength(0);
		expect(engine.state.counters.unexpectedExits).toBe(0);
	});
});
