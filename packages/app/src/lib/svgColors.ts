/**
 * SVG recolouring and CSS-colour normalisation.
 *
 * The railway SVGs in `public/graphics/` are authored with a small, fixed
 * palette of literal hex fills. We swap those source colours for theme-aware
 * values before handing the markup to PixiJS or the DOM. The swap is a plain
 * string replacement on the `fill="#rrggbb"` attributes — the source art only
 * uses simple `<rect>` fills, so this is both safe and dependency-free (works
 * in Node tests as well as the browser).
 */

/** A mapping from a source hex fill (lowercase) to a replacement colour. */
export type ColorMap = Record<string, string>;

/** Source fills used by the authored SVGs. */
export const SOURCE_FILLS = {
	/** Rails / structure — the dominant foreground colour. */
	rail: "#000000",
	/** Platforms / secondary detail. */
	platform: "#cccccc",
	/** Bright signal red. */
	signalRed: "#ff0000",
	/** Dark bridge red. */
	bridgeRed: "#cc0000",
} as const;

/**
 * Replace every `fill="<from>"` with `fill="<to>"` for each entry in the map.
 * Matching is case-insensitive on the source hex.
 */
export function recolorSvg(svg: string, colorMap: ColorMap): string {
	let out = svg;
	for (const [from, to] of Object.entries(colorMap)) {
		const pattern = new RegExp(`fill="${escapeRegExp(from)}"`, "gi");
		out = out.replace(pattern, `fill="${to}"`);
	}
	return out;
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Cache for {@link normalizeCssColor}: input string → resolved `#rrggbb`. */
const normalizedCache = new Map<string, string>();

/**
 * Resolve a CSS colour string — including `var(--token)`, `oklch(...)`, named
 * colours, etc. — to a concrete `#rrggbb` value via the browser's own colour
 * engine. PixiJS cannot parse CSS variables or non-sRGB colour spaces, so we
 * normalise at the application boundary.
 *
 * Results are cached per input — repeated calls with the same value (e.g. on
 * theme toggles) reuse the cached hex instead of creating new DOM probes.
 *
 * Two-step resolution:
 * 1. Probe element (in DOM): resolves CSS variables via the cascade.
 *    `getComputedStyle` returns the colour in a browser-dependent format
 *    (e.g. `rgb(37,37,37)` or `color(srgb 0.145 0 0)` for oklch values).
 * 2. Canvas pixel: parses the computed colour string and reads back the
 *    concrete RGBA. Canvas `fillStyle` accepts modern formats like
 *    `color(srgb …)` that the old regex-based fast-path cannot match.
 *
 * Returns the input unchanged when not running in a browser (e.g. SSR).
 */
export function normalizeCssColor(input: string): string {
	if (typeof document === "undefined") return input;

	const cached = normalizedCache.get(input);
	if (cached) return cached;

	// Step 1 — resolve CSS variables / cascade via a DOM probe.
	const probe = document.createElement("span");
	probe.style.color = input;
	probe.style.display = "none";
	document.body.appendChild(probe);
	const computed = getComputedStyle(probe).color;
	document.body.removeChild(probe);

	// Fast-path: legacy `rgb(r,g,b)` / `rgba(r,g,b,a)` — no canvas needed.
	const fast = rgbToHex(computed);
	if (fast) {
		normalizedCache.set(input, fast);
		return fast;
	}

	// Step 2 — canvas parses modern formats (e.g. `color(srgb 0.145 0 0)`).
	const canvas = document.createElement("canvas");
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		normalizedCache.set(input, input);
		return input;
	}

	ctx.fillStyle = computed;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
	const hex = (n: number) => n.toString(16).padStart(2, "0");
	const result = `#${hex(r)}${hex(g)}${hex(b)}`;
	normalizedCache.set(input, result);
	return result;
}

/** Fast-path: convert a legacy `rgb(r,g,b)`/`rgba(r,g,b,a)` string to `#rrggbb`. */
function rgbToHex(rgb: string): string | null {
	const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (!match) return null;
	const [, r, g, b] = match;
	const hex = (n: string) => Number(n).toString(16).padStart(2, "0");
	return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Build the recolour map for the current theme by resolving design-system CSS
 * variables to concrete hex. Reds are kept literal so signals and bridges stay
 * legible against either theme.
 */
export function buildThemeColorMap(): ColorMap {
	return {
		[SOURCE_FILLS.rail]: normalizeCssColor("var(--foreground)"),
		[SOURCE_FILLS.platform]: normalizeCssColor("var(--muted-foreground)"),
	};
}

/**
 * Recolour map for inline DOM SVGs (e.g. the palette preview). Uses
 * `currentColor` and CSS variables directly so the markup tracks the theme via
 * the cascade — no JS theme listener or re-bake needed.
 */
export function buildDomColorMap(): ColorMap {
	return {
		[SOURCE_FILLS.rail]: "currentColor",
		[SOURCE_FILLS.platform]: "var(--muted-foreground)",
	};
}
