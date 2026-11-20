import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	convertRailosRailway,
	convertRailosTimetable,
	deserializeMap,
	Map as Map_,
	parseTimetable,
	serializeMap,
	validateTimetable,
} from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const read = (name: string, encoding: "utf8" | "latin1" = "utf8") =>
	readFileSync(
		fileURLToPath(new URL(`../../../../../test-data/${name}`, import.meta.url)),
		encoding,
	);

describe("Lea Valley fixtures", () => {
	it("has a timetable that validates against its railway with no errors", () => {
		const map = new Map_();
		deserializeMap(parse(read("Lea Valley.railway.yaml")), map);
		const timetable = parseTimetable(
			parse(read("Lea Valley Lines 2022.timetable.yaml")),
		);

		const errors = validateTimetable(timetable, map).filter(
			(issue) => issue.severity === "error",
		);
		expect(errors).toEqual([]);
	});

	// The YAML pair was produced by converting the RailOS originals beside it,
	// so the converter must reproduce it field for field.
	it("is what the RailOS converter makes of the .rly", () => {
		const { map } = convertRailosRailway(read("Lea Valley.rly", "latin1"));
		expect(JSON.parse(JSON.stringify(serializeMap(map)))).toEqual(
			parse(read("Lea Valley.railway.yaml")),
		);
	});

	it("is what the RailOS converter makes of the .ttb", () => {
		const { timetable } = convertRailosTimetable(
			read("Lea Valley Lines 2022.ttb", "latin1"),
			{ title: "Lea Valley Lines 2022" },
		);
		expect(JSON.parse(JSON.stringify(timetable))).toEqual(
			parse(read("Lea Valley Lines 2022.timetable.yaml")),
		);
	});
});
