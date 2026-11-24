import {
	DEFAULT_MAX_ZOOM,
	DEFAULT_MIN_ZOOM,
	ZOOM_BUTTON_STEP,
} from "#/lib/zoomConstants";

/**
 * Discrete viewport commands, shared by the zoom controls and the hotkeys.
 *
 * Both used to need the same clamp against the zoom bounds; keeping it in one
 * place means a key and its button can't drift apart. Typed against the parts of
 * `ViewportController` these need rather than the class, so the module stays free
 * of pixi and can be unit-tested with a plain stub.
 */
export interface ZoomableViewport {
	readonly state: { zoom: number };
	zoomTo(zoom: number, screenX?: number, screenY?: number): void;
	fitToView(extent: number, padding: number): void;
}

/**
 * Extent and padding the app opens with. Fit-to-view reuses them so the key
 * restores the view the user started from, rather than framing whatever they
 * have built so far at some other scale.
 */
export const FIT_EXTENT = 320;
export const FIT_PADDING = 40;

export function zoomIn(viewport: ZoomableViewport | null | undefined): void {
	if (!viewport) return;
	viewport.zoomTo(
		Math.min(DEFAULT_MAX_ZOOM, viewport.state.zoom + ZOOM_BUTTON_STEP),
	);
}

export function zoomOut(viewport: ZoomableViewport | null | undefined): void {
	if (!viewport) return;
	viewport.zoomTo(
		Math.max(DEFAULT_MIN_ZOOM, viewport.state.zoom - ZOOM_BUTTON_STEP),
	);
}

export function fitToView(viewport: ZoomableViewport | null | undefined): void {
	if (!viewport) return;
	viewport.fitToView(FIT_EXTENT, FIT_PADDING);
}
