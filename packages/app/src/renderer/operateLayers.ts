import type { Container } from "pixi.js";
import { createRouteLayer } from "#/renderer/layers/RouteLayer";
import { createSignalStateLayer } from "#/renderer/layers/SignalStateLayer";
import { createTrainLayer } from "#/renderer/layers/TrainLayer";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";

/** How often a route that is still setting flashes. */
const FLASH_MS = 250;

/**
 * Add operate mode's layers to `world` — routes under signal lamps under
 * trains — and keep them in step with the engine's published view. Outside
 * operate mode they are empty. Returns a function that stops the updates.
 */
export function attachOperateLayers(world: Container): () => void {
	const routes = createRouteLayer();
	const signals = createSignalStateLayer();
	const trains = createTrainLayer();
	world.addChild(routes.container, signals.container, trains.container);

	let flashOn = true;
	const sync = (): void => {
		const operating = useModeStore.getState().mode === "operate";
		const view = operating ? useOperateStore.getState().view : null;
		routes.sync(view, flashOn);
		signals.sync(view);
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
		sync();
	}, FLASH_MS);

	return () => {
		unsubView();
		unsubMode();
		clearInterval(flash);
	};
}
