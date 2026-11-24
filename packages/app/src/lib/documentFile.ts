import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

/**
 * Browser file helpers shared by every document the editor saves: pick an
 * encoding, encode, decode, download, and open a file picker.
 *
 * The map and the timetable are different documents but the same file
 * handling, and the encoding a document was loaded from has to survive back
 * into the next save either way. Keeping that here rather than duplicating it
 * per document type is also what makes "save the timetable as YAML because the
 * map was YAML" a single setting rather than two that can disagree.
 *
 * Deliberately free of any model or pixi reference, so a plain React component
 * — or the server — can import it.
 */

/** On-disk encodings. The same document, different text. */
export type DocumentFileFormat = "json" | "yaml";

/** File picker `accept` for both encodings, including the shorter `.yml`. */
const DOCUMENT_FILE_ACCEPT =
	"application/json,.json,application/yaml,text/yaml,.yaml,.yml";

/** A parsed document plus the encoding it was read from. */
export interface LoadedDocument<T> {
	data: T;
	format: DocumentFileFormat;
}

/**
 * Pick an encoding from a filename, falling back to the first non-whitespace
 * character of the text (JSON objects/arrays start with `{`/`[`).
 */
export function inferDocumentFormat(
	filename?: string,
	text?: string,
): DocumentFileFormat {
	const lower = filename?.toLowerCase() ?? "";
	if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
	if (lower.endsWith(".json")) return "json";
	const trimmed = text?.trimStart() ?? "";
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
	return "yaml";
}

/** Serialise `data` as pretty-printed JSON or block-style YAML. */
export function encodeDocument(
	data: unknown,
	format: DocumentFileFormat,
): string {
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

/**
 * Decode `text` as `format` into plain data, with no idea what document it is.
 *
 * Throws the error `onSyntaxError` builds, so each document type reports a
 * broken file in its own words and with its own error class.
 */
export function decodeDocument(
	text: string,
	format: DocumentFileFormat,
	onSyntaxError: (message: string) => Error,
): unknown {
	try {
		return format === "yaml" ? parseYaml(text) : JSON.parse(text);
	} catch {
		throw onSyntaxError(
			format === "yaml" ? "File is not valid YAML." : "File is not valid JSON.",
		);
	}
}

/** Trigger a browser download of `data` encoded as `format`. */
export function downloadDocument(
	data: unknown,
	format: DocumentFileFormat,
	filename: string,
): void {
	const blob = new Blob([encodeDocument(data, format)], {
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

/**
 * Open a file picker and resolve with `parse`'s result plus the encoding the
 * file used, or `null` if the user cancels.
 *
 * `parse` is where a document type does its own checking, so a file that
 * decodes but is not the right document is rejected here rather than reaching
 * the editor.
 */
export function pickAndReadDocument<T>(
	parse: (text: string, format: DocumentFileFormat) => T,
): Promise<LoadedDocument<T> | null> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = DOCUMENT_FILE_ACCEPT;

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
					const format = inferDocumentFormat(file.name, text);
					resolve({ data: parse(text, format), format });
				})
				.catch(reject);
		});

		input.click();
	});
}

/** A {@link LoadedDocument} that also remembers which file it came from. */
export interface PickedDocument<T> extends LoadedDocument<T> {
	name: string;
}

/**
 * Open a browser multi-file picker and resolve with the chosen files, or `null`
 * if cancelled. Must be called from a user gesture.
 */
export function pickFiles(accept: string): Promise<File[] | null> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = accept;
		input.multiple = true;
		input.addEventListener("cancel", () => resolve(null));
		input.addEventListener("change", () => {
			const files = Array.from(input.files ?? []);
			resolve(files.length === 0 ? null : files);
		});
		input.click();
	});
}

/**
 * Like {@link pickAndReadDocument}, but the picker allows several files and
 * every one is read and parsed. Resolves with the documents in the order the
 * browser listed them, or `null` if the user cancels.
 *
 * A file `parse` rejects rejects the whole pick, with the file's name in the
 * message — the caller gets all the files or none, so it can refuse a bad set
 * without having half-applied it.
 */
export async function pickAndReadDocuments<T>(
	parse: (text: string, format: DocumentFileFormat) => T,
): Promise<PickedDocument<T>[] | null> {
	const files = await pickFiles(DOCUMENT_FILE_ACCEPT);
	if (!files) return null;
	return Promise.all(
		files.map(async (file) => {
			const text = await file.text();
			const format = inferDocumentFormat(file.name, text);
			try {
				return { name: file.name, data: parse(text, format), format };
			} catch (err) {
				const reason = err instanceof Error ? err.message : String(err);
				throw new Error(`${file.name}: ${reason}`);
			}
		}),
	);
}
