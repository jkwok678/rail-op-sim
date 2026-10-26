import { describe, expect, it } from "vitest";
import {
	addTrain,
	CELL,
	cell,
	engineFor,
	frontCell,
	line,
	passingLoop,
} from "./fixtures";

function running(map: ReturnType<typeof line>) {
	const engine = engineFor(map);
	engine.handle({ type: "run" });
	return engine;
}

describe("a train at a signal", () => {
	it("waits in the cell before a red signal", () => {
		const engine = running(line("X-->--X"));
		const train = addTrain(engine, cell(1), cell(2));
		engine.advance(30);
		expect(train.speed).toBe(0);
		expect(train.wait).toBe("signal");
		expect(frontCell(engine, train)).toEqual(cell(2));
	});

	it("leaves when a route clears the signal, and leaves the railway", () => {
		const engine = running(line("X-->--X"));
		const train = addTrain(engine, cell(1), cell(2));
		engine.advance(5);
		engine.handle({
			type: "setRoute",
			from: cell(3),
			to: cell(6),
			kind: "preferred",
		});
		engine.advance(5);
		expect(train.speed).toBeGreaterThan(0);
		engine.advance(300);
		expect(engine.state.trains).toHaveLength(0);
		// The route was released behind the train.
		expect(engine.state.routes).toHaveLength(0);
	});

	it("keeps an automatic route after the train has gone", () => {
		const engine = running(line("X-->--X"));
		addTrain(engine, cell(1), cell(2));
		engine.handle({
			type: "setRoute",
			from: cell(3),
			to: cell(6),
			kind: "auto",
		});
		engine.advance(300);
		expect(engine.state.trains).toHaveLength(0);
		expect(engine.state.routes).toHaveLength(1);
	});

	it("puts the signal back to red behind the train", () => {
		const engine = running(line("X-->------X"));
		addTrain(engine, cell(1), cell(2));
		engine.handle({
			type: "setRoute",
			from: cell(3),
			to: cell(10),
			kind: "auto",
		});
		engine.advance(20);
		expect(engine.view().signals[0].aspect).toBe(0);
	});
});

describe("braking", () => {
	it("stops short of a red signal from line speed", () => {
		const engine = running(line(`X-${"-".repeat(30)}>-X`));
		const train = addTrain(engine, cell(1), cell(2));
		let top = 0;
		for (let i = 0; i < 600; i++) {
			engine.advance(1);
			top = Math.max(top, train.speed);
		}
		expect(top * 3.6).toBeGreaterThan(100);
		expect(train.wait).toBe("signal");
		expect(frontCell(engine, train)).toEqual(cell(31));
		expect(train.frontM).toBeCloseTo(100, 3);
	});

	it("creeps up to a red signal without passing it, however weak its brakes", () => {
		// A heavy freight: 0.2 m/s² of brake, so its last metres are a crawl.
		const engine = running(line(`X-${"-".repeat(6)}>-X`));
		const train = addTrain(engine, cell(1), cell(2), {
			massTonnes: 1500,
			brakeForceTonnes: 30,
			startSpeedKmh: 30,
		});
		engine.advance(600);
		expect(train.status).toBe("waiting");
		expect(train.wait).toBe("signal");
		expect(engine.state.counters.spads).toBe(0);
	});

	it("stops at the end of buffers", () => {
		const engine = running(line("X------]"));
		const train = addTrain(engine, cell(1), cell(2));
		engine.advance(300);
		expect(train.wait).toBe("buffers");
		expect(frontCell(engine, train)).toEqual(cell(7));
	});

	it("keeps to a speed limit", () => {
		const map = line("X------------X");
		for (let gx = 1; gx <= 12; gx++)
			map.getTrackAt(gx * CELL, 0)?.setTrackMainSpeed(40);
		const engine = running(map);
		const train = addTrain(engine, cell(1), cell(2));
		let top = 0;
		for (let i = 0; i < 100; i++) {
			engine.advance(1);
			top = Math.max(top, train.speed);
		}
		expect(top * 3.6).toBeLessThanOrEqual(40 + 1e-6);
		expect(top * 3.6).toBeGreaterThan(39);
	});

	it("enters from an exit at speed", () => {
		const engine = running(line("X---------X"));
		const train = addTrain(engine, cell(0), cell(1), { startSpeedKmh: 60 });
		expect(train.speed * 3.6).toBeCloseTo(60);
		engine.advance(10);
		expect(frontCell(engine, train).gx).toBeGreaterThan(0);
	});
});

describe("other trains and points", () => {
	it("stops behind another train", () => {
		const engine = running(line("X--------->-X"));
		const ahead = addTrain(engine, cell(8), cell(9));
		const behind = addTrain(engine, cell(1), cell(2));
		engine.advance(200);
		expect(ahead.wait).toBe("signal");
		expect(behind.wait).toBe("train");
		expect(frontCell(engine, behind)).toEqual(cell(7));
	});

	it("stops for points lying against it, then runs through once thrown", () => {
		const engine = running(passingLoop());
		const train = addTrain(engine, cell(3, 1), cell(4, 1));
		engine.advance(10);
		expect(train.wait).toBe("points");
		engine.handle({ type: "togglePoints", at: cell(5) });
		engine.advance(200);
		expect(engine.state.trains).toHaveLength(0);
	});

	it("will not cancel a route a train is running towards", () => {
		const engine = running(line("X-------->---X"));
		addTrain(engine, cell(5), cell(6));
		engine.handle({
			type: "setRoute",
			from: cell(9),
			to: cell(13),
			kind: "preferred",
		});
		engine.advance(10);
		const result = engine.handle({ type: "cancelRoute", at: cell(11) });
		expect(result.ok).toBe(false);
	});
});

describe("signals passed at danger", () => {
	it("passes a signal that went red too close to stop, and stops", () => {
		const engine = running(line("X--->------X"));
		const train = addTrain(engine, cell(1), cell(2));
		engine.handle({
			type: "setRoute",
			from: cell(4),
			to: cell(11),
			kind: "auto",
		});
		while (!(frontCell(engine, train).gx === 3 && train.frontM > 92))
			engine.advance(0.1);
		addTrain(engine, cell(7), cell(8));
		engine.advance(5);
		expect(train.status).toBe("spad");
		expect(train.speed).toBe(0);
		expect(engine.state.counters.spads).toBe(1);
	});
});

describe("the train view", () => {
	it("lays the train back from its front over its length", () => {
		const engine = engineFor(line("X----X"));
		addTrain(engine, cell(1), cell(2));
		const [view] = engine.view().trains;
		expect(view.segs.map((s) => [s.gx, s.from, s.to])).toEqual([
			[1, 0, 1],
			[2, 0, 1],
		]);
	});
});
