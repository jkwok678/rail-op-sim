import { Text } from "../../railway/element";
import { Map_ } from "../../railway/map/map";
import { setPreferredDirectionsAlongPath } from "../../railway/map/map-connectivity";
import { parseSimTime } from "../../railway/timetable/time";
import type {
	Action,
	Service,
	Timetable,
	TrainSpec,
} from "../../railway/timetable/types";
import type { TrackKind } from "../../railway/track/track-data";
import { createTrackData } from "../../railway/track/track-factory";
import { applyPatch, type Patch } from "../../util/patch";
import { createEngine, type Engine } from "../engine";
import { startPosition, trainFromSpec } from "../trains";
import type { Train } from "../types";

/**
 * Fixture railways for the engine tests, built on a default-scale map (cell ×
 * 16) so a forgotten cell/coordinate conversion fails loudly.
 */

export const CELL = 16;

export const TRAIN: TrainSpec = {
	startSpeedKmh: 0,
	maxSpeedKmh: 120,
	massTonnes: 200,
	brakeForceTonnes: 100,
	powerKw: 2000,
};

export const t = parseSimTime;

export function place(
	map: Map_,
	gx: number,
	gy: number,
	kind: TrackKind,
	subtype: string,
	platform = false,
	levelCrossing = false,
): void {
	map.addTrack(
		createTrackData(kind, subtype, { platform1: platform, levelCrossing }),
		gx * CELL,
		gy * CELL,
	);
}

/**
 * Tokens for {@link line}, one per cell left to right along `gy = 0`:
 *
 * - `X` an exit (its open side faces the rest of the line)
 * - `-` plain straight, `P` a straight platform, `L` a level crossing
 * - `>` / `<` a signal for traffic running right / left
 * - `]` / `[` buffer stops at the right / left end
 */
export type Token = "X" | "-" | "P" | "L" | ">" | "<" | "]" | "[";

/**
 * A straight railway from tokens, with preferred directions set both ways
 * end to end — or, `oneWay`, left to right only. Cells start at `gx = 0`.
 */
export function line(
	tokens: string,
	names: Record<number, string> = {},
	{ oneWay = false }: { oneWay?: boolean } = {},
): Map_ {
	const map = new Map_();
	const last = tokens.length - 1;
	[...tokens].forEach((token, gx) => {
		placeToken(map, gx, token as Token, gx === 0, gx === last);
	});
	for (const [gx, name] of Object.entries(names))
		nameCells(map, [Number(gx)], name);
	map.makeTrackList();
	const left = map.getTrackAt(0, 0);
	const right = map.getTrackAt(last * CELL, 0);
	if (!left || !right) throw new Error("line fixture has no ends");
	setPreferredDirectionsAlongPath(map, left, right);
	if (!oneWay) setPreferredDirectionsAlongPath(map, right, left);
	return map;
}

/**
 * Two one-way lines joined by a pair of linked tracks, run left to right:
 *
 * ```
 *  row 0:  X(0) -(1) >(2) -(3) LR(4)          ← mouth on the right
 *  row 3:  LL(0) -(1) >(2) -(3) X(4)          ← mouth on the left
 * ```
 *
 * `paired: false` leaves the portals unconnected.
 */
export function linkedLine({ paired = true } = {}): Map_ {
	const map = new Map_();
	place(map, 0, 0, "exit", "EXITLEFT");
	place(map, 1, 0, "straight", "STRAIGHTH");
	place(map, 2, 0, "signal", "SIGNALRIGHT");
	place(map, 3, 0, "straight", "STRAIGHTH");
	place(map, 4, 0, "linked", "LINKRIGHT");
	place(map, 0, 3, "linked", "LINKLEFT");
	place(map, 1, 3, "straight", "STRAIGHTH");
	place(map, 2, 3, "signal", "SIGNALRIGHT");
	place(map, 3, 3, "straight", "STRAIGHTH");
	place(map, 4, 3, "exit", "EXITRIGHT");
	map.makeTrackList();
	const at = (gx: number, gy: number) => {
		const track = map.getTrackAt(gx * CELL, gy * CELL);
		if (!track) throw new Error(`no track at (${gx}, ${gy})`);
		return track;
	};
	if (paired) {
		map.connectTwoLinkedTracks(4 * CELL, 0);
		map.connectTwoLinkedTracks(0, 3 * CELL);
		setPreferredDirectionsAlongPath(map, at(0, 0), at(4, 3));
	} else {
		setPreferredDirectionsAlongPath(map, at(0, 0), at(4, 0));
		setPreferredDirectionsAlongPath(map, at(0, 3), at(4, 3));
	}
	return map;
}

