import { describe, expect, it } from "vitest";
import { Text } from "../element";
import {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	ParapetType,
	SignalType,
	StraightType,
	SwitchType,
} from "../enums";
import { Map_ } from "../map";
import type { FontInfo, MessageCallback, TextSelectionPrompt } from "../types";

const testFont: FontInfo = { family: "Arial", pointSize: 12 };

// ============================================================================
// Initial state
// ============================================================================

describe("Map initial state", () => {
	it("imageSize defaults to 16", () => {
		const map = new Map_();
		expect(map.getImageSize()).toBe(16);
	});

	it("totalTrack defaults to 0", () => {
		const map = new Map_();
		expect(map.getTotalTrack()).toBe(0);
	});

	it("all element lists are empty", () => {
		const map = new Map_();
		expect(map.getTracksOfKind("straight")).toEqual([]);
		expect(map.getTracksOfKind("directed")).toEqual([]);
		expect(map.getTracksOfKind("curved")).toEqual([]);
		expect(map.getTracksOfKind("linked")).toEqual([]);
		expect(map.getTracksOfKind("exit")).toEqual([]);
		expect(map.getTracksOfKind("buffer")).toEqual([]);
		expect(map.getTracksOfKind("signal")).toEqual([]);
		expect(map.getTracksOfKind("bridgeUnderpass")).toEqual([]);
		expect(map.getTracksOfKind("switch")).toEqual([]);
		expect(map.getTracksOfKind("crossover")).toEqual([]);
		expect(map.getTracksOfKind("flyover")).toEqual([]);
		expect(map.getNamedLocationList()).toEqual([]);
		expect(map.getConcourseList()).toEqual([]);
		expect(map.getParapetList()).toEqual([]);
		expect(map.getTextList()).toEqual([]);
	});

	it("linkedTrack1/2 are null", () => {
		const map = new Map_();
		expect(map.getLinkedTrack1()).toBeNull();
		expect(map.getLinkedTrack2()).toBeNull();
	});

	it("textToMove is null", () => {
		const map = new Map_();
		expect(map.getTextToMove()).toBeNull();
	});

	it("callbacks are null when not provided", () => {
		const map = new Map_();
		expect(map.getTextSelectionPrompt()).toBeNull();
		expect(map.getOnMessage()).toBeNull();
	});
});

// ============================================================================
// General
// ============================================================================

describe("setImageSize", () => {
	it("updates image size", () => {
		const map = new Map_();
		map.setImageSize(32);
		expect(map.getImageSize()).toBe(32);
	});
});

// ============================================================================
// CRUD - StraightTrack (via unified addTrack)
// ============================================================================

describe("StraightTrack CRUD", () => {
	it("addTrack with 'straight' adds to list", () => {
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
		expect(map.getTracksOfKind("straight")).toHaveLength(1);
	});

	it("getTrackAt returns the track after add", () => {
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
		const track = map.getTrackAt(0, 0);
		expect(track).not.toBeNull();
		expect(track!.data.subtype).toBe(StraightType.STRAIGHTH);
	});

	it("hasTrackAt returns false for empty coord", () => {
		const map = new Map_();
		expect(map.hasTrackAt(10, 10)).toBe(false);
	});

	it("checkElementExists returns true after add", () => {
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
		expect(map.checkElementExists(0, 0)).toBe(true);
	});

	it("totalTrack increments after add", () => {
		const map = new Map_();
		expect(map.getTotalTrack()).toBe(0);
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
		expect(map.getTotalTrack()).toBe(1);
	});

	it("adding at occupied coordinate is silently ignored", () => {
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
			0,
		);
		expect(map.getTracksOfKind("straight")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});
});

// ============================================================================
// CRUD - all track types compact (via unified addTrack + getTracksOfKind)
// ============================================================================

