import { describe, expect, it, vi } from "vitest";
import {
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	LinkedType,
	Platform,
	StraightType,
	SwitchType,
} from "../enums";
import { Map_ } from "../map";
import {
	checkAllTracksConnected,
	clearPreferredDirectionsAlongPath,
	elementNeedsName,
	findAllLinkedTracks,
	findPathBetween,
	findUnpairedLinkedTracks,
	getConnectivityReport,
	getLinkedTrackPairs,
	getLinkedTrackReport,
	isRailwayComplete,
	linkIndexForOffset,
	revalidatePreferredDirections,
	setPreferredDirectionsAlongPath,
} from "../map/map-connectivity";
import type { TrackKind } from "../track/track-data";
import { createTrackData } from "../track/track-factory";
import { defined, trackAt } from "./test-helpers";

// ============================================================================
// checkAllTracksConnected
// ============================================================================

describe("checkAllTracksConnected", () => {
	it("empty map returns false and calls onMessage with error", () => {
		const onMessage = vi.fn();
		const map = new Map_({ onMessage });
		expect(checkAllTracksConnected(map)).toBe(false);
		expect(onMessage).toHaveBeenCalledWith(
			"error",
			"There are zero tracks stored.",
		);
	});

	it("single track returns false", () => {
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
		expect(checkAllTracksConnected(map)).toBe(false);
	});

	it("two connected horizontal straight tracks terminated by exit tracks return true", () => {
		const map = new Map_();
		// STRAIGHTH: links[3]=left (checks cx-16,cy), links[5]=right (checks cx+16,cy)
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0); // link[5] checks (0,0) ✓
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0); // link[3] checks (16,0) ✓
		expect(checkAllTracksConnected(map)).toBe(true);
	});

	it("two tracks not at 16px offset return false", () => {
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			32,
			0,
		);
		// Track at (0,0) links[5] checks (16,0) -> no track
		expect(checkAllTracksConnected(map)).toBe(false);
	});

	it("two disconnected tracks at different y values return false", () => {
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			16,
		);
		// STRAIGHTH is horizontal: links left/right, not up/down
		expect(checkAllTracksConnected(map)).toBe(false);
	});

	it("two connected vertical straight tracks terminated by exit tracks return true", () => {
		const map = new Map_();
		// STRAIGHTV: links[1]=top (checks cx, cy+16), links[7]=bottom (checks cx, cy-16)
		map.addTrack({ kind: "exit", subtype: ExitType.EXITDOWN }, 0, -16); // link[1] checks (0,0) ✓
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			16,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITUP }, 0, 32); // link[7] checks (0,16) ✓
		expect(checkAllTracksConnected(map)).toBe(true);
	});

	it("TIGHTCURVE1 + STRAIGHTH at correct offset terminated by exit tracks returns true", () => {
		const map = new Map_();
		// TIGHTCURVE1: links[5]=right (checks 16,0), links[7]=bottom (checks 0,-16)
		// STRAIGHTH at (16,0): links[3]=left (checks 0,0), links[5]=right (checks 32,0)
		map.addTrack({ kind: "exit", subtype: ExitType.EXITDOWN }, 0, -16); // link[1] checks (0,0) ✓
		map.addTrack({ kind: "curved", subtype: CurvedType.TIGHTCURVE1 }, 0, 0);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0); // link[3] checks (16,0) ✓
		expect(checkAllTracksConnected(map)).toBe(true);
	});

	it("switch track with 3 exit tracks resolves all links", () => {
		const map = new Map_();
		// SWITCHTIGHT1: links[1]=top, [3]=left, [5]=right
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		// link[1] checks (0, 16) → EXITUP at (0,16): link[7]=bottom checks (0,0) ✓
		// link[3] checks (-16, 0) → EXITLEFT at (-16,0): link[5]=right checks (0,0) ✓
		// link[5] checks (16, 0) → EXITRIGHT at (16,0): link[3]=left checks (0,0) ✓
		map.addTrack({ kind: "exit", subtype: ExitType.EXITUP }, 0, 16);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 16, 0);
		expect(checkAllTracksConnected(map)).toBe(true);
	});

	it("switch track with only 2 of 3 links connected returns false", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0); // for link[3]
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 16, 0); // for link[5]
		// Missing track at (0, 16) for link[1]
		expect(checkAllTracksConnected(map)).toBe(false);
	});

	it("all tracks connected but LinkedTracks unlinked returns false", () => {
		const map = new Map_();
		// Create a connected stretch: EXITLEFT(-16,0) -> STRAIGHTH(0,0) -> STRAIGHTH(16,0) -> EXITRIGHT(32,0)
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);
		// Add unlinked LinkedTracks — odd count means checkAllLinkedTrackLinked fails
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 48, 0);
		expect(checkAllTracksConnected(map)).toBe(false);
	});

	it("onMessage not called when there are tracks (even if disconnected)", () => {
		const onMessage = vi.fn();
		const map = new Map_({ onMessage });
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
		checkAllTracksConnected(map);
		// onMessage should not be called because trackList is not empty
		expect(onMessage).not.toHaveBeenCalled();
	});
});

// ============================================================================
// getConnectivityReport
// ============================================================================

