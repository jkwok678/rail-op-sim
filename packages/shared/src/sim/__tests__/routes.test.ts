import { describe, expect, it } from "vitest";
import { nodeAt } from "../graph";
import { cell, engineFor, line, passingLoop } from "./fixtures";

/** Signals at 2 and 5 face right; exits at both ends. */
const twoSignals = () => line("X->-->-X");

const segNodes = (engine: ReturnType<typeof engineFor>, i = 0) =>
	engine.state.routes[i].segs.map((s) => engine.graph.nodes[s.node].cell.gx);

describe("setting routes", () => {
	it("sets a preferred route from a signal up to, not onto, the next one", () => {
		const engine = engineFor(twoSignals());
		const result = engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(5),
			kind: "preferred",
		});
		expect(result).toEqual({ ok: true });
		expect(segNodes(engine)).toEqual([2, 3, 4]);
	});

	it("runs a route to an exit onto the exit itself", () => {
		const engine = engineFor(twoSignals());
		engine.handle({
			type: "setRoute",
			from: cell(5),
			to: cell(7),
			kind: "auto",
		});
		expect(segNodes(engine)).toEqual([5, 6, 7]);
	});

	it("starts a route at an exit, heading into the railway", () => {
		const engine = engineFor(twoSignals());
		engine.handle({
			type: "setRoute",
			from: cell(0),
			to: cell(2),
			kind: "preferred",
		});
		expect(segNodes(engine)).toEqual([0, 1]);
	});

	it("will not start a preferred route on plain track", () => {
		const engine = engineFor(twoSignals());
		const result = engine.handle({
			type: "checkRouteStart",
			at: cell(3),
			kind: "preferred",
		});
		expect(result.ok).toBe(false);
	});

	it("will not run a preferred route past a signal", () => {
		const engine = engineFor(twoSignals());
		const result = engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(7),
			kind: "preferred",
		});
		expect(result.ok).toBe(false);
	});

	it("will not run a signal route against the way it faces", () => {
		const engine = engineFor(twoSignals());
		const result = engine.handle({
			type: "setRoute",
			from: cell(5),
			to: cell(0),
			kind: "preferred",
		});
		expect(result.ok).toBe(false);
	});

	it("lets an unrestricted route run past signals, either way", () => {
		const engine = engineFor(twoSignals());
		engine.handle({
			type: "setRoute",
			from: cell(6),
			to: cell(1),
			kind: "unrestricted",
		});
		expect(segNodes(engine)).toEqual([6, 5, 4, 3, 2, 1]);
	});

	it("will not let routes share a rail", () => {
		const engine = engineFor(twoSignals());
		engine.handle({
			type: "setRoute",
			from: cell(1),
			to: cell(4),
			kind: "unrestricted",
		});
		const result = engine.handle({
			type: "setRoute",
			from: cell(6),
			to: cell(3),
			kind: "unrestricted",
		});
		expect(result.ok).toBe(false);
	});

	it("refuses an automatic route into buffers", () => {
		const engine = engineFor(line("X->-]"));
		const auto = engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(4),
			kind: "auto",
		});
		expect(auto.ok).toBe(false);
		const preferred = engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(4),
			kind: "preferred",
		});
		expect(preferred.ok).toBe(true);
	});
});

describe("points", () => {
	it("sets the points a route needs and locks them", () => {
		const engine = engineFor(passingLoop());
		const sw = nodeAt(engine.graph, cell(2)) as number;
		const main = engine.state.lies[sw];
		engine.handle({
			type: "setRoute",
			from: cell(1),
			to: cell(4, 1),
			kind: "unrestricted",
		});
		expect(engine.state.lies[sw]).not.toBe(main);
		expect(engine.handle({ type: "togglePoints", at: cell(2) }).ok).toBe(false);
	});

	it("throws free points over by hand", () => {
		const engine = engineFor(passingLoop());
		const sw = nodeAt(engine.graph, cell(5)) as number;
		const before = engine.state.lies[sw];
		expect(engine.handle({ type: "togglePoints", at: cell(5) })).toEqual({
			ok: true,
		});
		expect(engine.state.lies[sw]).toBe(1 - before);
		expect(engine.view().points).toHaveLength(2);
	});

	it("takes the loop for a preferred route when the main line is held", () => {
		const engine = engineFor(passingLoop());
		engine.handle({
			type: "setRoute",
			from: cell(3),
			to: cell(4),
			kind: "unrestricted",
		});
		const result = engine.handle({
			type: "setRoute",
			from: cell(0),
			to: cell(7),
			kind: "preferred",
		});
		expect(result).toEqual({ ok: true });
		const cells = engine.state.routes[1].segs.map(
			(s) => engine.graph.nodes[s.node].cell,
		);
		expect(cells).toContainEqual({ gx: 3, gy: 1 });
	});
});

describe("route timing and cancelling", () => {
	it("holds a route pending while it sets, longer when points move", () => {
		const engine = engineFor(passingLoop());
		engine.handle({ type: "run" });
		engine.handle({
			type: "setRoute",
			from: cell(1),
			to: cell(4, 1),
			kind: "unrestricted",
		});
		expect(engine.state.routes).toHaveLength(0);
		expect(engine.view().pendingRoute).not.toBeNull();
		engine.advance(2);
		expect(engine.state.routes).toHaveLength(0);
		engine.advance(0.6);
		expect(engine.state.routes).toHaveLength(1);
		expect(engine.view().pendingRoute).toBeNull();
	});

	it("cancels a whole route", () => {
		const engine = engineFor(twoSignals());
		engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(5),
			kind: "preferred",
		});
		expect(engine.handle({ type: "cancelRoute", at: cell(3) })).toEqual({
			ok: true,
		});
		expect(engine.state.routes).toHaveLength(0);
		expect(engine.handle({ type: "cancelRoute", at: cell(3) }).ok).toBe(false);
	});

	it("will not set routes while paused", () => {
		const engine = engineFor(twoSignals());
		engine.handle({ type: "run" });
		engine.handle({ type: "pause" });
		const result = engine.handle({
			type: "setRoute",
			from: cell(2),
			to: cell(5),
			kind: "preferred",
		});
		expect(result.ok).toBe(false);
	});
});