describe("Track type CRUD (all 11 types)", () => {
	it("addTrack with 'directed' adds to directed list and increments totalTrack", () => {
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
		expect(map.getTracksOfKind("directed")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
		expect(map.hasTrackAt(0, 0)).toBe(true);
	});

	it("addTrack with 'curved' adds to curved list", () => {
		const map = new Map_();
		map.addTrack({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
		expect(map.getTracksOfKind("curved")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
		expect(map.hasTrackAt(0, 0)).toBe(true);
	});

	it("addTrack with 'linked' adds to linked list", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		expect(map.getTracksOfKind("linked")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
		expect(map.hasTrackAt(0, 0)).toBe(true);
	});

	it("addTrack with 'exit' adds to exit list", () => {
		const map = new Map_();
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, 0, 0);
		expect(map.getTracksOfKind("exit")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
		expect(map.hasTrackAt(0, 0)).toBe(true);
	});

	it("addTrack with 'buffer' adds to buffer list", () => {
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
		expect(map.getTracksOfKind("buffer")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});

	it("addTrack with 'signal' adds to signal list", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "signal",
				subtype: SignalType.SIGNALLEFT,
				aspect: 2,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		expect(map.getTracksOfKind("signal")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});

	it("addTrack with 'bridgeUnderpass' adds to bridge list", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "bridgeUnderpass",
				subtype: BridgeUnderpassType.BRIDGE1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		expect(map.getTracksOfKind("bridgeUnderpass")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});

	it("addTrack with 'switch' adds to switch list", () => {
		const map = new Map_();
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCH1,
				platform1: false,
				platform2: false,
			},
			0,
			0,
		);
		expect(map.getTracksOfKind("switch")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});

	it("addTrack with 'crossover' adds to crossover list", () => {
		const map = new Map_();
		map.addTrack(
			{ kind: "crossover", subtype: CrossoverType.CROSSOVER1 },
			0,
			0,
		);
		expect(map.getTracksOfKind("crossover")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});

	it("addTrack with 'flyover' adds to flyover list", () => {
		const map = new Map_();
		map.addTrack({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 0, 0);
		expect(map.getTracksOfKind("flyover")).toHaveLength(1);
		expect(map.getTotalTrack()).toBe(1);
	});
});

// ============================================================================
// CRUD - NamedLocation, Concourse, Parapet
// ============================================================================

describe("Non-track element CRUD", () => {
	it("createAddNamedLocation adds to namedLocationList (on empty coord)", () => {
		const map = new Map_();
		map.createAddNamedLocation(0, 0);
		expect(map.getNamedLocationList()).toHaveLength(1);
	});

	it("createAddConcourse adds to concourseList", () => {
		const map = new Map_();
		map.createAddConcourse(0, 0);
		expect(map.getConcourseList()).toHaveLength(1);
	});

	it("createAddParapet adds to parapetList", () => {
		const map = new Map_();
		map.createAddParapet(ParapetType.PARAPET1, 0, 0);
		expect(map.getParapetList()).toHaveLength(1);
	});

	it("non-track elements do NOT increment totalTrack", () => {
		const map = new Map_();
		map.createAddConcourse(0, 0);
		map.createAddParapet(ParapetType.PARAPET1, 16, 0);
		expect(map.getTotalTrack()).toBe(0);
	});
});

// ============================================================================
// existence checks
// ============================================================================

describe("Existence guards", () => {
	it("checkElementExists on empty coord returns false", () => {
		const map = new Map_();
		expect(map.checkElementExists(100, 100)).toBe(false);
	});

	it("checkCanAddNamedLocation on empty coord returns true", () => {
		const map = new Map_();
		expect(map.checkCanAddNamedLocation(100, 100)).toBe(true);
	});

	it("checkCanAddNamedLocation on STRAIGHTH returns true", () => {
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
		expect(map.checkCanAddNamedLocation(0, 0)).toBe(true);
	});

	it("checkCanAddNamedLocation on STRAIGHTH with platform returns false", () => {
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
		const track = map.getTrackAt(0, 0)!;
		track.setPlatform1(true);
		expect(map.checkCanAddNamedLocation(0, 0)).toBe(false);
	});

	it("checkCanAddNamedLocation on angled straight returns false", () => {
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
		expect(map.checkCanAddNamedLocation(0, 0)).toBe(false);
	});
});

// ============================================================================
// makeTrackList / getTrackList
// ============================================================================

describe("makeTrackList / getTrackList", () => {
	it("empty map produces empty trackList", () => {
		const map = new Map_();
		map.makeTrackList();
		expect(map.getTrackList()).toEqual([]);
	});

	it("one of each track type produces 11 items", () => {
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
				kind: "directed",
				subtype: DirectedType.DIRECTEDLEFT,
				platform1: false,
				platform2: false,
			},
			16,
			0,
		);
		map.addTrack({ kind: "curved", subtype: CurvedType.CURVE1 }, 32, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 48, 0);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, 64, 0);
		map.addTrack(
			{
				kind: "buffer",
				subtype: BufferType.BUFFERLEFT,
				platform1: false,
				platform2: false,
			},
			80,
			0,
		);
		map.addTrack(
			{
				kind: "signal",
				subtype: SignalType.SIGNALLEFT,
				aspect: 2,
				platform1: false,
				platform2: false,
			},
			96,
			0,
		);
		map.addTrack(
			{
				kind: "bridgeUnderpass",
				subtype: BridgeUnderpassType.BRIDGE1,
				platform1: false,
				platform2: false,
			},
			112,
			0,
		);
		map.addTrack(
			{
				kind: "switch",
				subtype: SwitchType.SWITCH1,
				platform1: false,
				platform2: false,
			},
			128,
			0,
		);
		map.addTrack(
			{ kind: "crossover", subtype: CrossoverType.CROSSOVER1 },
			144,
			0,
		);
		map.addTrack({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 160, 0);
		map.makeTrackList();
		expect(map.getTrackList()).toHaveLength(11);
	});
});

// ============================================================================
// LinkedTrack state machine
// ============================================================================

describe("LinkedTrack state machine", () => {
	it("connectTwoLinkedTracks: first click sets linkedTrack1", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		expect(map.getLinkedTrack1()).not.toBeNull();
		expect(map.getLinkedTrack2()).toBeNull();
	});

	it("connectTwoLinkedTracks: second click pairs them", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const a = map.getTrackAt(0, 0)!;
		const b = map.getTrackAt(16, 0)!;
		expect(a.isLinked()).toBe(true);
		expect(b.isLinked()).toBe(true);
	});

	it("connectTwoLinkedTracks: same location twice is no-op", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(0, 0); // same location
		// Second click: temp2 === linkedTrack1, so the if block does not execute
		// linkedTrack1 remains set, linkedTrack2 remains null
		expect(map.getLinkedTrack1()).not.toBeNull();
		expect(map.getLinkedTrack2()).toBeNull();
	});

	it("connectTwoLinkedTracks: re-pairing clears both sides of each old link", () => {
		const map = new Map_();
		// Two established pairs: A↔X and B↔Y.
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0); // A
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0); // X
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 16); // B
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 16); // Y
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		map.connectTwoLinkedTracks(0, 16);
		map.connectTwoLinkedTracks(16, 16);

		const a = map.getTrackAt(0, 0)!;
		const x = map.getTrackAt(16, 0)!;
		const b = map.getTrackAt(0, 16)!;
		const y = map.getTrackAt(16, 16)!;
		expect(a.getOtherLinkedTrack()).toBe(x);
		expect(b.getOtherLinkedTrack()).toBe(y);

		// Now pair A with B, across the two existing pairs.
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(0, 16);

		// The new link exists both ways...
		expect(a.getOtherLinkedTrack()).toBe(b);
		expect(b.getOtherLinkedTrack()).toBe(a);
		// ...and neither orphan is left pointing at its old partner, which would
		// otherwise leave a one-way link that reads as paired from one end only.
		expect(x.isLinked()).toBe(false);
		expect(y.isLinked()).toBe(false);
		expect(x.getOtherLinkedTrack()).toBeNull();
		expect(y.getOtherLinkedTrack()).toBeNull();
	});

	it("connectTwoLinkedTracks: re-pairing the same two portals is a no-op", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);

		// Disconnecting the clicked track also clears its partner, so the second
		// disconnect must not fire on an already-cleared linkedTrack1.
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);

		const a = map.getTrackAt(0, 0)!;
		const b = map.getTrackAt(16, 0)!;
		expect(a.getOtherLinkedTrack()).toBe(b);
		expect(b.getOtherLinkedTrack()).toBe(a);
	});

	it("connectTwoLinkedTracks: pairing a used portal with a free one orphans only the old partner", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0); // A
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0); // X
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 16); // B (free)
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);

		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(0, 16);

		const a = map.getTrackAt(0, 0)!;
		const x = map.getTrackAt(16, 0)!;
		const b = map.getTrackAt(0, 16)!;
		expect(a.getOtherLinkedTrack()).toBe(b);
		expect(b.getOtherLinkedTrack()).toBe(a);
		expect(x.isLinked()).toBe(false);
	});

	it("checkAllLinkedTrackLinked: empty list returns true", () => {
		const map = new Map_();
		expect(map.checkAllLinkedTrackLinked()).toBe(true);
	});

	it("checkAllLinkedTrackLinked: odd count returns false", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		expect(map.checkAllLinkedTrackLinked()).toBe(false);
	});

	it("checkAllLinkedTrackLinked: even unlinked returns false", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		expect(map.checkAllLinkedTrackLinked()).toBe(false);
	});

	it("checkAllLinkedTrackLinked: even all linked returns true", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		expect(map.checkAllLinkedTrackLinked()).toBe(true);
	});
});

