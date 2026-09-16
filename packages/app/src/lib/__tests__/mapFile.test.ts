import {
	deserializeMap,
	Map as Map_,
	ParapetType,
	SERIALIZED_MAP_VERSION,
	type SerializedMap,
	StraightType,
	serializeMap,
} from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import {
	encodeMap,
	InvalidMapFileError,
	inferMapFileFormat,
	mapFileName,
	parseMapText,
} from "#/lib/mapFile";

const sample: SerializedMap = {
	version: SERIALIZED_MAP_VERSION,
	imageSize: 1,
	tracks: [
		{
			data: {
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: true,
				platform2: false,
				levelCrossing: false,
			},
			x: 0,
			y: 0,
			mainSpeed: 80,
			mainLength: 40,
			secondarySpeed: -1,
			secondaryLength: -1,
			linkedTo: [1, 0],
			preferredDirections: [{ entry: 3, exit: 5 }],
			textIndex: 0,
		},
	],
	namedLocations: [{ x: 5, y: 0, textIndex: 0 }],
	concourses: [],
	parapets: [{ type: ParapetType.PARAPET1, x: 1, y: 2 }],
	texts: [
		{
			x: 5,
			y: 0,
			readableText: "Depot",
			font: { family: "JetBrains Mono", pointSize: 12 },
		},
	],
};

describe("inferMapFileFormat", () => {
	it("reads the extension, including the shorter .yml", () => {
		expect(inferMapFileFormat("railway.json")).toBe("json");
		expect(inferMapFileFormat("railway.YAML")).toBe("yaml");
		expect(inferMapFileFormat("map.yml")).toBe("yaml");
	});

	it("falls back to the first non-whitespace character when there is no extension", () => {
		expect(inferMapFileFormat("map", '{\n  "version": 1\n}')).toBe("json");
		expect(inferMapFileFormat("map", "version: 1\n")).toBe("yaml");
	});
});

describe("encodeMap / parseMapText", () => {
	it("round-trips JSON", () => {
		const text = encodeMap(sample, "json");
		expect(text).toContain('"version": 1');
		expect(parseMapText(text, "json")).toEqual(sample);
	});

	it("round-trips YAML", () => {
		const text = encodeMap(sample, "yaml");
		expect(text).toMatch(/^version: 1\b/m);
		expect(text).toContain("readableText: Depot");
		expect(parseMapText(text, "yaml")).toEqual(sample);
	});

	it("loads a JSON document saved as YAML (YAML 1.2 is a JSON superset)", () => {
		const json = encodeMap(sample, "json");
		expect(parseMapText(json, "yaml")).toEqual(sample);
	});

	it("survives serialize → YAML → deserialize on a live map", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			0,
		);
		const restored = new Map_();
		deserializeMap(
			parseMapText(encodeMap(serializeMap(map), "yaml"), "yaml"),
			restored,
		);
		expect(restored.getTotalTrack()).toBe(1);
		expect(restored.getTrackAt(0, 0)?.data.subtype).toBe(
			StraightType.STRAIGHTH,
		);
	});

	it("rejects malformed JSON and YAML", () => {
		expect(() => parseMapText("{", "json")).toThrow(InvalidMapFileError);
		expect(() => parseMapText("{", "json")).toThrow("not valid JSON");
		expect(() => parseMapText("version: [", "yaml")).toThrow(
			InvalidMapFileError,
		);
		expect(() => parseMapText("version: [", "yaml")).toThrow("not valid YAML");
	});

	it("rejects a well-formed document that is not a map", () => {
		expect(() => parseMapText("{}", "json")).toThrow("Unsupported map version");
		expect(() => parseMapText("version: 1\n", "yaml")).toThrow(
			"missing required map sections",
		);
	});
});

describe("mapFileName", () => {
	it("matches the encoding", () => {
		expect(mapFileName("json")).toBe("railway.json");
		expect(mapFileName("yaml")).toBe("railway.yaml");
	});
});