describe("getConnectivityReport", () => {
	/** A horizontal straight at (x, 0). */
	const straightAt = (map: Map_, x: number): void => {
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			0,
		);
	};

	it("empty map is not connected and reports no faults", () => {
		const report = getConnectivityReport(new Map_());
		expect(report).toMatchObject({
			total: 0,
			connected: false,
			complete: false,
			dangling: [],
			unpairedLinked: [],
			unnamed: [],
			undirected: [],
			brokenRoutes: [],
		});
	});

	it("a joined railway is connected but not complete until directed", () => {
		const map = new Map_();
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
		straightAt(map, 0);
		straightAt(map, 16);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);

		const report = getConnectivityReport(map);
		expect(report.connected).toBe(true);
		expect(report.complete).toBe(false);
		expect(report.total).toBe(4);
		expect(report.dangling).toEqual([]);
		expect(report.undirected).toHaveLength(4);

		setPreferredDirectionsAlongPath(
			map,
			trackAt(map, -16, 0),
			trackAt(map, 32, 0),
		);
		const directed = getConnectivityReport(map);
		expect(directed.connected).toBe(true);
		expect(directed.complete).toBe(true);
		expect(directed.undirected).toEqual([]);
	});

	it("names every track with an open end, not just the first", () => {
		const map = new Map_();
		straightAt(map, 0);
		straightAt(map, 16);

		const report = getConnectivityReport(map);
		expect(report.connected).toBe(false);
		// (0,0) dangles left, (16,0) dangles right — no early exit.
		expect(report.dangling).toHaveLength(2);
		expect(report.dangling.map((d) => d.track.getLocationX())).toEqual([0, 16]);
		// Each records which link indices are open: 3 = left, 5 = right.
		expect(defined(report.dangling[0], "dangling[0]").links).toEqual([3]);
		expect(defined(report.dangling[1], "dangling[1]").links).toEqual([5]);
	});

	it("reports an unpaired portal separately from open ends", () => {
		const map = new Map_();
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
		straightAt(map, 0);
		straightAt(map, 16);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 96, 96);

		const report = getConnectivityReport(map);
		expect(report.connected).toBe(false);
		expect(report.unpairedLinked).toHaveLength(1);
		expect(
			defined(
				report.unpairedLinked[0],
				"report.unpairedLinked[0]",
			).getLocationX(),
		).toBe(96);
	});

	it("does not treat occupancy as a join — H next to V is incomplete", () => {
		const map = new Map_();
		// STRAIGHTH links left/right; STRAIGHTV links up/down. Adjacent cells,
		// but the H's right link has no matching left link on the V.
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
		straightAt(map, 0);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITUP }, 16, 16);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITDOWN }, 16, -16);

		const report = getConnectivityReport(map);
		expect(report.connected).toBe(false);
		expect(report.dangling.map((d) => d.track.getLocationX())).toContain(0);
		expect(
			report.dangling.find((d) => d.track.getLocationX() === 0)?.links,
		).toEqual([5]);
	});
});

// ============================================================================
// isRailwayComplete
// ============================================================================

describe("isRailwayComplete", () => {
	const FONT = { family: "Arial", pointSize: 12 };

	const joinedLine = (map: Map_): void => {
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);
	};

	const directLine = (map: Map_): void => {
		setPreferredDirectionsAlongPath(
			map,
			trackAt(map, -16, 0),
			trackAt(map, 32, 0),
		);
	};

	it("empty map is not complete and does not message", () => {
		const onMessage = vi.fn();
		const map = new Map_({ onMessage });
		expect(isRailwayComplete(map)).toBe(false);
		expect(map.isRailwayComplete()).toBe(false);
		expect(onMessage).not.toHaveBeenCalled();
	});

	it("joined track is not complete until preferred directions are set", () => {
		const map = new Map_();
		joinedLine(map);
		expect(getConnectivityReport(map).connected).toBe(true);
		expect(isRailwayComplete(map)).toBe(false);

		directLine(map);
		expect(isRailwayComplete(map)).toBe(true);
		expect(map.isRailwayComplete()).toBe(true);
	});

	it("an open end is not complete", () => {
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
		expect(isRailwayComplete(map)).toBe(false);
	});

	it("an unnamed location keeps the railway incomplete", () => {
		const map = new Map_();
		joinedLine(map);
		directLine(map);
		map.createAddNamedLocation(0, 32);
		expect(getConnectivityReport(map).connected).toBe(true);
		expect(isRailwayComplete(map)).toBe(false);
		expect(getConnectivityReport(map).unnamed).toHaveLength(1);

		map
			.getNamedLocationAt(0, 32)!
			.setText(map.createAddText(0, 32, "Depot", FONT));
		expect(isRailwayComplete(map)).toBe(true);
	});

	it("an unnamed platform keeps the railway incomplete", () => {
		const map = new Map_();
		joinedLine(map);
		directLine(map);
		map.addPlatform(Platform.UP, 0, 0);
		expect(elementNeedsName(trackAt(map, 0, 0))).toBe(true);
		expect(isRailwayComplete(map)).toBe(false);

		trackAt(map, 0, 0).setText(map.createAddText(0, 0, "Platform 1", FONT));
		expect(isRailwayComplete(map)).toBe(true);
	});

	it("an unpaired portal is not complete", () => {
		const map = new Map_();
		joinedLine(map);
		directLine(map);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 96, 96);
		expect(isRailwayComplete(map)).toBe(false);
	});
});

// ============================================================================
// Linked track diagnostics
// ============================================================================

describe("findAllLinkedTracks", () => {
	it("returns empty array when no linked tracks exist", () => {
		const map = new Map_();
		expect(findAllLinkedTracks(map)).toEqual([]);
	});

	it("returns all linked tracks but not other kinds", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			32,
			0,
		);
		const result = findAllLinkedTracks(map);
		expect(result).toHaveLength(2);
		expect(result.every((t) => t.data.kind === "linked")).toBe(true);
	});
});

