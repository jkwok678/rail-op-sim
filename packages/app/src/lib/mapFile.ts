import {
	SERIALIZED_MAP_VERSION,
	type SerializedMap,
} from "@rail-op-sim/shared";
import {
	type DocumentFileFormat,
	decodeDocument,
	downloadDocument,
	encodeDocument,
	inferDocumentFormat,
	type LoadedDocument,
	pickAndReadDocument,
} from "#/lib/documentFile";

/**
 * Saving and loading a {@link SerializedMap} as a local JSON or YAML file.
 *
 * The file handling itself lives in `documentFile` and is shared with the
 * timetable; what is left here is the part that is specific to a map — what
 * counts as one, what a map file is called, and the error a bad one raises.
 */

/** On-disk encodings of a {@link SerializedMap}. Same object, different text. */
export type MapFileFormat = DocumentFileFormat;

/** A map document plus the encoding it was read from (so a later save can match). */
export type LoadedMapFile = LoadedDocument<SerializedMap>;

/** Thrown when a picked file cannot be parsed as a supported map document. */
export class InvalidMapFileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidMapFileError";
	}
}

/** Default download name for each encoding. */
export function mapFileName(format: MapFileFormat): string {
	return format === "yaml" ? "railway.yaml" : "railway.json";
}

/**
 * Pick an encoding from a filename, falling back to the first non-whitespace
 * character of the text (JSON objects/arrays start with `{`/`[`).
 */
export function inferMapFileFormat(
	filename?: string,
	text?: string,
): MapFileFormat {
	return inferDocumentFormat(filename, text);
}

/** Serialise `data` as pretty-printed JSON or block-style YAML. */
export function encodeMap(data: SerializedMap, format: MapFileFormat): string {
	return encodeDocument(data, format);
}

/** Parse `text` as `format` and check it is a supported {@link SerializedMap}. */
export function parseMapText(
	text: string,
	format: MapFileFormat,
): SerializedMap {
	const parsed = decodeDocument(
		text,
		format,
		(message) => new InvalidMapFileError(message),
	);
	assertSerializedMap(parsed);
	return parsed;
}

/** Trigger a browser download of `data` in `format` (JSON if omitted). */
export function downloadMap(
	data: SerializedMap,
	options: { format?: MapFileFormat; filename?: string } = {},
): void {
	const format = options.format ?? "json";
	downloadDocument(data, format, options.filename ?? mapFileName(format));
}

/** Minimal structural check that a parsed object is a supported SerializedMap. */
export function assertSerializedMap(
	value: unknown,
): asserts value is SerializedMap {
	if (typeof value !== "object" || value === null) {
		throw new InvalidMapFileError("File is not a valid map (not an object).");
	}
	const v = value as Partial<SerializedMap>;
	if (v.version !== SERIALIZED_MAP_VERSION) {
		throw new InvalidMapFileError(
			`Unsupported map version: ${String(v.version)} (expected ${SERIALIZED_MAP_VERSION}).`,
		);
	}
	if (
		!Array.isArray(v.tracks) ||
		!Array.isArray(v.namedLocations) ||
		!Array.isArray(v.concourses) ||
		!Array.isArray(v.parapets) ||
		!Array.isArray(v.texts)
	) {
		throw new InvalidMapFileError("File is missing required map sections.");
	}
}

/**
 * Open a file picker and resolve with the parsed {@link SerializedMap} plus the
 * encoding it used. Rejects with an {@link InvalidMapFileError} if the chosen
 * file is malformed. Resolves `null` if the user cancels the picker.
 */
export function pickAndReadMapFile(): Promise<LoadedMapFile | null> {
	return pickAndReadDocument(parseMapText);
}
