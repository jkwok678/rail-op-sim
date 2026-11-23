import { linkOffset, type TrainView, type ViewSeg } from "@rail-op-sim/shared";
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
	const [dx, dy] = linkOffset(link);
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

const dist = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);

const samePoint = (a: Point, b: Point): boolean => dist(a, b) < 1e-6;

/** Points a tight curve is drawn with: plenty for a smooth band. */
const CURVE_STEPS = 8;

const isOrthogonal = (link: number): boolean =>
	link === 1 || link === 3 || link === 5 || link === 7;

/** Up/down against left/right: a 90° turn within the cell. */
const isQuarterTurn = (entry: number, exit: number): boolean =>
	isOrthogonal(entry) &&
	isOrthogonal(exit) &&
	(entry === 1 || entry === 7) !== (exit === 1 || exit === 7);

/**
 * The centre line of a segment as the track art draws it, entry edge to exit
 * edge. Most rails pass through the middle of the cell; a quarter turn (tight
 * curves, the branch of tight points) cuts the corner instead, so it is drawn
 * as a curve with the middle as its control point.
 */
export function segPath(seg: ViewSeg): Point[] {
	const entry = edgePoint(seg.gx, seg.gy, seg.entry);
	const centre = gridToWorld(seg.gx, seg.gy);
	const exit = edgePoint(seg.gx, seg.gy, seg.exit);
	if (!isQuarterTurn(seg.entry, seg.exit)) return [entry, centre, exit];
	const points: Point[] = [];
	for (let i = 0; i <= CURVE_STEPS; i++) {
		const t = i / CURVE_STEPS;
		points.push(lerp(lerp(entry, centre, t), lerp(centre, exit, t), t));
	}
	return points;
}

/** A point on a polyline, with how far along the polyline it is. */
interface Station {
	point: Point;
	at: number;
}

function measure(points: readonly Point[]): Station[] {
	let at = 0;
	let prev: Point | undefined;
	return points.map((point) => {
		if (prev) at += dist(prev, point);
		prev = point;
		return { point, at };
	});
}

const lengthOf = (stations: readonly Station[]): number =>
	stations.at(-1)?.at ?? 0;

/** The point `d` along a measured polyline, clamped to its ends. */
function atDistance(stations: readonly Station[], d: number): Point {
	const [first, ...rest] = stations;
	if (!first) throw new Error("an empty polyline has no points");
	const last = rest.at(-1);
	let prev = first;
	for (const s of rest) {
		if (d <= s.at || s === last) {
			const span = s.at - prev.at;
			const t = span > 0 ? (d - prev.at) / span : 0;
			return lerp(prev.point, s.point, Math.min(1, Math.max(0, t)));
		}
		prev = s;
	}
	return first.point;
}

/** The inner points of a polyline that lie strictly between `start` and `end`. */
function innerPoints(
	stations: readonly Station[],
	start: number,
	end: number,
): Point[] {
	return stations
		.slice(1, -1)
		.filter((s) => s.at > start + 1e-6 && s.at < end - 1e-6)
		.map((s) => s.point);
}

/** The point `t` (0–1) of the way along a segment, measured along its rail. */
export function pointAlong(seg: ViewSeg, t: number): Point {
	const stations = measure(segPath(seg));
	return atDistance(stations, t * lengthOf(stations));
}

/** The polyline covering the span `from`–`to` of a segment, along its rail. */
export function spanPoints(seg: ViewSeg): Point[] {
	const stations = measure(segPath(seg));
	const total = lengthOf(stations);
	const start = seg.from * total;
	const end = seg.to * total;
	return [
		atDistance(stations, start),
		...innerPoints(stations, start, end),
		atDistance(stations, end),
	];
}

/** The last `d` of a polyline, as a polyline — all of it if it is shorter. */
export function pathTail(points: Point[], d: number): Point[] {
	const stations = measure(points);
	const total = lengthOf(stations);
	const end = points.at(-1);
	if (!end || points.length < 2 || d >= total) return points;
	const start = total - d;
	return [
		atDistance(stations, start),
		...innerPoints(stations, start, Number.POSITIVE_INFINITY),
		end,
	];
}

/**
 * Where a train's headcode sits: the middle of its longest piece, with the
 * angle (radians) of the rail there, turned so text never reads upside down.
 */
export function labelAnchor(
	paths: Point[][],
): { x: number; y: number; angle: number } | null {
	let best: Station[] = [];
	for (const points of paths) {
		if (points.length < 2) continue;
		const stations = measure(points);
		if (best.length === 0 || lengthOf(stations) > lengthOf(best)) {
			best = stations;
		}
	}
	const [first, ...rest] = best;
	if (!first) return null;
	const mid = lengthOf(best) / 2;
	// The leg the middle falls on: up to the first point at or past it.
	const last = rest.at(-1);
	let a = first;
	let b = first;
	for (const s of rest) {
		b = s;
		if (s.at >= mid || s === last) break;
		a = s;
	}
	let angle = Math.atan2(b.point.y - a.point.y, b.point.x - a.point.x);
	if (angle > Math.PI / 2) angle -= Math.PI;
	else if (angle <= -Math.PI / 2) angle += Math.PI;
	const at = atDistance(best, mid);
	return { x: at.x, y: at.y, angle };
}

/** A train's body, rear to front, one polyline per piece (see {@link joinedPaths}). */
export function trainPaths(train: TrainView): Point[][] {
	return joinedPaths(train.segs);
}

/**
 * Consecutive segments as polylines, so a stroke along them has no seams where
 * a cap would overlap the next segment's. A new polyline starts wherever one
 * segment does not begin where the last one ended — a hop between linked
 * tracks — so nothing is drawn across the map between the two.
 */
export function joinedPaths(segs: readonly ViewSeg[]): Point[][] {
	const paths: Point[][] = [];
	let current: Point[] = [];
	for (const seg of segs) {
		const span = spanPoints(seg);
		const last = current.at(-1);
		const [head] = span;
		if (last && head && !samePoint(last, head)) {
			paths.push(current);
			current = [];
		}
		for (const p of span) {
			const prev = current[current.length - 1];
			if (!prev || !samePoint(prev, p)) current.push(p);
		}
	}
	if (current.length > 0) paths.push(current);
	return paths;
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
	signaller: 0xfbbf24,
};

const CALL_ON_COLOR = 0xff33ff;

export function trainColor(train: TrainView): number {
	if (train.callingOnAllowed) return CALL_ON_COLOR;
	return train.status === "waiting"
		? WAIT_COLORS[train.wait ?? "station"]
		: STATUS_COLORS[train.status];
}
