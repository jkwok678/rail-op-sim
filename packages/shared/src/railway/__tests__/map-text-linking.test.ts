import { describe, expect, it } from "vitest";
import { Text } from "../element";
import { Platform, StraightType } from "../enums";
import { Map_ } from "../map";
import { addPlatform } from "../map/map-platform";
import {
	changeDeleteText,
	deleteTextFromAllElements,
	linkLocalText,
} from "../map/map-text-linking";
import type { FontInfo } from "../types";

const testFont: FontInfo = { family: "Arial", pointSize: 12 };

// ============================================================================
// linkLocalText
// ============================================================================

describe("linkLocalText", () => {
	it("links Text to a track that has a platform", () => {
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
		// Track needs a platform before linkLocalText will link text to it
		addPlatform(map, Platform.UP, 0, 0);
		const text = new Text(0, 0, "Platform A", testFont);
		linkLocalText(map, 0, 0, text);
		const track = map.getTrackAt(0, 0)!;
		expect(track.getText()).toBe(text);
		expect(track.getNamed()).toBe(true);
	});

	it("does not link to a track without a platform", () => {
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
		const text = new Text(0, 0, "Platform A", testFont);
		linkLocalText(map, 0, 0, text);
		const track = map.getTrackAt(0, 0)!;
		expect(track.getNamed()).toBe(false);
	});

	it("links to Concourse", () => {
		const map = new Map_();
		map.createAddConcourse(0, 0);
		const text = new Text(0, 0, "Station", testFont);
		linkLocalText(map, 0, 0, text);
		const concourse = map.getConcourseAt(0, 0)!;
		expect(concourse.getNamed()).toBe(true);
	});

	it("links to NamedLocation", () => {
		const map = new Map_();
		map.createAddNamedLocation(0, 0);
		const text = new Text(0, 0, "City", testFont);
		linkLocalText(map, 0, 0, text);
		const nl = map.getNamedLocationAt(0, 0)!;
		expect(nl.getNamed()).toBe(true);
	});

	it("does nothing at empty coordinate", () => {
		const map = new Map_();
		const text = new Text(0, 0, "Orphan", testFont);
		expect(() => linkLocalText(map, 999, 999, text)).not.toThrow();
	});
});

// ============================================================================
// deleteTextFromAllElements
// ============================================================================

describe("deleteTextFromAllElements", () => {
	it("removes text reference from all named elements", () => {
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
		const text = new Text(0, 0, "Platform A", testFont);
		map.getTrackAt(0, 0)!.setText(text);

		map.createAddConcourse(16, 0);
		map.getConcourseAt(16, 0)!.setText(text);

		deleteTextFromAllElements(map, text);

		expect(map.getTrackAt(0, 0)!.getText()).toBeNull();
		expect(map.getConcourseAt(16, 0)!.getText()).toBeNull();
	});

	it("does nothing when text is not referenced anywhere", () => {
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
		const text = new Text(0, 0, "Unused", testFont);
		expect(() => deleteTextFromAllElements(map, text)).not.toThrow();
	});
});

// ============================================================================
// changeDeleteText
// ============================================================================

describe("changeDeleteText", () => {
	it("updates text when non-empty and ok=true", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Original", testFont);
		changeDeleteText(map, "Updated Name", true, text);
		expect(text.getReadableText()).toBe("Updated Name");
		expect(map.getTextList()).toHaveLength(1);
	});

	it("deletes text from map when ok=false", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Original", testFont);
		changeDeleteText(map, "New Name", false, text);
		// Not confirmed -> deletes text
		expect(map.getTextList()).toHaveLength(0);
	});

	it("deletes text from map when string is empty", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Original", testFont);
		changeDeleteText(map, "", true, text);
		expect(map.getTextList()).toHaveLength(0);
	});

	it("deletes text from map when string starts with space", () => {
		const map = new Map_();
		const text = map.createAddText(0, 0, "Original", testFont);
		changeDeleteText(map, " test", true, text);
		expect(map.getTextList()).toHaveLength(0);
	});

	it("removes text from all referencing elements when deleting", () => {
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
		const text = map.createAddText(0, 0, "Platform A", testFont);
		map.getTrackAt(0, 0)!.setText(text);

		changeDeleteText(map, "", true, text);
		expect(map.getTrackAt(0, 0)!.getText()).toBeNull();
	});
});

// ============================================================================
// createAddLinkText — multi-cell spread for NamedLocation
// ============================================================================

