import { describe, expect, it } from "vitest";
import { CELL_SIZE } from "#/lib/grid";
import {
	edgePoint,
	joinedPaths,
	labelAnchor,
	pathTail,
	pointAlong,
	segPath,
	signalLamp,
	spanPoints,
	trainColor,
	trainPaths,
} from "#/renderer/operateGeometry";
import { defined } from "../../lib/__tests__/test-helpers";

const half = CELL_SIZE / 2;

/** Points equal to rounding, so -0 and +0 match. */
const near = (a: { x: number; y: number }, b: { x: number; y: number }) => {
	expect(a.x).toBeCloseTo(b.x);
	expect(a.y).toBeCloseTo(b.y);
};
const seg = (gx: number, from = 0, to = 1) => ({
	gx,
	gy: 0,
	entry: 3,
	exit: 5,
	from,
	to,
});

describe("operate geometry", () => {
	it("puts link edges half a cell out, with grid up drawn up", () => {
		const right = edgePoint(0, 0, 5);
		const up = edgePoint(0, 0, 1);
		expect([right.x, right.y + 0]).toEqual([half, 0]);
		expect([up.x, up.y]).toEqual([0, -half]);
	});

	it("measures along a segment through the middle of the cell", () => {
		expect(pointAlong(seg(0), 0)).toEqual({ x: -half, y: 0 });
		expect(pointAlong(seg(0), 0.5)).toEqual({ x: 0, y: 0 });
		expect(pointAlong(seg(0), 0.75)).toEqual({ x: half / 2, y: 0 });
	});

	it("bends a span through the cell's middle only when it crosses it", () => {
		expect(spanPoints(seg(0, 0, 1))).toHaveLength(3);
		expect(spanPoints(seg(0, 0.6, 1))).toHaveLength(2);
	});

	it("joins a train's spans into one line without repeats", () => {
		const paths = trainPaths({
			id: 1,
			headcode: "1A01",
			description: "",
			status: "running",
			wait: null,
			speedKmh: 0,
			segs: [seg(0), seg(1)],
			next: "",
			timetableIndex: 0,
			workingDone: false,
			signallerControl: false,
			signallerMode: "stop",
			canRestoreTimetable: false,
			followOnServiceRef: null,
			reminder: null,
			callingOnAllowed: false,
		});
		expect(paths).toHaveLength(1);
		expect(paths[0]).toHaveLength(5);
		expect(paths[0]?.[4]).toEqual({
			x: CELL_SIZE + half,
			y: 0,
		});
	});

	it("follows a tight curve round the corner, not through the middle", () => {
		// In from the left, out at the bottom: the rail bows toward the corner.
		const curve = { gx: 0, gy: 0, entry: 3, exit: 7, from: 0, to: 1 };
		const path = segPath(curve);
		near(defined(path[0], "path[0]"), edgePoint(0, 0, 3));
		near(defined(path.at(-1), "path.at(-1)"), edgePoint(0, 0, 7));
		const mid = pointAlong(curve, 0.5);
		// A quarter of the way to the corner — where the tight-curve art runs.
		near(mid, { x: -half / 4, y: half / 4 });
		// A partial span starts and ends on the curve too.
		const span = spanPoints({ ...curve, from: 0.5, to: 1 });
		expect(span[0]?.x).toBeCloseTo(mid.x);
		expect(span[0]?.y).toBeCloseTo(mid.y);
	});

	it("keeps straight and gentle curves through the middle", () => {
		expect(segPath(seg(0))).toHaveLength(3);
		const diagonalTurn = { gx: 0, gy: 0, entry: 3, exit: 8, from: 0, to: 1 };
		near(defined(segPath(diagonalTurn)[1], "segPath(diagonalTurn)[1]"), {
			x: 0,
			y: 0,
		});
	});

	it("breaks the line at a hop between linked tracks", () => {
		// Out at the right of (0,0), in at the left of the partner at (9,4).
		const here = { gx: 0, gy: 0, entry: 3, exit: 5, from: 0, to: 1 };
		const there = { gx: 9, gy: 4, entry: 3, exit: 5, from: 0, to: 1 };
		const paths = joinedPaths([here, there]);
		expect(paths).toHaveLength(2);
		const [first, second] = paths;
		near(defined(first?.at(-1), "first end"), edgePoint(0, 0, 5));
		near(defined(second?.[0], "second start"), edgePoint(9, 4, 3));
	});
	it("shows only the lamps a signal has", () => {
		expect(signalLamp(0, 4)).toBe("red");
		expect(signalLamp(2, 4)).toBe("doubleYellow");
		expect(signalLamp(2, 3)).toBe("green");
		expect(signalLamp(1, 2)).toBe("green");
		expect(signalLamp(3, 1)).toBe("white");
	});

	it("colours a train by what it is doing", () => {
		const base = {
			id: 1,
			headcode: "1A01",
			description: "",
			speedKmh: 0,
			segs: [],
			next: "",
			timetableIndex: 0,
			workingDone: false,
			signallerControl: false,
			signallerMode: "stop" as const,
			canRestoreTimetable: false,
			followOnServiceRef: null,
			reminder: null,
			callingOnAllowed: false,
		};
		expect(trainColor({ ...base, status: "running", wait: null })).toBe(
			0xcbd5e1,
		);
		expect(trainColor({ ...base, status: "waiting", wait: "signal" })).toBe(
			0x66ff00,
		);
		expect(trainColor({ ...base, status: "waiting", wait: null })).toBe(
			0x86efac,
		);
		expect(trainColor({ ...base, status: "crashed", wait: null })).toBe(
			0xdc2626,
		);
		expect(trainColor({ ...base, status: "waiting", wait: "signaller" })).toBe(
			0xfbbf24,
		);
	});

	it("takes the tail of a polyline", () => {
		const line = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
		];
		expect(pathTail(line, 4)).toEqual([
			{ x: 6, y: 0 },
			{ x: 10, y: 0 },
		]);
		expect(pathTail(line, 25)).toEqual(line);
	});

	it("keeps the bend when the tail spans one", () => {
		const bent = [
			{ x: 0, y: 0 },
			{ x: 10, y: 0 },
			{ x: 10, y: 10 },
		];
		const tail = pathTail(bent, 14);
		expect(tail).toHaveLength(3);
		near(defined(tail[0], "tail[0]"), { x: 6, y: 0 });
		near(defined(tail[1], "tail[1]"), { x: 10, y: 0 });
		near(defined(tail[2], "tail[2]"), { x: 10, y: 10 });
	});

	it("anchors a label at the middle of a straight path", () => {
		const anchor = labelAnchor([
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
			],
		]);
		near(anchor as { x: number; y: number }, { x: 5, y: 0 });
		expect(anchor?.angle).toBeCloseTo(0);
	});

	it("never turns a label upside down", () => {
		const left = labelAnchor([
			[
				{ x: 10, y: 0 },
				{ x: 0, y: 0 },
			],
		]);
		expect(left?.angle).toBeCloseTo(0);
		for (const [a, b] of [
			[0, 10],
			[10, 0],
		] as const) {
			const vertical = labelAnchor([
				[
					{ x: 0, y: a },
					{ x: 0, y: b },
				],
			]);
			expect(vertical?.angle).toBeCloseTo(Math.PI / 2);
		}
	});

	it("anchors a label on the longest piece", () => {
		const anchor = labelAnchor([
			[
				{ x: 0, y: 0 },
				{ x: 2, y: 0 },
			],
			[
				{ x: 0, y: 100 },
				{ x: 0, y: 108 },
			],
		]);
		near(anchor as { x: number; y: number }, { x: 0, y: 104 });
	});

	it("has no label anchor without a usable piece", () => {
		expect(labelAnchor([])).toBeNull();
		expect(labelAnchor([[{ x: 0, y: 0 }]])).toBeNull();
	});
});
