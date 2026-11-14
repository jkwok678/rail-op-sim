import { describe, expect, it } from "vitest";
import {
	type OperateInputState,
	resolveOperateClick,
} from "#/lib/operateInput";

const at = { gx: 3, gy: 1 };
const start = { gx: 1, gy: 1 };
const idle: OperateInputState = {
	routeKind: "preferred",
	cancelArmed: false,
	routeStart: null,
};

describe("resolveOperateClick", () => {
	it.each([
		[
			"left, idle",
			idle,
			"left",
			false,
			{ type: "startRoute", at, kind: "preferred" },
		],
		["left on points, idle", idle, "left", true, { type: "togglePoints", at }],
		[
			"left with a route started",
			{ ...idle, routeStart: start },
			"left",
			true,
			{ type: "finishRoute", from: start, to: at, kind: "preferred" },
		],
		[
			"left on the start again",
			{ ...idle, routeStart: at },
			"left",
			false,
			{ type: "abandonRoute" },
		],
		[
			"right with a route started",
			{ ...idle, routeStart: start },
			"right",
			false,
			{ type: "abandonRoute" },
		],
		["right, idle", idle, "right", false, { type: "none" }],
		[
			"right with cancel armed",
			{ ...idle, cancelArmed: true },
			"right",
			false,
			{ type: "cancelRoute", at },
		],
		[
			"left with cancel armed",
			{ ...idle, cancelArmed: true },
			"left",
			false,
			{ type: "none" },
		],
	] as const)("%s", (_, state, button, onPoints, expected) => {
		expect(resolveOperateClick(state, { button, cell: at, onPoints })).toEqual(
			expected,
		);
	});

	it("opens the train menu on idle right-click over a train, but respects cancel/routeStart first", () => {
		expect(
			resolveOperateClick(idle, {
				button: "right",
				cell: at,
				onPoints: false,
				trainId: 7,
				screenX: 100,
				screenY: 200,
			}),
		).toEqual({
			type: "openTrainMenu",
			trainId: 7,
			screenX: 100,
			screenY: 200,
		});
		expect(
			resolveOperateClick(
				{ ...idle, cancelArmed: true },
				{ button: "right", cell: at, onPoints: false, trainId: 7 },
			),
		).toEqual({ type: "cancelRoute", at });
		expect(
			resolveOperateClick(
				{ ...idle, routeStart: start },
				{ button: "right", cell: at, onPoints: false, trainId: 7 },
			),
		).toEqual({ type: "abandonRoute" });
	});
});
