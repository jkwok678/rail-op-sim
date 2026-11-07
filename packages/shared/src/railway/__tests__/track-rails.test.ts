import { describe, expect, it } from "vitest";
import { getRails, signalFacingExit } from "../track/track-data";

describe("getRails", () => {
	it("gives a straight a single main rail", () => {
		expect(getRails("straight", "STRAIGHTH")).toEqual([
			{ a: 3, b: 5, secondary: false },
		]);
	});

	it("gives a dead end no rails", () => {
		expect(getRails("buffer", "BUFFERLEFT")).toEqual([]);
	});

	it("makes the straight-through rail of a switch the main one", () => {
		const rails = getRails("switch", "SWITCH1");
		expect(rails).toHaveLength(2);
		expect(rails.find((r) => !r.secondary)).toMatchObject({ a: 3, b: 5 });
		expect(rails.find((r) => r.secondary)).toMatchObject({ a: 2, b: 3 });
	});

	it("never pairs the branches of a split switch", () => {
		const rails = getRails("switch", "SWITCHSPLIT1");
		expect(rails.map((r) => [r.a, r.b])).toEqual([
			[2, 3],
			[3, 8],
		]);
		expect(rails.filter((r) => r.secondary)).toHaveLength(1);
	});

	it("gives every switch exactly one main and one secondary rail", () => {
		for (const subtype of Object.keys(SWITCH_SUBTYPES())) {
			const rails = getRails("switch", subtype as never);
			expect(rails, subtype).toHaveLength(2);
			expect(
				rails.filter((r) => r.secondary),
				subtype,
			).toHaveLength(1);
		}
	});

	it("keeps the two paths of a crossover independent", () => {
		const rails = getRails("crossover", "CROSSOVER1");
		expect(rails.map((r) => [r.a, r.b, r.secondary])).toEqual([
			[1, 7, false],
			[3, 5, true],
		]);
	});
});

describe("signalFacingExit", () => {
	it("protects travel toward the end the subtype is named for", () => {
		expect(signalFacingExit("SIGNALLEFT" as never)).toBe(3);
		expect(signalFacingExit("SIGNALRIGHT" as never)).toBe(5);
		expect(signalFacingExit("SIGNALUP" as never)).toBe(1);
		expect(signalFacingExit("SIGNALDOWN" as never)).toBe(7);
		expect(signalFacingExit("SIGNALLEFTUP" as never)).toBe(0);
		expect(signalFacingExit("SIGNALRIGHTDOWN" as never)).toBe(8);
		expect(signalFacingExit("SIGNALRIGHTUP" as never)).toBe(2);
		expect(signalFacingExit("SIGNALLEFTDOWN" as never)).toBe(6);
	});

	it("returns null for a non-signal", () => {
		expect(signalFacingExit("STRAIGHTH" as never)).toBeNull();
	});
});

function SWITCH_SUBTYPES(): Record<string, true> {
	const out: Record<string, true> = {};
	for (const k of [
		..."12345678".split("").map((n) => `SWITCHTIGHT${n}`),
		..."12345678".split("").map((n) => `SWITCHSPLIT${n}`),
		...Array.from({ length: 16 }, (_, i) => `SWITCH${i + 1}`),
	]) {
		out[k] = true;
	}
	return out;
}
