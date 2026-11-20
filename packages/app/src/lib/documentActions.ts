import {
	createEmptyTimetable,
	Map as Map_,
	serializeMap,
} from "@rail-op-sim/shared";
import { PlacementController } from "#/engine/PlacementController";
import { debugLog } from "#/lib/debugLogger";
import {
	decodeDocument,
	type LoadedDocument,
	type PickedDocument,
	pickAndReadDocuments,
} from "#/lib/documentFile";
import { applyLoadedMap, saveMap } from "#/lib/mapActions";
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
 * in railway mode, the timetable in timetable mode. Both are no-ops in operate
 * mode, where neither document is being edited and a worker session owns the
 * canvas. The footer buttons and the Mod+S / Mod+O hotkeys both come through
 * here, so one key never means two things depending on which path reached it.
 */

export function saveDocument(): void {
	switch (useModeStore.getState().mode) {
		case "railway":
			saveMap();
			break;
		case "timetable":
			saveTimetable();
			break;
		case "operate":
			// Operate edits neither document, and mid-run session saving is not
			// implemented yet — do not silently download the static map.
			break;
	}
}

async function loadTimetableDocument(): Promise<void> {
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
		useTimetableStore
			.getState()
			.setLoadError(picked ? applyRailwayPick(picked) : null);
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

/**
 * Apply a parsed railway-mode pick — railway first, then timetable — and
 * return the error to show, or `null`. A set with duplicate kinds or more
 * than two files is refused without applying anything.
 */
function applyRailwayPick(
	picked: PickedDocument<RailwayOrTimetable>[],
): string | null {
	const maps: LoadedDocument<RailwayOrTimetable & { kind: "map" }>[] = [];
	const timetables: LoadedDocument<
		RailwayOrTimetable & { kind: "timetable" }
	>[] = [];
	for (const { data, format } of picked) {
		if (data.kind === "map") maps.push({ data, format });
		else timetables.push({ data, format });
	}
	if (maps.length > 1 || timetables.length > 1)
		return "Pick at most one railway and one timetable — nothing was loaded.";

	const [map] = maps;
	const [timetable] = timetables;
	if (map) applyLoadedMap({ data: map.data.data, format: map.format });
	return timetable
		? applyLoadedTimetable({
				data: timetable.data.data,
				format: timetable.format,
			})
		: null;
}

export async function loadDocument(): Promise<void> {
	switch (useModeStore.getState().mode) {
		case "railway":
			await loadRailwayOrTimetable();
			break;
		case "timetable":
			await loadTimetableDocument();
			break;
		case "operate":
			// Operate runs a worker snapshot of the railway and timetable; loading
			// here would replace the canvas map underneath the running session.
			break;
	}
}

/**
 * Throw the timetable away and start an empty one. The autosave picks the
 * change up like any other, so a refresh no longer brings the old one back.
 */
export function clearTimetable(): void {
	useTimetableStore
		.getState()
		.replaceTimetable(
			createEmptyTimetable(),
			PlacementController.instance?.map ?? null,
		);
	debugLog("saveload", "cleared the timetable");
}

/**
 * Start a new railway: an empty map and an empty timetable. The timetable goes
 * too because it is booked onto the railway — against an empty map every
 * service would be an error. Like opening a file, this drops the undo history.
 */
export function newRailway(): void {
	const controller = PlacementController.instance;
	if (!controller) return;
	controller.loadFromData(serializeMap(new Map_()));
	clearTimetable();
	debugLog("saveload", "started a new railway");
}
