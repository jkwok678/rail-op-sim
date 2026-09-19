import { describe, expect, it } from "vitest";
import { NamedLocation, Text } from "../../element";
import { Platform, StraightType } from "../../enums";
import { Map_ } from "../../map/map";
import {
	cellToLocation,
	getExitCells,
	getLocationNames,
	getStartableCells,
	locationToCell,
	trackAtCell,
} from "../locations";
import { CELL, nameTrack, nameTracks, railwayFixture } from "./fixtures";

describe("cell ↔ element coordinates", () => {
	it("scales a cell by the map's imageSize", () => {
		const map = new Map_();
		expect(map.getImageSize()).toBe(CELL);
		expect(cellToLocation(map, { gx: 3, gy: -2 })).toEqual({
			x: 3 * CELL,
			y: -2 * CELL,
		});
		expect(locationToCell(map, 3 * CELL, -2 * CELL)).toEqual({
			gx: 3,
			gy: -2,
		});
	});

	it("is the identity when the map is at the app's scale of one", () => {
		const map = new Map_();
		map.setImageSize(1);
		expect(cellToLocation(map, { gx: 7, gy: 4 })).toEqual({ x: 7, y: 4 });
		expect(locationToCell(map, 7, 4)).toEqual({ gx: 7, gy: 4 });
	});
});

describe("trackAtCell", () => {
	it("finds the track in a cell", () => {
		const map = railwayFixture();
		expect(trackAtCell(map, { gx: 1, gy: 0 })?.getLocationX()).toBe(1 * CELL);
	});

	it("answers null for an empty cell", () => {
		expect(trackAtCell(railwayFixture(), { gx: 9, gy: 9 })).toBeNull();
	});
});

describe("getLocationNames", () => {
	it("returns the platform labels, sorted and deduplicated", () => {
		expect(getLocationNames(railwayFixture())).toEqual(["Ashfield", "Barton"]);
	});

	it("counts two platforms sharing one label as a single location", () => {
		// A station spanning two platforms is one shared Text on both tracks —
		// what flood-fill naming produces on the map, and what a service booked
		// to "Ashfield" is allowed to use either of.
		const map = railwayFixture();
		map.addPlatform(Platform.UP, 2 * CELL, 0);
		nameTracks(map, [1, 2], "Ashfield");
		nameTrack(map, 3, "Barton");
		expect(getLocationNames(map)).toEqual(["Ashfield", "Barton"]);
	});

	it("includes a named location, which a train can also be booked to", () => {
		const map = railwayFixture();
		const nl = new NamedLocation(0, 2 * CELL);
		map.addNamedLocation(nl);
		const text = new Text(0, 2 * CELL, "Carlow Yard", {
			family: "sans-serif",
			pointSize: 12,
		});
		map.addText(text);
		nl.setText(text);
		expect(getLocationNames(map)).toEqual([
			"Ashfield",
			"Barton",
			"Carlow Yard",
		]);
	});

	it("leaves out a label on plain track, which is not a place to stop", () => {
		const map = railwayFixture();
		nameTrack(map, 4, "Nowhere In Particular");
		expect(getLocationNames(map)).toEqual(["Ashfield", "Barton"]);
	});

	it("is empty on a railway with nothing named", () => {
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
		expect(getLocationNames(map)).toEqual([]);
	});
});

describe("getExitCells", () => {
	it("returns the exits as cells, not element coordinates", () => {
		expect(getExitCells(railwayFixture())).toEqual([
			{ gx: -1, gy: 0 },
			{ gx: 5, gy: 0 },
		]);
	});
});

describe("getStartableCells", () => {
	it("offers the running line but neither exit", () => {
		expect(getStartableCells(railwayFixture())).toEqual([
			{ gx: 0, gy: 0 },
			{ gx: 1, gy: 0 },
			{ gx: 2, gy: 0 },
			{ gx: 3, gy: 0 },
			{ gx: 4, gy: 0 },
		]);
	});

	it("drops a cell once it carries a level crossing", () => {
		const map = railwayFixture();
		map.addLevelCrossing(4 * CELL, 0);
		expect(getStartableCells(map)).not.toContainEqual({ gx: 4, gy: 0 });
	});
});