describe("findUnpairedLinkedTracks", () => {
	it("returns empty array when no linked tracks", () => {
		const map = new Map_();
		expect(findUnpairedLinkedTracks(map)).toEqual([]);
	});

	it("returns all linked tracks when none are paired", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		expect(findUnpairedLinkedTracks(map)).toHaveLength(2);
	});

	it("returns empty array when all are paired", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		expect(findUnpairedLinkedTracks(map)).toEqual([]);
	});

	it("returns only unpaired tracks when mixed", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKUP }, 0, 16);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const unpaired = findUnpairedLinkedTracks(map);
		expect(unpaired).toHaveLength(1);
		expect(defined(unpaired[0], "unpaired[0]").data.subtype).toBe(
			LinkedType.LINKUP,
		);
	});
});

describe("getLinkedTrackPairs", () => {
	it("returns empty array when no linked tracks", () => {
		const map = new Map_();
		expect(getLinkedTrackPairs(map)).toEqual([]);
	});

	it("returns empty array when none are paired", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		expect(getLinkedTrackPairs(map)).toEqual([]);
	});

	it("returns one pair for two paired tracks", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const pairs = getLinkedTrackPairs(map);
		expect(pairs).toHaveLength(1);
		expect(defined(pairs[0], "pairs[0]").a.isLinked()).toBe(true);
		expect(defined(pairs[0], "pairs[0]").b.isLinked()).toBe(true);
	});

	it("returns only paired tracks when mixed with unpaired", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKUP }, 0, 16);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKDOWN }, 0, 32);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const pairs = getLinkedTrackPairs(map);
		expect(pairs).toHaveLength(1);
	});
});

describe("getLinkedTrackReport", () => {
	it("produces correct report for empty map", () => {
		const map = new Map_();
		const report = getLinkedTrackReport(map);
		expect(report.total).toBe(0);
		expect(report.paired).toBe(0);
		expect(report.unpaired).toBe(0);
		expect(report.allPaired).toBe(true);
	});

	it("produces correct report for fully paired map", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const report = getLinkedTrackReport(map);
		expect(report.total).toBe(2);
		expect(report.paired).toBe(2);
		expect(report.unpaired).toBe(0);
		expect(report.allPaired).toBe(true);
		expect(report.pairedPairs).toHaveLength(1);
		expect(report.unpairedTracks).toEqual([]);
	});

	it("produces correct report for fully unpaired map", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		const report = getLinkedTrackReport(map);
		expect(report.total).toBe(2);
		expect(report.paired).toBe(0);
		expect(report.unpaired).toBe(2);
		expect(report.allPaired).toBe(false);
	});

	it("produces correct report for partially paired map", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKUP }, 0, 16);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const report = getLinkedTrackReport(map);
		expect(report.total).toBe(3);
		expect(report.paired).toBe(2);
		expect(report.unpaired).toBe(1);
		expect(report.allPaired).toBe(false);
	});
});

// ============================================================================
// findPathBetween
// ============================================================================

describe("findPathBetween", () => {
	it("returns single-element path when start === end", () => {
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
		const start = trackAt(map, 0, 0);
		const path = findPathBetween(map, start, start);
		expect(path).toEqual([start]);
	});

	it("finds path between two directly connected horizontal tracks", () => {
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		const start = trackAt(map, 0, 0);
		const end = trackAt(map, 16, 0);
		const path = findPathBetween(map, start, end);
		expect(path).not.toBeNull();
		expect(path!.length).toBe(2);
		expect(path![0]).toBe(start);
		expect(path![1]).toBe(end);
	});

	it("runs straight through points rather than round a loop as short", () => {
		// row 1:        (3,1)╱‾(4,1)╲
		// row 0: -(0) -(1) SW(2) -(3) -(4) SW(5) -(6)
		const map = new Map_();
		const put = (gx: number, gy: number, kind: TrackKind, subtype: string) =>
			map.addTrack(createTrackData(kind, subtype), gx * 16, gy * 16);
		for (const gx of [0, 1, 3, 4, 6]) put(gx, 0, "straight", "STRAIGHTH");
		put(2, 0, "switch", "SWITCH1");
		put(5, 0, "switch", "SWITCH2");
		put(3, 1, "curved", "CURVE1");
		put(4, 1, "curved", "CURVE2");
		map.makeTrackList();
		const at = (gx: number) => trackAt(map, gx * 16, 0);
		for (const [from, to] of [
			[0, 6],
			[6, 0],
		] as const) {
			const path = findPathBetween(map, at(from), at(to));
			expect(path?.map((t) => t.getLocationY())).toEqual(Array(7).fill(0));
		}
	});

	it("finds path through a linear chain of tracks", () => {
		const map = new Map_();
		// Horizontal chain: -16,0 → 0,0 → 16,0 → 32,0
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			-16,
			0,
		);
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			32,
			0,
		);
		const start = trackAt(map, -16, 0);
		const end = trackAt(map, 32, 0);
		const path = findPathBetween(map, start, end);
		expect(path).not.toBeNull();
		expect(path!.length).toBe(4);
	});

	it("returns null when tracks are in disconnected components", () => {
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			32,
		);
		const start = trackAt(map, 0, 0);
		const end = trackAt(map, 0, 32);
		const path = findPathBetween(map, start, end);
		expect(path).toBeNull();
	});

	it("finds path through a switch junction", () => {
		const map = new Map_();
		// SWITCHTIGHT1 at (0,0): links[1]=top, [3]=left, [5]=right
		// Path: left entry → switch → right exit
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			-16,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		const start = trackAt(map, -16, 0);
		const end = trackAt(map, 16, 0);
		const path = findPathBetween(map, start, end);
		expect(path).not.toBeNull();
		expect(path!.length).toBe(3); // left → switch → right
	});

	it("cleans up found flags after traversal", () => {
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
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		const start = trackAt(map, 0, 0);
		const end = trackAt(map, 16, 0);
		findPathBetween(map, start, end);

		// All tracks should have found reset to false
		map.makeTrackList();
		for (const t of map.getTrackList()) {
			expect(t.getFound()).toBe(false);
		}
	});
});