function placeToken(
	map: Map_,
	gx: number,
	token: Token,
	first: boolean,
	last: boolean,
): void {
	switch (token) {
		case "X":
			// EXITLEFT's open link is on the right, so it sits at the left end.
			place(map, gx, 0, "exit", first ? "EXITLEFT" : "EXITRIGHT");
			return;
		case "-":
			place(map, gx, 0, "straight", "STRAIGHTH");
			return;
		case "P":
			place(map, gx, 0, "straight", "STRAIGHTH", true);
			return;
		case "L":
			place(map, gx, 0, "straight", "STRAIGHTH", false, true);
			return;
		case ">":
			place(map, gx, 0, "signal", "SIGNALRIGHT");
			return;
		case "<":
			place(map, gx, 0, "signal", "SIGNALLEFT");
			return;
		case "]":
			if (!last) throw new Error("buffers must end the line");
			place(map, gx, 0, "buffer", "BUFFERRIGHT");
			return;
		case "[":
			if (!first) throw new Error("buffers must start the line");
			place(map, gx, 0, "buffer", "BUFFERLEFT");
			return;
	}
}

/** One shared label across `gxs` on row 0, the way the editor names a station. */
export function nameCells(
	map: Map_,
	gxs: number[],
	name: string,
	gy = 0,
): void {
	const text = new Text(gxs[0] * CELL, gy * CELL, name, {
		family: "sans-serif",
		pointSize: 12,
	});
	map.addText(text);
	for (const gx of gxs) {
		const track = map.getTrackAt(gx * CELL, gy * CELL);
		if (!track) throw new Error(`no track at (${gx}, ${gy})`);
		track.setText(text);
	}
}

/**
 * A passing loop between two exits, preferred both ways:
 *
 * ```
 *  row 1:            (2,1)╱‾‾(3,1)╲
 *  row 0:  X(0) -(1) SW(2)  -(3) -(4)  SW(5) -(6) X(7)
 * ```
 *
 * Cells 2 and 5 are switches; the loop runs through (3,1) and (4,1).
 */
export function passingLoop(): Map_ {
	const map = new Map_();
	place(map, 0, 0, "exit", "EXITLEFT");
	place(map, 1, 0, "straight", "STRAIGHTH");
	place(map, 2, 0, "switch", "SWITCH1"); // stem 3, through 5, diverge 2 (up-right)
	place(map, 3, 0, "straight", "STRAIGHTH");
	place(map, 4, 0, "straight", "STRAIGHTH");
	place(map, 5, 0, "switch", "SWITCH2"); // stem 5, through 3, diverge 0 (up-left)
	place(map, 6, 0, "straight", "STRAIGHTH");
	place(map, 7, 0, "exit", "EXITRIGHT");
	place(map, 3, 1, "curved", "CURVE1"); // 6 ↔ 5
	place(map, 4, 1, "curved", "CURVE2"); // 3 ↔ 8
	map.makeTrackList();
	const at = (gx: number, gy: number) => {
		const track = map.getTrackAt(gx * CELL, gy * CELL);
		if (!track) throw new Error(`no track at (${gx}, ${gy})`);
		return track;
	};
	for (const [a, b] of [
		[at(0, 0), at(7, 0)],
		[at(7, 0), at(0, 0)],
	] as const) {
		setPreferredDirectionsAlongPath(map, a, b);
	}
	// The loop, both ways, through the diverging legs.
	for (const [entry, exit, cell] of [
		[3, 2, at(2, 0)],
		[2, 3, at(2, 0)],
		[6, 5, at(3, 1)],
		[5, 6, at(3, 1)],
		[3, 8, at(4, 1)],
		[8, 3, at(4, 1)],
		[0, 5, at(5, 0)],
		[5, 0, at(5, 0)],
	] as const) {
		cell.addPreferredDirection(entry, exit);
	}
	return map;
}

