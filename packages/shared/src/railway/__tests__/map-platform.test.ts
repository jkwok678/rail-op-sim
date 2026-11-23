import { describe, expect, it } from "vitest";
import {
	BridgeUnderpassType,
	BufferType,
	CurvedType,
	DirectedType,
	Platform,
	StraightType,
	SwitchType,
} from "../enums";
import { Map_ } from "../map";
import {
	addLevelCrossing,
	addPlatform,
	removeLevelCrossing,
	removePlatform,
} from "../map/map-platform";
import { trackAt } from "./test-helpers";

const FONT = { family: "JetBrains Mono", pointSize: 12 };

// ============================================================================
// addPlatform
// ============================================================================

describe("addPlatform", () => {
	describe("StraightTrack", () => {
		it("STRAIGHTH + Platform.UP sets platform1", () => {
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
			addPlatform(map, Platform.UP, 0, 0);
			const track = trackAt(map, 0, 0);
			expect(track.getPlatform1()).toBe(true);
			expect(track.getPlatform2()).toBe(false);
		});

		it("STRAIGHTH + Platform.DOWN sets platform2", () => {
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
			addPlatform(map, Platform.DOWN, 0, 0);
			const track = trackAt(map, 0, 0);
			expect(track.getPlatform1()).toBe(false);
			expect(track.getPlatform2()).toBe(true);
		});

		it("STRAIGHTV + Platform.LEFT sets platform1", () => {
			const map = new Map_();
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
			addPlatform(map, Platform.LEFT, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform1()).toBe(true);
		});

		it("STRAIGHTV + Platform.RIGHT sets platform2", () => {
			const map = new Map_();
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
			addPlatform(map, Platform.RIGHT, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform2()).toBe(true);
		});

		it("angled straight (SLU/SRU) rejected", () => {
			const map = new Map_();
			map.addTrack(
				{
					kind: "straight",
					subtype: StraightType.STRAIGHTLEFTUP,
					platform1: false,
					platform2: false,
					levelCrossing: false,
				},
				0,
				0,
			);
			addPlatform(map, Platform.UP, 0, 0);
			expect(trackAt(map, 0, 0).hasPlatform()).toBe(false);
		});

		it("rejected when track has level crossing", () => {
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
			trackAt(map, 0, 0).addLevelCrossing();
			addPlatform(map, Platform.UP, 0, 0);
			expect(trackAt(map, 0, 0).hasPlatform()).toBe(false);
		});
	});

	describe("DirectedTrack", () => {
		it("DIRECTEDLEFT + Platform.UP sets platform1", () => {
			const map = new Map_();
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
			addPlatform(map, Platform.UP, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform1()).toBe(true);
		});

		it("DIRECTEDLEFT + Platform.DOWN sets platform2", () => {
			const map = new Map_();
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
			addPlatform(map, Platform.DOWN, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform2()).toBe(true);
		});

		it("DIRECTEDUP + Platform.LEFT sets platform1", () => {
			const map = new Map_();
			map.addTrack(
				{
					kind: "directed",
					subtype: DirectedType.DIRECTEDUP,
					platform1: false,
					platform2: false,
				},
				0,
				0,
			);
			addPlatform(map, Platform.LEFT, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform1()).toBe(true);
		});
	});

	describe("BufferTrack", () => {
		it("BUFFERLEFT + Platform.UP sets platform1", () => {
			const map = new Map_();
			map.addTrack(
				{
					kind: "buffer",
					subtype: BufferType.BUFFERLEFT,
					platform1: false,
					platform2: false,
				},
				0,
				0,
			);
			addPlatform(map, Platform.UP, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform1()).toBe(true);
		});

		it("BUFFERUP + Platform.LEFT sets platform1", () => {
			const map = new Map_();
			map.addTrack(
				{
					kind: "buffer",
					subtype: BufferType.BUFFERUP,
					platform1: false,
					platform2: false,
				},
				0,
				0,
			);
			addPlatform(map, Platform.LEFT, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform1()).toBe(true);
		});
	});

	describe("SwitchTrack", () => {
		it("SWITCHTIGHT1 + Platform.DOWN sets platform2", () => {
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
			addPlatform(map, Platform.DOWN, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform2()).toBe(true);
		});

		it("SWITCHTIGHT3 + Platform.UP sets platform1", () => {
			const map = new Map_();
			map.addTrack(
				{
					kind: "switch",
					subtype: SwitchType.SWITCHTIGHT3,
					platform1: false,
					platform2: false,
				},
				0,
				0,
			);
			addPlatform(map, Platform.UP, 0, 0);
			expect(trackAt(map, 0, 0).getPlatform1()).toBe(true);
		});
	});

	describe("No-op cases", () => {
		it("empty coordinate does not raise an error", () => {
			const map = new Map_();
			expect(() => addPlatform(map, Platform.UP, 999, 999)).not.toThrow();
		});
	});
});

