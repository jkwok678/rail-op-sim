import { describe, expect, it } from "vitest";
import { createEngine } from "../engine";
import { cell, line, nameCells, service, t, timetable } from "./fixtures";

/**
 * Signal at cell 2 protecting a 4-cell platform named Bay (cells 4..7) ending
 * at buffers (cell 8):
 * 0[ - 1 - 2(>) - 3 - 4(Bay) - 5(Bay) - 6(Bay) - 7(Bay) - 8]
 */
function approachMap() {
	const map = line("--<-PPPP]".replace("<", ">"));
	nameCells(map, [4, 5, 6, 7], "Bay");
	return map;
}

describe("calling on (§5.13)", () => {
	it("flags a train stopped at red when an occupied platform lies ahead, and lets it call on at 30 km/h", () => {
		const map = approachMap();
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(6), front: cell(7) },
				{ kind: "stop", arrive: t("06:00"), location: "Bay" },
				{ kind: "finishRemainHere" },
			]),
			service("2B02", [
				{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
				{ kind: "stop", arrive: t("06:05"), location: "Bay" },
				{ kind: "finishRemainHere" },
			]),
		]);

		const engine = createEngine({ map, timetable: tt });
		engine.handle({ type: "run" });
		engine.advance(60);

		const second = engine.view().trains.find((tr) => tr.headcode === "2B02");
		expect(second?.status).toBe("waiting");
		expect(second?.wait).toBe("signal");
		expect(second?.callingOnAllowed).toBe(true);

		const res = engine.handle({ type: "callOn", at: cell(2) });
		expect(res).toEqual({ ok: true });

		const sig = engine.view().signals.find((s) => s.gx === 2);
		expect(sig?.callingOn).toBe(true);
		expect(sig?.aspect).toBe(0);
		expect(engine.view().routes.some((r) => r.kind === "unrestricted")).toBe(
			true,
		);

		let peakKmh = 0;
		for (let i = 0; i < 40; i++) {
			engine.advance(1);
			const view = engine.view().trains.find((tr) => tr.headcode === "2B02");
			if (view) peakKmh = Math.max(peakKmh, view.speedKmh);
		}
		expect(peakKmh).toBeGreaterThan(0);
		expect(peakKmh).toBeLessThanOrEqual(30.05);
		expect(engine.state.counters.spads).toBe(0);

		engine.advance(120);
		expect(engine.state.counters.crashedTrains).toBe(0);
		const log = engine.drainLog().map((l) => l.text);
		expect(log.some((l) => l.includes("2B02 arrived at Bay"))).toBe(true);
		expect(engine.view().signals.find((s) => s.gx === 2)?.callingOn).toBe(
			false,
		);
	});

	it("does not allow calling-on when no train blocks the platform", () => {
		const map = approachMap();
		const tt = timetable([
			service("2B02", [
				{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
				{ kind: "stop", arrive: t("06:05"), location: "Bay" },
				{ kind: "finishRemainHere" },
			]),
		]);
		const engine = createEngine({ map, timetable: tt });
		engine.handle({ type: "run" });
		engine.advance(60);

		const second = engine.view().trains.find((tr) => tr.headcode === "2B02");
		expect(second?.wait).toBe("signal");
		expect(second?.callingOnAllowed).toBe(false);
		expect(engine.handle({ type: "callOn", at: cell(2) }).ok).toBe(false);
	});

	it("rejects calling-on into a facing train that is about to depart rather than held", () => {
		const map = approachMap();
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(7), front: cell(6) },
				{
					kind: "stop",
					arrive: t("06:00"),
					depart: t("06:10"),
					location: "Bay",
				},
				{ kind: "finishRemainHere" },
			]),
			service("2B02", [
				{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
				{ kind: "stop", arrive: t("06:05"), location: "Bay" },
				{ kind: "finishRemainHere" },
			]),
		]);
		const engine = createEngine({ map, timetable: tt });
		engine.handle({ type: "run" });
		engine.advance(60);

		const second = engine.view().trains.find((tr) => tr.headcode === "2B02");
		expect(second?.wait).toBe("signal");
		expect(second?.callingOnAllowed).toBe(false);
	});

	it("rejects calling-on when another facing signal lies between stop signal and train", () => {
		const map = line("-->>-PPPP]");
		nameCells(map, [5, 6, 7, 8], "Bay");
		const tt = timetable([
			service("1A01", [
				{ kind: "startNew", time: t("06:00"), rear: cell(7), front: cell(8) },
				{ kind: "stop", arrive: t("06:00"), location: "Bay" },
				{ kind: "finishRemainHere" },
			]),
			service("2B02", [
				{ kind: "startNew", time: t("06:00"), rear: cell(0), front: cell(1) },
				{ kind: "stop", arrive: t("06:05"), location: "Bay" },
				{ kind: "finishRemainHere" },
			]),
		]);
		const engine = createEngine({ map, timetable: tt });
		engine.handle({ type: "run" });
		engine.advance(60);

		const second = engine.view().trains.find((tr) => tr.headcode === "2B02");
		expect(second?.wait).toBe("signal");
		expect(second?.callingOnAllowed).toBe(false);
	});
});
