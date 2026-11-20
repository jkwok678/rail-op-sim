import {
	LINK_OFFSETS,
	type Map as Map_,
	type PreferredDirection,
	resolvePathDirections,
	type Track,
} from "@rail-op-sim/shared";
import { Container, Graphics } from "pixi.js";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import {
	type Coord,
	createEndpointOutlines,
	GESTURE_PREVIEW_COLOR,
	GESTURE_PREVIEW_ERASE_COLOR,
} from "#/renderer/gestureOverlay";

/** Leg stroke for a one-way route (green-500). */
const LEG_ONEWAY_COLOR = 0x22c55e;
/** Leg stroke for a route set both ways (purple-500). */
const LEG_BIDIR_COLOR = 0xa855f7;
/** Dark-green arrow marker for a one-way route (green-800). */
const ARROW_COLOR = 0x166534;
/** Dark-purple arrow marker for a two-way route (purple-800). */
const BIDIR_ARROW_COLOR = 0x6b21a8;

/**
 * Width of a leg stroke. The authored art draws rails 2px wide in a 16px
 * viewBox, so CELL_SIZE * 0.16 covers a rail with a little to spare.
 */
const LEG_WIDTH = CELL_SIZE * 0.16;

/** Distance of a marker from the cell centre toward its entry edge. */
const MARKER_OFFSET = CELL_SIZE * 0.32;
/** Half-length of the arrow chevron. */
const ARROW_SIZE = CELL_SIZE * 0.16;

export interface DirectionLayer {
	container: Container;
	/** Rebuild the per-route legs + arrow markers from the current map. */
	sync(map: Map_): void;
	/**
	 * Outline (or clear) the pending direction-start cell. `erasing` colours the
	 * outline (and any route preview that follows) red, so the gesture shows
	 * which way it will run before the second click lands.
	 */
	setSelection(coord: Coord | null, erasing?: boolean): void;
	/**
	 * Preview the route from the pending start to the hovered end cell: each
	 * leg the gesture would assign — or remove, while erasing — is stroked and
	 * `end` is outlined. A null `path` with an `end` marks that cell as
	 * unreachable (red outline); a null `end` clears the preview entirely.
	 * `map` supplies the grid spacing used to turn the path into legs.
	 */
	setRoutePreview(map: Map_, path: Track[] | null, end: Coord | null): void;
	destroy(): void;
}

/**
 * Renders preferred-direction state, ROS-style, as one stroked leg per
 * entry→exit pair: a two-segment polyline running entry edge → cell centre →
 * exit edge, with a small arrow near the entry edge pointing along the
 * direction of travel.
 *
 * Colour is decided per route, not per cell — purple where the mirrored pair
 * is set too (the route runs both ways), green where it is not. So a switch
 * whose straight is set both ways and whose spur is set one way draws a purple
 * straight beside a green spur, and the same holds for the two independent
 * paths of a crossover or flyover.
 *
 * Nothing is drawn for a leg with no direction set: that spur keeps the plain
 * rail art from the track layer underneath. This is why legs are stroked
 * rather than tinting a recoloured copy of the track sprite — a flat bake
 * recolours every fill in the cell's art at once, so setting a direction on a
 * switch's straight would wash its untouched spur in the same colour and imply
 * a direction nobody set.
 *
 * The trade-off is that a leg is drawn from link geometry rather than traced
 * from the art, so on curved and tight-radius subtypes it approximates the
 * rail rather than covering it exactly.
 *
 * During the two-click assignment gesture the start cell is outlined, and
 * hovering a second track previews the route: the legs the gesture would
 * actually assign are stroked blue and the end cell is outlined too. The
 * preview likewise leaves untouched legs alone, so it shows the route rather
 * than the cells it passes through.
 *
 * The erase gesture previews the same way in red, so the legs about to be
 * removed are visible before the second click commits them.
 *
 * The container starts hidden; PlacementController manages visibility.
 */
