import { describe, expect, it } from "vitest";
import { cell, engineFor, line } from "./fixtures";

/** Signals for rightward running at 2, 4, 6 and 8, exit at 10. */
const fourSignals = () => line("X->->->->-X");

const aspectAt = (engine: ReturnType<typeof engineFor>, gx: number) =>
	engine.view().signals.find((s) => s.gx === gx)?.aspect;

describe("signal aspects", () => {
	it("keeps a signal red with no route from it", () => {
		const engine = engineFor(fourSignals());
		expect(aspectAt(engine, 2)).toBe(0);
	});

	it("clears to yellow towards a red signal", () => {
		const engine = engineFor(fourSignals());
		engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(4),
			kind: "preferred",
		});
		expect(aspectAt(engine, 2)).toBe(1);
	});

	it("steps up through double yellow to green behind clear routes", () => {
		const engine = engineFor(fourSignals());
		for (const [from, to] of [
			[2, 4],
			[4, 6],
			[6, 8],
		]) {
			engine.handle({
				type: "setRoute",
				from: cell(from),
				to: cell(to),
				kind: "auto",
			});
		}
		expect([2, 4, 6, 8].map((gx) => aspectAt(engine, gx))).toEqual([
			3, 2, 1, 0,
		]);
		engine.handle({
			type: "setRoute",
			from: cell(8),
			to: cell(10),
			kind: "auto",
		});
		expect([2, 4, 6, 8].map((gx) => aspectAt(engine, gx))).toEqual([
			3, 3, 3, 3,
		]);
	});

	it("shows buffers as a red signal ahead", () => {
		const engine = engineFor(line("X->-]"));
		engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(4),
			kind: "preferred",
		});
		expect(aspectAt(engine, 2)).toBe(1);
	});

	it("keeps a signal red at the plain end of an unrestricted route", () => {
		const engine = engineFor(line("X->---->-X"));
		engine.handle({
			type: "setRoute",
			from: cell(1),
			to: cell(4),
			kind: "unrestricted",
		});
		expect(aspectAt(engine, 2)).toBe(0);
	});
});

describe("aspects on a route through signals", () => {
	it("clears each signal it passes in sequence behind a red end signal", () => {
		const engine = engineFor(fourSignals());
		const result = engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(6),
			kind: "preferred",
		});
		expect(result).toEqual({ ok: true });
		expect([2, 4, 6].map((gx) => aspectAt(engine, gx))).toEqual([2, 1, 0]);
	});
});
