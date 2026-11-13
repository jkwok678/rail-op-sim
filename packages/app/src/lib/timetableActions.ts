import { hasErrors } from "@rail-op-sim/shared";
import { PlacementController } from "#/engine/PlacementController";
import { debugLog } from "#/lib/debugLogger";
import {
	downloadTimetable,
	type LoadedTimetableFile,
	pickAndReadTimetableFile,
} from "#/lib/timetableFile";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Save and load the timetable, shared by the editor's buttons and their
 * hotkeys so the two paths cannot drift — the same arrangement as `mapActions`.
 *
 * The encoding comes from the editor store, so a timetable is written in
 * whatever the last load or the settings row chose for the map: one setting for
 * the session's files rather than two that can disagree.
 */

export function saveTimetable(): void {
	const { timetable } = useTimetableStore.getState();
	const format = useEditorStore.getState().saveFormat;
	downloadTimetable(timetable, { format });
	debugLog("saveload", `saved timetable to file (${format})`);
}

/** Put an already-parsed timetable in the store; returns any issue message. */
export function applyLoadedTimetable(
	loaded: LoadedTimetableFile,
): string | null {
	useTimetableStore
		.getState()
		.replaceTimetable(loaded.data, PlacementController.instance?.map ?? null);
	useEditorStore.getState().setSaveFormat(loaded.format);
	debugLog("saveload", `loaded timetable from file (${loaded.format})`);
	return describeLoadedIssues();
}

export async function loadTimetable(): Promise<string | null> {
	try {
		// The picker has to be opened from the user gesture that got us here — a
		// keydown carries user activation, so the hotkey path works too.
		const loaded = await pickAndReadTimetableFile();
		if (!loaded) return null; // picker cancelled
		return applyLoadedTimetable(loaded);
	} catch (err) {
		// A rejected file leaves the editor exactly as it was: the message goes
		// back to the caller to show, and nothing has been replaced.
		const message =
			err instanceof Error ? err.message : "That file is not a timetable.";
		console.error("timetableActions: failed to load timetable file", err);
		return message;
	}
}

/**
 * A message for a timetable that loaded but cannot be operated, or null when it
 * is clean. A file can parse and still fail validation, and the Operate button
 * only says "fix the errors" — this names the first one so the user is not left
 * guessing why it is greyed out.
 */
function describeLoadedIssues(): string | null {
	const errors = useTimetableStore
		.getState()
		.issues.filter((issue) => issue.severity === "error");
	if (!hasErrors(errors)) return null;
	const more = errors.length > 1 ? ` (and ${errors.length - 1} more)` : "";
	return `Timetable loaded with ${errors.length === 1 ? "an error" : `${errors.length} errors`}, so Operate is unavailable: ${errors[0].message}${more}`;
}
