import type { SimView } from "@rail-op-sim/shared";
import type { Container } from "pixi.js";
import { crossingArt, crossingsChanging, operateArt } from "#/lib/operateArt";
import { every } from "#/lib/timers";
import type { ElementLayer } from "#/renderer/layers/ElementLayer";
import { createRouteLayer } from "#/renderer/layers/RouteLayer";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";
import { createTrainLayer } from "#/renderer/layers/TrainLayer";

/** How often a route that is still setting, or barriers on the move, flash. */
const FLASH_MS = 250;

/**
 * State source for {@link attachOperateLayers}, passed in so the renderer
 * stays decoupled from application stores.
 */
export interface OperateLayersSource {
	/** Whether operate mode is currently active. */
	isOperateMode(): boolean;
	/** The engine's latest published view, or `null` when unavailable. */
	getView(): SimView | null;
	/** Subscribe to operate-mode changes; returns an unsubscribe function. */
	subscribeMode(onChange: () => void): () => void;
	/** Subscribe to view changes; returns an unsubscribe function. */
	subscribeView(onChange: () => void): () => void;
}

/**
 * Add operate mode's layers to `world` — routes under trains — and keep them
 * in step with the engine's published view. Signals and points show their
 * state in `track`'s own art: lit signals, and points drawn for the way they
 * lie. Level crossings show their barriers in `elements`' crossing art.
 * Outside operate mode the layers are empty and the track shows its usual
 * art. Returns a function that stops the updates.
 */
export function attachOperateLayers(
	world: Container,
	track: Pick<TrackLayer, "setOverrides">,
	elements: Pick<ElementLayer, "setLevelCrossingArt">,
	source: OperateLayersSource,
): () => void {
	const routes = createRouteLayer();
	const trains = createTrainLayer();
	world.addChild(routes.container, trains.container);

	let flashOn = true;
	const currentView = () => (source.isOperateMode() ? source.getView() : null);

	const syncFlashing = (): void => {
		const view = currentView();
		routes.sync(view, flashOn);
		elements.setLevelCrossingArt(crossingArt(view, flashOn));
	};
	const sync = (): void => {
		const view = currentView();
		syncFlashing();
		track.setOverrides(operateArt(view));
		trains.sync(view);
	};

	const unsubView = source.subscribeView(sync);
	const unsubMode = source.subscribeMode(sync);
	const stopFlashing = every(FLASH_MS, () => {
		const view = source.getView();
		if (!view?.pendingRoute && !crossingsChanging(view)) return;
		flashOn = !flashOn;
		syncFlashing();
	});

	return () => {
		unsubView();
		unsubMode();
		stopFlashing();
		track.setOverrides(new Map());
		elements.setLevelCrossingArt(new Map());
	};
}
