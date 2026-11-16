import type { SimTransport } from "./types";

/**
 * Anything that speaks `postMessage`: a `Worker` from the page's side, the
 * worker's own global scope from the inside.
 */
export interface MessagePort {
	postMessage(message: unknown): void;
	addEventListener(type: "message", listener: (e: MessageEvent) => void): void;
	addEventListener(
		type: "error" | "messageerror",
		listener: (e: Event) => void,
	): void;
	removeEventListener(
		type: "message",
		listener: (e: MessageEvent) => void,
	): void;
	removeEventListener(
		type: "error" | "messageerror",
		listener: (e: Event) => void,
	): void;
}

/** A sentence for a failure event, which often carries no text of its own. */
function describeFailure(type: "error" | "messageerror", e: Event): string {
	const text = (e as ErrorEvent).message;
	if (text) return text;
	return type === "error"
		? "The simulation worker failed unexpectedly."
		: "The simulation sent a message that could not be read.";
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
		onError(handler) {
			const types = ["error", "messageerror"] as const;
			const listeners = types.map((type) => {
				const listener = (e: Event) => handler(describeFailure(type, e));
				port.addEventListener(type, listener);
				return listener;
			});
			return () =>
				types.forEach((type, i) => {
					port.removeEventListener(type, listeners[i]);
				});
		},
		close,
	};
}
