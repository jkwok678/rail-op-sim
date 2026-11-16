import { Ticker } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { guardTicker } from "#/engine/guardTicker";

describe("guardTicker", () => {
	it("passes a normal frame through", () => {
		const ticker = new Ticker();
		const tick = vi.fn();
		ticker.add(tick);
		const onError = vi.fn();
		guardTicker(ticker, onError);
		ticker.update(16);
		expect(tick).toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});

	it("catches an error in the real frame loop, stops it and reports once", () => {
		// Drive PixiJS's own loop, which calls `update` through `this`.
		const frames: FrameRequestCallback[] = [];
		vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
			frames.push(cb);
			return frames.length;
		});
		vi.stubGlobal("cancelAnimationFrame", () => {});
		const ticker = new Ticker();
		ticker.add(() => {
			throw new Error("bad frame");
		});
		const onError = vi.fn();
		guardTicker(ticker, onError);
		ticker.start();
		const frame = frames.shift();
		expect(frame).toBeDefined();
		expect(() => frame?.(performance.now() + 16)).not.toThrow();
		expect(ticker.started).toBe(false);
		expect(frames).toHaveLength(0);
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith(new Error("bad frame"));
		ticker.destroy();
		vi.unstubAllGlobals();
	});

	it("wraps a thrown non-Error", () => {
		const ticker = {
			update: (): void => {
				throw "plain";
			},
			stop: vi.fn(),
		};
		const onError = vi.fn();
		guardTicker(ticker, onError);
		ticker.update();
		expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
		expect(onError.mock.calls[0][0].message).toBe("plain");
		expect(ticker.stop).toHaveBeenCalled();
	});
});