// ============================================================================
// deleteElement
// ============================================================================

describe("deleteElement", () => {
	it("deletes track from list and decrements totalTrack", () => {
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
		expect(map.getTotalTrack()).toBe(1);
		expect(map.deleteElement(0, 0)).toBe(true);
		expect(map.getTotalTrack()).toBe(0);
		expect(map.getTracksOfKind("straight")).toHaveLength(0);
	});

	it("deletes NamedLocation", () => {
		const map = new Map_();
		map.createAddNamedLocation(0, 0);
		expect(map.deleteElement(0, 0)).toBe(true);
		expect(map.getNamedLocationList()).toHaveLength(0);
	});

	it("deletes Concourse", () => {
		const map = new Map_();
		map.createAddConcourse(0, 0);
		expect(map.deleteElement(0, 0)).toBe(true);
		expect(map.getConcourseList()).toHaveLength(0);
	});

	it("deletes Parapet", () => {
		const map = new Map_();
		map.createAddParapet(ParapetType.PARAPET1, 0, 0);
		expect(map.deleteElement(0, 0)).toBe(true);
		expect(map.getParapetList()).toHaveLength(0);
	});

	it("returns false for empty coordinate", () => {
		const map = new Map_();
		expect(map.deleteElement(999, 999)).toBe(false);
	});

	it("deleting linked track disconnects the pair", () => {
		const map = new Map_();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(16, 0);
		const b = map.getTrackAt(16, 0)!;
		expect(b.isLinked()).toBe(true);
		map.deleteElement(0, 0);
		expect(b.isLinked()).toBe(false);
	});

	it("deleting a NamedLocation restores the track it displaced", () => {
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
		const track = map.getTrackAt(0, 0)!;
		map.createAddNamedLocation(0, 0);
		// The NamedLocation takes the coordinate slot while the track stays in
		// tracksByKind, so the track is unreachable by coordinate until deleted.
		expect(map.getNamedLocationAt(0, 0)).not.toBeNull();
		expect(map.getTrackAt(0, 0)).toBeNull();

		expect(map.deleteElement(0, 0)).toBe(true);

		expect(map.getNamedLocationAt(0, 0)).toBeNull();
		expect(map.getNamedLocationList()).toHaveLength(0);
		// The same object, back in the spatial index — not orphaned in tracksByKind.
		expect(map.getTrackAt(0, 0)).toBe(track);
		expect(map.getTotalTrack()).toBe(1);
		expect(track.getLinkedNamedLocation()).toBeNull();
	});

	it("deleteElement cascades text cleanup for named tracks", () => {
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
		const track = map.getTrackAt(0, 0)!;
		const text = map.createAddText(0, 0, "Platform A", testFont);
		track.setText(text);
		expect(map.getTextList()).toHaveLength(1);
		map.deleteElement(0, 0);
		// The text should be removed from all elements and deleted
		expect(map.getTextList()).toHaveLength(0);
	});
});

