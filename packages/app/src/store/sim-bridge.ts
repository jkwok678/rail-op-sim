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
	/** Set once the connection has died: nothing more will be answered. */
	let failure: string | null = null;

	/**
	 * Show why the session is in trouble, and settle every command still
	 * waiting so no caller hangs on an answer that cannot come.
	 */
	const fail = (message: string): void => {
		store().setStatus("error", message);
		for (const resolve of waiting.values()) resolve({ ok: false, message });
		waiting.clear();
	};

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
			case "timetables":
				store().mergeTimetables(message.rows);
				return;
			case "command_result":
				waiting.get(message.id)?.(message.result);
				waiting.delete(message.id);
				return;
			case "error":
				debugLog("sim", `engine error: ${message.message}`);
				fail(message.message);
				return;
		}
	});
	const stopListeningForErrors = transport.onError((message) => {
		debugLog("sim", `transport error: ${message}`);
		failure = message;
		fail(message);
	});

	store().reset();
	store().setStatus("loading");
	transport.send({ type: "load", map, timetable });

	return {
		command(cmd) {
			if (failure !== null) {
				return Promise.resolve({ ok: false, message: failure });
			}
			const id = nextId++;
			return new Promise((resolve) => {
				waiting.set(id, resolve);
				transport.send({ type: "command", id, cmd });
			});
		},
		dispose() {
			stopListening();
			stopListeningForErrors();
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
function workerTransport(): HostTransport {
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

/**
 * Stands in for a worker that could not be created (no Worker support, a
 * blocked script): it fails as soon as the bridge sends it anything, so the
 * session lands in the error state through the same path as any other dead
 * connection, rather than throwing out of the effect that opens it.
 */
function unavailableTransport(message: string): HostTransport {
	const failed = new Set<(message: string) => void>();
	return {
		send() {
			for (const handler of [...failed]) handler(message);
		},
		onMessage: () => () => {},
		onError(handler) {
			failed.add(handler);
			return () => failed.delete(handler);
		},
		close() {},
	};
}

function connect(): HostTransport {
	try {
		return workerTransport();
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		return unavailableTransport(
			`The simulation worker could not start: ${reason}`,
		);
	}
}

let active: SimBridge | null = null;
/** What the open session was started with, so it can be started again. */
let last: { map: SerializedMap; timetable: Timetable } | null = null;

/** Open the operate session, closing any previous one. */
export function openSimSession(
	map: SerializedMap,
	timetable: Timetable,
	transport?: HostTransport,
): SimBridge {
	active?.dispose();
	last = { map, timetable };
	active = startSimBridge(transport ?? connect(), map, timetable);
	return active;
}

/** Start the session again from the same railway and timetable, on a fresh worker. */
export function restartSimSession(): void {
	if (last) openSimSession(last.map, last.timetable);
}

export function closeSimSession(): void {
	active?.dispose();
	active = null;
	last = null;
}

/**
 * Send a command to the open session. What it says — why it was refused, or
 * what it did — is put up as the panel's notice; a silent success clears it.
 */
export async function simCommand(cmd: SimCommand): Promise<CommandResult> {
	if (!active) return { ok: false, message: "No session is open." };
	const result = await active.command(cmd);
	useOperateStore.getState().setNotice(result.message ?? null);
	return result;
}
