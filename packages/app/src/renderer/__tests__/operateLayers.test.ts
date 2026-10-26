import type { SimView, TrainView } from "@rail-op-sim/shared";
import { Container, type Graphics, type Text } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { attachOperateLayers } from "#/renderer/operateLayers";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";

const seg = (gx: number) => ({ gx, gy: 0, entry: 3, exit: 5, from: 0, to: 1 });

const train = (over: Partial<TrainView> = {}): TrainView => ({
	id: 1,
	headcode: "1A01",
	description: "",
	status: "running",
	wait: null,
	speedKmh: 50,
	segs: [seg(1), seg(2)],
	next: "",
	...over,
});

const view = (over: Partial<SimView> = {}): SimView => ({
	time: 0,
	run: "running",
	speed: 1,
	signals: [
		{ gx: 3, gy: 0, aspect: 2, aspects: 4 },
		{ gx: 5, gy: 0, aspect: 0, aspects: 4 },
	],
	points: [{ gx: 4, gy: 0, a: 3, b: 5 }],
	routes: [{ id: "R1", kind: "auto", segs: [seg(3), seg(4)] }],
	pendingRoute: { kind: "preferred", segs: [seg(6)] },
	trains: [train()],
	counters: {} as SimView["counters"],
	...over,
});

const layer = (world: Container, label: string) =>
	world.children.find((c) => c.label === label) as Container;

const drawn = (world: Container, label: string): boolean =>
	layer(world, label).children.some(
		(c) => "bounds" in c && (c as Graphics).bounds.width > 0,
	);

const headcodes = (world: Container): string[] =>
	(layer(world, "trains").children[1] as Container).children.map(
		(c) => (c as Text).text,
	);

let world: Container;
let detach: () => void;

beforeEach(() => {
	vi.useFakeTimers();
	useOperateStore.getState().reset();
	useModeStore.setState({ mode: "operate" });
	world = new Container();
	detach = attachOperateLayers(world);
});

afterEach(() => {
	detach();
	vi.useRealTimers();
	useModeStore.setState({ mode: "railway" });
});

describe("attachOperateLayers", () => {
	it("draws routes, lamps, points and trains from the view", () => {
		useOperateStore.setState({ view: view() });
		expect(drawn(world, "routes")).toBe(true);
		expect(drawn(world, "signal-state")).toBe(true);
		expect(drawn(world, "trains")).toBe(true);
		expect(headcodes(world)).toEqual(["1A01"]);
	});

	it("drops a train's label once it has gone", () => {
		useOperateStore.setState({ view: view() });
		useOperateStore.setState({ view: view({ trains: [] }) });
		expect(headcodes(world)).toEqual([]);
	});

	it("skips a train with nothing on the railway yet", () => {
		useOperateStore.setState({ view: view({ trains: [train({ segs: [] })] }) });
		expect(headcodes(world)).toEqual([]);
	});

	it("flashes a route that is still setting", () => {
		useOperateStore.setState({ view: view({ routes: [] }) });
		const shown = drawn(world, "routes");
		vi.advanceTimersByTime(250);
		expect(drawn(world, "routes")).not.toBe(shown);
	});

	it("draws nothing outside operate mode", () => {
		useOperateStore.setState({ view: view() });
		useModeStore.setState({ mode: "railway" });
		expect(drawn(world, "routes")).toBe(false);
		expect(drawn(world, "trains")).toBe(false);
	});
});