// ============================================================================
// addLevelCrossing
// ============================================================================

describe("addLevelCrossing", () => {
	it("adds level crossing to straight track without platform", () => {
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
		addLevelCrossing(map, 0, 0);
		expect(trackAt(map, 0, 0).hasLevelCrossing()).toBe(true);
	});

	it("rejected when track already has a platform", () => {
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
		trackAt(map, 0, 0).setPlatform1(true);
		addLevelCrossing(map, 0, 0);
		expect(trackAt(map, 0, 0).hasLevelCrossing()).toBe(false);
	});

	it("rejected when track already has a level crossing", () => {
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
		trackAt(map, 0, 0).addLevelCrossing();
		addLevelCrossing(map, 0, 0); // already has one
		expect(trackAt(map, 0, 0).hasLevelCrossing()).toBe(true);
	});

	it("does nothing on non-StraightTrack (e.g., CurvedTrack)", () => {
		const map = new Map_();
		map.addTrack({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
		expect(() => addLevelCrossing(map, 0, 0)).not.toThrow();
		// CurvedTrack doesn't have levelCrossing at all
	});

	it("empty coordinate does not raise an error", () => {
		const map = new Map_();
		expect(() => addLevelCrossing(map, 999, 999)).not.toThrow();
	});
});

// ============================================================================
// removePlatform
// ============================================================================

function addStraightH(map: Map_, x: number, y: number): void {
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
}

describe("removePlatform", () => {
	it("clears both platforms and returns true", () => {
		const map = new Map_();
		addStraightH(map, 0, 0);
		const track = trackAt(map, 0, 0);
		track.setPlatform1(true);
		track.setPlatform2(true);
		expect(removePlatform(map, 0, 0)).toBe(true);
		expect(track.getPlatform1()).toBe(false);
		expect(track.getPlatform2()).toBe(false);
	});

	it("returns false when the track has no platform", () => {
		const map = new Map_();
		addStraightH(map, 0, 0);
		expect(removePlatform(map, 0, 0)).toBe(false);
	});

	it("returns false at an empty coordinate", () => {
		const map = new Map_();
		expect(removePlatform(map, 999, 999)).toBe(false);
	});

	it("unlinks shared text but keeps the Text and adjacent sharer named", () => {
		const map = new Map_();
		map.setImageSize(1); // match integer-grid storage for neighbor propagation
		addStraightH(map, 0, 0);
		addStraightH(map, 1, 0);
		trackAt(map, 0, 0).setPlatform1(true);
		trackAt(map, 1, 0).setPlatform1(true);
		// Names (0,0) and flood-fills to the adjacent platform track (1,0).
		map.createAddLinkText(0, 0, "Platform A", true, FONT);
		expect(trackAt(map, 0, 0).getNamed()).toBe(true);
		expect(trackAt(map, 1, 0).getNamed()).toBe(true);

		expect(removePlatform(map, 0, 0)).toBe(true);
		expect(trackAt(map, 0, 0).getNamed()).toBe(false);
		// The Text survives (still referenced by the adjacent sharer).
		expect(map.getTextList().length).toBe(1);
		expect(trackAt(map, 1, 0).getNamed()).toBe(true);
	});

	it("keeps text on a named bridge/underpass after removePlatform", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "bridgeUnderpass",
				subtype: BridgeUnderpassType.BRIDGE2,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		addPlatform(map, Platform.LEFT, 0, 0);
		map.createAddLinkText(0, 0, "Bridge", true, FONT);
		expect(trackAt(map, 0, 0).getNamed()).toBe(true);

		expect(removePlatform(map, 0, 0)).toBe(true);
		// Bridge naming isn't platform-gated, so the text stays linked.
		expect(trackAt(map, 0, 0).getNamed()).toBe(true);
	});
});

// ============================================================================
// removeLevelCrossing
// ============================================================================

describe("removeLevelCrossing", () => {
	it("removes an existing level crossing and returns true", () => {
		const map = new Map_();
		addStraightH(map, 0, 0);
		trackAt(map, 0, 0).addLevelCrossing();
		expect(removeLevelCrossing(map, 0, 0)).toBe(true);
		expect(trackAt(map, 0, 0).hasLevelCrossing()).toBe(false);
	});

	it("returns false when there is no level crossing", () => {
		const map = new Map_();
		addStraightH(map, 0, 0);
		expect(removeLevelCrossing(map, 0, 0)).toBe(false);
	});

	it("returns false at an empty coordinate", () => {
		const map = new Map_();
		expect(removeLevelCrossing(map, 999, 999)).toBe(false);
	});
});
