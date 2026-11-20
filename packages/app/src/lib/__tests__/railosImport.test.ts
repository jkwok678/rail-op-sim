import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadDocument } from "#/lib/documentFile";
import { applyLoadedMap } from "#/lib/mapActions";
import {
	convertRailosFiles,
	downloadRailosImport,
	openRailosImport,
	RailosImportError,
	type RailosSourceFile,
	railosDownloadNames,
} from "#/lib/railosImport";
import { applyLoadedTimetable } from "#/lib/timetableActions";

vi.mock("#/lib/documentFile", () => ({ downloadDocument: vi.fn() }));
vi.mock("#/lib/mapActions", () => ({ applyLoadedMap: vi.fn() }));
vi.mock("#/lib/timetableActions", () => ({
	applyLoadedTimetable: vi.fn(() => null),
}));

const source = (name: string): RailosSourceFile => {
	const buffer = readFileSync(
		fileURLToPath(new URL(`../../../../../test-data/${name}`, import.meta.url)),
	);
	return {
		name,
		bytes: buffer.buffer.slice(
			buffer.byteOffset,
			buffer.byteOffset + buffer.byteLength,
		) as ArrayBuffer,
	};
};

const text = (name: string, body: string): RailosSourceFile => ({
	name,
	bytes: new TextEncoder().encode(body).buffer as ArrayBuffer,
});

const RLY = "Lea Valley.rly";
const TTB = "Lea Valley Lines 2022.ttb";

describe("convertRailosFiles", () => {
	it("converts a railway and timetable picked together, in either order", () => {
		const result = convertRailosFiles([source(TTB), source(RLY)]);
		expect(result.railway?.data.tracks.length).toBe(1557);
		expect(result.railway?.summary).toBe(
			"1,557 track elements, 267 other elements, 70 labels",
		);
		expect(result.timetable?.data.title).toBe("Lea Valley Lines 2022");
		expect(result.timetable?.summary).toBe("564 services");
		expect(result.warnings).toHaveLength(2);
	});

	it("converts a railway on its own", () => {
		const result = convertRailosFiles([source(RLY)]);
		expect(result.railway).toBeDefined();
		expect(result.timetable).toBeUndefined();
	});

	it("refuses two railways", () => {
		expect(() => convertRailosFiles([source(RLY), source(RLY)])).toThrow(
			RailosImportError,
		);
	});

	it("refuses a file that is not RailOS", () => {
		expect(() => convertRailosFiles([text("railway.json", "{}")])).toThrow(
			/railway\.json is not a RailOS file/,
		);
	});

	it("names the file the converter could not read", () => {
		expect(() =>
			convertRailosFiles([text("broken.rly", "v2.0\nnot a number\n")]),
		).toThrow(/^broken\.rly: /);
	});
});

describe("railosDownloadNames", () => {
	it("names the JSON files after the files they came from", () => {
		const result = convertRailosFiles([source(RLY), source(TTB)]);
		expect(railosDownloadNames(result)).toEqual({
			railway: "Lea Valley.railway.json",
			timetable: "Lea Valley Lines 2022.timetable.json",
		});
	});

	it("uses .yaml extensions when YAML is chosen", () => {
		const result = convertRailosFiles([source(RLY), source(TTB)]);
		expect(railosDownloadNames(result, "yaml")).toEqual({
			railway: "Lea Valley.railway.yaml",
			timetable: "Lea Valley Lines 2022.timetable.yaml",
		});
	});
});

describe("downloadRailosImport", () => {
	afterEach(() => vi.clearAllMocks());

	it("downloads both documents in the chosen format", () => {
		const result = convertRailosFiles([source(RLY), source(TTB)]);
		downloadRailosImport(result, "yaml");
		expect(downloadDocument).toHaveBeenCalledWith(
			result.railway?.data,
			"yaml",
			"Lea Valley.railway.yaml",
		);
		expect(downloadDocument).toHaveBeenCalledWith(
			result.timetable?.data,
			"yaml",
			"Lea Valley Lines 2022.timetable.yaml",
		);
	});
});

describe("openRailosImport", () => {
	afterEach(() => vi.clearAllMocks());

	it("applies the railway before the timetable, in the chosen format", () => {
		const order: string[] = [];
		vi.mocked(applyLoadedMap).mockImplementation(() => {
			order.push("map");
		});
		vi.mocked(applyLoadedTimetable).mockImplementation(() => {
			order.push("timetable");
			return "blocked";
		});
		const result = convertRailosFiles([source(TTB), source(RLY)]);

		expect(openRailosImport(result, "yaml")).toBe("blocked");
		expect(order).toEqual(["map", "timetable"]);
		expect(vi.mocked(applyLoadedMap).mock.calls[0][0].format).toBe("yaml");
		expect(vi.mocked(applyLoadedTimetable).mock.calls[0][0].format).toBe(
			"yaml",
		);
	});

	it("leaves the timetable alone when only a railway was imported", () => {
		openRailosImport(convertRailosFiles([source(RLY)]));
		expect(applyLoadedMap).toHaveBeenCalledOnce();
		expect(vi.mocked(applyLoadedMap).mock.calls[0][0].format).toBe("json");
		expect(applyLoadedTimetable).not.toHaveBeenCalled();
	});
});
