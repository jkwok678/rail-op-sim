import { Container, Graphics } from "pixi.js";

export interface GroundLayerOptions {
	/** CSS color string for grid lines (called on each redraw for theme support). */
	gridColor?: string | (() => string);
	/** CSS color string for axes. */
	axisColor?: string | (() => string);
	/** Alpha value for grid lines (0–1). */
	gridAlpha?: number;
	/** Stroke width for grid lines. */
	gridWidth?: number;
	/** Whether to draw thicker X/Y axes at the origin. */
	showAxes?: boolean;
	/** Target screen pixels between grid lines (default ~100). */
	targetSpacing?: number;
}

const DEFAULTS: {
	gridColor: string;
	axisColor: string;
	gridAlpha: number;
	gridWidth: number;
	showAxes: boolean;
	targetSpacing: number;
} = {
	gridColor: "#888888",
	axisColor: "#4fb8b2",
	gridAlpha: 0.25,
	gridWidth: 1,
	showAxes: true,
	targetSpacing: 100,
};

function resolve(value: string | (() => string)): string {
	return typeof value === "function" ? value() : value;
}

/**
 * Picks a "nice" grid spacing so lines stay roughly `targetPx` apart
 * on screen given the current zoom level.
 */
function niceSpacing(targetPx: number, zoom: number): number {
	const worldTarget = targetPx / zoom;
	const exp = Math.floor(Math.log10(worldTarget));
	const base = worldTarget / 10 ** exp;
	let nice: number;
	if (base < 1.5) nice = 1;
	else if (base < 3.5) nice = 2;
	else if (base < 7.5) nice = 5;
	else nice = 10;
	return nice * 10 ** exp;
}

export interface GroundLayer {
	container: Container;
	redraw: (zoom: number, screenW: number, screenH: number) => void;
}

/**
 * Creates a dynamic graph-paper grid that redraws to feel infinite
 * at any zoom level. Colors can be static strings or getter functions
 * so they track the design system's light/dark theme.
 */
export function createGroundLayer(options?: GroundLayerOptions): GroundLayer {
	const gridColor = options?.gridColor ?? DEFAULTS.gridColor;
	const axisColor = options?.axisColor ?? DEFAULTS.axisColor;
	const gridAlpha = options?.gridAlpha ?? DEFAULTS.gridAlpha;
	const gridWidth = options?.gridWidth ?? DEFAULTS.gridWidth;
	const showAxes = options?.showAxes ?? DEFAULTS.showAxes;
	const targetSpacing = options?.targetSpacing ?? DEFAULTS.targetSpacing;

	const layer = new Container();
	layer.label = "ground-layer";

	const gridGfx = new Graphics();
	layer.addChild(gridGfx);

	const axesGfx = new Graphics();
	if (showAxes) {
		layer.addChild(axesGfx);
	}

	function redraw(zoom: number, screenW: number, screenH: number): void {
		const world = layer.parent;
		if (!world) return;

		const wx = world.position.x;
		const wy = world.position.y;

		// Visible world rect (with generous padding in world units)
		const pad = 1;
		const left = (0 - wx - screenW * pad) / zoom;
		const right = (screenW - wx + screenW * pad) / zoom;
		const top = (0 - wy - screenH * pad) / zoom;
		const bottom = (screenH - wy + screenH * pad) / zoom;

		const spacing = niceSpacing(targetSpacing, zoom);

		// ── Grid lines ──
		gridGfx.clear();
		const startX = Math.floor(left / spacing) * spacing;
		const endX = Math.ceil(right / spacing) * spacing;
		for (let x = startX; x <= endX; x += spacing) {
			gridGfx.moveTo(x, top);
			gridGfx.lineTo(x, bottom);
		}
		const startY = Math.floor(top / spacing) * spacing;
		const endY = Math.ceil(bottom / spacing) * spacing;
		for (let y = startY; y <= endY; y += spacing) {
			gridGfx.moveTo(left, y);
			gridGfx.lineTo(right, y);
		}
		gridGfx.stroke({
			width: gridWidth,
			color: resolve(gridColor),
			alpha: gridAlpha,
		});

		// ── Axes (always full viewport span) ──
		if (!showAxes) return;
		axesGfx.clear();
		axesGfx.moveTo(left, 0);
		axesGfx.lineTo(right, 0);
		axesGfx.moveTo(0, top);
		axesGfx.lineTo(0, bottom);
		axesGfx.stroke({
			width: gridWidth * 2,
			color: resolve(axisColor),
			alpha: Math.min(1, gridAlpha * 2.5),
		});
	}

	return { container: layer, redraw };
}
