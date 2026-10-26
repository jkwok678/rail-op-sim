import { describe, expect, it } from "vitest";
import { CELL_SIZE } from "#/lib/grid";
import {
	edgePoint,
	pointAlong,
	signalLamp,
	spanPoints,
	trainColor,
	trainPoints,
} from "#/renderer/operateGeometry";

const half = CELL_SIZE / 2;
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
		const points = trainPoints({
			id: 1,
			headcode: "1A01",
			description: "",
			status: "running",
			wait: null,
			speedKmh: 0,
			segs: [seg(0), seg(1)],
			next: "",
		});
		expect(points).toHaveLength(5);
		expect(points[4]).toEqual({ x: CELL_SIZE + half, y: 0 });
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
	});
});
