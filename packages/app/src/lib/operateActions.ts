import { type RouteKind, stepSpeed } from "@rail-op-sim/shared";
import type { OperateIntent } from "#/lib/operateInput";
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

/**
 * Set an automatic signals route on every plain section of line at once. Any
 * half-made route is dropped, since the clicks it was waiting for may now be
 * on a route; the engine says how many it set.
 */
export async function setAllAutoRoutes(): Promise<void> {
	const result = await simCommand({ type: "setAllAutoRoutes" });
	if (result.ok) useOperateStore.getState().setRouteStart(null);
}

export function toggleRouteCancel(): void {
	const s = useOperateStore.getState();
	s.setCancelArmed(!s.cancelArmed);
}

export function toggleLog(): void {
	useOperateStore.getState().toggleLog();
}

/** Carry out what a canvas click means (see `resolveOperateClick`). */
export async function applyOperateIntent(intent: OperateIntent): Promise<void> {
	const store = useOperateStore.getState();
	if (intent.type === "openTrainMenu") {
		store.openTrainMenu(intent.trainId, intent.screenX, intent.screenY);
		return;
	}
	if (store.trainMenu) store.closeTrainMenu();
	switch (intent.type) {
		case "none":
			return;
		case "abandonRoute":
			store.setRouteStart(null);
			store.setNotice(null);
			return;
		case "startRoute": {
			const result = await simCommand({
				type: "checkRouteStart",
				at: intent.at,
				kind: intent.kind,
			});
			if (result.ok) useOperateStore.getState().setRouteStart(intent.at);
			return;
		}
		case "finishRoute": {
			const result = await simCommand({
				type: "setRoute",
				from: intent.from,
				to: intent.to,
				kind: intent.kind,
			});
			// A refused end leaves the start in place, so another end can be tried.
			if (result.ok) useOperateStore.getState().setRouteStart(null);
			return;
		}
		case "cancelRoute":
			await simCommand({ type: "cancelRoute", at: intent.at });
			return;
		case "togglePoints":
			await simCommand({ type: "togglePoints", at: intent.at });
			return;
	}
}
