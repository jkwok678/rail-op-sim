import type { Cell, LogLine, RouteKind, SimView } from "@rail-op-sim/shared";
import { create } from "zustand";

/**
 * What operate mode shows and how the signaller is working the panel.
 *
 * The simulation itself runs in a worker; this is only its latest published
 * view and the log so far, plus the panel's own state — which kind of route
 * the next clicks set, whether right-click cancels, and the route half-made.
 */

/** Oldest lines are dropped beyond this, so a long session stays light. */
export const LOG_LIMIT = 2000;

/** A log line with a sequence number, so a list can key it stably. */
export type NumberedLogLine = LogLine & { seq: number };

export type SessionStatus = "idle" | "loading" | "ready" | "error";

export interface OperateState {
	status: SessionStatus;
	error: string | null;
	view: SimView | null;
	log: NumberedLogLine[];
	routeKind: RouteKind;
	/** Right-click cancels the route under the cursor while armed. */
	cancelArmed: boolean;
	/** First click of a route being set, awaiting its end. */
	routeStart: Cell | null;
	/** The last thing the engine refused, shown until the next action. */
	notice: string | null;
	showLog: boolean;

	setStatus: (status: SessionStatus, error?: string | null) => void;
	setView: (view: SimView) => void;
	appendLog: (lines: LogLine[]) => void;
	setRouteKind: (kind: RouteKind) => void;
	setCancelArmed: (armed: boolean) => void;
	setRouteStart: (cell: Cell | null) => void;
	setNotice: (notice: string | null) => void;
	toggleLog: () => void;
	reset: () => void;
}

const initial = {
	status: "idle" as SessionStatus,
	error: null,
	view: null,
	log: [],
	routeKind: "preferred" as RouteKind,
	cancelArmed: false,
	routeStart: null,
	notice: null,
	showLog: true,
};

export const useOperateStore = create<OperateState>((set) => ({
	...initial,
	setStatus: (status, error = null) => set({ status, error }),
	setView: (view) => set({ view }),
	appendLog: (lines) =>
		set((s) => {
			const first = (s.log[s.log.length - 1]?.seq ?? 0) + 1;
			const numbered = lines.map((line, i) => ({ ...line, seq: first + i }));
			return { log: [...s.log, ...numbered].slice(-LOG_LIMIT) };
		}),
	setRouteKind: (routeKind) =>
		set({ routeKind, routeStart: null, cancelArmed: false }),
	setCancelArmed: (cancelArmed) => set({ cancelArmed, routeStart: null }),
	setRouteStart: (routeStart) => set({ routeStart }),
	setNotice: (notice) => set({ notice }),
	toggleLog: () => set((s) => ({ showLog: !s.showLog })),
	reset: () => set({ ...initial }),
}));