// ============================================================================
// linkIndexForOffset
// ============================================================================

describe("linkIndexForOffset", () => {
	it("maps the cardinal/diagonal offsets to link indices", () => {
		expect(linkIndexForOffset(-1, 1)).toBe(0); // top-left
		expect(linkIndexForOffset(0, 1)).toBe(1); // top
		expect(linkIndexForOffset(1, 1)).toBe(2); // top-right
		expect(linkIndexForOffset(-1, 0)).toBe(3); // left
		expect(linkIndexForOffset(1, 0)).toBe(5); // right
		expect(linkIndexForOffset(-1, -1)).toBe(6); // bottom-left
		expect(linkIndexForOffset(0, -1)).toBe(7); // bottom
		expect(linkIndexForOffset(1, -1)).toBe(8); // bottom-right
	});

	it("returns null for the unused centre (0,0)", () => {
		expect(linkIndexForOffset(0, 0)).toBeNull();
	});

	it("returns null for out-of-range offsets", () => {
		expect(linkIndexForOffset(2, 0)).toBeNull();
		expect(linkIndexForOffset(0, -2)).toBeNull();
	});

	it("returns null for non-integer offsets", () => {
		expect(linkIndexForOffset(0.5, 0)).toBeNull();
		expect(linkIndexForOffset(0, -0.5)).toBeNull();
		expect(linkIndexForOffset(Number.NaN, 0)).toBeNull();
	});
});

// ============================================================================
// setPreferredDirectionsAlongPath
// ============================================================================

