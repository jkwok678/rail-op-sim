/**
 * Grid coordinate helpers for the track editor.
 *
 * The shared data model uses a math coordinate system where +Y = up.
 * PixiJS world space uses +Y = down. We flip Y when converting between
 * grid cells and world pixels so that grid "up" renders upward on screen.
 *
 * A track occupies one fixed-size cell. Integer grid coordinates map to
 * cell *centers* — placed sprites and the grid lines are positioned so the
 * visible grid and the snap grid coincide.
 */

/** World pixels per grid cell (distance between adjacent cell centers). */
export const CELL_SIZE = 32;

/**
 * Convert integer grid coordinates to the world-pixel position of the cell
 * centre. Flips Y so grid +Y renders upward.
 */
export function gridToWorld(gx: number, gy: number): { x: number; y: number } {
	return { x: gx * CELL_SIZE, y: -gy * CELL_SIZE };
}

/**
 * Snap a world-pixel position to the nearest grid cell.
 */
export function worldToGrid(
	wx: number,
	wy: number,
): { gx: number; gy: number } {
	return {
		gx: Math.round(wx / CELL_SIZE),
		gy: Math.round(-wy / CELL_SIZE),
	};
}
