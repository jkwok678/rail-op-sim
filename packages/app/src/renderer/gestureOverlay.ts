import type { Graphics } from "pixi.js";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";

/**
 * Shared visual language for the editor's two-click gestures — preferred
 * directions, speed/length sections, and portal linking.
 *
 * All three ask the same thing of the user: pick a track, then pick a second
 * one, with the tool doing something to what lies between. They used to each
 * invent their own feedback (the direction tool outlined endpoints and
 * previewed the route; the section tool outlined endpoints in different
 * colours with no preview at all; the link tool shaded a whole cell blue and
 * previewed nothing), so the same gesture looked like three unrelated
 * mechanics. Everything a gesture draws now comes from here, which is what
 * makes the colours mean the same thing in every tool:
 *
 * - blue outline   — the pending first pick (red while erasing)
 * - amber outline  — the hovered second pick, and the gesture can complete
 * - red outline    — the hovered second pick, but the gesture cannot complete
 * - blue stroke    — what the gesture would change if committed now
 *
 * Standing state — what the map *is*, drawn all the time and independent of
 * any tool — lives in the same palette but a quieter tier: a thin outline over
 * a faint wash, so a gesture pick always reads on top of it rather than
 * competing with it. Both tiers come from here so the two can never drift into
 * meaning different things by the same colour.
 */

/** Pending first pick (blue-500). */
const GESTURE_START_COLOR = 0x3b82f6;
/** Pending first pick while the gesture erases rather than assigns (red-500). */
const GESTURE_START_ERASE_COLOR = 0xef4444;
/** Hovered second pick, gesture can complete (amber-500). */
const GESTURE_END_COLOR = 0xf59e0b;
/**
 * Hovered second pick, gesture cannot complete (red-600). A shade darker than
 * the red-500 used for unpaired standing state, so hovering an unpaired portal
 * that still cannot be paired does not read as red-on-red.
 */
const GESTURE_INVALID_COLOR = 0xdc2626;
/** What the gesture would assign (blue-500). */
export const GESTURE_PREVIEW_COLOR = 0x3b82f6;
/** What the gesture would remove, matching the erase outline (red-500). */
export const GESTURE_PREVIEW_ERASE_COLOR = 0xef4444;

/** Gesture picks are the heavier tier, so they win over standing state. */
const GESTURE_OUTLINE_WIDTH = 3;
/** Inset so outlines of adjacent cells stay distinct instead of merging. */
const GESTURE_OUTLINE_INSET = 2;

// ── Standing state ──────────────────────────────────────────────────────

/** An element that is correctly paired/complete (green-500). */
export const STATE_OK_COLOR = 0x22c55e;
/** An element still missing its counterpart (red-500). */
export const STATE_INCOMPLETE_COLOR = 0xef4444;
/** Thinner than a gesture pick, so state never outshouts the active gesture. */
export const STATE_OUTLINE_WIDTH = 1.5;
/**
 * Faint enough that the track art and any gesture outline stay readable
 * through it, strong enough to pick the cell out at a glance while panning.
 */
export const STATE_FILL_ALPHA = 0.16;
export const STATE_OUTLINE_ALPHA = 0.85;
/** Connector drawn between two elements that are already paired. */
export const STATE_CONNECTOR_ALPHA = 0.7;
export const STATE_CONNECTOR_WIDTH = 2;

/** A grid cell. */
export interface Coord {
	gx: number;
	gy: number;
}

/** Per-call overrides for {@link strokeCellOutline}. */
export interface CellOutlineOptions {
	width?: number;
	alpha?: number;
	inset?: number;
}

/**
 * Stroke one cell-sized outline into `gfx`, inset so the outlines of adjacent
 * cells stay readable as two squares rather than merging into one. Defaults to
 * the gesture tier; pass {@link STATE_OUTLINE_WIDTH}/{@link STATE_OUTLINE_ALPHA}
 * for the quieter standing-state tier.
 */
