import {
	createDefaultTrainSpec,
	createEmptyTimetable,
	ExitType,
	Map as Map_,
	Platform,
	parseSimTime,
	StraightType,
	setPreferredDirectionsAlongPath,
	Text,
} from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { encodeTimetable, parseTimetableText } from "#/lib/timetableFile";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * The whole feature against a real railway: build two services through the
 * store's own mutators, then break them the way a user would — by editing the
 * map underneath.
 *
 * This is the walkthrough from the plan, run as a test rather than by hand, so
 * the connection between a map edit and a timetable issue stays checked.
 */

const store = () => useTimetableStore.getState();
const codes = () => store().issues.map((i) => i.code);

/** The app places elements at grid scale, so a cell *is* an element coordinate. */
function buildRailway(): Map_ {
	const map = new Map_();
	map.setImageSize(1);

	map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -1, 0);
	for (let gx = 0; gx <= 4; gx++) {
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			gx,
			0,
		);
	}
	map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 5, 0);

	map.addPlatform(Platform.UP, 1, 0);
	map.addPlatform(Platform.UP, 3, 0);
	name(map, 1, "Ashfield");
	name(map, 3, "Barton");

	// Directions both ways along the line, which is the last thing the
	// completeness gate wants before the editor will open.
	const left = map.getTrackAt(-1, 0);
	const right = map.getTrackAt(5, 0);
	if (left && right) {
		setPreferredDirectionsAlongPath(map, left, right);
		setPreferredDirectionsAlongPath(map, right, left);
	}

	map.makeTrackList();
	return map;
}

function name(map: Map_, gx: number, label: string): void {
	const track = map.getTrackAt(gx, 0);
	if (!track) throw new Error(`no track at (${gx}, 0)`);
	const text = new Text(gx, 0, label, { family: "sans-serif", pointSize: 12 });
	map.addText(text);
	track.setText(text);
}

let map: Map_;

beforeEach(() => {
	map = buildRailway();
	useTimetableStore.setState({
		timetable: createEmptyTimetable(parseSimTime("05:00")),
		selectedServiceRef: null,
		selectedActionIndex: null,
		issues: [],
		pendingCellPick: null,
		loadError: null,
	});
});

/** `1A01` out to Barton, handing its train to `2B01`, which leaves the map. */
function buildTwoServices(): void {
	store().addService(map, "1A01");
	store().updateService(
		"1A01",
		{ description: "Ashfield to Barton", train: createDefaultTrainSpec() },
		map,
	);
	store().addAction(
		"1A01",
		{
			kind: "startNew",
			time: parseSimTime("05:55"),
			rear: { gx: 0, gy: 0 },
			front: { gx: 1, gy: 0 },
		},
		map,
	);
	store().addAction(
		"1A01",
		{ kind: "stop", location: "Ashfield", depart: parseSimTime("06:00") },
		map,
	);
	store().addAction(
		"1A01",
		{
			kind: "stop",
			location: "Barton",
			arrive: parseSimTime("06:10"),
			depart: parseSimTime("06:12"),
		},
		map,
	);
	store().addAction(
		"1A01",
		{
			kind: "finishNewService",
			time: parseSimTime("06:12"),
			nextRef: "2B01",
		},
		map,
	);

	store().addService(map, "2B01");
	store().addAction(
		"2B01",
		{
			kind: "startNewService",
			time: parseSimTime("06:12"),
			fromRef: "1A01",
		},
		map,
	);
	store().addAction(
		"2B01",
		{
			kind: "stop",
			location: "Barton",
			arrive: parseSimTime("06:15"),
			depart: parseSimTime("06:16"),
		},
		map,
	);
	store().addAction(
		"2B01",
		{
			kind: "finishExit",
			time: parseSimTime("06:30"),
			exits: [{ gx: 5, gy: 0 }],
		},
		map,
	);
}

describe("building a timetable against a complete railway", () => {
	it("accepts two services that hand a train over and then leave the map", () => {
		buildTwoServices();
		expect(store().issues).toEqual([]);
	});

	it("reports the dangling hand-over when the successor is deleted", () => {
		buildTwoServices();
		store().removeService("2B01", map);
		const issue = store().issues.find((i) => i.code === "unknown-service-ref");
		expect(issue).toMatchObject({ serviceRef: "1A01", actionIndex: 3 });
	});

	it("reports both services when a platform is renamed on the map", () => {
		buildTwoServices();
		map.getTrackAt(3, 0)?.getText()?.setReadableText("Barchester");
		// The controller republishes track status after a map edit, which is what
		// calls this in the app; here the map edit is direct, so is the call.
		store().revalidate(map);

		const unknown = store().issues.filter((i) => i.code === "unknown-location");
		expect(unknown.map((i) => i.serviceRef)).toEqual(["1A01", "2B01"]);
	});

	it("reports a start position that the map cannot hold a train on", () => {
		buildTwoServices();
		store().beginCellPick({
			serviceRef: "1A01",
			actionIndex: 0,
			field: "front",
		});
		// Cell (5, 0) is the right-hand exit: a train nose-out of it would leave
		// the map the moment it moved.
		store().completeCellPick({ gx: 5, gy: 0 }, map);
		expect(codes()).toContain("start-on-exit");
	});

	it("survives a save and load, issues and all", () => {
		buildTwoServices();
		const text = encodeTimetable(store().timetable, "yaml");
		const saved = store().timetable;

		store().replaceTimetable(createEmptyTimetable(), map);
		expect(store().timetable.services).toEqual([]);

		store().replaceTimetable(parseTimetableText(text, "yaml"), map);
		expect(store().timetable).toEqual(saved);
		expect(store().issues).toEqual([]);
		expect(store().selectedServiceRef).toBe("1A01");
	});

	it("leaves the timetable untouched when a hand-edited file is rejected", () => {
		buildTwoServices();
		const before = store().timetable;
		const broken = encodeTimetable(before, "json").replace(
			'"kind": "stop"',
			'"kind": "teleport"',
		);
		expect(() => parseTimetableText(broken, "json")).toThrow(/teleport/);
		expect(store().timetable).toBe(before);
	});
});