// ============================================================================
// Text CRUD
// ============================================================================

describe("Text CRUD", () => {
	it("createAddText adds to textList and returns Text", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Station", testFont);
		expect(text).toBeInstanceOf(Text);
		expect(map.getTextList()).toHaveLength(1);
		expect(text.getReadableText()).toBe("Station");
	});

	it("createAddLinkText: empty string does nothing", () => {
		const map = new Map_();
		map.createAddLinkText(0, 0, "", true, testFont);
		expect(map.getTextList()).toHaveLength(0);
	});

	it("createAddLinkText: leading space string treated as empty", () => {
		const map = new Map_();
		map.createAddLinkText(0, 0, " test", true, testFont);
		expect(map.getTextList()).toHaveLength(0);
	});

	it("createAddLinkText: non-empty creates text", () => {
		const map = new Map_();
		map.createAddLinkText(0, 0, "Platform A", true, testFont);
		expect(map.getTextList()).toHaveLength(1);
	});

	it("setTextToMove finds text and sets textToMove", () => {
		const map = new Map_();
		map.createAddText(0, 0, "Station", testFont);
		const result = map.setTextToMove(0, 0);
		expect(result).toBe(true);
		expect(map.getTextToMove()).not.toBeNull();
	});

	it("setTextToMove returns false when no text at coordinate", () => {
		const map = new Map_();
		const result = map.setTextToMove(100, 100);
		expect(result).toBe(false);
		expect(map.getTextToMove()).toBeNull();
	});

	it("moveText updates location and editable offsets", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Station", testFont);
		map.setTextToMove(0, 0);
		map.moveText(50, 50);
		expect(text.getLocationX()).toBe(50);
		expect(text.getLocationY()).toBe(50);
		expect(text.getEditableX()).toBe(62); // 50 + fontSize(12)
		expect(text.getEditableY()).toBe(62);
	});

	it("deleteText removes from textList", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Station", testFont);
		expect(map.getTextList()).toHaveLength(1);
		map.deleteText(text);
		expect(map.getTextList()).toHaveLength(0);
	});

	it("deleteText returns false for text not in list", () => {
		const map = new Map_();
		const text = new Text(0, 0, "orphan", testFont);
		expect(map.deleteText(text)).toBe(false);
	});
});