export function strokeCellOutline(
	gfx: Graphics,
	coord: Coord,
	color: number,
	opts: CellOutlineOptions = {},
): void {
	const {
		width = GESTURE_OUTLINE_WIDTH,
		alpha = 1,
		inset = GESTURE_OUTLINE_INSET,
	} = opts;
	const { x, y } = gridToWorld(coord.gx, coord.gy);
	const half = CELL_SIZE / 2;
	const size = CELL_SIZE - inset * 2;
	gfx.rect(x - half + inset, y - half + inset, size, size);
	gfx.stroke({ color, width, alpha, alignment: 0.5 });
}

/**
 * Queue one cell-sized rect into `gfx` for a later {@link Graphics.fill}.
 * Batched rather than filled per cell so a whole state tier costs one fill.
 */
export function queueCellRect(gfx: Graphics, coord: Coord): void {
	const { x, y } = gridToWorld(coord.gx, coord.gy);
	const half = CELL_SIZE / 2;
	const inset = GESTURE_OUTLINE_INSET;
	gfx.rect(
		x - half + inset,
		y - half + inset,
		CELL_SIZE - inset * 2,
		CELL_SIZE - inset * 2,
	);
}

/**
 * Stroke a dashed segment between two world-space points. Used wherever a
 * connection is proposed rather than made — a dash reads as "not yet" against
 * the solid line of a connection that exists.
 */
export function dashedLine(
	gfx: Graphics,
	ax: number,
	ay: number,
	bx: number,
	by: number,
	dash = 8,
): void {
	const dx = bx - ax;
	const dy = by - ay;
	const len = Math.hypot(dx, dy);
	if (len === 0) return;
	const ux = dx / len;
	const uy = dy / len;
	for (let d = 0; d < len; d += dash * 2) {
		const end = Math.min(d + dash, len);
		gfx.moveTo(ax + ux * d, ay + uy * d);
		gfx.lineTo(ax + ux * end, ay + uy * end);
	}
}

/**
 * The start/end outline pair shared by every two-click gesture. Owns both
 * cells so either can change without the caller having to redraw the other,
 * and repaints the whole `gfx` on each change (two rectangles — not worth
 * tracking dirty state).
 */
export interface EndpointOutlines {
	/** Outline (or clear) the pending first pick. */
	setStart(coord: Coord | null, erasing?: boolean): void;
	/** Outline (or clear) the hovered second pick. `valid` picks amber vs red. */
	setEnd(coord: Coord | null, valid?: boolean): void;
	/** Current first pick, for callers that need to compare against a hover. */
	getStart(): Coord | null;
	/** Whether the pending gesture erases rather than assigns. */
	isErasing(): boolean;
	/** Drop both outlines. */
	clear(): void;
}

/** Create an {@link EndpointOutlines} that paints into `gfx`. */
export function createEndpointOutlines(gfx: Graphics): EndpointOutlines {
	let start: Coord | null = null;
	let erasing = false;
	let end: Coord | null = null;
	let endValid = false;

	function redraw(): void {
		gfx.clear();
		if (start) {
			strokeCellOutline(
				gfx,
				start,
				erasing ? GESTURE_START_ERASE_COLOR : GESTURE_START_COLOR,
			);
		}
		if (end) {
			strokeCellOutline(
				gfx,
				end,
				endValid ? GESTURE_END_COLOR : GESTURE_INVALID_COLOR,
			);
		}
	}

	return {
		setStart(coord, eraseMode = false) {
			start = coord;
			erasing = eraseMode;
			// A cleared start ends the gesture, so the hovered end goes with it.
			if (!coord) {
				end = null;
				endValid = false;
			}
			redraw();
		},
		setEnd(coord, valid = false) {
			end = coord;
			endValid = valid;
			redraw();
		},
		getStart: () => start,
		isErasing: () => erasing,
		clear() {
			start = null;
			end = null;
			erasing = false;
			endValid = false;
			gfx.clear();
		},
	};
}
