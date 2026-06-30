/**
 * Renders a simple `<rect>`-only SVG string to an offscreen HTML canvas,
 * scaled by the given factor. All track SVGs are authored as 16×16 pixel-art
 * rects — this utility avoids async image loading by parsing the SVG
 * synchronously with DOMParser and drawing rects directly.
 *
 * Results are cached by `(svg, scale)` — the same SVG string re-used across
 * theme toggles returns the cached canvas without re-parsing.
 *
 * Non-rect elements (`<path>`, `<circle>`, etc.) are silently ignored. This
 * is intentional: the track SVGs are exclusively `<rect>` elements.
 *
 * @param svg - The SVG markup string (should already be recoloured).
 * @param scale - Multiplier for the canvas dimensions and drawing context.
 *                Use 2+ for crisp upscaling when the art is displayed at a
 *                larger size than its native resolution.
 * @throws If the SVG has no `<svg>` root element or the canvas 2D context
 *         cannot be obtained.
 */
const canvasCache = new Map<string, HTMLCanvasElement>();

export function svgToCanvas(svg: string, scale: number): HTMLCanvasElement {
	const cacheKey = `${scale}:${svg}`;
	const cached = canvasCache.get(cacheKey);
	if (cached) return cached;

	const parser = new DOMParser();
	const doc = parser.parseFromString(svg, "image/svg+xml");
	const svgEl = doc.querySelector("svg");
	if (!svgEl) throw new Error("svgToCanvas: no <svg> element found");

	const vb = (svgEl.getAttribute("viewBox") ?? "0 0 16 16")
		.split(/\s+/)
		.map(Number);
	const vbW = vb[2] ?? 16;
	const vbH = vb[3] ?? 16;

	const canvas = document.createElement("canvas");
	canvas.width = vbW * scale;
	canvas.height = vbH * scale;

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("svgToCanvas: failed to get 2d context");

	ctx.scale(scale, scale);

	for (const rect of doc.querySelectorAll("rect")) {
		const x = Number(rect.getAttribute("x") ?? 0);
		const y = Number(rect.getAttribute("y") ?? 0);
		const w = Number(rect.getAttribute("width") ?? 0);
		const h = Number(rect.getAttribute("height") ?? 0);
		const rawFill = rect.getAttribute("fill");
		// Canvas 2D ignores CSS value "none" (treated as transparent in SVG).
		// Skip drawing — the default transparent canvas background is correct.
		if (rawFill === "none" || rawFill === null) continue;
		const fill = rawFill === null ? "#000000" : rawFill;

		ctx.fillStyle = fill;
		ctx.fillRect(x, y, w, h);
	}

	canvasCache.set(cacheKey, canvas);
	return canvas;
}
