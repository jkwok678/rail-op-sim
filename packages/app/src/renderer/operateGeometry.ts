import {
	LINK_OFFSETS,
	type TrainView,
	type ViewSeg,
} from "@rail-op-sim/shared";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";

/**
 * Where things in operate mode are drawn. Pure — no pixi — so the geometry
 * can be tested on its own.
 *
 * A segment runs from the middle of its entry edge to the middle of the cell
 * and on to the middle of its exit edge; a fraction along it is measured the
 * same way, half the cell on each side of the middle.
 */

export interface Point {
	x: number;
	y: number;
}

/** The middle of the edge of cell `(gx, gy)` that `link` leaves through. */
export function edgePoint(gx: number, gy: number, link: number): Point {
	const centre = gridToWorld(gx, gy);
	const [dx, dy] = LINK_OFFSETS[link];
	// Grid +Y is up; world +Y is down.
	return {
		x: centre.x + (dx * CELL_SIZE) / 2,
		y: centre.y - (dy * CELL_SIZE) / 2,
	};
}

const lerp = (a: Point, b: Point, t: number): Point => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
});

/** The point `t` (0–1) of the way along a segment. */
export function pointAlong(seg: ViewSeg, t: number): Point {
	const entry = edgePoint(seg.gx, seg.gy, seg.entry);
	const centre = gridToWorld(seg.gx, seg.gy);
	const exit = edgePoint(seg.gx, seg.gy, seg.exit);
	return t <= 0.5
		? lerp(entry, centre, t * 2)
		: lerp(centre, exit, (t - 0.5) * 2);
}

/** The polyline covering the span `from`–`to` of a segment. */
export function spanPoints(seg: ViewSeg): Point[] {
	const points = [pointAlong(seg, seg.from)];
	if (seg.from < 0.5 && seg.to > 0.5) points.push(gridToWorld(seg.gx, seg.gy));
	points.push(pointAlong(seg, seg.to));
	return points;
}

/** A train's whole body, rear to front, as one polyline. */
export function trainPoints(train: TrainView): Point[] {
	const points: Point[] = [];
	for (const seg of train.segs) {
		for (const p of spanPoints(seg)) {
			const last = points[points.length - 1];
			if (
				!last ||
				Math.abs(last.x - p.x) > 1e-6 ||
				Math.abs(last.y - p.y) > 1e-6
			) {
				points.push(p);
			}
		}
	}
	return points;
}

export type Lamp = "red" | "yellow" | "doubleYellow" | "green" | "white";

/**
 * What a signal head shows for an aspect (0 red … 3 green), given what it can
 * show: a two-aspect signal goes straight to green, a three-aspect one has no
 * double yellow, and a shunt signal shows white for proceed.
 */
export function signalLamp(aspect: number, capability: number): Lamp {
	if (aspect <= 0) return "red";
	if (capability === 1) return "white";
	if (capability === 2) return "green";
	if (aspect === 1) return "yellow";
	if (aspect === 2 && capability >= 4) return "doubleYellow";
	return "green";
}

/**
 * Train body colours, after RailOS's headcode backgrounds (OPERATE-MODE §6.7):
 * grey when moving, green at a red signal, yellow after a SPAD, and so on.
 */
const STATUS_COLORS: Record<Exclude<TrainView["status"], "waiting">, number> = {
	running: 0xcbd5e1,
	dwelling: 0x86efac,
	spad: 0xfde047,
	crashed: 0xdc2626,
	finished: 0x94a3b8,
};

const WAIT_COLORS: Record<NonNullable<TrainView["wait"]>, number> = {
	signal: 0x66ff00,
	train: 0x9999ff,
	buffers: 0x67e8f9,
	points: 0xfb923c,
	station: 0x86efac,
};

export function trainColor(train: TrainView): number {
	return train.status === "waiting"
		? WAIT_COLORS[train.wait ?? "station"]
		: STATUS_COLORS[train.status];
}
