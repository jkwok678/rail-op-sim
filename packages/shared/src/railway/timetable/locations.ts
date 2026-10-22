/**
 * What a timetable can name: the places a train can stop at, and the cells it
 * can leave the map by.
 *
 * A location in a timetable is the *text label* on the railway, exactly as in
 * railway-dot-exe — two platforms sharing a label are one station, and that is
 * how a service booked into "Reading" can use either platform.
 *
 * The labels here are a subset of the ones `elementNeedsName` demands for a
 * complete railway: a concourse and a bridge must be named too, but no train
 * calls at either, so neither is a place a service can be booked to.
 */

import type { Map_ } from "../map/map";
import type { Track } from "../track/track";
import type { Cell } from "./types";

/** Element coordinates of a {@link Cell} on `map`, scaled by its `imageSize`. */
export function cellToLocation(
	map: Map_,
	cell: Cell,
): { x: number; y: number } {
	const step = map.getImageSize();
	return { x: cell.gx * step, y: cell.gy * step };
}

/** The {@link Cell} an element at `(x, y)` on `map` occupies. */
export function locationToCell(map: Map_, x: number, y: number): Cell {
	const step = map.getImageSize();
	return { gx: x / step, gy: y / step };
}

/** The track in `cell`, or `null` when the cell is empty or holds something else. */
export function trackAtCell(map: Map_, cell: Cell): Track | null {
	const { x, y } = cellToLocation(map, cell);
	return map.getTrackAt(x, y);
}

/**
 * Every distinct location name on `map`, sorted.
 *
 * A name counts when it labels something a train can be booked to: a platform,
 * a named location, or a track linked to one. Concourses and bridge labels are
 * deliberately absent — they need a name to complete the railway, but no train
 * calls at them.
 */
export function getLocationNames(map: Map_): string[] {
	const names = new Set<string>();

	const take = (text: { getReadableText(): string } | null): void => {
		const name = text?.getReadableText().trim();
		if (name) names.add(name);
	};

	for (const nl of map.getNamedLocationList()) take(nl.getText());
	map.forEachTrack((track) => {
		if (track.hasPlatform() || track.hasLinkedNamedLocation()) {
			take(track.getText());
			take(track.getLinkedNamedLocation()?.getText() ?? null);
		}
	});

	return [...names].sort((a, b) => a.localeCompare(b));
}

/** Every cell a train can leave the map by, for the exits picker. */
export function getExitCells(map: Map_): Cell[] {
	return map
		.getTracksOfKind("exit")
		.map((t) => locationToCell(map, t.getLocationX(), t.getLocationY()))
		.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
}

/**
 * Cells a train can be placed on to start: track that is not an exit and has no
 * level crossing, matching what {@link import("./validate").validateTimetableAgainstMap}
 * will accept for a `startNew` pair.
 */
export function getStartableCells(map: Map_): Cell[] {
	const cells: Cell[] = [];
	map.forEachTrack((track) => {
		if (track.data.kind === "exit") return;
		if (track.hasLevelCrossing()) return;
		cells.push(locationToCell(map, track.getLocationX(), track.getLocationY()));
	});
	return cells.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
}
