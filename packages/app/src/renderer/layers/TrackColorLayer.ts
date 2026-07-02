import { Container } from "pixi.js";
import type { Map as Map_ } from "@rail-op-sim/shared";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";

export interface TrackColorLayer {
	container: Container;
	/** Full sync: apply speed/length colour tints to track sprites. */
	sync(map: Map_): void;
	/** Hide colour tints (reset all sprites to identity tint). */
	hide(): void;
	destroy(): void;
}

/**
 * Coordinates speed/length colour tinting by delegating to
 * {@link TrackLayer.syncColors}. The container is kept in the scene graph
 * (empty, between ground and trackLayer) so no scene-graph reordering is
 * needed.
 *
 * Only active when a section is selected for editing (toggled by
 * PlacementController).
 */
export function createTrackColorLayer(trackLayer: TrackLayer): TrackColorLayer {
	const container = new Container();
	container.label = "track-color-layer";
	// No Graphics child — colour is applied directly as sprite tints

	let lastMap: Map_ | null = null;

	function sync(map: Map_): void {
		lastMap = map;
		trackLayer.syncColors(map, true);
	}

	function hide(): void {
		if (lastMap) trackLayer.syncColors(lastMap, false);
	}

	function destroy(): void {
		container.destroy({ children: true });
	}

	return { container, sync, hide, destroy };
}
