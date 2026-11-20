import {
	createTrackData,
	Map as Map_,
	StraightType,
} from "@rail-op-sim/shared";
import { Texture } from "pixi.js";
import { describe, expect, it, vi } from "vitest";
import { createTrackColorLayer } from "#/renderer/layers/TrackColorLayer";
import {
	createTrackLayer,
	type TrackLayer,
} from "#/renderer/layers/TrackLayer";
import type { TextureCache } from "#/renderer/textureCache";

function mapWithCustomTrack(): Map_ {
	const map = new Map_();
	map.setImageSize(1);
	const track = map.addTrack(
		createTrackData("straight", StraightType.STRAIGHTH),
		0,
		0,
	);
	track.setTrackMainSpeed(120);
	track.setTrackMainLength(50);
	return map;
}

describe("TrackColorLayer", () => {
	it("does not enable colour tints when sync() is called while hidden", () => {
		const syncColors = vi.fn();
		const trackLayer = { syncColors } as unknown as TrackLayer;
		const colorLayer = createTrackColorLayer(trackLayer);
		const map = new Map_();

		colorLayer.sync(map);
		expect(syncColors).not.toHaveBeenCalled();

		colorLayer.hide();
		colorLayer.sync(map);
		expect(syncColors).toHaveBeenCalledTimes(1);
		expect(syncColors).toHaveBeenLastCalledWith(map, false);
	});

	it("applies tints only between show() and hide()", () => {
		const syncColors = vi.fn();
		const trackLayer = { syncColors } as unknown as TrackLayer;
		const colorLayer = createTrackColorLayer(trackLayer);
		const map = new Map_();

		colorLayer.show(map);
		expect(syncColors).toHaveBeenLastCalledWith(map, true);

		colorLayer.sync(map);
		expect(syncColors).toHaveBeenCalledTimes(2);
		expect(syncColors).toHaveBeenLastCalledWith(map, true);

		colorLayer.hide();
		expect(syncColors).toHaveBeenLastCalledWith(map, false);

		colorLayer.sync(map);
		expect(syncColors).toHaveBeenCalledTimes(3);
	});

	it("keeps restored tracks themed when preload finishes after autosave restore", () => {
		const themed = Texture.WHITE;
		const colored = Texture.EMPTY;
		let preloaded = false;
		const textures = {
			get: vi.fn(() => (preloaded ? themed : null)),
			getColored: vi.fn(() => (preloaded ? colored : null)),
			getFile: vi.fn(() => null),
		} as unknown as TextureCache;

		const trackLayer = createTrackLayer(textures);
		const colorLayer = createTrackColorLayer(trackLayer);
		const map = mapWithCustomTrack();

		// 1. Autosave restores the railway before textures finish preloading.
		trackLayer.sync(map);
		colorLayer.hide();

		// 2. Texture preload finishes and syncs the layers.
		preloaded = true;
		trackLayer.sync(map);
		colorLayer.sync(map);

		expect(textures.getColored).not.toHaveBeenCalled();

		// 3. Entering the section tool explicitly shows the blue speed+length tint.
		colorLayer.show(map);
		expect(textures.getColored).toHaveBeenCalledWith(
			StraightType.STRAIGHTH,
			"#3b82f6",
			undefined,
		);

		// 4. Leaving the section tool hides the tint; later syncs stay themed.
		colorLayer.hide();
		vi.mocked(textures.getColored).mockClear();
		trackLayer.sync(map);
		colorLayer.sync(map);
		expect(textures.getColored).not.toHaveBeenCalled();

		colorLayer.destroy();
		trackLayer.destroy();
	});
});
