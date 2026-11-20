import { describe, expect, it } from "vitest";
import { type HostClock, startEngineHost } from "#/host/engine-host";
import { memoryTransports } from "#/transport/__tests__/memory";
import type { EngineToHost, HostToEngine } from "#/transport/types";
import { emptyTimetable, lineMap } from "./fixture";

function fakeClock() {
	let now = 0;
	const tasks: { at: number; fn: () => void; id: number }[] = [];
	let nextId = 1;
	const clock: HostClock = {
		now: () => now,
		schedule(fn, ms) {
			const id = nextId++;
			tasks.push({ at: now + ms, fn, id });
			return id;
		},
		cancel(handle) {
			const i = tasks.findIndex((t) => t.id === handle);
			if (i >= 0) tasks.splice(i, 1);
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
	return { clock, advance };
}

function setUp() {
	const [host, engineEnd, record] = memoryTransports<
		HostToEngine,
		EngineToHost
	>();
	const { clock, advance } = fakeClock();
	startEngineHost(engineEnd, clock);
	const received: EngineToHost[] = [];
	host.onMessage((m) => received.push(m));
	return { host, received, advance, record };
}

const latestView = (received: EngineToHost[]) => {
	const updates = received.filter((m) => m.type === "state_update");
	const last = updates[updates.length - 1];
	return last?.type === "state_update" ? last.view : null;
};

describe("engine host", () => {
	it("loads a railway and publishes its view", () => {
		const { host, received } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		expect(received[0]).toEqual({ type: "ready" });
		expect(latestView(received)?.run).toBe("prestart");
	});

	it("answers commands and runs the clock at the chosen speed", () => {
		const { host, received, advance } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		host.send({ type: "command", id: 7, cmd: { type: "setSpeed", speed: 4 } });
		host.send({ type: "command", id: 8, cmd: { type: "run" } });
		expect(received).toContainEqual({
			type: "command_result",
			id: 8,
			result: { ok: true },
		});
		advance(1000);
		const view = latestView(received);
		expect(view?.time).toBeGreaterThan(6 * 3600 + 3);
		expect(view?.time).toBeLessThanOrEqual(6 * 3600 + 4.01);
	});

	it("reports a malformed message instead of acting on it", () => {
		const { host, received } = setUp();
		host.send({ type: "command", id: 1, cmd: { type: "fly" } } as never);
		expect(received[0]?.type).toBe("error");
	});

	it("refuses commands before anything is loaded", () => {
		const { host, received } = setUp();
		host.send({ type: "command", id: 1, cmd: { type: "run" } });
		expect(received[0]).toMatchObject({
			type: "command_result",
			result: { ok: false },
		});
	});

	it("stops and closes on dispose", () => {
		const { host, record, advance, received } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		host.send({ type: "dispose" });
		const count = received.length;
		advance(1000);
		expect(received).toHaveLength(count);
		expect(record.closed.right).toBe(true);
	});

	it("publishes only changed views", () => {
		const { host, received, advance } = setUp();
		host.send({ type: "load", map: lineMap(), timetable: emptyTimetable });
		const updates = () =>
			received.filter((m) => m.type === "state_update").length;
		const before = updates();
		advance(1000);
		expect(updates()).toBe(before);
		host.send({ type: "command", id: 1, cmd: { type: "setSpeed", speed: 4 } });
		expect(updates()).toBe(before + 1);
	});
});
