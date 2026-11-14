import type { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import type { PlacementController } from "#/engine/PlacementController";
import type { ViewportController } from "#/engine/ViewportController";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE } from "#/lib/grid";
import { OPERATE_ART_FILES } from "#/lib/operateArt";
import { buildThemeColorMap } from "#/lib/svgColors";
import { SVG_MAP } from "#/lib/svgMap";
import { FIT_EXTENT, FIT_PADDING } from "#/lib/viewportActions";
import { useEditorStore } from "#/store/editor-store";

export interface UsePixiAppReturn {
	/** Attach to a `<div>` in JSX. The PixiJS canvas mounts inside it. */
	containerRef: React.RefObject<HTMLDivElement | null>;
	/** The PixiJS Application (null before mount). */
	appRef: React.MutableRefObject<Application | null>;
	/** The viewport controller for imperative control. */
	viewportRef: React.MutableRefObject<ViewportController | null>;
	/** The placement controller (owns the Map and placement interaction). */
	placementRef: React.MutableRefObject<PlacementController | null>;
}

const themeKey = (): string =>
	document.documentElement.classList.contains("dark") ? "dark" : "light";

/**
 * Initializes a PixiJS Application with a fixed-cell ground grid, a track layer
 * driven by a shared texture cache, viewport controls, and click-to-place
 * interaction. All pixi.js-dependent modules are dynamically imported to keep
 * browser-only code out of the SSR module graph.
 */
