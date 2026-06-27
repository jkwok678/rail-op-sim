import type { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import type { ViewportController } from "#/engine/ViewportController";

export interface UsePixiAppReturn {
	/** Attach to a `<div>` in JSX. The PixiJS canvas mounts inside it. */
	containerRef: React.RefObject<HTMLDivElement | null>;
	/** The PixiJS Application (null before mount). */
	appRef: React.MutableRefObject<Application | null>;
	/** The viewport controller for imperative control. */
	viewportRef: React.MutableRefObject<ViewportController | null>;
}

/**
 * Initializes a PixiJS Application with a dynamic ground grid layer and
 * viewport controller. Handles resize, cleanup, and React Strict Mode safely.
 *
 * All pixi.js-dependent modules are dynamically imported to avoid
 * SSR evaluation of browser-only code.
 */
export function usePixiApp(): UsePixiAppReturn {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const appRef = useRef<Application | null>(null);
	const viewportRef = useRef<ViewportController | null>(null);

	useEffect(() => {
		let destroyed = false;
		let observer: ResizeObserver | null = null;
		let themeObserver: MutationObserver | null = null;

		const container = containerRef.current;
		if (!container) return;

		const init = async () => {
			// Dynamic imports — keep pixi.js out of the SSR module graph
			const [
				{ createPixiApp },
				{ createGroundLayer },
				{ ViewportController: VC },
				{ Container },
			] = await Promise.all([
				import("#/engine/PixiApp"),
				import("#/engine/GroundLayer"),
				import("#/engine/ViewportController"),
				import("pixi.js"),
			]);

			if (destroyed) return;

			const width = container.clientWidth || 800;
			const height = container.clientHeight || 600;

			const app = await createPixiApp({ width, height });
			if (destroyed) {
				app.destroy(true);
				return;
			}

			// Build the scene graph: stage → world → grid
			const world = new Container();
			world.label = "world";

			const cssVar = (name: string): string =>
				getComputedStyle(document.documentElement)
					.getPropertyValue(name)
					.trim();

			// Cache colours so getComputedStyle isn't called on every pan/zoom frame.
			// The getter closures read the cached variables cheaply.
			let gridColor = cssVar("--sea-ink");
			let axisColor = cssVar("--lagoon");

			const ground = createGroundLayer({
				gridColor: () => gridColor,
				axisColor: () => axisColor,
				gridAlpha: 0.2,
			});
			world.addChild(ground.container);
			app.stage.addChild(world);

			// Redraw helper
			const redrawGrid = () => {
				ground.redraw(world.scale.x, app.screen.width, app.screen.height);
			};

			// Set canvas display style
			const canvas = app.canvas;
			canvas.style.display = "block";
			canvas.style.width = "100%";
			canvas.style.height = "100%";

			container.appendChild(canvas);

			// Viewport controls — redraw grid on every transform
			const viewport = new VC(world, app, redrawGrid);
			viewport.attach();
			viewport.fitToView();
			redrawGrid();

			// Theme observer — refresh cached colours and redraw when theme toggles
			themeObserver = new MutationObserver(() => {
				gridColor = cssVar("--sea-ink");
				axisColor = cssVar("--lagoon");
				redrawGrid();
			});
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"],
			});

			// Resize observer — also triggers grid redraw
			observer = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (!entry) return;
				const { width: w, height: h } = entry.contentRect;
				app.renderer.resize(
					Math.max(1, Math.floor(w)),
					Math.max(1, Math.floor(h)),
				);
				redrawGrid();
			});
			observer.observe(container);

			appRef.current = app;
			viewportRef.current = viewport;
		};

		init();

		return () => {
			destroyed = true;
			if (observer) observer.disconnect();
			if (themeObserver) themeObserver.disconnect();
			if (viewportRef.current) viewportRef.current.detach();
			if (appRef.current) appRef.current.destroy(true);
			appRef.current = null;
			viewportRef.current = null;
		};
	}, []);

	return { containerRef, appRef, viewportRef };
}