describe("setPreferredDirectionsAlongPath", () => {
	const straightH = (map: Map_, x: number, y = 0) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			y,
		);

	const straightV = (map: Map_, x: number, y: number) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			y,
		);

	it("assigns {3,5} to every track (incl. endpoints) in an L→R chain", () => {
		const map = new Map_();
		straightH(map, 0);
		straightH(map, 16);
		straightH(map, 32);
		const start = trackAt(map, 0, 0);
		const end = trackAt(map, 32, 0);
		const result = setPreferredDirectionsAlongPath(map, start, end);
		expect(result).not.toBeNull();
		expect(result!.path).toHaveLength(3);
		expect(result!.applied).toBe(3);
		for (const x of [0, 16, 32]) {
			expect(trackAt(map, x, 0).getPreferredDirections()).toEqual([
				{ entry: 3, exit: 5 },
			]);
		}
	});

	it("assigning L→R then R→L makes tracks bidirectional with no dupes", () => {
		const map = new Map_();
		straightH(map, 0);
		straightH(map, 16);
		straightH(map, 32);
		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 32, 0);
		setPreferredDirectionsAlongPath(map, left, right);
		setPreferredDirectionsAlongPath(map, right, left);
		for (const x of [0, 16, 32]) {
			expect(trackAt(map, x, 0).getPreferredDirections()).toEqual([
				{ entry: 3, exit: 5 },
				{ entry: 5, exit: 3 },
			]);
		}
		// Re-running L→R must not add duplicates, and must report nothing applied.
		const repeat = setPreferredDirectionsAlongPath(map, left, right);
		expect(trackAt(map, 16, 0).getPreferredDirections()).toHaveLength(2);
		expect(repeat!.applied).toBe(0);
		expect(repeat!.unassigned).toBe(3);
	});

	it("endpoint on a curve borrows the curve's other link (not 8-entry)", () => {
		const map = new Map_();
		// TIGHTCURVE1 at (0,0): links 5 (right → 16,0) and 7 (bottom).
		map.addTrack({ kind: "curved", subtype: CurvedType.TIGHTCURVE1 }, 0, 0);
		straightH(map, 16);
		const start = trackAt(map, 16, 0);
		const curve = trackAt(map, 0, 0);
		setPreferredDirectionsAlongPath(map, start, curve);
		expect(curve.getPreferredDirections()).toEqual([{ entry: 5, exit: 7 }]);
		expect(start.getPreferredDirections()).toEqual([{ entry: 5, exit: 3 }]);
	});

	it("directs a buffer (1 link) endpoint into its dead-end, like ROS", () => {
		const map = new Map_();
		straightH(map, 0);
		straightH(map, 16);
		// BUFFERRIGHT at (32,0): single link 3 (→ 16,0); dead-end edge is 8-3=5.
		map.addTrack(
			{
				kind: "buffer",
				subtype: BufferType.BUFFERRIGHT,
				platform1: false,
				platform2: false,
			},
			32,
			0,
		);
		const start = trackAt(map, 0, 0);
		const buffer = trackAt(map, 32, 0);
		setPreferredDirectionsAlongPath(map, start, buffer);
		// Entry from the network (link 3), exit into the buffer stop (link 5).
		expect(buffer.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
		expect(trackAt(map, 0, 0).getPreferredDirections()).toEqual([
			{ entry: 3, exit: 5 },
		]);
		expect(trackAt(map, 16, 0).getPreferredDirections()).toEqual([
			{ entry: 3, exit: 5 },
		]);
	});

	it("assigns a switch both mid-path and as a trailing-point endpoint", () => {
		const map = new Map_();
		// SWITCHTIGHT1 at (0,0): links 1, 3, 5.
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(map, -16);
		straightH(map, 16);
		const left = trackAt(map, -16, 0);
		const right = trackAt(map, 16, 0);
		setPreferredDirectionsAlongPath(map, left, right);
		// Switch is mid-path → gets entry(toward prev=left, link 3) → exit(toward next=right, link 5).
		expect(trackAt(map, 0, 0).getPreferredDirections()).toEqual([
			{ entry: 3, exit: 5 },
		]);

		// A path that ENDS on the switch approached along its through (from the
		// right, link 5) → unique partner 3 (8-5 happens to agree).
		const map2 = new Map_();
		map2.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(map2, 16);
		const startTrack = trackAt(map2, 16, 0);
		const switchTrack = trackAt(map2, 0, 0);
		setPreferredDirectionsAlongPath(map2, startTrack, switchTrack);
		expect(switchTrack.getPreferredDirections()).toEqual([
			{ entry: 5, exit: 3 },
		]);
		expect(startTrack.getPreferredDirections()).toEqual([
			{ entry: 5, exit: 3 },
		]);
	});

	it("assigns a trailing spur endpoint via its unique partner", () => {
		const map = new Map_();
		// SWITCHTIGHT1 at (0,0): links 1, 3, 5. Approached from the toe (top,
		// link 1) the only legal exit is 3 — 8-1=7 is not a link, but geometry
		// is unambiguous.
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightV(map, 0, 16); // link 1 (top) neighbour of the switch
		const start = trackAt(map, 0, 16);
		const switchTrack = trackAt(map, 0, 0);
		const result = setPreferredDirectionsAlongPath(map, start, switchTrack);
		expect(switchTrack.getPreferredDirections()).toEqual([
			{ entry: 1, exit: 3 },
		]);
		expect(result!.applied).toBe(2);
		expect(result!.unassigned).toBe(0);
	});

	it("refuses a facing switch endpoint instead of partially committing", () => {
		const map = new Map_();
		// SWITCHTIGHT1 approached from the stem (left, link 3): 3→5 and 3→1
		// are both legal, so inventing a continuation would silently pick the
		// through. The user chooses by clicking past the switch — nothing is
		// written until they do.
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(map, -16);
		const start = trackAt(map, -16, 0);
		const switchTrack = trackAt(map, 0, 0);
		const result = setPreferredDirectionsAlongPath(map, start, switchTrack);
		expect(switchTrack.getPreferredDirections()).toEqual([]);
		expect(start.getPreferredDirections()).toEqual([]);
		expect(result!.applied).toBe(0);
		expect(result!.facingSwitchEndpoint).toBe(true);
	});

	it("SWITCH1 trailing on the diverging leg assigns 2→3, facing 3 stays unset", () => {
		// SWITCH1 ([2, 3, 5]): 2↔3 is the curve, 3↔5 the through, 2↔5 illegal.
		const trailing = new Map_();
		trailing.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCH1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		trailing.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTRIGHTUP,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			16,
		);
		const spur = trackAt(trailing, 16, 16);
		const swTrail = trackAt(trailing, 0, 0);
		const trailResult = setPreferredDirectionsAlongPath(
			trailing,
			spur,
			swTrail,
		);
		expect(swTrail.getPreferredDirections()).toEqual([{ entry: 2, exit: 3 }]);
		expect(trailResult!.unassigned).toBe(0);

		const facing = new Map_();
		facing.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCH1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(facing, -16);
		const stem = trackAt(facing, -16, 0);
		const swFace = trackAt(facing, 0, 0);
		const faceResult = setPreferredDirectionsAlongPath(facing, stem, swFace);
		expect(swFace.getPreferredDirections()).toEqual([]);
		expect(stem.getPreferredDirections()).toEqual([]);
		expect(faceResult!.applied).toBe(0);
		expect(faceResult!.facingSwitchEndpoint).toBe(true);
	});

	it("returns null and mutates nothing for disconnected tracks", () => {
		const map = new Map_();
		straightH(map, 0, 0);
		straightH(map, 0, 32);
		const a = trackAt(map, 0, 0);
		const b = trackAt(map, 0, 32);
		expect(setPreferredDirectionsAlongPath(map, a, b)).toBeNull();
		expect(a.getPreferredDirections()).toEqual([]);
		expect(b.getPreferredDirections()).toEqual([]);
	});

	it("returns [start] and assigns nothing when start === end", () => {
		const map = new Map_();
		straightH(map, 0);
		const t = trackAt(map, 0, 0);
		const result = setPreferredDirectionsAlongPath(map, t, t);
		expect(result!.path).toEqual([t]);
		expect(result!.applied).toBe(0);
		expect(t.getPreferredDirections()).toEqual([]);
	});

	it("assigns through a linked-pair portal in one gesture", () => {
		const map = new Map_();
		straightH(map, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 48, 0);
		straightH(map, 64);
		map.connectTwoLinkedTracks(16, 0);
		map.connectTwoLinkedTracks(48, 0);
		const a = trackAt(map, 0, 0);
		const b = trackAt(map, 64, 0);
		const result = setPreferredDirectionsAlongPath(map, a, b);
		expect(result).not.toBeNull();
		expect(result!.path).toHaveLength(4);
		expect(result!.applied).toBe(4);
		// LINKRIGHT: enter from the railway (3), leave through the mouth (5).
		expect(trackAt(map, 16, 0).getPreferredDirections()).toEqual([
			{ entry: 3, exit: 5 },
		]);
		// LINKLEFT: enter through the mouth (3), leave onto the far railway (5).
		expect(trackAt(map, 48, 0).getPreferredDirections()).toEqual([
			{ entry: 3, exit: 5 },
		]);
	});

	it("leaves a portal endpoint unset rather than routing into the mouth", () => {
		const map = new Map_();
		straightH(map, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		const start = trackAt(map, 0, 0);
		const portal = trackAt(map, 16, 0);
		const result = setPreferredDirectionsAlongPath(map, start, portal);
		expect(result!.applied).toBe(1);
		expect(start.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
		expect(portal.getPreferredDirections()).toEqual([]);
	});
});

