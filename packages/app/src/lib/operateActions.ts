import { type RouteKind, stepSpeed } from "@rail-op-sim/shared";
import { useOperateStore } from "#/store/operate-store";
import { simCommand } from "#/store/sim-bridge";

/**
 * What the operate panel's buttons and keys do. One place, so the panel and
 * the keyboard cannot disagree.
 */

/** Start the clock, or pause it if it is running. */
export function runOrPause(): void {
	const run = useOperateStore.getState().view?.run;
	void simCommand({ type: run === "running" ? "pause" : "run" });
}

/** One step slower (`-1`) or faster (`+1`) on the clock. */
export function changeSpeed(direction: 1 | -1): void {
	const speed = useOperateStore.getState().view?.speed ?? 1;
	void simCommand({ type: "setSpeed", speed: stepSpeed(speed, direction) });
}

export function chooseRouteKind(kind: RouteKind): void {
	useOperateStore.getState().setRouteKind(kind);
}

export function toggleRouteCancel(): void {
	const s = useOperateStore.getState();
	s.setCancelArmed(!s.cancelArmed);
}

export function toggleLog(): void {
	useOperateStore.getState().toggleLog();
}
