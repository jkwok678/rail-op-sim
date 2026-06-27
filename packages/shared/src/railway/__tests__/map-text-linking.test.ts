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
