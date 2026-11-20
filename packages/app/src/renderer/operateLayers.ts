import type { Container } from "pixi.js";
import { crossingArt, crossingsChanging, operateArt } from "#/lib/operateArt";
import type { ElementLayer } from "#/renderer/layers/ElementLayer";
import { createRouteLayer } from "#/renderer/layers/RouteLayer";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";
import { createTrainLayer } from "#/renderer/layers/TrainLayer";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";

/** How often a route that is still setting, or barriers on the move, flash. */
const FLASH_MS = 250;

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
): () => void {
	const routes = createRouteLayer();
	const trains = createTrainLayer();
	world.addChild(routes.container, trains.container);

	let flashOn = true;
	const currentView = () =>
		useModeStore.getState().mode === "operate"
			? useOperateStore.getState().view
			: null;

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

	const unsubView = useOperateStore.subscribe((state, prev) => {
		if (state.view !== prev.view) sync();
	});
	const unsubMode = useModeStore.subscribe((state, prev) => {
		if (state.mode !== prev.mode) sync();
	});
	const flash = setInterval(() => {
		const view = useOperateStore.getState().view;
		if (!view?.pendingRoute && !crossingsChanging(view)) return;
		flashOn = !flashOn;
		syncFlashing();
	}, FLASH_MS);

	return () => {
		unsubView();
		unsubMode();
		clearInterval(flash);
		track.setOverrides(new Map());
		elements.setLevelCrossingArt(new Map());
	};
}
