import type { Map as Map_ } from "@rail-op-sim/shared";
import { Container } from "pixi.js";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";

export interface TrackColorLayer {
	container: Container;
	/** Turn speed/length colour tints on and apply them to all track sprites. */
	show(map: Map_): void;
	/** Re-apply speed/length colour tints if the layer is currently shown. */
	sync(map: Map_): void;
	/** Hide colour tints (restore themed textures on all track sprites). */
	hide(): void;
	destroy(): void;
}

/**
 * Coordinates speed/length colour tinting by delegating to
 * {@link TrackLayer.syncColors}. The container is kept in the scene graph
 * (empty, between ground and trackLayer) so no scene-graph reordering is
 * needed.
 *
 * Only active while explicitly shown (e.g. when the section tool is active):
 * calling `sync()` while hidden is a no-op so background refreshes such as
 * texture preload, theme switches, or track edits never turn colours on.
 */
export function createTrackColorLayer(trackLayer: TrackLayer): TrackColorLayer {
	const container = new Container();
	container.label = "track-color-layer";
	// No Graphics child — colour is applied directly as sprite tints

	let active = false;
	let lastMap: Map_ | null = null;

	function show(map: Map_): void {
		active = true;
		lastMap = map;
		trackLayer.syncColors(map, true);
	}

	function sync(map: Map_): void {
		lastMap = map;
		if (active) trackLayer.syncColors(map, true);
	}

	function hide(): void {
		active = false;
		if (lastMap) trackLayer.syncColors(lastMap, false);
	}

	function destroy(): void {
		active = false;
		container.destroy({ children: true });
	}

	return { container, show, sync, hide, destroy };
}
