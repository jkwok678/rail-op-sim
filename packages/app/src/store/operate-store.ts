import type {
	Cell,
	LogLine,
	RouteKind,
	SimView,
	TrainTimetableRow,
} from "@rail-op-sim/shared";
import { create } from "zustand";

/**
 * What operate mode shows and how the signaller is working the panel.
 *
 * The simulation itself runs in a worker; this is only its latest published
 * view and the log so far, plus the panel's own state — which kind of route
 * the next clicks set, whether right-click cancels, and the route half-made.
 */

/** Oldest lines are dropped beyond this, so a long session stays light. */
const LOG_LIMIT = 2000;

/** A log line with a sequence number, so a list can key it stably. */
export type NumberedLogLine = LogLine & { seq: number };

export type SessionStatus = "idle" | "loading" | "ready" | "error";

export interface OperateState {
	status: SessionStatus;
	error: string | null;
	view: SimView | null;
	log: NumberedLogLine[];
	/** Formatted timetable rows by train id; static per working. */
	timetables: Record<number, TrainTimetableRow[]>;
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
	/** Merge rows for trains whose working is new or changed. */
	mergeTimetables: (rows: Record<number, TrainTimetableRow[]>) => void;
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
	timetables: {},
	routeKind: "preferred" as RouteKind,
	cancelArmed: false,
	routeStart: null,
	notice: null,
	showLog: true,
};

export const useOperateStore = create<OperateState>((set) => ({
	...initial,
	setStatus: (status, error = null) => set({ status, error }),
	setView: (view) =>
		set((s) => {
			// Drop rows of trains that have left the railway.
			const ids = Object.keys(s.timetables);
			if (ids.length === 0) return { view };
			const live = new Set(view.trains.map((t) => t.id));
			if (ids.every((id) => live.has(Number(id)))) return { view };
			const timetables: Record<number, TrainTimetableRow[]> = {};
			for (const id of ids) {
				if (live.has(Number(id)))
					timetables[Number(id)] = s.timetables[Number(id)];
			}
			return { view, timetables };
		}),
	mergeTimetables: (rows) =>
		set((s) => ({ timetables: { ...s.timetables, ...rows } })),
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
