import { decodeDocument, pickAndReadDocuments } from "#/lib/documentFile";
import { applyLoadedMap, loadMap, saveMap } from "#/lib/mapActions";
import { parseMapText } from "#/lib/mapFile";
import {
	applyLoadedTimetable,
	loadTimetable,
	saveTimetable,
} from "#/lib/timetableActions";
import { parseTimetableText } from "#/lib/timetableFile";
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

/** A file with a `services` list is a timetable; anything else is tried as a map. */
function isTimetableText(text: string, format: "json" | "yaml"): boolean {
	try {
		const parsed = decodeDocument(text, format, (m) => new Error(m));
		return (
			typeof parsed === "object" &&
			parsed !== null &&
			Array.isArray((parsed as { services?: unknown }).services) &&
			!("tracks" in parsed)
		);
	} catch {
		return false;
	}
}

/** What a file picked in railway mode turned out to be. */
type RailwayOrTimetable =
	| { kind: "map"; data: ReturnType<typeof parseMapText> }
	| { kind: "timetable"; data: ReturnType<typeof parseTimetableText> };

/**
 * Railway mode's upload: pick a railway, a timetable, or both at once, in any
 * order, and each file is routed by what it contains.
 *
 * The railway is always applied first however the files were listed, because
 * the timetable is validated against the railway it lands on — applied the
 * other way round it would be judged against the old map and report errors
 * the new one does not have. Loading a map keeps the timetable and
 * revalidates it, so railway-then-timetable leaves both in place and the
 * issues Operate is gated on already computed; no visit to timetable mode is
 * needed.
 *
 * Every file is parsed before anything is applied, and a set that cannot
 * make sense (two railways, two timetables, more than two files) is refused
 * whole, so a bad pick never half-replaces the user's work.
 */
async function loadRailwayOrTimetable(): Promise<void> {
	try {
		const picked = await pickAndReadDocuments<RailwayOrTimetable>(
			(text, format) =>
				isTimetableText(text, format)
					? { kind: "timetable", data: parseTimetableText(text, format) }
					: { kind: "map", data: parseMapText(text, format) },
		);
		if (!picked) {
			useTimetableStore.getState().setLoadError(null);
			return;
		}
		const maps = picked.filter((p) => p.data.kind === "map");
		const timetables = picked.filter((p) => p.data.kind === "timetable");
		if (picked.length > 2 || maps.length > 1 || timetables.length > 1) {
			useTimetableStore
				.getState()
				.setLoadError(
					"Pick at most one railway and one timetable — nothing was loaded.",
				);
			return;
		}

		let error: string | null = null;
		for (const doc of maps) {
			if (doc.data.kind === "map")
				applyLoadedMap({ data: doc.data.data, format: doc.format });
		}
		for (const doc of timetables) {
			if (doc.data.kind === "timetable")
				error = applyLoadedTimetable({
					data: doc.data.data,
					format: doc.format,
				});
		}
		useTimetableStore.getState().setLoadError(error);
	} catch (err) {
		console.error("documentActions: failed to load file", err);
		useTimetableStore
			.getState()
			.setLoadError(
				err instanceof Error
					? err.message
					: "That file is not a railway or timetable.",
			);
	}
}

export async function loadDocument(): Promise<void> {
	const { mode } = useModeStore.getState();
	if (mode === "timetable") {
		await loadTimetableDocument();
	} else if (mode === "railway") {
		await loadRailwayOrTimetable();
	} else {
		await loadMap();
	}
}
