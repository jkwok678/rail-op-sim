import { decodeDocument, pickAndReadDocument } from "#/lib/documentFile";
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

/**
 * Railway mode's single upload: the picked file may be a railway or a
 * timetable, and is routed by what it contains.
 */
async function loadRailwayOrTimetable(): Promise<void> {
	try {
		const loaded = await pickAndReadDocument((text, format) =>
			isTimetableText(text, format)
				? ({
						kind: "timetable",
						data: parseTimetableText(text, format),
					} as const)
				: ({ kind: "map", data: parseMapText(text, format) } as const),
		);
		if (!loaded) {
			useTimetableStore.getState().setLoadError(null);
			return;
		}
		if (loaded.data.kind === "timetable") {
			const error = applyLoadedTimetable({
				data: loaded.data.data,
				format: loaded.format,
			});
			useTimetableStore.getState().setLoadError(error);
		} else {
			applyLoadedMap({ data: loaded.data.data, format: loaded.format });
			useTimetableStore.getState().setLoadError(null);
		}
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
