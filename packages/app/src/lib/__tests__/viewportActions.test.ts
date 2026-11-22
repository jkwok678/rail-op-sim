import { describe, expect, it, vi } from "vitest";
import {
	DEFAULT_MAX_ZOOM,
	DEFAULT_MIN_ZOOM,
	ZOOM_BUTTON_STEP,
} from "#/editor/zoomConstants";
import {
	FIT_EXTENT,
	FIT_PADDING,
	fitToView,
	type ZoomableViewport,
	zoomIn,
	zoomOut,
} from "#/lib/viewportActions";

const stub = (zoom: number) => ({
	state: { zoom },
	zoomTo: vi.fn(),
	fitToView: vi.fn(),
});

describe("zoomIn", () => {
	it("steps up by one button step", () => {
		const vp = stub(1);
		zoomIn(vp);
		expect(vp.zoomTo).toHaveBeenCalledWith(1 + ZOOM_BUTTON_STEP);
	});

	it("clamps at the maximum rather than overshooting", () => {
		const vp = stub(DEFAULT_MAX_ZOOM);
		zoomIn(vp);
		expect(vp.zoomTo).toHaveBeenCalledWith(DEFAULT_MAX_ZOOM);
	});
});

describe("zoomOut", () => {
	it("steps down by one button step", () => {
		const vp = stub(1);
		zoomOut(vp);
		expect(vp.zoomTo).toHaveBeenCalledWith(1 - ZOOM_BUTTON_STEP);
	});

	it("clamps at the minimum rather than undershooting", () => {
		const vp = stub(DEFAULT_MIN_ZOOM);
		zoomOut(vp);
		expect(vp.zoomTo).toHaveBeenCalledWith(DEFAULT_MIN_ZOOM);
	});
});

describe("fitToView", () => {
	it("uses the same framing the app opens with", () => {
		const vp = stub(1);
		fitToView(vp);
		expect(vp.fitToView).toHaveBeenCalledWith(FIT_EXTENT, FIT_PADDING);
	});
});

// The hotkeys fire against whatever the singleton controller has, which is null
// until pixi has mounted — a key pressed during startup must not throw.
describe("with no viewport yet", () => {
	it("is a no-op", () => {
		const absent: ZoomableViewport | null = null;
		expect(() => {
			zoomIn(absent);
			zoomOut(absent);
			fitToView(absent);
			zoomIn(undefined);
		}).not.toThrow();
	});
});
