import {
	convertRailosRailway,
	convertRailosTimetable,
	itemAt,
	type SerializedMap,
	serializeMap,
	type Timetable,
} from "@rail-op-sim/shared";
import { debugLog } from "#/lib/debugLogger";
import { type DocumentFileFormat, downloadDocument } from "#/lib/documentFile";
import { applyLoadedMap } from "#/lib/mapActions";
import { applyLoadedTimetable } from "#/lib/timetableActions";

/**
 * Import a legacy RailOS railway (.rly) and/or timetable (.ttb).
 *
 * The conversion is the shared package's — the same code the railway-author
 * skill's CLI runs — so a file converted here and one converted on the
 * command line are the same document. What this adds is the browser end:
 * picking the files, decoding them, and handing the result either to a
 * download (JSON or YAML documents) or to the editor.
 */

/** One picked file, already read. */
export interface RailosSourceFile {
	name: string;
	bytes: ArrayBuffer;
}

/** A converted pick: either document may be missing, never both. */
export interface RailosImport {
	railway?: { name: string; data: SerializedMap; summary: string };
	timetable?: { name: string; data: Timetable; summary: string };
	/** What the converter could not carry over, one sentence each. */
	warnings: string[];
}

/** Thrown when the picked set cannot be imported; nothing has changed. */
export class RailosImportError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RailosImportError";
	}
}

const RAILOS_ACCEPT = ".rly,.ttb";

/** RailOS writes Latin-1, which UTF-8 decoding would mangle (£, accents). */
function decodeLatin1(bytes: ArrayBuffer): string {
	return new TextDecoder("latin1").decode(bytes);
}

const extensionOf = (name: string): string =>
	name.slice(name.lastIndexOf(".") + 1).toLowerCase();

/** The file's name without its extension, for titles and download names. */
const baseName = (name: string): string => name.replace(/\.[^.]*$/, "");

const plural = (n: number, word: string) =>
	`${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/**
 * Convert a picked set — one .rly, one .ttb, or one of each — into our
 * documents. Throws {@link RailosImportError} for a set that does not make
 * sense or a file the converter cannot read, naming the file.
 */
export function convertRailosFiles(files: RailosSourceFile[]): RailosImport {
	const rly = files.filter((f) => extensionOf(f.name) === "rly");
	const ttb = files.filter((f) => extensionOf(f.name) === "ttb");
	const other = files.filter((f) => !rly.includes(f) && !ttb.includes(f));
	if (other.length > 0) {
		throw new RailosImportError(
			`${itemAt(other, 0).name} is not a RailOS file — pick a .rly railway and/or a .ttb timetable.`,
		);
	}
	if (rly.length > 1 || ttb.length > 1 || files.length === 0) {
		throw new RailosImportError(
			"Pick one .rly railway, one .ttb timetable, or one of each.",
		);
	}

	const result: RailosImport = { warnings: [] };
	const [railwayFile] = rly;
	const [timetableFile] = ttb;

	if (railwayFile) {
		const converted = withFileName(railwayFile, () =>
			convertRailosRailway(decodeLatin1(railwayFile.bytes)),
		);
		const { trackElements, otherElements, labels } = converted.counts;
		result.railway = {
			name: railwayFile.name,
			data: serializeMap(converted.map),
			summary: `${plural(trackElements, "track element")}, ${plural(otherElements, "other element")}, ${plural(labels, "label")}`,
		};
		result.warnings.push(...converted.warnings);
	}
	if (timetableFile) {
		const converted = withFileName(timetableFile, () =>
			convertRailosTimetable(decodeLatin1(timetableFile.bytes), {
				title: baseName(timetableFile.name),
			}),
		);
		result.timetable = {
			name: timetableFile.name,
			data: converted.timetable,
			summary: plural(converted.timetable.services.length, "service"),
		};
		result.warnings.push(...converted.warnings);
	}
	return result;
}

function withFileName<T>(file: RailosSourceFile, convert: () => T): T {
	try {
		return convert();
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		throw new RailosImportError(`${file.name}: ${reason}`);
	}
}

/**
 * Open a picker for RailOS files and read every one chosen. Resolves `null`
 * when the picker is cancelled. Must be called from a user gesture.
 */
export function pickRailosFiles(): Promise<RailosSourceFile[] | null> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = RAILOS_ACCEPT;
		input.multiple = true;
		input.addEventListener("cancel", () => resolve(null));
		input.addEventListener("change", () => {
			const files = Array.from(input.files ?? []);
			if (files.length === 0) {
				resolve(null);
				return;
			}
			Promise.all(
				files.map(async (f) => ({
					name: f.name,
					bytes: await f.arrayBuffer(),
				})),
			)
				.then(resolve)
				.catch(reject);
		});
		input.click();
	});
}

/** File names for the downloaded documents, after the files they came from. */
export function railosDownloadNames(
	result: RailosImport,
	format: DocumentFileFormat = "json",
): {
	railway?: string;
	timetable?: string;
} {
	return {
		...(result.railway
			? { railway: `${baseName(result.railway.name)}.railway.${format}` }
			: {}),
		...(result.timetable
			? { timetable: `${baseName(result.timetable.name)}.timetable.${format}` }
			: {}),
	};
}

/** Download each converted document in `format` (JSON by default), leaving the editor untouched. */
export function downloadRailosImport(
	result: RailosImport,
	format: DocumentFileFormat = "json",
): void {
	const names = railosDownloadNames(result, format);
	if (result.railway && names.railway) {
		downloadDocument(result.railway.data, format, names.railway);
	}
	if (result.timetable && names.timetable) {
		downloadDocument(result.timetable.data, format, names.timetable);
	}
	debugLog("saveload", `downloaded a RailOS import as ${format.toUpperCase()}`);
}

/**
 * Replace the editor's railway and/or timetable with the converted ones,
 * railway first so the timetable is validated against the railway it lands
 * on. Returns the timetable's load message (errors that block Operate), or
 * `null`. The next save writes `format` (JSON by default).
 */
export function openRailosImport(
	result: RailosImport,
	format: DocumentFileFormat = "json",
): string | null {
	if (result.railway) {
		applyLoadedMap({ data: result.railway.data, format });
	}
	const message = result.timetable
		? applyLoadedTimetable({ data: result.timetable.data, format })
		: null;
	debugLog("saveload", "opened a RailOS import in the editor");
	return message;
}
