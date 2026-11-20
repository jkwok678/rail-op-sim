import type {
	CommandResult,
	LogLine,
	SerializedMap,
	SimCommand,
	SimView,
	Timetable,
	TrainTimetableRow,
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
	/** Formatted timetable rows by train id, for trains whose working is new or changed. */
	| { type: "timetables"; rows: Record<number, TrainTimetableRow[]> }
	| { type: "command_result"; id: number; result: CommandResult }
	/**
	 * The engine has stopped and dropped its state; nothing more will be
	 * answered. Never sent for a problem the engine carries on through — a
	 * refused command is a `command_result` with `ok: false`.
	 */
	| { type: "error"; message: string };

/** One end of a connection: send `Out`, receive `In`. */
export interface SimTransport<In, Out> {
	send(message: Out): void;
	/** Listen for messages; returns a function that stops listening. */
	onMessage(handler: (message: In) => void): () => void;
	/**
	 * Listen for the connection itself failing — a worker's uncaught error, a
	 * message that could not be deserialised, later a dropped socket. Distinct
	 * from an `error` message, which the engine sends while still working.
	 * Returns a function that stops listening.
	 */
	onError(handler: (message: string) => void): () => void;
	close(): void;
}

/** The engine's end. */
export type EngineTransport = SimTransport<HostToEngine, EngineToHost>;
/** The host's end. */
export type HostTransport = SimTransport<EngineToHost, HostToEngine>;
