import { describe, expect, it } from "vitest";
import {
	ExitType,
	LinkedType,
	ParapetType,
	SignalType,
	StraightType,
	SwitchType,
} from "../enums";
import { Map_ } from "../map";
import { deserializeMap, serializeMap } from "../map/map-serialization";
import { SignalAspect } from "../track/signal-aspects";
import type { FontInfo } from "../types";
import { defined, trackAt } from "./test-helpers";

const font: FontInfo = { family: "JetBrains Mono", pointSize: 12 };

/**
 * Build a map exercising every element type: a straight with a platform, a
 * straight with a level crossing, an *untouched* default-speed track, a signal
 * with a non-default aspect, a switch with custom section speed/length (main +
 * secondary), a wired linked-track pair, a named location, a named concourse, a
 * parapet, and a standalone text.
 */
function buildSampleMap(): Map_ {
	const map = new Map_();
	map.setImageSize(1);

	// Straight with a platform (data flags set as a load would produce them).
	map.addTrack(
		{
			kind: "straight",
			subtype: StraightType.STRAIGHTH,
			platform1: true,
			platform2: false,
			levelCrossing: false,
		},
		0,
		0,
	);

	// Straight with a level crossing.
	map.addTrack(
		{
			kind: "straight",
			subtype: StraightType.STRAIGHTH,
			platform1: false,
			platform2: false,
			levelCrossing: true,
		},
		1,
		0,
	);

	// Untouched track — left entirely at constructor defaults.
	map.addTrack(
		{
			kind: "straight",
			subtype: StraightType.STRAIGHTV,
			platform1: false,
			platform2: false,
			levelCrossing: false,
		},
		2,
		0,
	);

	// Signal with a non-default aspect + custom main speed/length.
	const signal = map.addTrack(
		{
			kind: "signal",
			subtype: SignalType.SIGNALLEFT,
			aspect: SignalAspect.THREE_ASPECT,
			platform1: false,
			platform2: false,
		},
		3,
		0,
	);
	signal.setTrackMainSpeed(90);
	signal.setTrackMainLength(45);

	// Switch with custom main + secondary speed/length (has a secondary path).
	const sw = map.addTrack(
		{
			kind: "switch",
			subtype: SwitchType.SWITCHTIGHT1,
			platform1: false,
			platform2: false,
		},
		4,
		0,
	);
	sw.setTrackMainSpeed(120);
	sw.setTrackMainLength(60);
	sw.setTrackSecondarySpeed(70);
	sw.setTrackSecondaryLength(35);

	// Linked pair, wired together.
	map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 1);
	map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 1, 1);
	map.connectTwoLinkedTracks(0, 1);
	map.connectTwoLinkedTracks(1, 1);

	// Named location + concourse (both named). Attach labels via the Text API so
	// the element→text reference (round-tripped by index) is exercised.
	map.createAddNamedLocation(5, 0);
	defined(map.getNamedLocationAt(5, 0)).setText(
		map.createAddText(5, 0, "Depot", font),
	);
	map.createAddConcourse(0, 2);
	defined(map.getConcourseAt(0, 2)).setText(
		map.createAddText(0, 2, "Main Hall", font),
	);

	// A parapet, and a standalone (unlinked) text.
	map.createAddParapet(ParapetType.PARAPET1, 1, 2);
	map.createAddText(100, 100, "Sidings", font);

	map.makeTrackList();
	return map;
}

