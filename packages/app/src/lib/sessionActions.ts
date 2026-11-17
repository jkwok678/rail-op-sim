import { parseTimetable } from "@rail-op-sim/shared";
import { PlacementController } from "#/engine/PlacementController";
import {
	AUTOSAVE_SESSION_ID,
	deleteSession,
	loadSession,
	SESSION_STATE_VERSION,
	type SessionState,
	saveSession,
} from "#/lib/db";
import { debugLog } from "#/lib/debugLogger";
import { assertSerializedMap } from "#/lib/mapFile";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Capture and restore the editing session — the railway and its timetable —
 * through the session store, so a page refresh does not wipe a tester's work.
 *
 * Like `mapActions`, the railway is applied before the timetable, because the
 * timetable is validated against the map.
 */

const AUTOSAVE_NAME = "Autosave";

/** The current session, or null before the placement controller exists. */
export function captureSession(): SessionState | null {
	const controller = PlacementController.instance;
	if (!controller) return null;
	return {
		version: SESSION_STATE_VERSION,
		map: controller.serialize(),
		timetable: useTimetableStore.getState().timetable,
		saveFormat: useEditorStore.getState().saveFormat,
	};
}

/**
 * Put a captured session back. Everything is validated before anything is
 * applied, so a bad record leaves the editor exactly as it was; returns false
 * (after a warning) for one.
 */
export function applySession(state: unknown): boolean {
	const controller = PlacementController.instance;
	if (!controller) return false;
	try {
		if (typeof state !== "object" || state === null) {
			throw new Error("session is not an object");
		}
		const s = state as Partial<SessionState>;
		if (s.version !== SESSION_STATE_VERSION) {
			throw new Error(`unsupported session version: ${String(s.version)}`);
		}
		if (s.saveFormat !== "json" && s.saveFormat !== "yaml") {
			throw new Error("session has no valid save format");
		}
		assertSerializedMap(s.map);
		const timetable = parseTimetable(s.timetable);

		controller.loadFromData(s.map);
		useTimetableStore.getState().replaceTimetable(timetable, controller.map);
		useEditorStore.getState().setSaveFormat(s.saveFormat);
		return true;
	} catch (err) {
		console.warn("sessionActions: ignoring an unusable session", err);
		return false;
	}
}

/**
 * Write the current session to the autosave slot. Resolves true only when it
 * was written — false when there is nothing to capture yet or no storage.
 */
export async function autosaveNow(): Promise<boolean> {
	const state = captureSession();
	if (!state) return false;
	const now = Date.now();
	const written = await saveSession({
		id: AUTOSAVE_SESSION_ID,
		name: AUTOSAVE_NAME,
		description: "",
		createdAt: now,
		updatedAt: now,
		state,
	});
	if (written) debugLog("saveload", "autosaved session");
	return written;
}

/**
 * Apply the autosave slot, if there is one. A record that cannot be read or
 * applied is deleted so it cannot trip every later boot; resolves true only
 * when a session was restored.
 *
 * `shouldApply` is asked once the record has been read: the editor is usable
 * while the read is in flight, and work done in that gap is newer than the
 * autosave, so it must not be overwritten.
 */
export async function restoreAutosave(
	shouldApply: () => boolean = () => true,
): Promise<boolean> {
	try {
		const record = await loadSession(AUTOSAVE_SESSION_ID);
		if (!record) return false;
		if (!shouldApply()) {
			debugLog("saveload", "skipped the autosave: the session changed first");
			return false;
		}
		if (applySession(record.state)) {
			debugLog("saveload", "restored autosaved session");
			return true;
		}
		await deleteSession(AUTOSAVE_SESSION_ID);
		return false;
	} catch (err) {
		console.warn("sessionActions: could not restore the autosave", err);
		try {
			await deleteSession(AUTOSAVE_SESSION_ID);
		} catch {
			// Storage is unusable; boot carries on with an empty railway.
		}
		return false;
	}
}