/**
 * A passing loop with a signal on each leg after the facing points, traffic
 * running right:
 *
 * ```
 *  row 1:            (2,1)╱‾(3,1)>‾(4,1)╲
 *  row 0:  X(0) >(1) SW(2) >(3) -(4) -(5) SW(6) -(7) X(8)
 * ```
 *
 * Main signal at (3,0), loop signal at (4,1). `loopPreferred: false` leaves
 * the loop without preferred directions.
 */
export function signalledLoop({ loopPreferred = true } = {}): Map_ {
	const map = new Map_();
	place(map, 0, 0, "exit", "EXITLEFT");
	place(map, 1, 0, "signal", "SIGNALRIGHT");
	place(map, 2, 0, "switch", "SWITCH1");
	place(map, 3, 0, "signal", "SIGNALRIGHT");
	place(map, 4, 0, "straight", "STRAIGHTH");
	place(map, 5, 0, "straight", "STRAIGHTH");
	place(map, 6, 0, "switch", "SWITCH2");
	place(map, 7, 0, "straight", "STRAIGHTH");
	place(map, 8, 0, "exit", "EXITRIGHT");
	place(map, 3, 1, "curved", "CURVE1");
	place(map, 4, 1, "signal", "SIGNALRIGHT");
	place(map, 5, 1, "curved", "CURVE2");
	map.makeTrackList();
	const at = (gx: number, gy: number) => {
		const track = map.getTrackAt(gx * CELL, gy * CELL);
		if (!track) throw new Error(`no track at (${gx}, ${gy})`);
		return track;
	};
	// Set by hand, main line both ways and the loop (below) one way only.
	for (let gx = 0; gx <= 8; gx++) {
		at(gx, 0).addPreferredDirection(3, 5);
		at(gx, 0).addPreferredDirection(5, 3);
	}
	if (loopPreferred) {
		for (const [entry, exit, track] of [
			[3, 2, at(2, 0)],
			[6, 5, at(3, 1)],
			[3, 5, at(4, 1)],
			[3, 8, at(5, 1)],
			[0, 5, at(6, 0)],
		] as const) {
			track.addPreferredDirection(entry, exit);
		}
	}
	return map;
}

export function timetable(
	services: Service[],
	startTime = t("06:00"),
): Timetable {
	return { version: 1, startTime, services };
}

export function service(
	ref: string,
	actions: Action[],
	extra: Patch<Service> = {},
): Service {
	return applyPatch({ ref, train: { ...TRAIN }, actions }, extra);
}

export function engineFor(map: Map_, tt: Timetable = timetable([])): Engine {
	return createEngine({ map, timetable: tt });
}

/** Run `engine` for `seconds` of timetable time. */
export function runFor(engine: Engine, seconds: number): void {
	engine.advance(seconds);
}

export const cell = (gx: number, gy = 0) => ({ gx, gy });

/** Put a train straight onto the railway, outside any timetable. */
export function addTrain(
	engine: Engine,
	rear: { gx: number; gy: number },
	front: { gx: number; gy: number },
	spec: Partial<TrainSpec> = {},
): Train {
	const position = startPosition(engine.graph, engine.state.lies, rear, front);
	if (!position) throw new Error("cannot place a train there");
	const train = trainFromSpec(
		engine.state.nextTrainId++,
		"1A01",
		"",
		{ ...TRAIN, ...spec },
		{
			ref: "1A01",
			repeat: 0,
			index: 0,
			at: null,
			arrivedAt: null,
			lastActionAt: 0,
			releaseAt: null,
			extraDwell: 0,
			heldReported: false,
			done: false,
		},
	);
	train.segs = position.segs;
	train.frontM = position.frontM;
	engine.state.trains.push(train);
	return train;
}

/** The cell a train's front is in. */
export function frontCell(
	engine: Engine,
	train: Train,
): { gx: number; gy: number } {
	return engine.graph.nodes[train.segs[train.segs.length - 1].node].cell;
}
