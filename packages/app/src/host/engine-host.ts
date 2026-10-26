import {
	createEngine,
	deserializeMap,
	type Engine,
	parseTimetable,
	Map as RailMap,
} from "@rail-op-sim/shared";
import { parseHostMessage } from "#/transport/schemas";
import type { EngineTransport, HostToEngine } from "#/transport/types";

/**
 * Hosts one engine behind a transport: loads it, feeds it commands, runs its
 * clock against wall time, and publishes what it shows.
 *
 * The clock is injected so the loop can be driven by a test; in the worker it
 * is `performance.now` and `setTimeout`.
 */

export interface HostClock {
	now(): number;
	schedule(fn: () => void, ms: number): unknown;
	cancel(handle: unknown): void;
}

/** How often the loop runs. */
const FRAME_MS = 16;
/** How often the view is published: 20 Hz is plenty for a signalling panel. */
const VIEW_MS = 50;
/** Most wall time one frame may make up, so a stalled tab does not lurch. */
const MAX_FRAME_S = 0.25;

export function startEngineHost(
	transport: EngineTransport,
	clock: HostClock,
): void {
	let engine: Engine | null = null;
	let timer: unknown = null;
	let last = 0;
	let lastView = 0;

	const publish = (): void => {
		if (!engine) return;
		lastView = clock.now();
		transport.send({ type: "state_update", view: engine.view() });
		const lines = engine.drainLog();
		if (lines.length > 0) transport.send({ type: "log", lines });
	};

	const frame = (): void => {
		if (!engine) return;
		const now = clock.now();
		const seconds = Math.min((now - last) / 1000, MAX_FRAME_S);
		last = now;
		engine.advance(seconds * engine.state.speed);
		if (now - lastView >= VIEW_MS) publish();
		timer = clock.schedule(frame, FRAME_MS);
	};

	const stop = (): void => {
		if (timer !== null) clock.cancel(timer);
		timer = null;
	};

	const load = (message: Extract<HostToEngine, { type: "load" }>): void => {
		const map = new RailMap();
		deserializeMap(message.map, map);
		engine = createEngine({
			map,
			timetable: parseTimetable(message.timetable),
		});
		transport.send({ type: "ready" });
		publish();
		stop();
		last = clock.now();
		timer = clock.schedule(frame, FRAME_MS);
	};

	const handle = (message: HostToEngine): void => {
		switch (message.type) {
			case "load":
				load(message);
				return;
			case "command": {
				const result = engine
					? engine.handle(message.cmd)
					: { ok: false as const, message: "Nothing is loaded." };
				transport.send({ type: "command_result", id: message.id, result });
				publish();
				return;
			}
			case "dispose":
				stop();
				engine = null;
				transport.close();
				return;
		}
	};

	transport.onMessage((raw) => {
		const parsed = parseHostMessage(raw);
		if (!parsed.ok) {
			transport.send({ type: "error", message: parsed.error });
			return;
		}
		try {
			handle(parsed.message);
		} catch (error) {
			transport.send({
				type: "error",
				message: error instanceof Error ? error.message : String(error),
			});
		}
	});
}
