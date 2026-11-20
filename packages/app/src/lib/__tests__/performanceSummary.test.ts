import { emptyCounters } from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import {
	formatMinutes,
	formatPunctuality,
	summariseCounters,
} from "#/lib/performanceSummary";

describe("performanceSummary", () => {
	it("handles all-zero counters with null punctuality and zero incidents", () => {
		const summary = summariseCounters(emptyCounters());
		expect(summary.timed).toBe(0);
		expect(summary.onTime).toBe(0);
		expect(summary.punctuality).toBeNull();
		expect(formatPunctuality(summary.punctuality)).toBe("—");
		expect(summary.incidentCount).toBe(0);
		expect(summary.events).toEqual([
			{
				label: "Arrivals",
				onTime: 0,
				late: 0,
				early: 0,
				lateMins: 0,
				earlyMins: 0,
			},
			{
				label: "Passes",
				onTime: 0,
				late: 0,
				early: 0,
				lateMins: 0,
				earlyMins: 0,
			},
			{
				label: "Departures",
				onTime: 0,
				late: 0,
				early: null,
				lateMins: 0,
				earlyMins: null,
			},
			{
				label: "Exits",
				onTime: 0,
				late: 0,
				early: 0,
				lateMins: 0,
				earlyMins: 0,
			},
		]);
		expect(summary.incidents).toEqual([
			{ label: "Missed stops", value: 0, severity: "warning", unit: "count" },
			{
				label: "Other missed events",
				value: 0,
				severity: "warning",
				unit: "count",
			},
			{
				label: "Unexpected exits",
				value: 0,
				severity: "warning",
				unit: "count",
			},
			{
				label: "Incorrect exits",
				value: 0,
				severity: "warning",
				unit: "count",
			},
			{ label: "SPADs", value: 0, severity: "error", unit: "count" },
			{ label: "Crashed trains", value: 0, severity: "error", unit: "count" },
			{
				label: "Excess crossing-down time",
				value: 0,
				severity: "warning",
				unit: "minutes",
			},
		]);
	});

	it("summarises mixed timed events and excludes excessLcDownMins from incidentCount", () => {
		const summary = summariseCounters({
			...emptyCounters(),
			onTimeArrivals: 5,
			lateArrivals: 2,
			earlyArrivals: 1,
			totLateArrMins: 7,
			totEarlyArrMins: 2,
			onTimePasses: 3,
			latePasses: 1,
			earlyPasses: 0,
			totLatePassMins: 3,
			totEarlyPassMins: 0,
			onTimeDeps: 4,
			lateDeps: 1,
			totLateDepMins: 5,
			onTimeExits: 2,
			lateExits: 0,
			earlyExits: 1,
			totLateExitMins: 0,
			totEarlyExitMins: 1,
			missedStops: 1,
			otherMissedEvents: 2,
			unexpectedExits: 1,
			incorrectExits: 0,
			spads: 1,
			crashedTrains: 2,
			excessLcDownMins: 4.5,
		});

		expect(summary.onTime).toBe(14);
		expect(summary.timed).toBe(20);
		expect(summary.punctuality).toBeCloseTo(0.7);
		expect(formatPunctuality(summary.punctuality)).toBe("70%");

		const departures = summary.events[2];
		expect(departures).toEqual({
			label: "Departures",
			onTime: 4,
			late: 1,
			early: null,
			lateMins: 5,
			earlyMins: null,
		});

		// Crashed trains (2) and crossing minutes stay out of the event count.
		expect(summary.incidentCount).toBe(5);
		expect(summary.headline).toEqual([
			{ text: "70% on time", severity: null },
			{ text: "5 incidents", severity: "error" },
			{ text: "2 trains crashed", severity: "error" },
			{ text: "4.5 min excess crossing time", severity: "warning" },
		]);
		expect(summary.incidents[4]).toEqual({
			label: "SPADs",
			value: 1,
			severity: "error",
			unit: "count",
		});
		expect(summary.incidents[5]).toEqual({
			label: "Crashed trains",
			value: 2,
			severity: "error",
			unit: "count",
		});
		expect(summary.incidents[6]).toEqual({
			label: "Excess crossing-down time",
			value: 4.5,
			severity: "warning",
			unit: "minutes",
		});
	});

	it("headlines only punctuality and incidents when nothing else happened", () => {
		expect(summariseCounters(emptyCounters()).headline).toEqual([
			{ text: "— on time", severity: null },
			{ text: "0 incidents", severity: null },
		]);
	});

	it("flags crossing-only problems and a single crashed train in the headline", () => {
		const summary = summariseCounters({
			...emptyCounters(),
			onTimeArrivals: 1,
			missedStops: 1,
			crashedTrains: 1,
			excessLcDownMins: 0.02,
		});
		// 0.02 min rounds to "0 min", so it is not worth a headline part.
		expect(summary.headline).toEqual([
			{ text: "100% on time", severity: null },
			{ text: "1 incident", severity: "warning" },
			{ text: "1 train crashed", severity: "error" },
		]);
		expect(
			summariseCounters({ ...emptyCounters(), excessLcDownMins: 3 }).headline,
		).toEqual([
			{ text: "— on time", severity: null },
			{ text: "0 incidents", severity: null },
			{ text: "3 min excess crossing time", severity: "warning" },
		]);
	});

	it("formats punctuality percentages and null", () => {
		expect(formatPunctuality(null)).toBe("—");
		expect(formatPunctuality(0)).toBe("0%");
		expect(formatPunctuality(0.924)).toBe("92%");
		expect(formatPunctuality(0.925)).toBe("93%");
		expect(formatPunctuality(1)).toBe("100%");
	});

	it("formats whole and fractional minutes", () => {
		expect(formatMinutes(0)).toBe("0 min");
		expect(formatMinutes(12)).toBe("12 min");
		expect(formatMinutes(2.5)).toBe("2.5 min");
		expect(formatMinutes(1 / 3)).toBe("0.3 min");
		expect(formatMinutes(2.04)).toBe("2 min");
	});
});
