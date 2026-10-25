import type { SimView } from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { emptyTimetable, lineMap } from "#/host/__tests__/fixture";
import { useOperateStore } from "#/store/operate-store";
import { startSimBridge } from "#/store/sim-bridge";
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
