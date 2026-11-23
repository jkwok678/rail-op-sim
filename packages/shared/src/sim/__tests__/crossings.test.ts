import { describe, expect, it } from "vitest";
import { Map_ } from "../../railway/map/map";
import { itemAt } from "../../util/checked";
import { buildGraph } from "../graph";
import {
	addTrain,
	cell,
	engineFor,
	frontCell,
	line,
	place,
	runFor,
} from "./fixtures";

/** X(0) >(1) -(2) L(3) -(4) X(5): one signal protecting one crossing. */
const guarded = () => line("X>-L-X");

type Engine = ReturnType<typeof engineFor>;

const barriers = (engine: Engine) =>
	engine.view().levelCrossings.map((lc) => lc.barriers);

const aspectAt = (engine: Engine, gx: number) =>
	engine.view().signals.find((s) => s.gx === gx)?.aspect;

const setRoute = (
	engine: Engine,
	from: number,
	to: number,
	kind: "auto" | "preferred" | "unrestricted" = "preferred",
) => engine.handle({ type: "setRoute", from: cell(from), to: cell(to), kind });

describe("level crossing graph", () => {
	it("joins crossings on parallel tracks side by side into one", () => {
		const map = new Map_();
		for (const gy of [0, 1, 2]) {
			place(map, 0, gy, "straight", "STRAIGHTH", false, true);
		}
		place(map, 0, 4, "straight", "STRAIGHTH", false, true);
		place(map, 2, 0, "straight", "STRAIGHTV", false, true);
		place(map, 3, 0, "straight", "STRAIGHTV", false, true);
		map.makeTrackList();
		const graph = buildGraph(map);
		const cells = graph.crossings.map((lc) =>
			lc.nodes.map((id) => itemAt(graph.nodes, id).cell),
		);
		expect(cells).toEqual([
			[cell(0, 0), cell(0, 1), cell(0, 2)],
			[cell(2, 0), cell(3, 0)],
			[cell(0, 4)],
		]);
	});
});

describe("automatic level crossings", () => {
	it("stand with barriers up until a route is set", () => {
		const engine = engineFor(guarded());
		expect(barriers(engine)).toEqual(["up"]);
	});

	it("come down at once before the clock starts", () => {
		const engine = engineFor(guarded());
		expect(setRoute(engine, 1, 5).ok).toBe(true);
		expect(barriers(engine)).toEqual(["down"]);
		expect(aspectAt(engine, 1)).toBe(3);
	});

	it("hold the signal at red for the 30 seconds the barriers take to lower", () => {
		const engine = engineFor(guarded());
		engine.handle({ type: "run" });
		setRoute(engine, 1, 5);
		runFor(engine, 1);
		expect(barriers(engine)).toEqual(["lowering"]);
		expect(aspectAt(engine, 1)).toBe(0);
		runFor(engine, 28);
		expect(aspectAt(engine, 1)).toBe(0);
		runFor(engine, 2);
		expect(barriers(engine)).toEqual(["down"]);
		expect(aspectAt(engine, 1)).toBe(3);
	});

	it("lower in the same real time at slow clock speeds", () => {
		const engine = engineFor(guarded());
		engine.handle({ type: "run" });
		engine.handle({ type: "setSpeed", speed: 0.5 });
		setRoute(engine, 1, 5);
		runFor(engine, 16);
		expect(barriers(engine)).toEqual(["down"]);
	});

	it("rise once the route is gone, counting the time down for nothing", () => {
		const engine = engineFor(guarded());
		engine.handle({ type: "run" });
		setRoute(engine, 1, 5);
		runFor(engine, 31);
		runFor(engine, 60);
		expect(engine.handle({ type: "cancelRoute", at: cell(2) }).ok).toBe(true);
		runFor(engine, 1);
		expect(barriers(engine)).toEqual(["raising"]);
		expect(engine.state.counters.excessLcDownMins).toBeCloseTo(61 / 60, 1);
		runFor(engine, 10);
		expect(barriers(engine)).toEqual(["up"]);
	});

	it("will not let a route be cancelled while its barriers are moving", () => {
		const engine = engineFor(guarded());
		engine.handle({ type: "run" });
		setRoute(engine, 1, 5);
		runFor(engine, 5);
		const result = engine.handle({ type: "cancelRoute", at: cell(2) });
		expect(result).toEqual({
			ok: false,
			message: "The level crossing on that route is still moving.",
		});
	});

	it("are kept off automatic signals routes", () => {
		const engine = engineFor(guarded());
		expect(setRoute(engine, 1, 5, "auto")).toEqual({
			ok: false,
			message: "An automatic signals route cannot pass over a level crossing.",
		});
		expect(engine.handle({ type: "setAllAutoRoutes" }).ok).toBe(false);
		expect(engine.state.routes).toEqual([]);
	});

	it("cannot be where a route starts or ends", () => {
		const engine = engineFor(guarded());
		expect(setRoute(engine, 3, 5, "unrestricted")).toEqual({
			ok: false,
			message: "A route cannot start on a level crossing.",
		});
		expect(setRoute(engine, 2, 3, "unrestricted")).toEqual({
			ok: false,
			message: "A route cannot end on a level crossing.",
		});
	});

	it("let a train over and rise behind it, with 3 minutes allowed down", () => {
		const engine = engineFor(guarded());
		const train = addTrain(engine, cell(0), cell(1));
		engine.handle({ type: "run" });
		setRoute(engine, 1, 5);
		runFor(engine, 20);
		// Held at the signal, which stands at the near edge of cell 1.
		expect(train.speed).toBe(0);
		expect(frontCell(engine, train)).toEqual(cell(0));
		runFor(engine, 120);
		expect(train.status).not.toBe("crashed");
		expect(engine.state.trains).not.toContain(train);
		expect(barriers(engine)).not.toEqual(["down"]);
		expect(engine.state.counters.excessLcDownMins).toBe(0);
		expect(engine.state.counters.crashedTrains).toBe(0);
	});

	it("wreck a train that runs onto them with the barriers up", () => {
		const engine = engineFor(line("X-L-X"));
		const train = addTrain(engine, cell(0), cell(1));
		engine.handle({ type: "run" });
		runFor(engine, 120);
		expect(train.status).toBe("crashed");
		expect(frontCell(engine, train)).toEqual(cell(2));
		expect(engine.state.counters.crashedTrains).toBe(1);
		expect(engine.drainLog().map((l) => l.text)).toContainEqual(
			expect.stringContaining("CRASHED INTO ROAD TRAFFIC AT A LEVEL CROSSING"),
		);
	});
});
