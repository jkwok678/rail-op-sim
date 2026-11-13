import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	deserializeMap,
	Map as Map_,
	parseTimetable,
	validateTimetable,
} from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const read = (name: string) =>
	readFileSync(
		fileURLToPath(new URL(`../../../../../test-data/${name}`, import.meta.url)),
		"utf8",
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
});
