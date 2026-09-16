import {
	SERIALIZED_MAP_VERSION,
	type SerializedMap,
} from "@rail-op-sim/shared";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

/**
 * Browser file helpers for saving/loading a {@link SerializedMap} to and from a
 * local JSON or YAML file. Kept free of pixi/model references so they can be
 * imported by plain React components.
 */

/** On-disk encodings of a {@link SerializedMap}. Same object, different text. */
export type MapFileFormat = "json" | "yaml";

/** A map document plus the encoding it was read from (so a later save can match). */
export interface LoadedMapFile {
	data: SerializedMap;
	format: MapFileFormat;
}

/** File picker `accept` for both encodings, including the shorter `.yml`. */
export const MAP_FILE_ACCEPT =
	"application/json,.json,application/yaml,text/yaml,.yaml,.yml";

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
	const lower = filename?.toLowerCase() ?? "";
	if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
	if (lower.endsWith(".json")) return "json";
	const trimmed = text?.trimStart() ?? "";
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	return "yaml";
}

/** Serialise `data` as pretty-printed JSON or block-style YAML. */
export function encodeMap(data: SerializedMap, format: MapFileFormat): string {
	if (format === "yaml") {
		return stringifyYaml(data, {
			indent: 2,
			lineWidth: 0,
			// Indices, not aliases — a save should stay readable as a document.
			aliasDuplicateObjects: false,
		});
	}
	return JSON.stringify(data, null, 2);
}

/** Parse `text` as `format` and check it is a supported {@link SerializedMap}. */
export function parseMapText(
	text: string,
	format: MapFileFormat,
): SerializedMap {
	let parsed: unknown;
	try {
		parsed = format === "yaml" ? parseYaml(text) : JSON.parse(text);
	} catch {
		throw new InvalidMapFileError(
			format === "yaml" ? "File is not valid YAML." : "File is not valid JSON.",
		);
	}
	assertSerializedMap(parsed);
	return parsed;
}

/** Trigger a browser download of `data` in `format` (JSON if omitted). */
export function downloadMap(
	data: SerializedMap,
	options: { format?: MapFileFormat; filename?: string } = {},
): void {
	const format = options.format ?? "json";
	const filename = options.filename ?? mapFileName(format);
	const blob = new Blob([encodeMap(data, format)], {
		type: format === "yaml" ? "application/yaml" : "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

/** Minimal structural check that a parsed object is a supported SerializedMap. */
function assertSerializedMap(value: unknown): asserts value is SerializedMap {
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
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = MAP_FILE_ACCEPT;

		// `cancel` fires on supporting browsers when the dialog is dismissed.
		input.addEventListener("cancel", () => resolve(null));

		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (!file) {
				resolve(null);
				return;
			}
			file
				.text()
				.then((text) => {
					const format = inferMapFileFormat(file.name, text);
					resolve({ data: parseMapText(text, format), format });
				})
				.catch(reject);
		});

		input.click();
	});
}
