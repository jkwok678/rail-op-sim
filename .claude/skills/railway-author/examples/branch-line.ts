/**
 * A worked example: a through line with two stations and a bay platform, plus
 * a three-service timetable that uses all of it.
 *
 * Copy this file as the starting point for a new railway — the shape is always
 * the same: lay track, name it, route it, state the services, hand both to
 * `writeDocuments`, which checks before it saves.
 *
 *   .claude/skills/railway-author/scripts/run.sh \
 *     .claude/skills/railway-author/examples/branch-line.ts out/railway.json out/timetable.json
 *
 * The layout, in cells (+Y is up, so the bay sits above the main line):
 *
 *        gy=2                          (8,2) buffer, facing up
 *        gy=1                          (8,1) bay platform "Barton"
 *        gy=0  exit ─ 0 … 10 ─ exit     (8,0) points off the main line
 *                 ^^^ Ashfield at 2–3, Barton at 7
 */

import {
	at,
	c,
	buffer,
	direct,
	directBothWays,
	exit,
	name,
	newRailway,
	Platform,
	platform,
	points,
	run,
	straight,
	timetable,
	writeDocuments,
} from "../scripts/authoring";
import {
	BufferType,
	ExitType,
	StraightType,
	SwitchType,
} from "../../../../packages/shared/src/railway/enums";
import type { Service } from "../scripts/authoring";

const mapPath = process.argv[2] ?? "out/railway.json";
const timetablePath = process.argv[3] ?? "out/timetable.json";

// ── The railway ──────────────────────────────────────────────────────────

const map = newRailway();

// The through line, exit to exit. An exit's subtype names the side the track
// continues on, so the left-hand exit is EXITLEFT with its link pointing right.
exit(map, c(-1, 0), ExitType.EXITLEFT);
run(map, c(0, 0), c(7, 0));
points(map, c(8, 0), SwitchType.SWITCHTIGHT2); // through 3↔5, diverging 1↔5
run(map, c(9, 0), c(10, 0));
exit(map, c(11, 0), ExitType.EXITRIGHT);

// The bay, off the top of the switch. BUFFERUP faces up and links downward.
straight(map, c(8, 1), StraightType.STRAIGHTV);
buffer(map, c(8, 2), BufferType.BUFFERUP);

// Platforms, and the labels a timetable books to. Two cells sharing one label
// are one station: a service booked to "Ashfield" may use either.
platform(map, c(2, 0), Platform.UP);
platform(map, c(3, 0), Platform.UP);
name(map, [c(2, 0), c(3, 0)], "Ashfield");

platform(map, c(7, 0), Platform.UP);
platform(map, c(8, 1), Platform.LEFT); // vertical track takes LEFT/RIGHT
name(map, [c(7, 0), c(8, 1)], "Barton");

// Every track needs a preferred direction before the railway counts as
// complete, and a line worked both ways needs both.
directBothWays(map, c(-1, 0), c(11, 0));
// SWITCHTIGHT2 diverges 1↔5, so the bay faces east: a train reaches it from
// the right-hand exit, not the left. Routing it the other way finds no path.
directBothWays(map, c(11, 0), c(8, 2));

// ── The timetable ────────────────────────────────────────────────────────

const train = {
	startSpeedKmh: 0,
	maxSpeedKmh: 120,
	massTonnes: 200,
	brakeForceTonnes: 100,
	powerKw: 2000,
};

const services: Service[] = [
	{
		ref: "1A01",
		description: "Ashfield to Barton",
		train: { ...train },
		actions: [
			{
				kind: "startNew",
				time: at("05:55"),
				rear: c(0, 0),
				front: c(1, 0),
			},
			{ kind: "stop", location: "Ashfield", depart: at("06:00") },
			{
				kind: "stop",
				location: "Barton",
				arrive: at("06:10"),
				depart: at("06:12"),
			},
			{ kind: "finishNewService", time: at("06:12"), nextRef: "2B01" },
		],
	},
	{
		ref: "2B01",
		description: "Barton to the west",
		actions: [
			{ kind: "startNewService", time: at("06:12"), fromRef: "1A01" },
			{
				kind: "stop",
				location: "Ashfield",
				arrive: at("06:20"),
				depart: at("06:22"),
			},
			{ kind: "finishExit", time: at("06:30"), exits: [c(-1, 0)] },
		],
	},
	{
		ref: "2T05",
		description: "Barton bay to the east",
		train: { ...train },
		actions: [
			// Rear on the buffer, front on the platform: the pair is which way
			// round the train stands, and it must be joined track.
			{
				kind: "startNew",
				time: at("06:30"),
				rear: c(8, 2),
				front: c(8, 1),
			},
			{ kind: "stop", location: "Barton", depart: at("06:35") },
			{ kind: "finishExit", time: at("06:45"), exits: [c(11, 0)] },
		],
	},
];

writeDocuments({
	map,
	mapPath,
	timetable: timetable({
		title: "Ashfield–Barton",
		startTime: at("05:00"),
		services,
	}),
	timetablePath,
});
