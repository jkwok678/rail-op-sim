import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getRails, SignalAspect, SwitchType } from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import {
	crossingArt,
	OPERATE_ART_FILES,
	openCrossingTile,
	operateArt,
	pointsArt,
	signalArt,
} from "../operateArt";

const GRAPHICS = resolve(__dirname, "../../../public/graphics");

describe("signalArt", () => {
	it("lights a four-aspect signal for each aspect", () => {
		const art = (aspect: number) =>
			signalArt("SIGNALRIGHT", aspect, SignalAspect.FOUR_ASPECT);
		expect(art(0)).toEqual(["signalRight.svg"]);
		expect(art(1)).toEqual(["signalRightYellow.svg"]);
		expect(art(2)).toEqual(["signalRightDoubleYellow.svg"]);
		expect(art(3)).toEqual(["signalRightGreen.svg"]);
	});

	it("shows no double yellow on a three-aspect signal, no yellow on a two", () => {
		expect(signalArt("SIGNALUP", 2, SignalAspect.THREE_ASPECT)).toEqual([
			"signalUpGreen.svg",
		]);
		expect(signalArt("SIGNALUP", 1, SignalAspect.TWO_ASPECT)).toEqual([
			"signalUpGreen.svg",
		]);
	});

	it("shows two reds or two whites on a shunt signal", () => {
		expect(signalArt("SIGNALLEFTDOWN", 0, SignalAspect.SHUNT)).toEqual([
			"shuntLeftDownRed.svg",
		]);
		expect(signalArt("SIGNALLEFTDOWN", 3, SignalAspect.SHUNT)).toEqual([
			"shuntLeftDownWhite.svg",
		]);
	});

	it("ignores what is not a signal", () => {
		expect(signalArt("STRAIGHTH", 3, SignalAspect.FOUR_ASPECT)).toBeNull();
	});
});

describe("pointsArt", () => {
	it("draws the gapped points and the rail they lie for", () => {
		// SWITCH3 runs W–E straight, diverging W–SE.
		expect(pointsArt("SWITCH3", 3, 5)).toEqual([
			"switchGapped3.svg",
			"switchStraight3.svg",
		]);
		expect(pointsArt("SWITCH3", 8, 3)).toEqual([
			"switchGapped3.svg",
			"switchDiverging3.svg",
		]);
	});

	it("names a split's legs as forks", () => {
		// SWITCHSPLIT1 leads from the west to NE (left) and SE (right).
		expect(pointsArt("SWITCHSPLIT1", 2, 3)).toEqual([
			"switchSplitGapped1.svg",
			"switchSplitLeftFork1.svg",
		]);
		expect(pointsArt("SWITCHSPLIT1", 3, 8)).toEqual([
			"switchSplitGapped1.svg",
			"switchSplitRightFork1.svg",
		]);
	});

	it("gives a switch's two rails different legs", () => {
		for (const subtype of Object.values(SwitchType) as string[]) {
			const legs = getRails("switch", subtype as never).map(
				(r) => pointsArt(subtype, r.a, r.b)?.[1],
			);
			expect(legs, subtype).toHaveLength(2);
			expect(legs[0], subtype).toBeTruthy();
			expect(legs[0], subtype).not.toBe(legs[1]);
		}
	});

	it("ignores a rail the points do not have", () => {
		expect(pointsArt("SWITCH3", 0, 8)).toBeNull();
	});
});

describe("operateArt", () => {
	it("keys each signal and set of points by cell", () => {
		const art = operateArt({
			signals: [
				{
					gx: 1,
					gy: 2,
					subtype: "SIGNALLEFT",
					aspect: 3,
					aspects: 4,
					callingOn: false,
				},
			],
			points: [{ gx: -1, gy: 0, subtype: "SWITCH3", a: 3, b: 5 }],
		} as never);
		expect(art).toEqual(
			new Map([
				["1,2", ["signalLeftGreen.svg"]],
				["-1,0", ["switchGapped3.svg", "switchStraight3.svg"]],
			]),
		);
	});

	it("is empty with no view", () => {
		expect(operateArt(null).size).toBe(0);
	});
});

describe("openCrossingTile", () => {
	it("turns the barriers along a single track", () => {
		expect(openCrossingTile("STRAIGHTH", 0, 1)).toBe("levelCrossingV.svg");
		expect(openCrossingTile("STRAIGHTV", 0, 1)).toBe("levelCrossingH.svg");
	});

	it("puts barriers on the outer sides of a crossing over several tracks", () => {
		const across = (subtype: string) =>
			[0, 1, 2].map((i) => openCrossingTile(subtype, i, 3));
		expect(across("STRAIGHTH")).toEqual([
			"levelCrossingVTop.svg",
			"levelCrossingPlain.svg",
			"levelCrossingVBottom.svg",
		]);
		expect(across("STRAIGHTV")).toEqual([
			"levelCrossingHLeft.svg",
			"levelCrossingPlain.svg",
			"levelCrossingHRight.svg",
		]);
	});

	it("has nothing for a diagonal crossing", () => {
		expect(openCrossingTile("STRAIGHTLEFTUP", 0, 1)).toBeNull();
	});
});

describe("crossingArt", () => {
	const view = (barriers: string) =>
		({
			levelCrossings: [
				{ subtype: "STRAIGHTV", cells: [{ gx: 4, gy: 5 }], barriers },
			],
		}) as never;

	it("shows lowered barriers, and keeps the usual art while they are up", () => {
		expect(crossingArt(view("down"), false)).toEqual(
			new Map([["4,5", "levelCrossingH.svg"]]),
		);
		expect(crossingArt(view("up"), true).size).toBe(0);
	});

	it("alternates while the barriers move", () => {
		for (const moving of ["lowering", "raising"]) {
			expect(crossingArt(view(moving), true).size).toBe(1);
			expect(crossingArt(view(moving), false).size).toBe(0);
		}
	});
});

describe("OPERATE_ART_FILES", () => {
	it("all exist in public/graphics", () => {
		const missing = OPERATE_ART_FILES.filter(
			(f) => !existsSync(resolve(GRAPHICS, f)),
		);
		expect(missing).toEqual([]);
	});

	it("covers every signal state and points leg", () => {
		// 8 directions × (red, yellow, double yellow, green, calling-on, shunt
		// red, shunt white) + 32 points × (gapped, two legs) + crossings lowered
		// over one track or several (2 × only, first, last; one plain).
		expect(OPERATE_ART_FILES).toHaveLength(8 * 7 + 32 * 3 + 2 * 3 + 1);
	});
});
