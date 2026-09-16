import { beforeEach, describe, expect, it } from "vitest";
import {
	beginRecording,
	type EffectEntry,
	endRecording,
	isRecording,
	redoEntries,
	undoEntries,
} from "../effect-journal";
import { LinkedType, Platform, StraightType } from "../enums";
import { Map_ } from "../map";
import { type SerializedMap, serializeMap } from "../map/map-serialization";

const testFont = { family: "JetBrains Mono", pointSize: 12 };

/** Grid step of 1, matching how the app configures the map. */
function newMap(): Map_ {
	const map = new Map_();
	map.setImageSize(1);
	return map;
}

function straight(subtype: StraightType = StraightType.STRAIGHTH) {
	return {
		kind: "straight" as const,
		subtype,
		platform1: false,
		platform2: false,
		levelCrossing: false,
	};
}

/**
 * Run `edit` as a recorded command and assert it inverts exactly.
 *
 * Comparing full serializations rather than spot-checking the field the edit
 * touched is the point: a missed instrumentation point shows up as a silent,
 * partial undo, which is the failure mode that would quietly corrupt a map and
 * then save it. Returns the entries so a caller can assert on the journal size.
 */
function expectRoundTrip(map: Map_, edit: () => void): EffectEntry[] {
	const before = serializeMap(map);
	beginRecording();
	let entries: EffectEntry[];
	try {
		edit();
	} finally {
		entries = endRecording();
	}
	const after = serializeMap(map);

	undoEntries(map, entries);
	expect(serializeMap(map)).toEqual(before);

	redoEntries(map, entries);
	expect(serializeMap(map)).toEqual(after);

	// Undo again so the caller is left on the pre-edit state deterministically.
	undoEntries(map, entries);
	expect(serializeMap(map)).toEqual(before);
	return entries;
}

/** A straight run of horizontal track from (0,0) to (n-1,0). */
function buildRun(map: Map_, n: number): void {
	for (let i = 0; i < n; i++) map.addTrack(straight(), i, 0);
}

describe("effect journal — recording window", () => {
	beforeEach(() => {
		// A test that threw mid-window would leave the module recording.
		if (isRecording()) endRecording();
	});

	it("records nothing when no window is open", () => {
		const map = newMap();
		map.addTrack(straight(), 0, 0);
		expect(isRecording()).toBe(false);
	});

	it("refuses to nest windows", () => {
		beginRecording();
		expect(() => beginRecording()).toThrow(/cannot nest/);
		endRecording();
	});

	it("closes the window even when the edit throws", () => {
		const map = newMap();
		map.addTrack(straight(), 0, 0);
		beginRecording();
		try {
			map.addTrack({ ...straight(), subtype: StraightType.STRAIGHTV }, 0, 0);
		} catch {
			// ElementAlreadyExistsError — the point is the window still closes.
		}
		endRecording();
		expect(isRecording()).toBe(false);
	});
});

describe("effect journal — no-op edits record nothing", () => {
	it("re-adding an identical track", () => {
		const map = newMap();
		map.addTrack(straight(), 0, 0);
		const entries = expectRoundTrip(map, () => {
			map.addTrack(straight(), 0, 0);
		});
		expect(entries).toHaveLength(0);
	});

	it("adding a platform on a side the track cannot take", () => {
		const map = newMap();
		map.addTrack(straight(StraightType.STRAIGHTH), 0, 0);
		// A horizontal straight has no LEFT platform.
		const entries = expectRoundTrip(map, () => {
			map.addPlatform(Platform.LEFT, 0, 0);
		});
		expect(entries).toHaveLength(0);
	});

	it("the first click of a portal pairing", () => {
		const map = newMap();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 1, 0);
		const entries = expectRoundTrip(map, () => {
			map.connectTwoLinkedTracks(0, 0);
		});
		expect(entries).toHaveLength(0);
	});

	it("a level crossing on a track that cannot take one", () => {
		const map = newMap();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		const entries = expectRoundTrip(map, () => {
			map.addLevelCrossing(0, 0);
		});
		expect(entries).toHaveLength(0);
	});

	it("setting a speed to the value it already has", () => {
		const map = newMap();
		map.addTrack(straight(), 0, 0);
		const track = map.getTrackAt(0, 0);
		const entries = expectRoundTrip(map, () => {
			track?.setTrackMainSpeed(track.getTrackMainSpeed());
		});
		expect(entries).toHaveLength(0);
	});
});

