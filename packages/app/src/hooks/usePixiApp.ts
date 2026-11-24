import type { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";
import { guardTicker } from "#/editor/guardTicker";
import type { PlacementController } from "#/editor/PlacementController";
import type { ViewportController } from "#/editor/ViewportController";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE } from "#/lib/grid";
import { OPERATE_ART_FILES } from "#/lib/operateArt";
import { buildThemeColorMap } from "#/lib/svgColors";
import { SVG_MAP } from "#/lib/svgMap";
import { FIT_EXTENT, FIT_PADDING } from "#/lib/viewportActions";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";

/** How far the canvas has got: `error` means PixiJS could not start at all. */
export type CanvasStatus = "loading" | "ready" | "error";

export interface UsePixiAppReturn {
	status: CanvasStatus;
	/** Why the canvas could not start, when `status` is `error`. */
	error: string | null;
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

const cssVar = (name: string): string =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim();

async function loadPixiModules() {
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
		import("#/editor/PixiApp"),
		import("#/editor/GroundLayer"),
		import("#/editor/ViewportController"),
		import("pixi.js"),
		import("#/renderer/layers/TrackLayer"),
		import("#/renderer/layers/ElementLayer"),
		import("#/renderer/layers/TextLayer"),
		import("#/renderer/layers/LinkHighlightLayer"),
		import("#/renderer/layers/TrackColorLayer"),
		import("#/renderer/layers/DirectionLayer"),
		import("#/renderer/operateLayers"),
		import("#/renderer/textureCache"),
		import("#/editor/PlacementController"),
	]);
	return {
		createPixiApp,
		createGroundLayer,
		VC,
		Container,
		createTrackLayer,
		createElementLayer,
		createTextLayer,
		createLinkHighlightLayer,
		createTrackColorLayer,
		createDirectionLayer,
		attachOperateLayers,
		createTextureCache,
		PC,
	};
}

type PixiModules = Awaited<ReturnType<typeof loadPixiModules>>;
type TextureCache = ReturnType<PixiModules["createTextureCache"]>;

interface CanvasSession {
	app: Application;
	viewport: ViewportController;
	placement: PlacementController;
	dispose: () => void;
}

function createSceneLayers(
	mods: PixiModules,
	world: InstanceType<PixiModules["Container"]>,
	getColors: () => { gridColor: string; axisColor: string },
) {
	const ground = mods.createGroundLayer({
		gridColor: () => getColors().gridColor,
		axisColor: () => getColors().axisColor,
		gridAlpha: 0.2,
		fixedSpacing: CELL_SIZE,
		showAxes: false,
	});
	ground.container.visible = useEditorStore.getState().showGrid;

	// Shared texture cache + track layer (created before colour layer
	// so the colour layer can delegate tinting to it).
	const textures: TextureCache = mods.createTextureCache(
		themeKey(),
		buildThemeColorMap(),
	);
	const trackLayer = mods.createTrackLayer(textures);
	// Track colour overlay (empty container; tints are applied to track sprites).
	const trackColorLayer = mods.createTrackColorLayer(trackLayer);
	const elementLayer = mods.createElementLayer(textures);
	const textLayer = mods.createTextLayer();
	const linkHighlightLayer = mods.createLinkHighlightLayer(textures);
	// Preferred-direction overlay (per-route legs + arrow markers), added
	// after the link highlights and below the ghost.
	const directionLayer = mods.createDirectionLayer();

	// Scene-graph order: ground → colour → element underlay → tracks → elements → text → links → directions
	world.addChild(
		ground.container,
		trackColorLayer.container,
		elementLayer.underlay,
		trackLayer.container,
		elementLayer.container,
		textLayer.container,
		linkHighlightLayer.container,
		directionLayer.container,
	);
	// Operate mode's routes and trains, and the signal, point and crossing art,
	// driven by the engine's view.
	const stopOperate = mods.attachOperateLayers(
		world,
		trackLayer,
		elementLayer,
		{
			isOperateMode: () => useModeStore.getState().mode === "operate",
			getView: () => useOperateStore.getState().view,
			subscribeMode: (onChange) =>
				useModeStore.subscribe((state, prev) => {
					if (state.mode !== prev.mode) onChange();
				}),
			subscribeView: (onChange) =>
				useOperateStore.subscribe((state, prev) => {
					if (state.view !== prev.view) onChange();
				}),
		},
	);
	return {
		ground,
		textures,
		trackLayer,
		trackColorLayer,
		elementLayer,
		textLayer,
		linkHighlightLayer,
		directionLayer,
		stopOperate,
	};
}

