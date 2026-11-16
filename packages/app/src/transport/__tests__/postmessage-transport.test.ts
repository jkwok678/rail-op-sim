import { describe, expect, it, vi } from "vitest";
import {
	type MessagePort,
	postMessageTransport,
} from "../postmessage-transport";

/** A port that remembers its listeners, so a test can fire events at them. */
function fakePort() {
	const listeners = new Map<string, Set<(e: Event) => void>>();
	const port = {
		postMessage: vi.fn(),
		addEventListener(type: string, listener: (e: Event) => void) {
			if (!listeners.has(type)) listeners.set(type, new Set());
			listeners.get(type)?.add(listener);
		},
		removeEventListener(type: string, listener: (e: Event) => void) {
			listeners.get(type)?.delete(listener);
		},
	};
	const fire = (type: string, e: Partial<ErrorEvent> = {}) => {
		for (const l of [...(listeners.get(type) ?? [])]) l(e as Event);
	};
	const count = (type: string) => listeners.get(type)?.size ?? 0;
	return { port: port as unknown as MessagePort, fire, count };
}

describe("postMessageTransport onError", () => {
	it("reports a worker's uncaught error with its message", () => {
		const { port, fire } = fakePort();
		const handler = vi.fn();
		postMessageTransport(port, () => {}).onError(handler);
		fire("error", { message: "Uncaught TypeError: x is not a function" });
		expect(handler).toHaveBeenCalledWith(
			"Uncaught TypeError: x is not a function",
		);
	});

	it("falls back to a sentence when the event has no message", () => {
		const { port, fire } = fakePort();
		const handler = vi.fn();
		postMessageTransport(port, () => {}).onError(handler);
		fire("error", { message: "" });
		fire("messageerror");
		expect(handler).toHaveBeenNthCalledWith(
			1,
			"The simulation worker failed unexpectedly.",
		);
		expect(handler).toHaveBeenNthCalledWith(
			2,
			"The simulation sent a message that could not be read.",
		);
	});

	it("stops listening when unsubscribed", () => {
		const { port, fire, count } = fakePort();
		const handler = vi.fn();
		const stop = postMessageTransport(port, () => {}).onError(handler);
		expect(count("error")).toBe(1);
		expect(count("messageerror")).toBe(1);
		stop();
		expect(count("error")).toBe(0);
		expect(count("messageerror")).toBe(0);
		fire("error", { message: "late" });
		expect(handler).not.toHaveBeenCalled();
	});
});
