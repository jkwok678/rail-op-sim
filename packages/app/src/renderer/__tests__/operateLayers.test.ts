import type { SimView, TrainView } from "@rail-op-sim/shared";
import { Container, type Graphics, type Text } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import {
	attachOperateLayers,
	type OperateLayersSource,
} from "#/renderer/operateLayers";
import { defined } from "../../lib/__tests__/test-helpers";

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
	timetableIndex: 0,
	workingDone: false,
	signallerControl: false,
	signallerMode: "stop",
	canRestoreTimetable: false,
	followOnServiceRef: null,
	reminder: null,
	callingOnAllowed: false,
	...over,
});

const view = (over: Partial<SimView> = {}): SimView => ({
	time: 0,
	run: "running",
	speed: 1,
	signals: [
		{
			gx: 3,
			gy: 0,
			subtype: "SIGNALRIGHT",
			aspect: 2,
			aspects: 4,
			callingOn: false,
		},
		{
			gx: 5,
			gy: 0,
			subtype: "SIGNALRIGHT",
			aspect: 0,
			aspects: 4,
			callingOn: false,
		},
	],
	points: [{ gx: 4, gy: 0, subtype: "SWITCH3", a: 3, b: 5 }],
	levelCrossings: [
		{
			subtype: "STRAIGHTH",
			cells: [
				{ gx: 7, gy: 0 },
				{ gx: 7, gy: 1 },
			],
			barriers: "down",
		},
	],
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

function createTestSource(): {
	source: OperateLayersSource;
	setMode: (next: "railway" | "operate") => void;
	setView: (next: SimView | null) => void;
	reset: () => void;
} {
	let mode: "railway" | "operate" = "operate";
	let currentView: SimView | null = null;
	const modeListeners = new Set<() => void>();
	const viewListeners = new Set<() => void>();

	return {
		source: {
			isOperateMode: () => mode === "operate",
			getView: () => currentView,
			subscribeMode: (onChange) => {
				modeListeners.add(onChange);
				return () => modeListeners.delete(onChange);
			},
			subscribeView: (onChange) => {
				viewListeners.add(onChange);
				return () => viewListeners.delete(onChange);
			},
		},
		setMode(next) {
			if (next === mode) return;
			mode = next;
			for (const listener of modeListeners) listener();
		},
		setView(next) {
			if (next === currentView) return;
			currentView = next;
			for (const listener of viewListeners) listener();
		},
		reset() {
			mode = "operate";
			currentView = null;
		},
	};
}

const testSource = createTestSource();
let world: Container;
let detach: () => void;
const setOverrides = vi.fn();
const overrides = (): ReadonlyMap<string, readonly string[]> =>
	setOverrides.mock.lastCall?.[0] ?? new Map();
const setLevelCrossingArt = vi.fn();
const crossings = (): ReadonlyMap<string, string> =>
	setLevelCrossingArt.mock.lastCall?.[0] ?? new Map();
const lowered = new Map([
	["7,0", "levelCrossingVTop.svg"],
	["7,1", "levelCrossingVBottom.svg"],
]);

beforeEach(() => {
	vi.useFakeTimers();
	testSource.reset();
	setOverrides.mockClear();
	setLevelCrossingArt.mockClear();
	world = new Container();
	detach = attachOperateLayers(
		world,
		{ setOverrides },
		{ setLevelCrossingArt },
		testSource.source,
	);
});

afterEach(() => {
	detach();
	vi.useRealTimers();
	testSource.setMode("railway");
});

describe("attachOperateLayers", () => {
	it("draws routes and trains from the view", () => {
		testSource.setView(view());
		expect(drawn(world, "routes")).toBe(true);
		expect(drawn(world, "trains")).toBe(true);
		expect(headcodes(world)).toEqual(["1A01"]);
	});

	it("shows signal aspects and point lies in the track's art", () => {
		testSource.setView(view());
		expect(overrides()).toEqual(
			new Map([
				["3,0", ["signalRightDoubleYellow.svg"]],
				["5,0", ["signalRight.svg"]],
				["4,0", ["switchGapped3.svg", "switchStraight3.svg"]],
			]),
		);
	});

	it("gives the track its usual art back outside operate mode", () => {
		testSource.setView(view());
		testSource.setMode("railway");
		expect(overrides().size).toBe(0);
		expect(crossings().size).toBe(0);
	});

	it("shows a crossing's lowered barriers", () => {
		testSource.setView(view());
		expect(crossings()).toEqual(lowered);
	});

	it("flashes a crossing whose barriers are on the move", () => {
		const moving = view({
			pendingRoute: null,
			levelCrossings: [
				{
					...defined(view().levelCrossings[0], "levelCrossings[0]"),
					barriers: "lowering",
				},
			],
		});
		testSource.setView(moving);
		const first = crossings().size;
		vi.advanceTimersByTime(250);
		expect(crossings().size).not.toBe(first);
	});

	it("puts a train's headcode on the middle of its body", () => {
		testSource.setView(view());
		const text = (layer(world, "trains").children[1] as Container)
			.children[0] as Text;
		// Segs at gx 1 and 2 run left to right: the body spans gx 1's entry
		// edge to gx 2's exit edge, so its middle is the edge between them.
		const middle = gridToWorld(1, 0).x + CELL_SIZE / 2;
		expect(text.position.x).toBeCloseTo(middle);
		expect(text.position.y).toBeCloseTo(gridToWorld(1, 0).y);
		expect(text.rotation).toBeCloseTo(0);
	});

	it("drops a train's label once it has gone", () => {
		testSource.setView(view());
		testSource.setView(view({ trains: [] }));
		expect(headcodes(world)).toEqual([]);
	});

	it("skips a train with nothing on the railway yet", () => {
		testSource.setView(view({ trains: [train({ segs: [] })] }));
		expect(headcodes(world)).toEqual([]);
	});

	it("flashes a route that is still setting", () => {
		testSource.setView(view({ routes: [] }));
		const shown = drawn(world, "routes");
		vi.advanceTimersByTime(250);
		expect(drawn(world, "routes")).not.toBe(shown);
	});

	it("draws nothing outside operate mode", () => {
		testSource.setView(view());
		testSource.setMode("railway");
		expect(drawn(world, "routes")).toBe(false);
		expect(drawn(world, "trains")).toBe(false);
	});
});
