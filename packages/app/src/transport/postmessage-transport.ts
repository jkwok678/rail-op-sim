import type { SimTransport } from "./types";

/**
 * Anything that speaks `postMessage`: a `Worker` from the page's side, the
 * worker's own global scope from the inside.
 */
export interface MessagePort {
	postMessage(message: unknown): void;
	addEventListener(type: "message", listener: (e: MessageEvent) => void): void;
	removeEventListener(
		type: "message",
		listener: (e: MessageEvent) => void,
	): void;
}

/** A {@link SimTransport} over a {@link MessagePort}; `close` tears the port down. */
export function postMessageTransport<In, Out>(
	port: MessagePort,
	close: () => void,
): SimTransport<In, Out> {
	return {
		send(message) {
			port.postMessage(message);
		},
		onMessage(handler) {
			const listener = (e: MessageEvent) => handler(e.data as In);
			port.addEventListener("message", listener);
			return () => port.removeEventListener("message", listener);
		},
		close,
	};
}