// ============================================================================
// clearPreferredDirectionsAlongPath
// ============================================================================

describe("clearPreferredDirectionsAlongPath", () => {
	const straightH = (map: Map_, x: number, y = 0) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			y,
		);

	const straightV = (map: Map_, x: number, y: number) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			y,
		);

	/** Three straights at x = 0, 16, 32 with L→R directions already set. */
	const chainLR = () => {
		const map = new Map_();
		straightH(map, 0);
		straightH(map, 16);
		straightH(map, 32);
		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 32, 0);
		setPreferredDirectionsAlongPath(map, left, right);
		return { map, left, right };
	};

	it("removes exactly what the same two clicks assigned", () => {
		const { map, left, right } = chainLR();
		const result = clearPreferredDirectionsAlongPath(map, left, right);
		expect(result).not.toBeNull();
		expect(result!.path).toHaveLength(3);
		expect(result!.removed).toBe(3);
		expect(result!.untouched).toBe(0);
		for (const x of [0, 16, 32]) {
			expect(trackAt(map, x, 0).getPreferredDirections()).toEqual([]);
			expect(trackAt(map, x, 0).hasPreferredDirection()).toBe(false);
		}
	});

	it("clears both directions of a two-way route", () => {
		const { map, left, right } = chainLR();
		setPreferredDirectionsAlongPath(map, right, left);
		const result = clearPreferredDirectionsAlongPath(map, left, right);
		expect(result!.removed).toBe(3);
		for (const x of [0, 16, 32]) {
			expect(trackAt(map, x, 0).getPreferredDirections()).toEqual([]);
			expect(trackAt(map, x, 0).getDirectionality()).toBe("none");
		}
	});

	it("erases a one-way route retraced against its arrows", () => {
		const { map, left, right } = chainLR();
		// Clicked end→start, the opposite way round from how it was drawn.
		const result = clearPreferredDirectionsAlongPath(map, right, left);
		expect(result!.removed).toBe(3);
		for (const x of [0, 16, 32]) {
			expect(trackAt(map, x, 0).getPreferredDirections()).toEqual([]);
		}
	});

	it("reports removed === 0 when the route carries no such directions", () => {
		const map = new Map_();
		straightH(map, 0);
		straightH(map, 16);
		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 16, 0);
		const result = clearPreferredDirectionsAlongPath(map, left, right);
		expect(result!.removed).toBe(0);
		expect(result!.untouched).toBe(2);
	});

	it("erasing one route through a switch leaves the other spur set", () => {
		const map = new Map_();
		// SWITCHTIGHT1 at (0,0): links 1, 3, 5 — straight 3↔5, spur toward 1.
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHTIGHT1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(map, -16);
		straightH(map, 16);
		straightV(map, 0, 16);
		const left = trackAt(map, -16, 0);
		const right = trackAt(map, 16, 0);
		const top = trackAt(map, 0, 16);
		const sw = trackAt(map, 0, 0);

		setPreferredDirectionsAlongPath(map, left, right); // straight, 3→5
		setPreferredDirectionsAlongPath(map, left, top); // spur, 3→1
		expect(sw.getPreferredDirections()).toHaveLength(2);

		clearPreferredDirectionsAlongPath(map, left, right);
		// The spur is untouched; only the straight leg (and its mirror) went.
		expect(sw.getPreferredDirections()).toEqual([{ entry: 3, exit: 1 }]);
		// The straight's own tracks lost their directions.
		expect(right.getPreferredDirections()).toEqual([]);
	});

	it("returns null and mutates nothing for disconnected tracks", () => {
		const map = new Map_();
		straightH(map, 0, 0);
		straightH(map, 0, 32);
		const a = trackAt(map, 0, 0);
		const b = trackAt(map, 0, 32);
		a.addPreferredDirection(3, 5);
		expect(clearPreferredDirectionsAlongPath(map, a, b)).toBeNull();
		expect(a.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
	});

	it("returns [start] and removes nothing when start === end", () => {
		const map = new Map_();
		straightH(map, 0);
		const t = trackAt(map, 0, 0);
		t.addPreferredDirection(3, 5);
		const result = clearPreferredDirectionsAlongPath(map, t, t);
		expect(result!.path).toEqual([t]);
		expect(result!.removed).toBe(0);
		expect(t.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
	});
});

// ============================================================================
// Traversability constraints (crossovers, one-way directed track)
// ============================================================================

