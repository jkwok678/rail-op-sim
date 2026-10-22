import { create } from "zustand";
import { debugLog } from "#/lib/debugLogger";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
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
 * `"operate"` joins the union when the timetable engine lands.
 */
export type AppMode = "railway" | "timetable";

export interface ModeState {
	mode: AppMode;
	/**
	 * Switch to `mode`, returning whether it happened. Refused when the railway
	 * cannot yet be timetabled — see {@link timetableBlockedReason}.
	 */
	setMode: (mode: AppMode) => boolean;
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

export const useModeStore = create<ModeState>((set, get) => ({
	mode: "railway",

	setMode: (mode) => {
		const prev = get().mode;
		if (mode === prev) return true;

		if (mode === "timetable") {
			const reason = timetableBlockedReason(
				useEditorStore.getState().trackStatus,
			);
			if (reason) {
				debugLog("store", `setMode: timetable refused — ${reason}`);
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
		set({ mode });
		return true;
	},
}));
