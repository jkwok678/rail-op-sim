import type { SimView } from "@rail-op-sim/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyTimetable, lineMap } from "#/host/__tests__/fixture";
import { useOperateStore } from "#/store/operate-store";
import {
	closeSimSession,
	openSimSession,
	restartSimSession,
	startSimBridge,
} from "#/store/sim-bridge";
import { memoryTransports } from "#/transport/__tests__/memory";
import type { EngineToHost, HostToEngine } from "#/transport/types";

function setUp() {
	const [host, engine, record] = memoryTransports<HostToEngine, EngineToHost>();
	const fromHost: HostToEngine[] = [];
	engine.onMessage((m) => fromHost.push(m));
	const bridge = startSimBridge(host, lineMap(), emptyTimetable);
	return { bridge, engine, fromHost, record };
}

const view = { time: 1, run: "running" } as SimView;

beforeEach(() => useOperateStore.getState().reset());

describe("startSimBridge", () => {
	it("loads the railway and waits for the engine", () => {
		const { fromHost } = setUp();
		expect(fromHost[0]?.type).toBe("load");
		expect(useOperateStore.getState().status).toBe("loading");
	});

	it("lands views, log lines and readiness in the store", () => {
		const { engine } = setUp();
		engine.send({ type: "ready" });
		engine.send({ type: "state_update", view });
		engine.send({
			type: "log",
			lines: [{ time: 1, level: "info", text: "hello" }],
		});
		const s = useOperateStore.getState();
		expect(s.status).toBe("ready");
		expect(s.view).toBe(view);
		expect(s.log.map((l) => l.text)).toEqual(["hello"]);
	});

	it("resolves a command with the engine's answer", async () => {
		const { bridge, engine, fromHost } = setUp();
		const pending = bridge.command({ type: "run" });
		const sent = fromHost[1];
		if (sent?.type !== "command") throw new Error("no command sent");
		engine.send({ type: "command_result", id: sent.id, result: { ok: true } });
		await expect(pending).resolves.toEqual({ ok: true });
	});

	it("shows an engine error", () => {
		const { engine } = setUp();
		engine.send({ type: "error", message: "boom" });
		expect(useOperateStore.getState()).toMatchObject({
			status: "error",
			error: "boom",
		});
	});

	it("settles waiting commands when the engine reports an error", async () => {
		const { bridge, engine } = setUp();
		const pending = bridge.command({ type: "run" });
		engine.send({ type: "error", message: "boom" });
		await expect(pending).resolves.toEqual({ ok: false, message: "boom" });
	});

	it("fails the session when the connection itself fails", async () => {
		const { bridge, record } = setUp();
		const pending = bridge.command({ type: "run" });
		record.fail.left("The simulation worker failed unexpectedly.");
		expect(useOperateStore.getState()).toMatchObject({
			status: "error",
			error: "The simulation worker failed unexpectedly.",
		});
		await expect(pending).resolves.toEqual({
			ok: false,
			message: "The simulation worker failed unexpectedly.",
		});
		// A dead connection answers nothing, so later commands are refused outright.
		await expect(bridge.command({ type: "run" })).resolves.toMatchObject({
			ok: false,
		});
	});

	it("stops listening for connection errors on dispose", () => {
		const { bridge, record } = setUp();
		bridge.dispose();
		record.fail.left("late");
		expect(useOperateStore.getState().status).toBe("idle");
	});

	it("disposes the engine and settles outstanding commands", async () => {
		const { bridge, fromHost, record } = setUp();
		const pending = bridge.command({ type: "run" });
		bridge.dispose();
		await expect(pending).resolves.toMatchObject({ ok: false });
		expect(fromHost[fromHost.length - 1]).toEqual({ type: "dispose" });
		expect(record.closed.left).toBe(true);
		expect(useOperateStore.getState().status).toBe("idle");
	});
});

describe("openSimSession", () => {
	afterEach(() => {
		closeSimSession();
		vi.unstubAllGlobals();
	});

	it("lands a Worker that cannot be created as an error, not a throw", () => {
		vi.stubGlobal(
			"Worker",
			class {
				constructor() {
					throw new Error("Workers are blocked");
				}
			},
		);
		expect(() => openSimSession(lineMap(), emptyTimetable)).not.toThrow();
		expect(useOperateStore.getState()).toMatchObject({
			status: "error",
			error: "The simulation worker could not start: Workers are blocked",
		});
	});

	it("restarts with the same railway and timetable on a fresh worker", () => {
		const first = memoryTransports<HostToEngine, EngineToHost>();
		const map = lineMap();
		openSimSession(map, emptyTimetable, first[0]);
		first[2].fail.left("dead");
		expect(useOperateStore.getState().status).toBe("error");

		const created: unknown[] = [];
		const posted: unknown[] = [];
		vi.stubGlobal(
			"Worker",
			class {
				constructor() {
					created.push(this);
				}
				postMessage(message: unknown) {
					posted.push(message);
				}
				addEventListener() {}
				removeEventListener() {}
				terminate() {}
			},
		);
		restartSimSession();
		expect(created).toHaveLength(1);
		expect(first[2].closed.left).toBe(true);
		expect(posted[0]).toEqual({
			type: "load",
			map,
			timetable: emptyTimetable,
		});
		expect(useOperateStore.getState().status).toBe("loading");
	});

	it("does nothing to restart when no session was opened", () => {
		closeSimSession();
		restartSimSession();
		expect(useOperateStore.getState().status).toBe("idle");
	});
});
