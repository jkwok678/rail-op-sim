import { useEffect } from "react";
import { autosaveNow, restoreAutosave } from "#/lib/sessionActions";
import { after, type Cancel } from "#/lib/timers";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * How long the session has to sit unchanged before it is written. Short, so a
 * refresh seconds after an edit still keeps it.
 */
export const AUTOSAVE_DEBOUNCE_MS = 1000;

/**
 * Keep the railway and timetable in the browser's session store.
 *
 * Once `ready` (the placement controller exists) the previous session is
 * restored, and only then are changes watched: subscribing first would let the
 * empty boot state overwrite the work being restored. If the session changes
 * while the restore is still reading (a fast edit or file load), that newer
 * work wins: the autosave is not applied and the change is saved instead.
 *
 * The map signals a change by bumping `historyRevision`, the timetable by
 * replacing `timetable`, the file encoding by changing `saveFormat`. A pending
 * or failed write is flushed when the page is hidden or closed.
 */
export function useAutoSave(ready: boolean): void {
	useEffect(() => {
		if (!ready) return;

		let cancelled = false;
		let cancelTimer: Cancel | null = null;
		let dirty = false;
		const cleanups: Array<() => void> = [];

		const save = async () => {
			cancelTimer?.();
			cancelTimer = null;
			if (!dirty) return;
			dirty = false;
			let written = false;
			try {
				written = await autosaveNow();
				if (!written) {
					console.warn("useAutoSave: no session storage to write to");
				}
			} catch (err) {
				console.warn("useAutoSave: autosave failed", err);
			}
			const { setAutosave, autosave } = useEditorStore.getState();
			if (written) {
				setAutosave({ lastSavedAt: Date.now(), error: false });
			} else {
				// Still unsaved, so the next hide or close tries again.
				dirty = true;
				setAutosave({ lastSavedAt: autosave.lastSavedAt, error: true });
			}
		};

		const schedule = () => {
			dirty = true;
			cancelTimer?.();
			cancelTimer = after(AUTOSAVE_DEBOUNCE_MS, () => void save());
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === "hidden") void save();
		};
		const onPageHide = () => void save();

		const before = snapshot();
		const pristine = () => sameSnapshot(before, snapshot());

		void restoreAutosave(pristine).then((restored) => {
			if (cancelled) return;
			// Changed while the restore was reading: that work is not saved yet.
			// (A restore changes the session too, so only ask when none applied.)
			if (!restored && !pristine()) schedule();
			cleanups.push(
				useEditorStore.subscribe((state, prev) => {
					if (
						state.historyRevision !== prev.historyRevision ||
						state.saveFormat !== prev.saveFormat
					) {
						schedule();
					}
				}),
				useTimetableStore.subscribe((state, prev) => {
					if (state.timetable !== prev.timetable) schedule();
				}),
			);
			window.addEventListener("pagehide", onPageHide);
			document.addEventListener("visibilitychange", onVisibilityChange);
			cleanups.push(() => {
				window.removeEventListener("pagehide", onPageHide);
				document.removeEventListener("visibilitychange", onVisibilityChange);
			});
		});

		return () => {
			cancelled = true;
			cancelTimer?.();
			for (const cleanup of cleanups) cleanup();
		};
	}, [ready]);
}

/** The parts of the session whose change means there is something to save. */
function snapshot() {
	const { historyRevision, saveFormat } = useEditorStore.getState();
	const { timetable } = useTimetableStore.getState();
	return { historyRevision, saveFormat, timetable };
}

function sameSnapshot(
	a: ReturnType<typeof snapshot>,
	b: ReturnType<typeof snapshot>,
): boolean {
	return (
		a.historyRevision === b.historyRevision &&
		a.saveFormat === b.saveFormat &&
		a.timetable === b.timetable
	);
}