export function createDirectionLayer(): DirectionLayer {
	const container = new Container();
	container.label = "direction-layer";
	container.visible = false;

	// One-way legs (below), two-way legs, blue route preview, arrows,
	// outlines (top).
	//
	// Two-way legs draw over one-way ones, and so win where legs overlap: a
	// switch's straight and spur share the half-cell from their common entry
	// edge to the centre, and that stretch really can be run both ways, so it
	// should read purple.
	const legOneWayGfx = new Graphics();
	container.addChild(legOneWayGfx);

	const legBidirGfx = new Graphics();
	container.addChild(legBidirGfx);

	const previewGfx = new Graphics();
	container.addChild(previewGfx);

	// Arrows are split by colour so each batch can be filled in one pass.
	const arrowGfx = new Graphics();
	container.addChild(arrowGfx);

	const bidirArrowGfx = new Graphics();
	container.addChild(bidirArrowGfx);

	const outlineGfx = new Graphics();
	container.addChild(outlineGfx);

	// Endpoint outlines come from the shared gesture overlay, so the pending
	// start and hovered end read the same here as in the section and link tools.
	const outlines = createEndpointOutlines(outlineGfx);

	/** World-space unit direction of a link index (grid +Y flips to world −Y). */
	const linkWorldVec = (link: number): { x: number; y: number } => {
		const [dx, dy] = LINK_OFFSETS[link];
		const len = Math.hypot(dx, dy) || 1;
		return { x: dx / len, y: -dy / len };
	};

	/**
	 * World-space point where `link` meets the cell boundary: the edge midpoint
	 * for a cardinal link, the corner for a diagonal one. Uses the raw ±1
	 * {@link LINK_OFFSETS} rather than a unit vector so diagonals reach the
	 * corner instead of stopping short of it.
	 */
	const linkEdgePoint = (
		cx: number,
		cy: number,
		link: number,
	): { x: number; y: number } => {
		const [dx, dy] = LINK_OFFSETS[link];
		const half = CELL_SIZE / 2;
		return { x: cx + dx * half, y: cy - dy * half };
	};

	/** Stroke one entry→exit leg: entry edge → cell centre → exit edge. */
	function drawLeg(
		gfx: Graphics,
		cx: number,
		cy: number,
		entry: number,
		exit: number,
		color: number,
	): void {
		const from = linkEdgePoint(cx, cy, entry);
		const to = linkEdgePoint(cx, cy, exit);
		gfx.moveTo(from.x, from.y);
		gfx.lineTo(cx, cy);
		gfx.lineTo(to.x, to.y);
		gfx.stroke({ color, width: LEG_WIDTH, cap: "round", join: "round" });
	}

	function drawArrow(
		gfx: Graphics,
		cx: number,
		cy: number,
		entry: number,
		exit: number,
	): void {
		const entryVec = linkWorldVec(entry);
		const exitVec = linkWorldVec(exit);

		// Travel direction = chord from entry edge toward exit edge.
		let dirX = exitVec.x - entryVec.x;
		let dirY = exitVec.y - entryVec.y;
		const dirLen = Math.hypot(dirX, dirY) || 1;
		dirX /= dirLen;
		dirY /= dirLen;

		// Perpendicular (for the chevron base).
		const perpX = -dirY;
		const perpY = dirX;

		// Anchor the marker near the entry edge of the cell.
		const px = cx + entryVec.x * MARKER_OFFSET;
		const py = cy + entryVec.y * MARKER_OFFSET;

		const tipX = px + dirX * ARROW_SIZE;
		const tipY = py + dirY * ARROW_SIZE;
		const b1X = px - dirX * ARROW_SIZE * 0.5 + perpX * ARROW_SIZE * 0.7;
		const b1Y = py - dirY * ARROW_SIZE * 0.5 + perpY * ARROW_SIZE * 0.7;
		const b2X = px - dirX * ARROW_SIZE * 0.5 - perpX * ARROW_SIZE * 0.7;
		const b2Y = py - dirY * ARROW_SIZE * 0.5 - perpY * ARROW_SIZE * 0.7;

		gfx.moveTo(tipX, tipY);
		gfx.lineTo(b1X, b1Y);
		gfx.lineTo(b2X, b2Y);
		gfx.closePath();
	}

	function sync(map: Map_): void {
		legOneWayGfx.clear();
		legBidirGfx.clear();
		arrowGfx.clear();
		bidirArrowGfx.clear();

		let legs = 0;
		let bidirLegs = 0;
		map.forEachTrack((track) => {
			if (!track.hasPreferredDirection()) return;

			const { x, y } = gridToWorld(track.getLocationX(), track.getLocationY());

			// Shade each leg and arrow by its own route, not by the cell, so the
			// one-way spur of a switch still reads as one-way next to a two-way
			// straight — and a leg with no direction set stays uncoloured.
			for (const pair of track.getPreferredDirections()) {
				legs++;
				const twoWay = track.isDirectionMirrored(pair);
				if (twoWay) bidirLegs++;
				// A mirrored pair is drawn twice, once per direction; the two
				// strokes coincide, so only the arrows distinguish them.
				drawLeg(
					twoWay ? legBidirGfx : legOneWayGfx,
					x,
					y,
					pair.entry,
					pair.exit,
					twoWay ? LEG_BIDIR_COLOR : LEG_ONEWAY_COLOR,
				);
				drawArrow(
					twoWay ? bidirArrowGfx : arrowGfx,
					x,
					y,
					pair.entry,
					pair.exit,
				);
			}
		});
		arrowGfx.fill({ color: ARROW_COLOR });
		bidirArrowGfx.fill({ color: BIDIR_ARROW_COLOR });

		debugLog("directionLayer", `sync — ${legs} legs (${bidirLegs} two-way)`);
	}

	function setSelection(coord: Coord | null, eraseMode = false): void {
		// A cleared start ends the gesture, so the route preview goes with it.
		if (!coord) previewGfx.clear();
		outlines.setStart(coord, eraseMode);
	}

	function setRoutePreview(
		map: Map_,
		path: Track[] | null,
		end: Coord | null,
	): void {
		previewGfx.clear();
		outlines.setEnd(end, path !== null);

		if (end && path) {
			// Preview the legs the gesture would actually assign, so a switch's
			// untouched spur is not implied to be part of the route.
			const legs: (PreferredDirection | null)[] = resolvePathDirections(
				map,
				path,
			);
			let drawn = 0;
			for (let i = 0; i < path.length; i++) {
				const leg = legs[i];
				if (!leg) continue;
				drawn++;
				const track = path[i];
				const { x, y } = gridToWorld(
					track.getLocationX(),
					track.getLocationY(),
				);
				drawLeg(
					previewGfx,
					x,
					y,
					leg.entry,
					leg.exit,
					outlines.isErasing()
						? GESTURE_PREVIEW_ERASE_COLOR
						: GESTURE_PREVIEW_COLOR,
				);
			}
		}
	}

	function destroy(): void {
		container.destroy({ children: true });
	}

	return { container, sync, setSelection, setRoutePreview, destroy };
}
