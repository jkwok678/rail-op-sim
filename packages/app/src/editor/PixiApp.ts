import type { ApplicationOptions } from "pixi.js";
import { Application } from "pixi.js";

const DEFAULT_OPTIONS: Partial<ApplicationOptions> = {
	backgroundAlpha: 0,
	antialias: true,
	resolution: window.devicePixelRatio || 1,
	autoDensity: true,
};

/**
 * Creates and initializes a PixiJS v8 Application.
 * Callers can override or extend the defaults by passing options.
 */
export async function createPixiApp(
	options?: Partial<ApplicationOptions>,
): Promise<Application> {
	const app = new Application();
	await app.init({
		...DEFAULT_OPTIONS,
		...options,
	});
	return app;
}