describe("effect journal — placement and deletion", () => {
	it("inverts placing a track", () => {
		const map = newMap();
		expectRoundTrip(map, () => {
			map.addTrack(straight(), 0, 0);
		});
		expect(map.getTotalTrack()).toBe(0);
	});

	it("inverts deleting a track, restoring the object itself", () => {
		const map = newMap();
		buildRun(map, 2);
		const original = map.getTrackAt(0, 0);
		expectRoundTrip(map, () => {
			map.deleteElement(0, 0);
		});
		expect(map.getTrackAt(0, 0)).toBe(original);
		expect(map.getTotalTrack()).toBe(2);
	});

	it("inverts a platform placement", () => {
		const map = newMap();
		map.addTrack(straight(StraightType.STRAIGHTH), 0, 0);
		expectRoundTrip(map, () => {
			map.addPlatform(Platform.UP, 0, 0);
		});
		expect(map.getTrackAt(0, 0)?.hasPlatform()).toBe(false);
	});

	it("inverts deleting a NamedLocation that displaced a track", () => {
		const map = newMap();
		map.addTrack(straight(), 0, 0);
		const track = map.getTrackAt(0, 0);
		map.createAddNamedLocation(0, 0);
		expectRoundTrip(map, () => {
			map.deleteElement(0, 0);
		});
		// Back to the displaced arrangement: the NamedLocation holds the slot.
		expect(map.getNamedLocationAt(0, 0)).not.toBeNull();
		expect(map.getTrackAt(0, 0)).toBeNull();
		expect(track?.getLinkedNamedLocation()).not.toBeNull();
	});
});

