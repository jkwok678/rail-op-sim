import { describe, expect, it } from "vitest";
import {
	formatImperialLength,
	kmhToMph,
	metresToImperial,
	round1,
} from "../units";

describe("round1", () => {
	it("rounds to 1 decimal place", () => {
		expect(round1(1.2345)).toBe(1.2);
		expect(round1(2.78)).toBe(2.8);
		expect(round1(5.0)).toBe(5.0);
		expect(round1(0.05)).toBe(0.1);
	});
});

describe("kmhToMph", () => {
	it("converts km/h to mph correctly", () => {
		expect(kmhToMph(100)).toBe(62.1);
		expect(kmhToMph(200)).toBe(124.3);
		expect(kmhToMph(0)).toBe(0);
	});
});

describe("metresToImperial", () => {
	it("converts 100m to chains and yards", () => {
		const result = metresToImperial(100);
		expect(result.miles).toBe(0);
		expect(result.chains).toBe(4);
		expect(result.yards).toBeCloseTo(21.4, 1);
	});

	it("converts 1609.344m (1 mile) correctly", () => {
		const result = metresToImperial(1609.344);
		expect(result.miles).toBe(1);
		expect(result.chains).toBe(0);
		expect(result.yards).toBeCloseTo(0, 1);
	});

	it("handles zero metres", () => {
		const result = metresToImperial(0);
		expect(result.miles).toBe(0);
		expect(result.chains).toBe(0);
		expect(result.yards).toBe(0);
	});
});

describe("formatImperialLength", () => {
	it("formats short lengths as chains and yards only", () => {
		const result = formatImperialLength(100); // ~4 ch 21.4 yd
		expect(result).toContain("ch");
		expect(result).toContain("yd");
		expect(result).not.toContain("mi");
	});

	it("formats mile-length distances with all units", () => {
		const result = formatImperialLength(2000); // > 1 mile
		expect(result).toContain("mi");
		expect(result).toContain("ch");
		expect(result).toContain("yd");
	});

	it("always includes yards even when zero", () => {
		const result = formatImperialLength(0);
		expect(result).toBe("0 yd");
	});
});
