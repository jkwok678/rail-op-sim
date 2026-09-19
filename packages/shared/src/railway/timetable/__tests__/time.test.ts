import { describe, expect, it } from "vitest";
import {
	dayOffset,
	formatDuration,
	formatSimTime,
	formatWallClock,
	InvalidTimeError,
	parseSimTime,
	SECONDS_PER_DAY,
	tryParseSimTime,
} from "../time";

describe("parseSimTime", () => {
	it("parses HH:MM", () => {
		expect(parseSimTime("00:00")).toBe(0);
		expect(parseSimTime("06:02")).toBe(6 * 3600 + 2 * 60);
		expect(parseSimTime("23:59")).toBe(23 * 3600 + 59 * 60);
	});

	it("parses HH:MM:SS", () => {
		expect(parseSimTime("06:02:30")).toBe(6 * 3600 + 2 * 60 + 30);
	});

	it("accepts a single-digit hour", () => {
		expect(parseSimTime("6:02")).toBe(6 * 3600 + 2 * 60);
	});

	it("carries hours past 24 rather than wrapping them", () => {
		expect(parseSimTime("25:10")).toBe(25 * 3600 + 10 * 60);
		expect(parseSimTime("25:10")).toBeGreaterThan(parseSimTime("23:50"));
	});

	it("ignores surrounding whitespace", () => {
		expect(parseSimTime("  07:15  ")).toBe(7 * 3600 + 15 * 60);
	});

	it("throws InvalidTimeError on junk, out-of-range minutes, or a bare hour", () => {
		expect(() => parseSimTime("nonsense")).toThrow(InvalidTimeError);
		expect(() => parseSimTime("06:60")).toThrow(InvalidTimeError);
		expect(() => parseSimTime("06:30:60")).toThrow(InvalidTimeError);
		expect(() => parseSimTime("6")).toThrow(InvalidTimeError);
		expect(() => parseSimTime("")).toThrow(InvalidTimeError);
	});
});

describe("tryParseSimTime", () => {
	it("answers the parsed time when the text is a clock time", () => {
		expect(tryParseSimTime("06:02")).toBe(6 * 3600 + 2 * 60);
	});

	it("answers null instead of throwing, so live input can keep typing", () => {
		expect(tryParseSimTime("0")).toBeNull();
		expect(tryParseSimTime("06:")).toBeNull();
	});
});

describe("formatSimTime", () => {
	it("pads to HH:MM", () => {
		expect(formatSimTime(0)).toBe("00:00");
		expect(formatSimTime(6 * 3600 + 2 * 60)).toBe("06:02");
	});

	it("adds seconds on request", () => {
		expect(formatSimTime(6 * 3600 + 2 * 60 + 5, true)).toBe("06:02:05");
	});

	it("keeps counting hours past 24, so it round-trips through parseSimTime", () => {
		expect(formatSimTime(25 * 3600 + 10 * 60)).toBe("25:10");
		expect(parseSimTime(formatSimTime(25 * 3600 + 10 * 60))).toBe(
			25 * 3600 + 10 * 60,
		);
	});

	it("clamps a negative time to zero", () => {
		expect(formatSimTime(-60)).toBe("00:00");
	});
});

describe("formatWallClock", () => {
	it("wraps a next-day time back onto the clock face", () => {
		expect(formatWallClock(25 * 3600 + 10 * 60)).toBe("01:10");
		expect(formatWallClock(SECONDS_PER_DAY)).toBe("00:00");
	});

	it("wraps a negative time forwards rather than clamping it", () => {
		expect(formatWallClock(-600)).toBe("23:50");
	});

	it("adds seconds on request", () => {
		expect(formatWallClock(25 * 3600 + 10 * 60 + 5, true)).toBe("01:10:05");
	});
});

describe("dayOffset", () => {
	it("counts the first day as 0", () => {
		expect(dayOffset(0)).toBe(0);
		expect(dayOffset(23 * 3600 + 50 * 60)).toBe(0);
	});

	it("counts the next day as 1", () => {
		expect(dayOffset(SECONDS_PER_DAY)).toBe(1);
		expect(dayOffset(25 * 3600 + 10 * 60)).toBe(1);
	});
});

describe("formatDuration", () => {
	it("renders seconds alone", () => {
		expect(formatDuration(45)).toBe("45s");
		expect(formatDuration(0)).toBe("0s");
	});

	it("renders whole minutes without a seconds part", () => {
		expect(formatDuration(240)).toBe("4m");
	});

	it("renders minutes and seconds", () => {
		expect(formatDuration(245)).toBe("4m 5s");
	});

	it("drops seconds once hours are involved", () => {
		expect(formatDuration(4320)).toBe("1h 12m");
		expect(formatDuration(3600)).toBe("1h");
		expect(formatDuration(3605)).toBe("1h");
	});

	it("clamps a negative gap to zero", () => {
		expect(formatDuration(-10)).toBe("0s");
	});
});