describe("map serialization round-trip", () => {
	it("reproduces an identical map through serialize → deserialize", () => {
		const original = buildSampleMap();
		const snapshot = serializeMap(original);

		// Snapshot must survive a JSON round-trip (it is written to a file).
		const restored = new Map_();
		deserializeMap(JSON.parse(JSON.stringify(snapshot)), restored);

		// ── Counts ──
		expect(restored.getTotalTrack()).toBe(original.getTotalTrack());
		expect(restored.getImageSize()).toBe(original.getImageSize());
		expect(restored.getNamedLocationList().length).toBe(
			original.getNamedLocationList().length,
		);
		expect(restored.getConcourseList().length).toBe(
			original.getConcourseList().length,
		);
		expect(restored.getParapetList().length).toBe(
			original.getParapetList().length,
		);
		expect(restored.getTextList().length).toBe(original.getTextList().length);

		// ── Every track: identical data + full speed/length quad ──
		original.forEachTrack((t) => {
			const r = restored.getTrackAt(t.getLocationX(), t.getLocationY());
			expect(r, `track at ${t.locationToString()}`).not.toBeNull();
			if (!r) return;
			expect(r.data).toEqual(t.data);
			expect(r.getTrackMainSpeed()).toBe(t.getTrackMainSpeed());
			expect(r.getTrackMainLength()).toBe(t.getTrackMainLength());
			expect(r.getTrackSecondarySpeed()).toBe(t.getTrackSecondarySpeed());
			expect(r.getTrackSecondaryLength()).toBe(t.getTrackSecondaryLength());
		});

		// ── Untouched track kept its defaults verbatim ──
		const def = trackAt(restored, 2, 0);
		const origDef = trackAt(original, 2, 0);
		expect(def.getTrackMainSpeed()).toBe(origDef.getTrackMainSpeed());
		expect(def.getTrackMainLength()).toBe(origDef.getTrackMainLength());

		// ── Linked pair wired both directions ──
		const a = trackAt(restored, 0, 1);
		const b = trackAt(restored, 1, 1);
		expect(a.isLinked()).toBe(true);
		expect(b.isLinked()).toBe(true);
		expect(a.getOtherLinkedTrack()).toBe(b);
		expect(b.getOtherLinkedTrack()).toBe(a);

		// ── Names preserved ──
		expect(
			restored.getNamedLocationAt(5, 0)?.getText()?.getReadableText(),
		).toBe("Depot");
		expect(restored.getConcourseAt(0, 2)?.getText()?.getReadableText()).toBe(
			"Main Hall",
		);

		// ── Parapet + standalone text preserved ──
		expect(restored.getParapetAt(1, 2)?.getParapetType()).toBe(
			ParapetType.PARAPET1,
		);
		const text = restored.getTextList().find((x) => x.getLocationX() === 100);
		expect(text?.getReadableText()).toBe("Sidings");
		expect(text?.getFont()).toEqual(font);
	});

	it("clearAll empties a populated map", () => {
		const map = buildSampleMap();
		expect(map.getTotalTrack()).toBeGreaterThan(0);
		map.clearAll();
		expect(map.getTotalTrack()).toBe(0);
		expect(map.getNamedLocationList()).toEqual([]);
		expect(map.getConcourseList()).toEqual([]);
		expect(map.getParapetList()).toEqual([]);
		expect(map.getTextList()).toEqual([]);
	});

	it("keeps a named location riding on its track through a round trip", () => {
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
		map.createAddNamedLocation(0, 0);
		const loaded = new Map_();
		deserializeMap(serializeMap(map), loaded);
		const track = loaded.getTrackAt(0, 0);
		expect(track).not.toBeNull();
		expect(loaded.getNamedLocationAt(0, 0)).not.toBeNull();
		expect(track?.getLinkedNamedLocation()).toBe(
			loaded.getNamedLocationAt(0, 0),
		);
	});
});

// ============================================================================
// Preferred directions round-trip
// ============================================================================

describe("preferred directions serialization", () => {
	const addStraightH = (map: Map_, x: number) =>
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

	it("round-trips preferred-direction pairs on a complete railway", () => {
		const map = new Map_();
		map.setImageSize(1);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -1, 0);
		const t = addStraightH(map, 0);
		map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 1, 0);
		t.addPreferredDirection(3, 5);
		t.addPreferredDirection(5, 3);

		const restored = new Map_();
		deserializeMap(serializeMap(map), restored);
		expect(restored.getTrackAt(0, 0)?.getPreferredDirections()).toEqual([
			{ entry: 3, exit: 5 },
			{ entry: 5, exit: 3 },
		]);
	});

	it("drops pairs that point into empty space on load", () => {
		const map = new Map_();
		map.setImageSize(1);
		const t = addStraightH(map, 0);
		t.addPreferredDirection(3, 5);
		t.addPreferredDirection(5, 3);

		const restored = new Map_();
		deserializeMap(serializeMap(map), restored);
		expect(restored.getTrackAt(0, 0)?.getPreferredDirections()).toEqual([]);
	});

	it("omits the field when a track has no preferred directions", () => {
		const map = new Map_();
		map.setImageSize(1);
		addStraightH(map, 0);
		const s = serializeMap(map);
		expect(
			defined(s.tracks[0], "tracks[0]").preferredDirections,
		).toBeUndefined();
	});

	it("deserializes an old snapshot without the field to an empty list", () => {
		const map = new Map_();
		map.setImageSize(1);
		addStraightH(map, 0);
		const s = serializeMap(map);
		// Simulate a legacy save with no preferredDirections key.
		delete defined(s.tracks[0], "tracks[0]").preferredDirections;

		const restored = new Map_();
		deserializeMap(s, restored);
		expect(restored.getTrackAt(0, 0)?.getPreferredDirections()).toEqual([]);
	});
});
