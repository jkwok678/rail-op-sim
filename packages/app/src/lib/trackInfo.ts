import {
	aspectToLabel,
	hasSecondaryPath,
	kindToShortLabel,
	subtypeToCode,
	type Track,
} from "@rail-op-sim/shared";
import type { HoveredTrackInfo } from "#/store/editor-store";

/**
 * Build the plain-data tooltip snapshot for `track`. Kept out of
 * PlacementController so the "what does the tooltip say about this kind of
 * track" question is answerable without a pixi application; the controller
 * only decides *when* to call this.
 *
 * `gx`/`gy` are the hovered cell and `screenX`/`screenY` the pointer in
 * viewport coordinates.
 */
export function buildHoveredTrackInfo(
	track: Track,
	gx: number,
	gy: number,
	screenX: number,
	screenY: number,
): HoveredTrackInfo {
	// A switch/crossover/flyover carries a second path with its own figures;
	// showing only the main pair would read as the whole track.
	const secondary = hasSecondaryPath(track.data.kind);
	return {
		kindLabel: kindToShortLabel(track.data.kind),
		subtypeCode: subtypeToCode(track.data.kind, track.data.subtype),
		mainSpeed: track.getTrackMainSpeed(),
		mainLength: track.getTrackMainLength(),
		secondarySpeed: secondary ? track.getTrackSecondarySpeed() : null,
		secondaryLength: secondary ? track.getTrackSecondaryLength() : null,
		// Two signals of the same subtype differ only by aspect, so without it
		// their tooltips would be indistinguishable.
		aspectLabel:
			track.data.kind === "signal" ? aspectToLabel(track.data.aspect) : null,
		gx,
		gy,
		screenX,
		screenY,
	};
}