describe("path traversability", () => {
	const straightH = (map: Map_, x: number, y = 0) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			y,
		);
	const straightV = (map: Map_, x: number, y: number) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			y,
		);

	/** CROSSOVER1 at (0,0) with a straight on each of its four arms. */
	const crossoverMap = () => {
		const map = new Map_();
		map.addTrack(
			{ kind: "crossover", subtype: CrossoverType.CROSSOVER1 },
			0,
			0,
		);
		straightH(map, -16);
		straightH(map, 16);
		straightV(map, 0, 16);
		straightV(map, 0, -16);
		return map;
	};

	it("routes straight through a crossover but not between its two paths", () => {
		const map = crossoverMap();
		const left = trackAt(map, -16, 0);
		const right = trackAt(map, 16, 0);
		const above = trackAt(map, 0, 16);
		// Horizontal path (3↔5) is fine.
		expect(findPathBetween(map, left, right)).toHaveLength(3);
		// Left arm to top arm would need the impossible turn 3→1.
		expect(findPathBetween(map, left, above)).toBeNull();
	});

	it("never records an impossible turn across a crossover", () => {
		const map = crossoverMap();
		const crossover = trackAt(map, 0, 0);
		expect(crossover.addPreferredDirection(3, 1)).toBe(false);
		expect(crossover.addPreferredDirection(3, 5)).toBe(true);
		expect(crossover.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
	});

	it("refuses a preferred direction against a one-way directed track", () => {
		const map = new Map_();
		// DIRECTEDRIGHT at (16,0): links [3,5], one-way 3→5.
		straightH(map, 0);
		map.addTrack(
			{
				kind: "directed",
				subtype: DirectedType.DIRECTEDRIGHT,
				platform1: false,
				platform2: false,
			},
			16,
			0,
		);
		straightH(map, 32);
		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 32, 0);
		const directed = trackAt(map, 16, 0);

		// With the arrow: assigned all the way through.
		expect(setPreferredDirectionsAlongPath(map, left, right)!.applied).toBe(3);
		expect(directed.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);

		// Against the arrow: no route exists, nothing is mutated.
		expect(setPreferredDirectionsAlongPath(map, right, left)).toBeNull();
		expect(directed.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
		expect(directed.addPreferredDirection(5, 3)).toBe(false);
	});

	it("section path-finding ignores the one-way sense", () => {
		const map = new Map_();
		straightH(map, 0);
		map.addTrack(
			{
				kind: "directed",
				subtype: DirectedType.DIRECTEDRIGHT,
				platform1: false,
				platform2: false,
			},
			16,
			0,
		);
		straightH(map, 32);
		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 32, 0);
		// Default options (used by the section tool) route in both senses.
		expect(findPathBetween(map, right, left)).toHaveLength(3);
		expect(
			findPathBetween(map, right, left, { respectOneWay: true }),
		).toBeNull();
	});

	it("requires the neighbour to link back, not merely to be occupied", () => {
		const map = new Map_();
		// An H straight beside a V straight: adjacent cells, but link 5 of the H
		// has no matching link 3 on the V — they do not join.
		straightH(map, 0);
		straightV(map, 16, 0);
		const h = trackAt(map, 0, 0);
		const v = trackAt(map, 16, 0);
		expect(findPathBetween(map, h, v)).toBeNull();
		expect(setPreferredDirectionsAlongPath(map, h, v)).toBeNull();
		expect(h.getPreferredDirections()).toEqual([]);
	});

	it("will not leave a one-way start track against its arrow", () => {
		const map = new Map_();
		// DIRECTEDRIGHT at (0,0) runs 3→5; the only neighbour is to its left.
		map.addTrack(
			{
				kind: "directed",
				subtype: DirectedType.DIRECTEDRIGHT,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(map, -16);
		const directed = trackAt(map, 0, 0);
		const left = trackAt(map, -16, 0);
		expect(
			findPathBetween(map, directed, left, { respectOneWay: true }),
		).toBeNull();
		expect(setPreferredDirectionsAlongPath(map, directed, left)).toBeNull();
		expect(left.getPreferredDirections()).toEqual([]);
		// Section selection still reaches it.
		expect(findPathBetween(map, directed, left)).toHaveLength(2);
	});

	it("will not reach a one-way goal track against its arrow", () => {
		const map = new Map_();
		// DIRECTEDLEFT at (0,0) runs 5→3, so it cannot be entered from the left.
		map.addTrack(
			{
				kind: "directed",
				subtype: DirectedType.DIRECTEDLEFT,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		straightH(map, -16);
		const directed = trackAt(map, 0, 0);
		const left = trackAt(map, -16, 0);
		expect(
			findPathBetween(map, left, directed, { respectOneWay: true }),
		).toBeNull();
		expect(setPreferredDirectionsAlongPath(map, left, directed)).toBeNull();
		expect(left.getPreferredDirections()).toEqual([]);
		expect(directed.getPreferredDirections()).toEqual([]);
	});
});

// ============================================================================
// Tight-radius switch geometry
// ============================================================================

describe("tight-radius switch geometry", () => {
	const arms = (subtype: (typeof SwitchType)[keyof typeof SwitchType]) => {
		const map = new Map_();
		map.addTrack(
			{ kind: "switch", subtype, platform1: false, platform2: false },
			0,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			-16,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			16,
		);
		return {
			map,
			sw: trackAt(map, 0, 0),
			left: trackAt(map, -16, 0),
			right: trackAt(map, 16, 0),
			top: trackAt(map, 0, 16),
		};
	};

	it("SWITCHTIGHT1 routes left→up (the curve the art has) and through", () => {
		const { map, sw, left, right, top } = arms(SwitchType.SWITCHTIGHT1);
		expect(findPathBetween(map, left, right)).toHaveLength(3);
		expect(findPathBetween(map, left, top)).toHaveLength(3);
		expect(sw.addPreferredDirection(3, 1)).toBe(true);
		expect(sw.addPreferredDirection(5, 1)).toBe(false);
	});

	it("SWITCHTIGHT2 refuses left→up (that curve belongs to variant 1)", () => {
		const { map, sw, left, right, top } = arms(SwitchType.SWITCHTIGHT2);
		expect(findPathBetween(map, left, right)).toHaveLength(3);
		expect(findPathBetween(map, left, top)).toBeNull();
		expect(findPathBetween(map, right, top)).toHaveLength(3);
		expect(sw.addPreferredDirection(3, 1)).toBe(false);
		expect(sw.addPreferredDirection(5, 1)).toBe(true);
	});
});

// ============================================================================
// Split-switch geometry (explicit pairs; 3–6 are not GEOMETRIC_PAIRS-safe)
// ============================================================================

describe("split-switch geometry", () => {
	it("SWITCHSPLIT3 routes stem→branches and refuses the phantom 2↔7", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCHSPLIT3,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			-16,
			0,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTRIGHTUP,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			16,
		);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			0,
			-16,
		);
		const left = trackAt(map, -16, 0);
		const diag = trackAt(map, 16, 16);
		const bottom = trackAt(map, 0, -16);
		const sw = trackAt(map, 0, 0);

		expect(findPathBetween(map, left, diag)).toHaveLength(3);
		expect(findPathBetween(map, left, bottom)).toHaveLength(3);
		expect(findPathBetween(map, diag, bottom)).toBeNull();

		// Trailing on a branch uniquely infers the stem (2↔7 is not a rail).
		const trail = setPreferredDirectionsAlongPath(map, diag, sw);
		expect(trail!.facingSwitchEndpoint).toBe(false);
		expect(trail!.applied).toBe(2);
		expect(sw.getPreferredDirections()).toEqual([{ entry: 2, exit: 3 }]);
		expect(sw.addPreferredDirection(2, 7)).toBe(false);
	});
});

