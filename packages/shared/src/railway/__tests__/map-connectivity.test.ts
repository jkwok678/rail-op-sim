import { describe, expect, it, vi } from "vitest";
import {
	CurvedType,
	ExitType,
	LinkedType,
	StraightType,
	SwitchType,
} from "../enums";
import { Map_ } from "../map";
import {
	checkAllTracksConnected,
	findAllLinkedTracks,
	findPathBetween,
	findUnpairedLinkedTracks,
	getLinkedTrackPairs,
	getLinkedTrackReport,
} from "../map/map-connectivity";

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
		expect(unpaired[0].data.subtype).toBe(LinkedType.LINKUP);
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
		expect(pairs[0].a.isLinked()).toBe(true);
		expect(pairs[0].b.isLinked()).toBe(true);
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
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			0, 0,
		);
		const start = map.getTrackAt(0, 0)!;
		const path = findPathBetween(map, start, start);
		expect(path).toEqual([start]);
	});

	it("finds path between two directly connected horizontal tracks", () => {
		const map = new Map_();
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			0, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			16, 0,
		);
		const start = map.getTrackAt(0, 0)!;
		const end = map.getTrackAt(16, 0)!;
		const path = findPathBetween(map, start, end);
		expect(path).not.toBeNull();
		expect(path!.length).toBe(2);
		expect(path![0]).toBe(start);
		expect(path![1]).toBe(end);
	});

	it("finds path through a linear chain of tracks", () => {
		const map = new Map_();
		// Horizontal chain: -16,0 → 0,0 → 16,0 → 32,0
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			-16, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			0, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			16, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			32, 0,
		);
		const start = map.getTrackAt(-16, 0)!;
		const end = map.getTrackAt(32, 0)!;
		const path = findPathBetween(map, start, end);
		expect(path).not.toBeNull();
		expect(path!.length).toBe(4);
	});

	it("returns null when tracks are in disconnected components", () => {
		const map = new Map_();
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			0, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			0, 32,
		);
		const start = map.getTrackAt(0, 0)!;
		const end = map.getTrackAt(0, 32)!;
		const path = findPathBetween(map, start, end);
		expect(path).toBeNull();
	});

	it("finds path through a switch junction", () => {
		const map = new Map_();
		// SWITCHTIGHT1 at (0,0): links[1]=top, [3]=left, [5]=right
		// Path: left entry → switch → right exit
		map.addTrack(
			{ kind: "switch", subtype: SwitchType.SWITCHTIGHT1, platform1: false, platform2: false },
			0, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			-16, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			16, 0,
		);
		const start = map.getTrackAt(-16, 0)!;
		const end = map.getTrackAt(16, 0)!;
		const path = findPathBetween(map, start, end);
		expect(path).not.toBeNull();
		expect(path!.length).toBe(3); // left → switch → right
	});

	it("cleans up found flags after traversal", () => {
		const map = new Map_();
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			0, 0,
		);
		map.addTrack(
			{ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
			16, 0,
		);
		const start = map.getTrackAt(0, 0)!;
		const end = map.getTrackAt(16, 0)!;
		findPathBetween(map, start, end);

		// All tracks should have found reset to false
		map.makeTrackList();
		for (const t of map.getTrackList()) {
			expect(t.getFound()).toBe(false);
		}
	});
});
