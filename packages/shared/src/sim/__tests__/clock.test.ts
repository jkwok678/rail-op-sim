import { describe, expect, it } from "vitest";
import { stepSpeed } from "../clock";
import { engineFor, line } from "./fixtures";

describe("stepSpeed", () => {
	it("steps through the speeds and stops at the ends", () => {
		expect(stepSpeed(1, 1)).toBe(2);
		expect(stepSpeed(1, -1)).toBe(0.5);
		expect(stepSpeed(16, 1)).toBe(16);
		expect(stepSpeed(0.25, -1)).toBe(0.25);
	});
});

describe("engine clock", () => {
	it("holds the clock in prestart and runs it once started", () => {
		const engine = engineFor(line("X--X"));
		const start = engine.state.time;
		engine.advance(10);
		expect(engine.state.time).toBe(start);
		expect(engine.handle({ type: "run" })).toEqual({ ok: true });
		engine.advance(10);
		expect(engine.state.time).toBeCloseTo(start + 10, 6);
	});

	it("pauses and refuses to pause twice", () => {
		const engine = engineFor(line("X--X"));
		expect(engine.handle({ type: "pause" }).ok).toBe(false);
		engine.handle({ type: "run" });
		expect(engine.handle({ type: "pause" })).toEqual({ ok: true });
		const at = engine.state.time;
		engine.advance(5);
		expect(engine.state.time).toBe(at);
		expect(engine.state.run).toBe("paused");
	});

	it("accepts only the listed speeds", () => {
		const engine = engineFor(line("X--X"));
		expect(engine.handle({ type: "setSpeed", speed: 4 }).ok).toBe(true);
		expect(engine.handle({ type: "setSpeed", speed: 3 }).ok).toBe(false);
		expect(engine.state.speed).toBe(4);
	});
});