describe("effect journal — cascades", () => {
	it("restores a portal pair broken by deleting one half", () => {
		const map = newMap();
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
		map.addTrack({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 5, 0);
		map.connectTwoLinkedTracks(0, 0);
		map.connectTwoLinkedTracks(5, 0);
		const partner = map.getTrackAt(5, 0);
		expect(partner?.isLinked()).toBe(true);

		expectRoundTrip(map, () => {
			map.deleteElement(0, 0);
		});

		// Both sides of the pair are wired again, to the original objects.
		expect(partner?.isLinked()).toBe(true);
		expect(partner?.getOtherLinkedTrack()).toBe(map.getTrackAt(0, 0));
		expect(map.getTrackAt(0, 0)?.getOtherLinkedTrack()).toBe(partner);
	});

	it("restores a shared Text and every element that referenced it", () => {
		const map = newMap();
		buildRun(map, 3);
		for (let i = 0; i < 3; i++) map.addPlatform(Platform.UP, i, 0);
		map.createAddLinkText(0, 0, "Platform A", true, testFont);

		const shared = map.getTrackAt(0, 0)?.getText();
		expect(shared).toBeTruthy();
		// The flood fill reached the neighbours by reference, not by copy.
		const namedBefore = [0, 1, 2].filter(
			(i) => map.getTrackAt(i, 0)?.getText() === shared,
		);
		expect(namedBefore.length).toBeGreaterThan(1);

		expectRoundTrip(map, () => {
			map.deleteElement(0, 0);
		});

		expect(map.getTextList()).toHaveLength(1);
		expect(map.getTextList()[0]).toBe(shared);
		for (const i of namedBefore) {
			expect(map.getTrackAt(i, 0)?.getText()).toBe(shared);
		}
	});

	it("inverts a naming flood fill across neighbours", () => {
		const map = newMap();
		buildRun(map, 3);
		for (let i = 0; i < 3; i++) map.addPlatform(Platform.UP, i, 0);

		expectRoundTrip(map, () => {
			map.createAddLinkText(0, 0, "Platform A", true, testFont);
		});

		// Undo cleared exactly what the fill set, leaving no orphan label behind.
		expect(map.getTextList()).toHaveLength(0);
		for (let i = 0; i < 3; i++) {
			expect(map.getTrackAt(i, 0)?.getNamed()).toBe(false);
		}
	});

	it("restores preferred directions pruned on other tracks by a delete", () => {
		const map = newMap();
		buildRun(map, 3);
		const middle = map.getTrackAt(1, 0);
		// A route running left-to-right through the middle cell.
		expect(middle?.addPreferredDirection(3, 5)).toBe(true);
		expect(middle?.getPreferredDirections()).toHaveLength(1);

		// Deleting the neighbour makes that pair invalid, so revalidation prunes
		// it from a track the delete never named.
		expectRoundTrip(map, () => {
			map.deleteElement(2, 0);
		});

		expect(map.getTrackAt(1, 0)?.getPreferredDirections()).toHaveLength(1);
	});

	it("inverts clearing every direction on a track", () => {
		const map = newMap();
		buildRun(map, 3);
		const middle = map.getTrackAt(1, 0);
		middle?.addPreferredDirection(3, 5);
		middle?.addPreferredDirection(5, 3);
		expect(middle?.getPreferredDirections()).toHaveLength(2);

		expectRoundTrip(map, () => {
			middle?.clearPreferredDirections();
		});

		expect(middle?.getPreferredDirections()).toHaveLength(2);
	});

	it("restores direction array order, not just membership", () => {
		const map = newMap();
		buildRun(map, 3);
		const middle = map.getTrackAt(1, 0);
		middle?.addPreferredDirection(3, 5);
		middle?.addPreferredDirection(5, 3);
		const before = middle
			?.getPreferredDirections()
			.map((p) => [p.entry, p.exit]);

		expectRoundTrip(map, () => {
			// Remove the *first* pair — a naive re-add would put it back at the end.
			middle?.removePreferredDirection(3, 5);
		});

		expect(
			middle?.getPreferredDirections().map((p) => [p.entry, p.exit]),
		).toEqual(before);
	});
});

describe("effect journal — text and section edits", () => {
	it("inverts placing text", () => {
		const map = newMap();
		expectRoundTrip(map, () => {
			map.createAddText(2, 3, "Depot", testFont);
		});
		expect(map.getTextList()).toHaveLength(0);
	});

	it("inverts renaming text without replacing the object", () => {
		const map = newMap();
		const text = map.createAddText(2, 3, "Depot", testFont);
		expectRoundTrip(map, () => {
			map.changeDeleteText("Sidings", true, text);
		});
		expect(map.getTextList()[0]).toBe(text);
		expect(text.getReadableText()).toBe("Depot");
	});

	it("inverts moving text", () => {
		const map = newMap();
		const text = map.createAddText(2, 3, "Depot", testFont);
		expectRoundTrip(map, () => {
			map.setTextToMove(text);
			map.moveText(9, 9);
			map.setTextToMove(null);
		});
		expect(text.getLocationX()).toBe(2);
		expect(text.getLocationY()).toBe(3);
	});

	it("inverts a section speed and length edit", () => {
		const map = newMap();
		buildRun(map, 3);
		expectRoundTrip(map, () => {
			for (let i = 0; i < 3; i++) {
				const t = map.getTrackAt(i, 0);
				t?.setTrackMainSpeed(40);
				t?.setTrackMainLength(500);
			}
		});
		expect(map.getTrackAt(0, 0)?.getTrackMainSpeed()).not.toBe(40);
	});

	it("inverts restoring section defaults", () => {
		const map = newMap();
		buildRun(map, 2);
		for (let i = 0; i < 2; i++) {
			map.getTrackAt(i, 0)?.setTrackMainSpeed(40);
			map.getTrackAt(i, 0)?.setTrackMainLength(500);
		}
		expectRoundTrip(map, () => {
			for (let i = 0; i < 2; i++) map.getTrackAt(i, 0)?.restoreDefaults();
		});
		expect(map.getTrackAt(0, 0)?.getTrackMainSpeed()).toBe(40);
		expect(map.getTrackAt(0, 0)?.getTrackMainLength()).toBe(500);
	});
});

describe("effect journal — repeated cycles", () => {
	it("undo/redo/undo is stable over a compound edit", () => {
		const map = newMap();
		buildRun(map, 3);
		for (let i = 0; i < 3; i++) map.addPlatform(Platform.UP, i, 0);
		map.createAddLinkText(0, 0, "Platform A", true, testFont);

		const before: SerializedMap = serializeMap(map);
		beginRecording();
		map.deleteElement(1, 0);
		const entries = endRecording();
		const after = serializeMap(map);

		for (let cycle = 0; cycle < 3; cycle++) {
			undoEntries(map, entries);
			expect(serializeMap(map)).toEqual(before);
			redoEntries(map, entries);
			expect(serializeMap(map)).toEqual(after);
		}
	});
});
