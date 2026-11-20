import {
	hasErrors,
	type Timetable,
	type TimetableIssue,
} from "@rail-op-sim/shared";
import { create } from "zustand";
import { debugLog } from "#/lib/debugLogger";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { useOperateStore } from "#/store/operate-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Which document the user is working on: the railway, or the timetable laid
 * over it.
 *
 * The modes are exclusive on purpose. A timetable is validated against the
 * railway it books trains onto, so editing both at once means every map edit
 * can silently invalidate services the user is not looking at. In timetable
 * mode the map is a read-only backdrop — pan, zoom, hover and "pick on map" —
 * and in railway mode the timetable is not on screen at all.
 *
 * A store of its own rather than a field on `editor-store` or
 * `timetable-store`, because it sits above both: switching mode resets
 * transient state in each, and neither should import the other to do it.
 *
 * Operate mode runs the timetable on the railway. Both are read-only there;
 * the session itself is opened and closed by `useOperateSession`, which can
 * reach the map.
 */
export type AppMode = "railway" | "timetable" | "operate";

export interface ModeState {
	mode: AppMode;
	/**
	 * The mode the user last tried to enter and was refused by a gate, so the
	 * screen can say why — a tooltip or a silent hotkey is easy to miss. Cleared
	 * by any successful switch, or dismissed.
	 */
	blockedNotice: AppMode | null;
	dismissBlockedNotice: () => void;
	/**
	 * Switch to `mode`, returning whether it happened. Refused when the railway
	 * cannot yet be timetabled — see {@link timetableBlockedReason}.
	 */
	setMode: (mode: AppMode) => boolean;
	/**
	 * Asked before leaving a session whose clock has started, since leaving
	 * throws it away. Swapped out by tests.
	 */
	confirmLeaveOperate: () => boolean;
}

/**
 * Why timetable mode cannot be entered yet, or null when it can.
 *
 * A timetable books trains to named platforms and runs them along preferred
 * directions, so the railway has to be complete — not merely joined.
 */
export function timetableBlockedReason(
	trackStatus: TrackStatus | null,
): string | null {
	if (trackStatus?.complete) return null;
	if (!trackStatus || trackStatus.total === 0) return "Build a railway first";
	return "Finish the railway first — every element named and directed";
}

/**
 * Why operate mode cannot be entered yet, or null when it can: it needs
 * everything the timetable does, plus a timetable with services and no errors.
 */
export function operateBlockedReason(
	trackStatus: TrackStatus | null,
	timetable: Timetable,
	issues: readonly TimetableIssue[],
): string | null {
	const railway = timetableBlockedReason(trackStatus);
	if (railway) return railway;
	if (timetable.services.length === 0) return "Write a timetable first";
	if (hasErrors(issues)) return "Fix the timetable's errors first";
	return null;
}

/**
 * Whether leaving operate mode would throw away a session that has run. A
 * session that errored has nothing left worth confirming: its engine is gone.
 */
function sessionStarted(): boolean {
	const { status, view } = useOperateStore.getState();
	if (status === "error") return false;
	const run = view?.run;
	return run !== undefined && run !== "prestart";
}

export const useModeStore = create<ModeState>((set, get) => ({
	mode: "railway",
	blockedNotice: null,
	dismissBlockedNotice: () => set({ blockedNotice: null }),

	setMode: (mode) => {
		const prev = get().mode;
		if (mode === prev) return true;

		if (
			prev === "operate" &&
			sessionStarted() &&
			!get().confirmLeaveOperate()
		) {
			return false;
		}

		if (mode !== "railway") {
			const reason = blockedReason(mode);
			if (reason) {
				debugLog("store", `setMode: ${mode} refused — ${reason}`);
				set({ blockedNotice: mode });
				return false;
			}
			// Put the map down: back to Select, which cancels any half-made
			// gesture, open dialog or section selection the railway tools left
			// behind. The placement controller tears down their overlays on the
			// tool change, the same as a manual switch to Select.
			useEditorStore.getState().setTool("select");
		}

		if (prev === "timetable") {
			// The canvas should not keep waiting for a click on behalf of an
			// editor that is no longer on screen.
			useTimetableStore.getState().cancelCellPick();
		}

		debugLog("store", `setMode: ${prev} → ${mode}`);
		set({ mode, blockedNotice: null });
		return true;
	},

	confirmLeaveOperate: () =>
		typeof window === "undefined" ||
		window.confirm("Leave operate mode? The session will be lost."),
}));

/** Why `mode` cannot be entered now, from the live stores. */
export function blockedReason(mode: AppMode): string | null {
	const { trackStatus } = useEditorStore.getState();
	switch (mode) {
		case "railway":
			return null;
		case "timetable":
			return timetableBlockedReason(trackStatus);
		case "operate": {
			const { timetable, issues } = useTimetableStore.getState();
			return operateBlockedReason(trackStatus, timetable, issues);
		}
	}
}

/** Why each mode cannot be entered right now, kept live for the UI. */
export function useBlockedReasons(): Record<AppMode, string | null> {
	const trackStatus = useEditorStore((s) => s.trackStatus);
	const timetable = useTimetableStore((s) => s.timetable);
	const issues = useTimetableStore((s) => s.issues);
	return {
		railway: null,
		timetable: timetableBlockedReason(trackStatus),
		operate: operateBlockedReason(trackStatus, timetable, issues),
	};
}
