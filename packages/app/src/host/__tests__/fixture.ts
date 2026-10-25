import {
	createTrackData,
	Map as RailMap,
	type SerializedMap,
	serializeMap,
	setPreferredDirectionsAlongPath,
	type Timetable,
} from "@rail-op-sim/shared";

/** A short line between two exits, as the editor would save it. */
export function lineMap(): SerializedMap {
	const map = new RailMap();
	map.addTrack(createTrackData("exit", "EXITLEFT"), 0, 0);
	for (let gx = 1; gx <= 4; gx++) {
		map.addTrack(createTrackData("straight", "STRAIGHTH"), gx * 16, 0);
	}
	map.addTrack(createTrackData("exit", "EXITRIGHT"), 5 * 16, 0);
	map.makeTrackList();
	const left = map.getTrackAt(0, 0);
	const right = map.getTrackAt(80, 0);
	if (!left || !right) throw new Error("fixture has no ends");
	setPreferredDirectionsAlongPath(map, left, right);
	setPreferredDirectionsAlongPath(map, right, left);
	return serializeMap(map);
}

export const emptyTimetable: Timetable = {
	version: 1,
	startTime: 6 * 3600,
	services: [],
};