function preloadArtAndSync(
	textures: TextureCache,
	syncAllLayers: () => void,
	isDestroyed: () => boolean,
): void {
	// Preload all track art and operate mode's signal and point art,
	// then backfill anything placed (or operated) meanwhile.
	Promise.all([
		textures.preload(Object.keys(SVG_MAP)),
		textures.preloadFiles(OPERATE_ART_FILES),
	])
		.then(() => {
			if (isDestroyed()) return;
			syncAllLayers();
			debugLog("pixi", "init complete — ready for interaction");
		})
		.catch((reason: unknown) =>
			// The canvas works without the art (pieces appear as it loads or
			// not at all), so this is logged rather than failing the canvas.
			console.error("Track art failed to load", reason),
		);
}

function assembleScene(
	mods: PixiModules,
	app: Application,
	container: HTMLDivElement,
	isDestroyed: () => boolean,
): CanvasSession {
	const cleanups: (() => void)[] = [() => app.destroy(true)];
	const dispose = () => {
		for (let i = cleanups.length - 1; i >= 0; i--) {
			cleanups[i]?.();
		}
	};

	try {
		// Scene graph: stage → world → { ground, tracks, ghost }
		const world = new mods.Container();
		world.label = "world";
		// Cache colours so getComputedStyle isn't called on every pan/zoom frame.
		const colors = {
			gridColor: cssVar("--sea-ink"),
			axisColor: cssVar("--lagoon"),
		};
		const layers = createSceneLayers(mods, world, () => colors);
		cleanups.push(
			() => layers.textures.destroy(),
			() => layers.stopOperate(),
		);
		app.stage.addChild(world);
		debugLog(
			"pixi",
			`scene graph assembled — world children: ${world.children.map((c) => c.label).join(", ")}`,
		);

		const redrawGrid = () => {
			layers.ground.redraw(world.scale.x, app.screen.width, app.screen.height);
			useEditorStore.getState().setZoom(world.scale.x);
		};

		Object.assign(app.canvas.style, {
			display: "block",
			width: "100%",
			height: "100%",
		});
		container.appendChild(app.canvas);

		const viewport = new mods.VC({ world, app, onChange: redrawGrid });
		viewport.attach();
		cleanups.push(() => viewport.detach());
		// A tile-scale starting view (≈ origin centred, cells ~cell-size on screen).
		viewport.fitToView(FIT_EXTENT, FIT_PADDING);
		debugLog(
			"pixi",
			`viewport attached — fitToView(${FIT_EXTENT},${FIT_PADDING}), worldPos=(${world.position.x.toFixed(1)},${world.position.y.toFixed(1)}) worldScale=(${world.scale.x.toFixed(3)},${world.scale.y.toFixed(3)})`,
		);
		redrawGrid();

		// Placement interaction (owns the Map; ghost lives on top of the tracks).
		const placement = new mods.PC({
			app,
			world,
			trackLayer: layers.trackLayer,
			elementLayer: layers.elementLayer,
			textLayer: layers.textLayer,
			linkHighlightLayer: layers.linkHighlightLayer,
			trackColorLayer: layers.trackColorLayer,
			directionLayer: layers.directionLayer,
			textures: layers.textures,
			viewport,
		});
		world.addChild(placement.ghost);
		placement.attach();
		cleanups.push(() => placement.detach());

		const syncAllLayers = () => {
			layers.trackLayer.sync(placement.map);
			layers.trackColorLayer.sync(placement.map);
			layers.elementLayer.sync(placement.map);
			layers.textLayer.sync(placement.map);
			layers.directionLayer.sync(placement.map);
			placement.refreshGhost();
		};
		preloadArtAndSync(layers.textures, syncAllLayers, isDestroyed);

		const stopObservers = attachCanvasObservers({
			app,
			container,
			redrawGrid,
			// Theme: rebuild grid colours and re-bake track/ghost textures.
			onThemeChange: () => {
				colors.gridColor = cssVar("--sea-ink");
				colors.axisColor = cssVar("--lagoon");
				layers.textures.setTheme(themeKey(), buildThemeColorMap());
				layers.trackLayer.clear();
				layers.elementLayer.clear();
				layers.textLayer.clear();
				syncAllLayers();
				redrawGrid();
			},
			onGridVisibilityChange: (visible) => {
				layers.ground.container.visible = visible;
			},
		});
		cleanups.push(stopObservers);

		return { app, viewport, placement, dispose };
	} catch (err) {
		dispose();
		throw err;
	}
}

