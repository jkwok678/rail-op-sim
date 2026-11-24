import type { Engine } from "@rail-op-sim/shared";
import { describe, expect, it, vi } from "vitest";
import { type HostClock, startEngineHost } from "#/host/engine-host";
import { memoryTransports } from "#/transport/__tests__/memory";
import type { EngineToHost, HostToEngine } from "#/transport/types";
import { emptyTimetable, lineMap } from "./fixture";

/** What the next engine created should throw, if anything. */
const trip = vi.hoisted(() => ({ advance: false, handle: false }));

vi.mock("@rail-op-sim/shared", async (importOriginal) => {
	const shared = await importOriginal<typeof import("@rail-op-sim/shared")>();
	return {
		...shared,
		createEngine: (...args: Parameters<typeof shared.createEngine>) => {
			const engine = shared.createEngine(...args);
			const advance = engine.advance.bind(engine);
			const handle = engine.handle.bind(engine);
			engine.advance = (seconds: number) => {
				if (trip.advance) throw new Error("advance blew up");
				advance(seconds);
			};
			engine.handle = (cmd) => {
				if (trip.handle) throw new Error("handle blew up");
				return handle(cmd);
			};
			return engine as Engine;
		},
	};
});

function setUp() {
	const [host, engineEnd] = memoryTransports<HostToEngine, EngineToHost>();
	let now = 0;
	const tasks: { at: number; fn: () => void; id: number }[] = [];
	let nextId = 1;
	const clock: HostClock = {
		now: () => now,
		schedule(fn, ms) {
			const id = nextId++;
			tasks.push({ at: now + ms, fn, id });
			return () => {
				const i = tasks.findIndex((t) => t.id === id);
				if (i >= 0) tasks.splice(i, 1);
			};
		},
	};
	const advance = (ms: number) => {
		const end = now + ms;
		for (;;) {
			tasks.sort((a, b) => a.at - b.at);
			const task = tasks[0];
			if (!task || task.at > end) break;
			tasks.shift();
			now = task.at;
			task.fn();
		}
		now = end;
	};
	startEngineHost(engineEnd, clock);
	const received: EngineToHost[] = [];
	host.onMessage((m) => received.push(m));
	return { host, received, advance, pending: () => tasks.length };
}

describe("engine host crashes", () => {
	it("reports a frame that throws, stops the loop and drops the engine", () => {
		trip.advance = false;
		trip.handle = false;
		const { host, received, advance, pending } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		trip.advance = true;
		advance(100);
		expect(received).toContainEqual({
			type: "error",
			message: "advance blew up",
		});
		expect(pending()).toBe(0);

		const count = received.length;
		advance(1000);
		expect(received).toHaveLength(count);

		host.send({ type: "command", id: 1, cmd: { type: "run" } });
		expect(received).toContainEqual({
			type: "command_result",
			id: 1,
			result: { ok: false, message: "Nothing is loaded." },
		});
		trip.advance = false;
	});

	it("stops when a command throws", () => {
		trip.advance = false;
		trip.handle = false;
		const { host, received, advance, pending } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		trip.handle = true;
		host.send({ type: "command", id: 2, cmd: { type: "run" } });
		expect(received).toContainEqual({
			type: "error",
			message: "handle blew up",
		});
		expect(pending()).toBe(0);
		advance(1000);
		trip.handle = false;
		host.send({ type: "command", id: 3, cmd: { type: "run" } });
		expect(received).toContainEqual({
			type: "command_result",
			id: 3,
			result: { ok: false, message: "Nothing is loaded." },
		});
	});

	// Every `error` ends the session, so the host can treat it as fatal: a
	// malformed message stops the engine rather than leaving it running behind
	// a panel that says it stopped.
	it("stops on a message it cannot read", () => {
		trip.advance = false;
		trip.handle = false;
		const { host, received, pending } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		host.send({ type: "nonsense" } as unknown as HostToEngine);
		expect(received.some((m) => m.type === "error")).toBe(true);
		expect(pending()).toBe(0);
		host.send({ type: "command", id: 4, cmd: { type: "run" } });
		expect(received).toContainEqual({
			type: "command_result",
			id: 4,
			result: { ok: false, message: "Nothing is loaded." },
		});
	});
});
