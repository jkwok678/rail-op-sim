import { Text } from "../../element";
import { BufferType, ExitType, Platform, StraightType } from "../../enums";
import { Map_ } from "../../map/map";
import { setPreferredDirectionsAlongPath } from "../../map/map-connectivity";
import type { FontInfo } from "../../types";
import { parseSimTime } from "../time";
import type { Service, Timetable, TrainSpec } from "../types";

/**
 * Fixtures for the timetable tests.
 *
 * The map fixture is built with the default `imageSize` of 16, the way
 * `map-connectivity.test.ts` does, deliberately *not* the app's 1 — so a cell
 * and an element coordinate are different numbers and any place the conversion
 * was forgotten shows up as a failure.
 */

/** Element coordinates of a grid cell on a default-scale map. */
export const CELL = 16;

export const TRAIN: TrainSpec = {
	startSpeedKmh: 0,
	maxSpeedKmh: 120,
	massTonnes: 200,
	brakeForceTonnes: 100,
	powerKw: 2000,
};

/** A timetable wrapper, so a test can state only the services it cares about. */
export function timetable(
	services: Service[],
	startTime = parseSimTime("05:00"),
): Timetable {
	return { version: 1, startTime, services };
}

/**
 * A valid two-service timetable: `1A01` starts at the yard, calls at Ashfield
 * and Barton, and hands its train to `2B01`, which runs back to Ashfield and
 * leaves the map.
 */
export function twoServiceTimetable(): Timetable {
	return timetable([
		{
			ref: "1A01",
			description: "Ashfield to Barton",
			train: { ...TRAIN },
			actions: [
				{
					kind: "startNew",
					time: parseSimTime("05:55"),
					rear: { gx: 0, gy: 0 },
					front: { gx: 1, gy: 0 },
				},
				{
					kind: "stop",
					location: "Ashfield",
					depart: parseSimTime("06:00"),
				},
				{
					kind: "stop",
					location: "Barton",
					arrive: parseSimTime("06:10"),
					depart: parseSimTime("06:12"),
				},
				{
					kind: "finishNewService",
					time: parseSimTime("06:12"),
					nextRef: "2B01",
				},
			],
		},
		{
			ref: "2B01",
			description: "Barton to the south",
			actions: [
				{
					kind: "startNewService",
					time: parseSimTime("06:12"),
					fromRef: "1A01",
				},
				{
					kind: "stop",
					location: "Ashfield",
					arrive: parseSimTime("06:20"),
					depart: parseSimTime("06:22"),
				},
				{
					kind: "finishExit",
					time: parseSimTime("06:30"),
					exits: [{ gx: 5, gy: 0 }],
				},
			],
		},
	]);
}

/**
 * A straight run of track from an exit at cell (-1, 0) to an exit at (5, 0),
 * with a platform named "Ashfield" at (1, 0) and one named "Barton" at (3, 0).
 *
 * Built cell by cell with `addStraight` so the coordinates in the tests read as
 * cells while the map stores them scaled.
 */
export function railwayFixture(): Map_ {
	const map = new Map_();

	const exitAt = (gx: number, subtype: ExitType): void => {
		map.addTrack({ kind: "exit", subtype }, gx * CELL, 0);
	};
	const straightAt = (gx: number): void => {
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			gx * CELL,
			0,
		);
	};

	exitAt(-1, ExitType.EXITLEFT);
	for (let gx = 0; gx <= 4; gx++) straightAt(gx);
	exitAt(5, ExitType.EXITRIGHT);

	// Platforms carry the station names, which is what a timetable books to.
	map.addPlatform(Platform.UP, 1 * CELL, 0);
	map.addPlatform(Platform.UP, 3 * CELL, 0);
	nameTrack(map, 1, "Ashfield");
	nameTrack(map, 3, "Barton");

	map.makeTrackList();
	return map;
}

/** The font every fixture label uses — nothing here depends on its shape. */
const FONT: FontInfo = { family: "sans-serif", pointSize: 12 };

/**
 * Attach a text label to the track in cell `(gx, 0)`.
 *
 * The Text goes into the map's own list as well as onto the track, the way
 * `deserializeMap` restores one, so the label is a real map element rather
 * than an object only the track knows about.
 */
export function nameTrack(map: Map_, gx: number, name: string): void {
	nameTracks(map, [gx], name);
}

/**
 * Give several tracks *one* label object, which is how the map represents a
 * station spanning more than one platform — `linkLocalText` flood-fills the
 * same Text across the run, and serialization preserves the sharing by index.
 */
export function nameTracks(map: Map_, gxs: number[], name: string): void {
	const text = new Text(gxs[0] * CELL, 0, name, { ...FONT });
	map.addText(text);
	for (const gx of gxs) {
		const track = map.getTrackAt(gx * CELL, 0);
		if (!track) throw new Error(`no track at cell (${gx}, 0)`);
		track.setText(text);
	}
}

/** A vertical siding off the main line, for start-position tests. */
export function addVerticalNeighbour(map: Map_, gx: number, gy: number): void {
	map.addTrack(
		{
			kind: "straight",
			subtype: StraightType.STRAIGHTV,
			platform1: false,
			platform2: false,
			levelCrossing: false,
		},
		gx * CELL,
		gy * CELL,
	);
	map.makeTrackList();
}

/** A buffer stop, used where a test needs a track that is not an exit. */
export function addBuffer(map: Map_, gx: number, gy: number): void {
	map.addTrack(
		{
			kind: "buffer",
			subtype: BufferType.BUFFERLEFT,
			platform1: false,
			platform2: false,
		},
		gx * CELL,
		gy * CELL,
	);
	map.makeTrackList();
}

/**
 * {@link railwayFixture} with preferred directions set both ways along the
 * line, which is what makes `isRailwayComplete` true — the state the editor
 * gates on, and so the one where the "railway is not complete" warning should
 * *not* appear.
 */
export function completeRailwayFixture(): Map_ {
	const map = railwayFixture();
	const left = map.getTrackAt(-1 * CELL, 0);
	const right = map.getTrackAt(5 * CELL, 0);
	if (!left || !right) throw new Error("fixture is missing its exits");
	setPreferredDirectionsAlongPath(map, left, right);
	setPreferredDirectionsAlongPath(map, right, left);
	return map;
}