// ============================================================================
// Callback injection
// ============================================================================

describe("Callback injection", () => {
	it("constructor stores textSelectionPrompt callback", () => {
		const prompt: TextSelectionPrompt = () => "selected";
		const map = new Map_({ textSelectionPrompt: prompt });
		expect(map.getTextSelectionPrompt()).toBe(prompt);
	});

	it("constructor stores onMessage callback", () => {
		const onMsg: MessageCallback = () => {};
		const map = new Map_({ onMessage: onMsg });
		expect(map.getOnMessage()).toBe(onMsg);
	});

	it("callbacks are null when not provided", () => {
		const map = new Map_();
		expect(map.getTextSelectionPrompt()).toBeNull();
		expect(map.getOnMessage()).toBeNull();
	});
});

// ============================================================================
// Unified lookups
// ============================================================================

describe("Unified lookups", () => {
	it("getTrackAt returns null for empty map", () => {
		const map = new Map_();
		expect(map.getTrackAt(0, 0)).toBeNull();
	});

	it("getTrackAt finds any track type", () => {
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
		map.addTrack({ kind: "curved", subtype: CurvedType.CURVE1 }, 16, 0);
		expect(map.getTrackAt(0, 0)).not.toBeNull();
		expect(map.getTrackAt(16, 0)).not.toBeNull();
	});

	it("hasTrackAt returns correct boolean", () => {
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
		expect(map.hasTrackAt(0, 0)).toBe(true);
		expect(map.hasTrackAt(16, 0)).toBe(false);
	});

	it("getElementAt returns track at coordinate", () => {
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
		const el = map.getElementAt(0, 0);
		expect(el).not.toBeNull();
		expect(el!.locationToString()).toBe("0,0");
	});

	it("getElementAt returns non-track element", () => {
		const map = new Map_();
		map.createAddConcourse(0, 0);
		const el = map.getElementAt(0, 0);
		expect(el).not.toBeNull();
	});

	it("hasElementAt returns correct boolean", () => {
		const map = new Map_();
		expect(map.hasElementAt(0, 0)).toBe(false);
		map.createAddConcourse(0, 0);
		expect(map.hasElementAt(0, 0)).toBe(true);
	});

	it("getTrackHasPlatformAt returns platform-capable tracks", () => {
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
		map.addTrack({ kind: "curved", subtype: CurvedType.CURVE1 }, 16, 0);
		expect(map.getTrackHasPlatformAt(0, 0)).not.toBeNull();
		expect(map.getTrackHasPlatformAt(16, 0)).toBeNull(); // curved has no platforms
	});
});

// ============================================================================
// Save string methods
// ============================================================================

describe("List to save string methods", () => {
	it("tracksToSaveStrings returns save strings grouped by kind", () => {
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
		const all = map.tracksToSaveStrings();
		const straightResult = all.get("straight")!;
		expect(straightResult).toContain("SH,0,0,200,100,0,0,0");
		expect(straightResult).toContain("\n");
	});

	it("textListToSaveString returns joined text save strings", () => {
		const map = new Map_();
		map.createAddText(0, 0, "A", testFont);
		map.createAddText(16, 0, "B", testFont);
		const result = map.textListToSaveString();
		expect(result).toContain("0,0,A,Arial,12");
		expect(result).toContain("\n");
	});
});
