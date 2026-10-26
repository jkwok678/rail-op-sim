import type { Cell, RouteKind } from "@rail-op-sim/shared";

/**
 * What a click on the canvas means in operate mode, decided from the panel's
 * state alone — pure, so the rules read and test as a table.
 *
 * - Left-click starts a route, then a second left-click finishes it.
 * - Left-click on points that are not part of a route being built throws them.
 * - Right-click abandons a half-made route, or — with cancel armed — cancels
 *   the route under the cursor.
 */

export interface OperateInputState {
	routeKind: RouteKind;
	cancelArmed: boolean;
	routeStart: Cell | null;
}

export interface OperateClick {
	button: "left" | "right";
	cell: Cell;
	/** The cell holds points. */
	onPoints: boolean;
}

export type OperateIntent =
	| { type: "none" }
	| { type: "startRoute"; at: Cell; kind: RouteKind }
	| { type: "finishRoute"; from: Cell; to: Cell; kind: RouteKind }
	| { type: "abandonRoute" }
	| { type: "cancelRoute"; at: Cell }
	| { type: "togglePoints"; at: Cell };

const sameCell = (a: Cell, b: Cell): boolean => a.gx === b.gx && a.gy === b.gy;

export function resolveOperateClick(
	state: OperateInputState,
	click: OperateClick,
): OperateIntent {
	if (click.button === "right") {
		if (state.cancelArmed) return { type: "cancelRoute", at: click.cell };
		return state.routeStart ? { type: "abandonRoute" } : { type: "none" };
	}
	if (state.cancelArmed) return { type: "none" };
	if (state.routeStart) {
		if (sameCell(state.routeStart, click.cell)) return { type: "abandonRoute" };
		return {
			type: "finishRoute",
			from: state.routeStart,
			to: click.cell,
			kind: state.routeKind,
		};
	}
	if (click.onPoints) return { type: "togglePoints", at: click.cell };
	return { type: "startRoute", at: click.cell, kind: state.routeKind };
}
