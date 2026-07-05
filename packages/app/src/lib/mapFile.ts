import {
	SERIALIZED_MAP_VERSION,
	type SerializedMap,
} from "@rail-op-sim/shared";

/**
 * Browser file helpers for saving/loading a {@link SerializedMap} to and from a
 * local JSON file. Kept free of pixi/model references so they can be imported by
 * plain React components.
 */

/** Trigger a browser download of `data` as a pretty-printed JSON file. */
export function downloadMap(
	data: SerializedMap,
	filename = "railway.json",
): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
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

/** Thrown when a picked file cannot be parsed as a supported map document. */
export class InvalidMapFileError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidMapFileError";
	}
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
 * Open a file picker and resolve with the parsed {@link SerializedMap}. Rejects
 * with an {@link InvalidMapFileError} if the chosen file is malformed. Resolves
 * `null` if the user cancels the picker.
 */
export function pickAndReadMapFile(): Promise<SerializedMap | null> {
	return new Promise((resolve, reject) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json,.json";

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
					let parsed: unknown;
					try {
						parsed = JSON.parse(text);
					} catch {
						throw new InvalidMapFileError("File is not valid JSON.");
					}
					assertSerializedMap(parsed);
					resolve(parsed);
				})
				.catch(reject);
		});

		input.click();
	});
}