// ============================================================================
// Preferred-direction revalidation after map edits
// ============================================================================

describe("revalidatePreferredDirections", () => {
	const straightH = (map: Map_, x: number) =>
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTH,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			x,
			0,
		);

	it("prunes neighbours when the middle cell is deleted", () => {
		const map = new Map_();
		straightH(map, 0);
		straightH(map, 16);
		straightH(map, 32);
		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 32, 0);
		setPreferredDirectionsAlongPath(map, left, right);
		expect(left.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);

		map.deleteElement(16, 0);
		expect(left.getPreferredDirections()).toEqual([]);
		expect(right.getPreferredDirections()).toEqual([]);
	});

	it("prunes a pair that exits into a cell with no reciprocal link", () => {
		const map = new Map_();
		straightH(map, 0);
		map.addTrack(
			{
				kind: "straight",
				subtype: StraightType.STRAIGHTV,
				platform1: false,
				platform2: false,
				levelCrossing: false,
			},
			16,
			0,
		);
		const left = trackAt(map, 0, 0);
		expect(left.addPreferredDirection(3, 5)).toBe(true);
		expect(revalidatePreferredDirections(map)).toBe(1);
		expect(left.getPreferredDirections()).toEqual([]);
	});

	it("cascades: deleting one portal approach also drops the partner mouth", () => {
		const map = new Map_();
		straightH(map, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 48, 0);
		straightH(map, 64);
		map.connectTwoLinkedTracks(16, 0);
		map.connectTwoLinkedTracks(48, 0);

		const left = trackAt(map, 0, 0);
		const right = trackAt(map, 64, 0);
		const west = trackAt(map, 16, 0);
		const east = trackAt(map, 48, 0);
		expect(setPreferredDirectionsAlongPath(map, left, right)!.applied).toBe(4);

		map.deleteElement(0, 0);
		// Single-pass revalidation would prune only the west mouth (no neighbour)
		// and leave east pointing into a hop that no longer continues.
		expect(west.getPreferredDirections()).toEqual([]);
		expect(east.getPreferredDirections()).toEqual([]);
		expect(right.getPreferredDirections()).toEqual([]);
	});

	it("drops both portal mouths when they point into their dead-ends", () => {
		const map = new Map_();
		straightH(map, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 48, 0);
		straightH(map, 64);
		map.connectTwoLinkedTracks(16, 0);
		map.connectTwoLinkedTracks(48, 0);

		const west = trackAt(map, 16, 0);
		const east = trackAt(map, 48, 0);
		// Both mouths pointing into the hop — trains arrive at both, leave from neither.
		expect(west.addPreferredDirection(3, 5)).toBe(true);
		expect(east.addPreferredDirection(5, 3)).toBe(true);

		const report = getConnectivityReport(map);
		expect(report.brokenRoutes.length).toBeGreaterThan(0);
		expect(revalidatePreferredDirections(map)).toBe(2);
		expect(west.getPreferredDirections()).toEqual([]);
		expect(east.getPreferredDirections()).toEqual([]);
	});

	it("flags contradictory neighbours without pruning until topology changes", () => {
		const map = new Map_();
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
		straightH(map, 0);
		straightH(map, 16);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);
		const a = trackAt(map, 0, 0);
		const b = trackAt(map, 16, 0);
		a.addPreferredDirection(3, 5);
		b.addPreferredDirection(5, 3);

		const report = getConnectivityReport(map);
		expect(
			report.brokenRoutes.some((i) => i.reason === "no-continuation"),
		).toBe(true);
		expect(a.getPreferredDirections()).toEqual([{ entry: 3, exit: 5 }]);
		expect(b.getPreferredDirections()).toEqual([{ entry: 5, exit: 3 }]);
	});

	it("lets a two-way stretch end against a one-way neighbour", () => {
		const map = new Map_();
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
		straightH(map, 0);
		straightH(map, 16);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);
		const twoWay = trackAt(map, 0, 0);
		const oneWay = trackAt(map, 16, 0);
		// Westbound starts at the boundary; eastbound crosses it and carries on.
		twoWay.addPreferredDirection(3, 5);
		twoWay.addPreferredDirection(5, 3);
		oneWay.addPreferredDirection(3, 5);

		expect(getConnectivityReport(map).brokenRoutes).toEqual([]);
		expect(revalidatePreferredDirections(map)).toBe(0);
		expect(twoWay.getPreferredDirections()).toHaveLength(2);
	});
});