function attachCanvasObservers({
	app,
	container,
	redrawGrid,
	onThemeChange,
	onGridVisibilityChange,
}: {
	app: Application;
	container: HTMLDivElement;
	redrawGrid: () => void;
	onThemeChange: () => void;
	onGridVisibilityChange: (visible: boolean) => void;
}): () => void {
	const themeObserver = new MutationObserver(onThemeChange);
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	const unsubGrid = useEditorStore.subscribe((state, prev) => {
		if (state.showGrid !== prev.showGrid) {
			onGridVisibilityChange(state.showGrid);
		}
	});

	const observer = new ResizeObserver((entries) => {
		const entry = entries[0];
		if (!entry) return;
		const { width: w, height: h } = entry.contentRect;
		app.renderer.resize(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)));
		redrawGrid();
	});
	observer.observe(container);

	return () => {
		observer.disconnect();
		themeObserver.disconnect();
		unsubGrid();
	};
}

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
	const [status, setStatus] = useState<CanvasStatus>("loading");
	const [error, setError] = useState<string | null>(null);
	/**
	 * Set to a function that throws, so a crash in a running frame is rethrown
	 * while rendering, where the canvas's error boundary can catch it.
	 */
	const [, setCrash] = useState<null>(null);

	useEffect(() => {
		let destroyed = false;
		let session: CanvasSession | null = null;
		const container = containerRef.current;
		if (!container) return;

		const init = async () => {
			const mods = await loadPixiModules();
			if (destroyed) return;
			const app = await mods.createPixiApp({
				width: container.clientWidth || 800,
				height: container.clientHeight || 600,
			});
			if (destroyed) {
				app.destroy(true);
				return;
			}
			// An error thrown in a frame would otherwise end the render loop and
			// leave a frozen canvas with no word why. Throwing it during a render
			// hands it to the canvas's error boundary, which says so.
			guardTicker(app.ticker, (crash) => {
				if (destroyed) return;
				console.error("The canvas crashed while drawing", crash);
				setCrash(() => {
					throw crash;
				});
			});
			session = assembleScene(mods, app, container, () => destroyed);
			appRef.current = session.app;
			viewportRef.current = session.viewport;
			placementRef.current = session.placement;
			setStatus("ready");
		};

		init().catch((reason: unknown) => {
			if (destroyed) return;
			console.error("The canvas failed to start", reason);
			setError(reason instanceof Error ? reason.message : String(reason));
			setStatus("error");
		});

		return () => {
			debugLog("pixi", "cleanup — destroying");
			destroyed = true;
			session?.dispose();
			appRef.current = null;
			viewportRef.current = null;
			placementRef.current = null;
		};
	}, []);

	return { containerRef, appRef, viewportRef, placementRef, status, error };
}
