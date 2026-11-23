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

export interface TrainMenuState {
	trainId: number;
	screenX: number;
	screenY: number;
}

export type TrainDialogKind =
	| "skipActions"
	| "becomeNewService"
	| "setReminder"
	| "removeTrain";

export interface TrainDialogState {
	kind: TrainDialogKind;
	trainId: number;
}

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
	/** Next click on a qualifying stop signal calls its waiting train on (§5.13). */
	callOnArmed: boolean;
	/** First click of a route being set, awaiting its end. */
	routeStart: Cell | null;
	/** Open right-click popup menu for a train. */
	trainMenu: TrainMenuState | null;
	/** Open dialog for a timetable-linked train command or reminder. */
	trainDialog: TrainDialogState | null;
	/** The last thing the engine refused, shown until the next action. */
	notice: string | null;
	showSummary: boolean;
	showLog: boolean;

	setStatus: (status: SessionStatus, error?: string | null) => void;
	setView: (view: SimView) => void;
	appendLog: (lines: LogLine[]) => void;
	/** Merge rows for trains whose working is new or changed. */
	mergeTimetables: (rows: Record<number, TrainTimetableRow[]>) => void;
	setRouteKind: (kind: RouteKind) => void;
	setCancelArmed: (armed: boolean) => void;
	setCallOnArmed: (armed: boolean) => void;
	setRouteStart: (cell: Cell | null) => void;
	openTrainMenu: (trainId: number, screenX: number, screenY: number) => void;
	closeTrainMenu: () => void;
	openTrainDialog: (kind: TrainDialogKind, trainId: number) => void;
	closeTrainDialog: () => void;
	setNotice: (notice: string | null) => void;
	toggleSummary: () => void;
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
	callOnArmed: false,
	routeStart: null,
	trainMenu: null,
	trainDialog: null,
	notice: null,
	showSummary: false,
	showLog: true,
};

export const useOperateStore = create<OperateState>((set) => ({
	...initial,
	setStatus: (status, error = null) => set({ status, error }),
	setView: (view) =>
		set((s) => {
			const callOnArmed =
				s.callOnArmed && (view.trains ?? []).some((t) => t.callingOnAllowed);
			const live = new Set((view.trains ?? []).map((t) => t.id));
			const trainMenu =
				s.trainMenu && !live.has(s.trainMenu.trainId) ? null : s.trainMenu;
			const trainDialog =
				s.trainDialog && !live.has(s.trainDialog.trainId)
					? null
					: s.trainDialog;
			// Drop rows of trains that have left the railway.
			const ids = Object.keys(s.timetables);
			if (ids.length === 0 || ids.every((id) => live.has(Number(id)))) {
				return { view, callOnArmed, trainMenu, trainDialog };
			}
			const timetables: Record<number, TrainTimetableRow[]> =
				Object.fromEntries(
					Object.entries(s.timetables).filter(([id]) => live.has(Number(id))),
				);
			return { view, callOnArmed, timetables, trainMenu, trainDialog };
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
		set({
			routeKind,
			routeStart: null,
			cancelArmed: false,
			callOnArmed: false,
			trainMenu: null,
		}),
	setCancelArmed: (cancelArmed) =>
		set({ cancelArmed, callOnArmed: false, routeStart: null, trainMenu: null }),
	setCallOnArmed: (callOnArmed) =>
		set({ callOnArmed, cancelArmed: false, routeStart: null, trainMenu: null }),
	setRouteStart: (routeStart) =>
		set({ routeStart, callOnArmed: false, trainMenu: null }),
	openTrainMenu: (trainId, screenX, screenY) =>
		set({ trainMenu: { trainId, screenX, screenY } }),
	closeTrainMenu: () => set({ trainMenu: null }),
	openTrainDialog: (kind, trainId) =>
		set({ trainMenu: null, trainDialog: { kind, trainId } }),
	closeTrainDialog: () => set({ trainDialog: null }),
	setNotice: (notice) => set({ notice }),
	toggleSummary: () => set((s) => ({ showSummary: !s.showSummary })),
	toggleLog: () => set((s) => ({ showLog: !s.showLog })),
	reset: () => set({ ...initial }),
}));