describe("createAddLinkText — NamedLocation multi-cell spread", () => {
	it("spreads to adjacent unnamed NamedLocations via createAddLinkText", () => {
		const map = new Map_();
		map.setImageSize(1); // Phase 0: match integer-grid storage

		// Place three NamedLocations in a row at (0,0), (1,0), (2,0)
		map.createAddNamedLocation(0, 0);
		map.createAddNamedLocation(1, 0);
		map.createAddNamedLocation(2, 0);

		// Name the middle one — should flood to all three
		map.createAddLinkText(1, 0, "Station", true, testFont);

		const nl0 = map.getNamedLocationAt(0, 0)!;
		const nl1 = map.getNamedLocationAt(1, 0)!;
		const nl2 = map.getNamedLocationAt(2, 0)!;

		// All three should be named
		expect(nl0.getNamed()).toBe(true);
		expect(nl1.getNamed()).toBe(true);
		expect(nl2.getNamed()).toBe(true);

		// All three share the SAME Text instance
		const t0 = nl0.getText()!;
		const t1 = nl1.getText()!;
		const t2 = nl2.getText()!;
		expect(t1).toBe(t0);
		expect(t2).toBe(t0);

		// Same readable text
		expect(t0.getReadableText()).toBe("Station");

		// Only ONE Text object was created
		expect(map.getTextList()).toHaveLength(1);
	});

	it("spreads across a 2x2 block of NamedLocations", () => {
		const map = new Map_();
		map.setImageSize(1);

		// 2x2 block
		map.createAddNamedLocation(0, 0);
		map.createAddNamedLocation(1, 0);
		map.createAddNamedLocation(0, 1);
		map.createAddNamedLocation(1, 1);

		// Name top-left — edge-connected flood should cover all four
		map.createAddLinkText(0, 0, "Depot", true, testFont);

		for (const [gx, gy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
			const nl = map.getNamedLocationAt(gx, gy)!;
			expect(nl.getNamed()).toBe(true);
			expect(nl.getText()!.getReadableText()).toBe("Depot");
			expect(nl.getText()).toBe(map.getNamedLocationAt(0, 0)!.getText());
		}

		expect(map.getTextList()).toHaveLength(1);
	});

	it("deleting shared text clears all linked NamedLocations", () => {
		const map = new Map_();
		map.setImageSize(1);

		map.createAddNamedLocation(0, 0);
		map.createAddNamedLocation(1, 0);
		map.createAddNamedLocation(2, 0);
		map.createAddLinkText(1, 0, "Ghost Town", true, testFont);

		const nl1 = map.getNamedLocationAt(1, 0)!;
		const sharedText = nl1.getText()!;

		// Delete via changeDeleteText with empty string
		changeDeleteText(map, "", true, sharedText);

		// All three should be unnamed
		for (let gx = 0; gx <= 2; gx++) {
			const nl = map.getNamedLocationAt(gx, 0)!;
			expect(nl.getNamed()).toBe(false);
			expect(nl.getText()).toBeNull();
		}

		// Text removed from map
		expect(map.getTextList()).toHaveLength(0);
	});

	it("editing shared text updates all linked NamedLocations", () => {
		const map = new Map_();
		map.setImageSize(1);

		map.createAddNamedLocation(0, 0);
		map.createAddNamedLocation(1, 0);
		map.createAddNamedLocation(2, 0);
		map.createAddLinkText(1, 0, "Old Name", true, testFont);

		const sharedText = map.getNamedLocationAt(1, 0)!.getText()!;

		// Edit the shared text
		changeDeleteText(map, "New Name", true, sharedText);

		// All three still named, now with new text
		for (let gx = 0; gx <= 2; gx++) {
			const nl = map.getNamedLocationAt(gx, 0)!;
			expect(nl.getNamed()).toBe(true);
			expect(nl.getText()).toBe(sharedText);
		}
		expect(sharedText.getReadableText()).toBe("New Name");
		expect(map.getTextList()).toHaveLength(1);
	});

	it("new adjacent NamedLocation inherits neighbor text via linkNewElementToText", () => {
		const map = new Map_();
		map.setImageSize(1);

		// Place and name two adjacent NamedLocations
		map.createAddNamedLocation(0, 0);
		map.createAddNamedLocation(1, 0);
		map.createAddLinkText(1, 0, "Hub", true, testFont);

		// Place a NEW NamedLocation adjacent to the named group
		map.createAddNamedLocation(2, 0);

		const nl2 = map.getNamedLocationAt(2, 0)!;
		// createAddNamedLocation calls linkNewElementToText -> should inherit
		expect(nl2.getNamed()).toBe(true);
		expect(nl2.getText()).toBe(map.getNamedLocationAt(1, 0)!.getText());
		expect(nl2.getText()!.getReadableText()).toBe("Hub");
	});

	it("does NOT spread to non-adjacent NamedLocations (no diagonal spread)", () => {
		const map = new Map_();
		map.setImageSize(1);

		// (1,1) is diagonally adjacent to (0,0) and (2,0) — should NOT spread
		map.createAddNamedLocation(0, 0);
		map.createAddNamedLocation(2, 0);
		map.createAddNamedLocation(1, 1);

		map.createAddLinkText(0, 0, "Diagonal", true, testFont);

		// (0,0) should be named
		expect(map.getNamedLocationAt(0, 0)!.getNamed()).toBe(true);

		// (2,0) is not cardinally adjacent to (0,0), so not linked
		expect(map.getNamedLocationAt(2, 0)!.getNamed()).toBe(false);

		// (1,1) is not cardinally adjacent to (0,0), so not linked
		expect(map.getNamedLocationAt(1, 1)!.getNamed()).toBe(false);
	});
});