export function usePixiApp(): UsePixiAppReturn {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const appRef = useRef<Application | null>(null);
	const viewportRef = useRef<ViewportController | null>(null);
	const placementRef = useRef<PlacementController | null>(null);

	useEffect(() => {
		let destroyed = false;
		let observer: ResizeObserver | null = null;
		let themeObserver: MutationObserver | null = null;
		let unsubGrid: (() => void) | null = null;
		let stopOperate: () => void = () => {};
		let textures: ReturnType<
			typeof import("#/renderer/textureCache").createTextureCache
		> | null = null;

		const container = containerRef.current;
		if (!container) return;

		const init = async () => {
			const [
				{ createPixiApp },
				{ createGroundLayer },
				{ ViewportController: VC },
				{ Container },
				{ createTrackLayer },
				{ createElementLayer },
				{ createTextLayer },
				{ createLinkHighlightLayer },
				{ createTrackColorLayer },
				{ createDirectionLayer },
				{ attachOperateLayers },
				{ createTextureCache },
				{ PlacementController: PC },
			] = await Promise.all([
				import("#/engine/PixiApp"),
				import("#/engine/GroundLayer"),
				import("#/engine/ViewportController"),
				import("pixi.js"),
				import("#/renderer/layers/TrackLayer"),
				import("#/renderer/layers/ElementLayer"),
				import("#/renderer/layers/TextLayer"),
				import("#/renderer/layers/LinkHighlightLayer"),
				import("#/renderer/layers/TrackColorLayer"),
				import("#/renderer/layers/DirectionLayer"),
				import("#/renderer/operateLayers"),
				import("#/renderer/textureCache"),
				import("#/engine/PlacementController"),
			]);

			if (destroyed) return;

			const width = container.clientWidth || 800;
			const height = container.clientHeight || 600;

			const app = await createPixiApp({ width, height });
			if (destroyed) {
				app.destroy(true);
				return;
			}

			// Scene graph: stage → world → { ground, tracks, ghost }
			const world = new Container();
			world.label = "world";

			const cssVar = (name: string): string =>
				getComputedStyle(document.documentElement)
					.getPropertyValue(name)
					.trim();

			// Cache colours so getComputedStyle isn't called on every pan/zoom frame.
			let gridColor = cssVar("--sea-ink");
			let axisColor = cssVar("--lagoon");

			const ground = createGroundLayer({
				gridColor: () => gridColor,
				axisColor: () => axisColor,
				gridAlpha: 0.2,
				fixedSpacing: CELL_SIZE,
				showAxes: false,
			});
			ground.container.visible = useEditorStore.getState().showGrid;
			world.addChild(ground.container);

			// Shared texture cache + track layer (created before colour layer
			// so the colour layer can delegate tinting to it)
			textures = createTextureCache(themeKey(), buildThemeColorMap());
			const trackLayer = createTrackLayer(textures);

			// Track colour overlay (empty container; tints are applied to track sprites)
			const trackColorLayer = createTrackColorLayer(trackLayer);

			const elementLayer = createElementLayer(textures);

			// Scene-graph order: ground → colour → element underlay → tracks → elements
			world.addChild(trackColorLayer.container);
			world.addChild(elementLayer.underlay);
			world.addChild(trackLayer.container);
			world.addChild(elementLayer.container);

			const textLayer = createTextLayer();
			world.addChild(textLayer.container);

			const linkHighlightLayer = createLinkHighlightLayer(textures);
			world.addChild(linkHighlightLayer.container);

			// Preferred-direction overlay (per-route legs + arrow markers), added
			// after the link highlights and below the ghost.
			const directionLayer = createDirectionLayer();
			world.addChild(directionLayer.container);

			// Operate mode's routes and trains, and the signal, point and crossing art,
			// driven by the engine's view.
			stopOperate = attachOperateLayers(world, trackLayer, elementLayer);

			app.stage.addChild(world);
			debugLog(
				"pixi",
				`scene graph assembled — world children: ${world.children.map((c) => c.label).join(", ")}`,
			);

			const redrawGrid = () => {
				ground.redraw(world.scale.x, app.screen.width, app.screen.height);
				useEditorStore.getState().setZoom(world.scale.x);
			};

			const canvas = app.canvas;
			canvas.style.display = "block";
			canvas.style.width = "100%";
			canvas.style.height = "100%";
			container.appendChild(canvas);

			const viewport = new VC({ world, app, onChange: redrawGrid });
			viewport.attach();
			// A tile-scale starting view (≈ origin centred, cells ~cell-size on screen).
			viewport.fitToView(FIT_EXTENT, FIT_PADDING);
			debugLog(
				"pixi",
				`viewport attached — fitToView(${FIT_EXTENT},${FIT_PADDING}), worldPos=(${world.position.x.toFixed(1)},${world.position.y.toFixed(1)}) worldScale=(${world.scale.x.toFixed(3)},${world.scale.y.toFixed(3)})`,
			);
			redrawGrid();

			// Placement interaction (owns the Map; ghost lives on top of the tracks)
			const placement = new PC({
				app,
				world,
				trackLayer,
				elementLayer,
				textLayer,
				linkHighlightLayer,
				trackColorLayer,
				directionLayer,
				textures,
				viewport,
			});
			world.addChild(placement.ghost);
			placement.attach();

			// Preload all track art and operate mode's signal and point art,
			// then backfill anything placed (or operated) meanwhile.
			const allSubtypes = Object.keys(SVG_MAP);
			Promise.all([
				textures.preload(allSubtypes),
				textures.preloadFiles(OPERATE_ART_FILES),
			]).then(() => {
				if (destroyed) return;
				trackColorLayer.sync(placement.map);
				trackLayer.sync(placement.map);
				elementLayer.sync(placement.map);
				textLayer.sync(placement.map);
				directionLayer.sync(placement.map);
				placement.refreshGhost();
				debugLog("pixi", "init complete — ready for interaction");
			});

			// Theme: rebuild grid colours and re-bake track/ghost textures.
			themeObserver = new MutationObserver(() => {
				if (!textures) return;
				gridColor = cssVar("--sea-ink");
				axisColor = cssVar("--lagoon");
				textures.setTheme(themeKey(), buildThemeColorMap());
				trackLayer.clear();
				elementLayer.clear();
				textLayer.clear();
				trackLayer.sync(placement.map);
				trackColorLayer.sync(placement.map);
				elementLayer.sync(placement.map);
				textLayer.sync(placement.map);
				directionLayer.sync(placement.map);
				placement.refreshGhost();
				redrawGrid();
			});
			themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"],
			});

			unsubGrid = useEditorStore.subscribe((state, prev) => {
				if (state.showGrid !== prev.showGrid) {
					ground.container.visible = state.showGrid;
				}
			});

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
			placementRef.current = placement;
		};

		init();

		return () => {
			debugLog("pixi", "cleanup — destroying");
			destroyed = true;
			if (observer) observer.disconnect();
			if (themeObserver) themeObserver.disconnect();
			if (unsubGrid) unsubGrid();
			stopOperate();
			placementRef.current?.detach();
			viewportRef.current?.detach();
			textures?.destroy();
			appRef.current?.destroy(true);
			appRef.current = null;
			viewportRef.current = null;
			placementRef.current = null;
			textures = null;
		};
	}, []);

	return { containerRef, appRef, viewportRef, placementRef };
}
