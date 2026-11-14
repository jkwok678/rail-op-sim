import type { Container } from "pixi.js";
import { operateArt } from "#/lib/operateArt";
import { createRouteLayer } from "#/renderer/layers/RouteLayer";
import type { TrackLayer } from "#/renderer/layers/TrackLayer";
import { createTrainLayer } from "#/renderer/layers/TrainLayer";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";

/** How often a route that is still setting flashes. */
const FLASH_MS = 250;

/**
 * Add operate mode's layers to `world` — routes under trains — and keep them
 * in step with the engine's published view. Signals and points show their
 * state in `track`'s own art: lit signals, and points drawn for the way they
 * lie. Outside operate mode the layers are empty and the track shows its
 * usual art. Returns a function that stops the updates.
 */
export function attachOperateLayers(
	world: Container,
	track: Pick<TrackLayer, "setOverrides">,
): () => void {
	const routes = createRouteLayer();
	const trains = createTrainLayer();
	world.addChild(routes.container, trains.container);

	let flashOn = true;
	const currentView = () =>
		useModeStore.getState().mode === "operate"
			? useOperateStore.getState().view
			: null;

	const syncRoutes = (): void => routes.sync(currentView(), flashOn);
	const sync = (): void => {
		const view = currentView();
		routes.sync(view, flashOn);
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
		if (!useOperateStore.getState().view?.pendingRoute) return;
		flashOn = !flashOn;
		syncRoutes();
	}, FLASH_MS);

	return () => {
		unsubView();
		unsubMode();
		clearInterval(flash);
		track.setOverrides(new Map());
	};
}
