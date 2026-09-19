import {
	InvalidTimetableError,
	parseTimetable,
	type Timetable,
} from "@rail-op-sim/shared";
import {
	type DocumentFileFormat,
	decodeDocument,
	downloadDocument,
	encodeDocument,
	type LoadedDocument,
	pickAndReadDocument,
} from "#/lib/documentFile";

/**
 * Saving and loading a {@link Timetable} as a local JSON or YAML file, over the
 * same helpers the map uses.
 *
 * There is no structural check here to match `mapFile`'s: `parseTimetable` in
 * the shared package already is one, and a stricter one — it rebuilds every
 * action field by field and refuses an unknown kind outright. All this file
 * adds is the encoding and the filename.
 */

/** On-disk encodings of a {@link Timetable}. Same object, different text. */
export type TimetableFileFormat = DocumentFileFormat;

/** A timetable plus the encoding it was read from (so a later save can match). */
export type LoadedTimetableFile = LoadedDocument<Timetable>;

/** File picker `accept` for both encodings, including the shorter `.yml`. */
export { DOCUMENT_FILE_ACCEPT as TIMETABLE_FILE_ACCEPT } from "#/lib/documentFile";

/** Default download name for each encoding. */
export function timetableFileName(format: TimetableFileFormat): string {
	return format === "yaml" ? "timetable.yaml" : "timetable.json";
}

/** Serialise `timetable` as pretty-printed JSON or block-style YAML. */
export function encodeTimetable(
	timetable: Timetable,
	format: TimetableFileFormat,
): string {
	return encodeDocument(timetable, format);
}

/**
 * Parse `text` as `format` and check it really is a timetable.
 *
 * Throws {@link InvalidTimetableError} either way — a file that is not valid
 * YAML and a file that is valid YAML but not a timetable are the same kind of
 * problem to whoever picked it.
 */
export function parseTimetableText(
	text: string,
	format: TimetableFileFormat,
): Timetable {
	const parsed = decodeDocument(
		text,
		format,
		(message) => new InvalidTimetableError(message),
	);
	return parseTimetable(parsed);
}

/** Trigger a browser download of `timetable` in `format` (JSON if omitted). */
export function downloadTimetable(
	timetable: Timetable,
	options: { format?: TimetableFileFormat; filename?: string } = {},
): void {
	const format = options.format ?? "json";
	downloadDocument(
		timetable,
		format,
		options.filename ?? timetableFileName(format),
	);
}

/**
 * Open a file picker and resolve with the parsed {@link Timetable} plus the
 * encoding it used. Rejects with an {@link InvalidTimetableError} if the chosen
 * file is malformed. Resolves `null` if the user cancels the picker.
 */
export function pickAndReadTimetableFile(): Promise<LoadedTimetableFile | null> {
	return pickAndReadDocument(parseTimetableText);
}
