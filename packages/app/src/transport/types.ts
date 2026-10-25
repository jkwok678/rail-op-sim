import type {
	CommandResult,
	LogLine,
	SerializedMap,
	SimCommand,
	SimView,
	Timetable,
} from "@rail-op-sim/shared";

/**
 * The protocol between the simulation engine and whatever shows it.
 *
 * The engine only ever sees a {@link SimTransport}: today a Web Worker's
 * `postMessage`, later a socket. Every message is plain data.
 */

/** Host → engine. */
export type HostToEngine =
	| { type: "load"; map: SerializedMap; timetable: Timetable }
	| { type: "command"; id: number; cmd: SimCommand }
	| { type: "dispose" };

/** Engine → host. */
export type EngineToHost =
	| { type: "ready" }
	| { type: "state_update"; view: SimView }
	| { type: "log"; lines: LogLine[] }
	| { type: "command_result"; id: number; result: CommandResult }
	| { type: "error"; message: string };

/** One end of a connection: send `Out`, receive `In`. */
export interface SimTransport<In, Out> {
	send(message: Out): void;
	/** Listen for messages; returns a function that stops listening. */
	onMessage(handler: (message: In) => void): () => void;
	close(): void;
}

/** The engine's end. */
export type EngineTransport = SimTransport<HostToEngine, EngineToHost>;
/** The host's end. */
export type HostTransport = SimTransport<EngineToHost, HostToEngine>;
