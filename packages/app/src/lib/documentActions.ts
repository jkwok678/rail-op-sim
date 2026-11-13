import { loadMap, saveMap } from "#/lib/mapActions";
import { loadTimetable, saveTimetable } from "#/lib/timetableActions";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Save and load whichever document the current mode is editing — the railway
 * in railway mode, the timetable in timetable mode. The footer buttons and the
 * Mod+S / Mod+O hotkeys both come through here, so one key never means two
 * things depending on which path reached it.
 */

export function saveDocument(): void {
	if (useModeStore.getState().mode === "timetable") saveTimetable();
	else saveMap();
}

export async function loadTimetableDocument(): Promise<void> {
	// The editor (and railway mode) shows a rejected file's reason until it is
	// dismissed; a successful load (or a cancelled picker) clears any earlier one.
	const error = await loadTimetable();
	useTimetableStore.getState().setLoadError(error);
}

export async function loadDocument(): Promise<void> {
	if (useModeStore.getState().mode === "timetable") {
		await loadTimetableDocument();
	} else {
		await loadMap();
	}
}
