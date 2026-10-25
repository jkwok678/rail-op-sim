import type {
	CommandResult,
	SerializedMap,
	SimCommand,
	Timetable,
} from "@rail-op-sim/shared";
import { debugLog } from "#/lib/debugLogger";
import { useOperateStore } from "#/store/operate-store";
import { postMessageTransport } from "#/transport/postmessage-transport";
import type {
	EngineToHost,
	HostToEngine,
	HostTransport,
} from "#/transport/types";

/**
 * The page's side of the simulation: starts an engine behind a transport,
 * forwards commands to it, and lands what it publishes in the operate store.
 *
 * One session at a time — operate mode opens it on entry and closes it on
 * exit.
 */

export interface SimBridge {
	command(cmd: SimCommand): Promise<CommandResult>;
	dispose(): void;
}

export function startSimBridge(
	transport: HostTransport,
	map: SerializedMap,
	timetable: Timetable,
): SimBridge {
	const store = useOperateStore.getState;
	const waiting = new Map<number, (result: CommandResult) => void>();
	let nextId = 1;

	const stopListening = transport.onMessage((message: EngineToHost) => {
		switch (message.type) {
			case "ready":
				store().setStatus("ready");
				return;
			case "state_update":
				store().setView(message.view);
				return;
			case "log":
				store().appendLog(message.lines);
				return;
			case "command_result":
				waiting.get(message.id)?.(message.result);
				waiting.delete(message.id);
				return;
			case "error":
				debugLog("sim", `engine error: ${message.message}`);
				store().setStatus("error", message.message);
				return;
		}
	});

	store().reset();
	store().setStatus("loading");
	transport.send({ type: "load", map, timetable });

	return {
		command(cmd) {
			const id = nextId++;
			return new Promise((resolve) => {
				waiting.set(id, resolve);
				transport.send({ type: "command", id, cmd });
			});
		},
		dispose() {
			stopListening();
			for (const resolve of waiting.values()) {
				resolve({ ok: false, message: "The session has ended." });
			}
			waiting.clear();
			transport.send({ type: "dispose" });
			transport.close();
			store().reset();
		},
	};
}

/** A transport to a fresh engine worker. */
export function workerTransport(): HostTransport {
	const worker = new Worker(
		new URL("../host/worker-host.ts", import.meta.url),
		{
			type: "module",
		},
	);
	return postMessageTransport<EngineToHost, HostToEngine>(worker, () =>
		worker.terminate(),
	);
}

let active: SimBridge | null = null;

/** Open the operate session, closing any previous one. */
export function openSimSession(
	map: SerializedMap,
	timetable: Timetable,
	transport: HostTransport = workerTransport(),
): SimBridge {
	active?.dispose();
	active = startSimBridge(transport, map, timetable);
	return active;
}

export function closeSimSession(): void {
	active?.dispose();
	active = null;
}

/**
 * Send a command to the open session. A refusal is put up as the panel's
 * notice; anything accepted clears it.
 */
export async function simCommand(cmd: SimCommand): Promise<CommandResult> {
	if (!active) return { ok: false, message: "No session is open." };
	const result = await active.command(cmd);
	useOperateStore.getState().setNotice(result.ok ? null : result.message);
	return result;
}
