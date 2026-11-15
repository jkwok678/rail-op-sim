import type { SimView } from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	applyOperateIntent,
	changeSpeed,
	runOrPause,
	toggleRouteCancel,
} from "#/lib/operateActions";
import { useOperateStore } from "#/store/operate-store";

const sent = vi.hoisted(() => [] as unknown[]);
const answer = vi.hoisted(() => ({ ok: true as boolean }));
vi.mock("#/store/sim-bridge", () => ({
	simCommand: async (cmd: unknown) => {
		sent.push(cmd);
		return answer.ok ? { ok: true } : { ok: false, message: "no" };
	},
}));

const at = { gx: 2, gy: 0 };
const to = { gx: 6, gy: 0 };

beforeEach(() => {
	sent.length = 0;
	answer.ok = true;
	useOperateStore.getState().reset();
});

describe("clock actions", () => {
	it("runs a stopped clock and pauses a running one", () => {
		useOperateStore.setState({ view: { run: "prestart" } as SimView });
		runOrPause();
		useOperateStore.setState({ view: { run: "running" } as SimView });
		runOrPause();
		expect(sent).toEqual([{ type: "run" }, { type: "pause" }]);
	});

	it("steps the speed from the one shown", () => {
		useOperateStore.setState({ view: { speed: 4 } as SimView });
		changeSpeed(-1);
		expect(sent).toEqual([{ type: "setSpeed", speed: 2 }]);
	});

	it("arms and disarms route cancelling", () => {
		toggleRouteCancel();
		expect(useOperateStore.getState().cancelArmed).toBe(true);
		toggleRouteCancel();
		expect(useOperateStore.getState().cancelArmed).toBe(false);
	});
});

describe("applyOperateIntent", () => {
	it("remembers a route start the engine accepts", async () => {
		await applyOperateIntent({ type: "startRoute", at, kind: "auto" });
		expect(sent).toEqual([{ type: "checkRouteStart", at, kind: "auto" }]);
		expect(useOperateStore.getState().routeStart).toEqual(at);
	});

	it("forgets nothing when a start is refused", async () => {
		answer.ok = false;
		await applyOperateIntent({ type: "startRoute", at, kind: "auto" });
		expect(useOperateStore.getState().routeStart).toBeNull();
	});

	it("clears the start once a route is set, and keeps it if refused", async () => {
		useOperateStore.setState({ routeStart: at });
		answer.ok = false;
		await applyOperateIntent({
			type: "finishRoute",
			from: at,
			to,
			kind: "preferred",
		});
		expect(useOperateStore.getState().routeStart).toEqual(at);
		answer.ok = true;
		await applyOperateIntent({
			type: "finishRoute",
			from: at,
			to,
			kind: "preferred",
		});
		expect(useOperateStore.getState().routeStart).toBeNull();
	});

	it("abandons a half-made route without asking the engine", async () => {
		useOperateStore.setState({ routeStart: at, notice: "old" });
		await applyOperateIntent({ type: "abandonRoute" });
		expect(sent).toEqual([]);
		expect(useOperateStore.getState()).toMatchObject({
			routeStart: null,
			notice: null,
		});
	});

	it("cancels routes and throws points", async () => {
		await applyOperateIntent({ type: "cancelRoute", at });
		await applyOperateIntent({ type: "togglePoints", at });
		await applyOperateIntent({ type: "callOn", at });
		await applyOperateIntent({ type: "none" });
		expect(sent).toEqual([
			{ type: "cancelRoute", at },
			{ type: "togglePoints", at },
			{ type: "callOn", at },
		]);
	});

	it("opens and closes the train menu without talking to the engine", async () => {
		await applyOperateIntent({
			type: "openTrainMenu",
			trainId: 5,
			screenX: 80,
			screenY: 160,
		});
		expect(useOperateStore.getState().trainMenu).toEqual({
			trainId: 5,
			screenX: 80,
			screenY: 160,
		});
		await applyOperateIntent({ type: "none" });
		expect(useOperateStore.getState().trainMenu).toBeNull();
		expect(sent).toEqual([]);
	});
});
