import { describe, expect, it } from "vitest";
import { SignalAspect } from "../track/signal-aspects";
import { KIND_META, kindToLabel, type TrackKind } from "../track/track-data";
import {
	aspectToLabel,
	kindToPhrase,
	kindToShortLabel,
	subtypeWithAspect,
} from "../track/track-labels";

const ALL_KINDS = Object.keys(KIND_META) as TrackKind[];

describe("track kind labels", () => {
	it("covers every track kind", () => {
		// KIND_META is the roster of kinds, so a kind added there without a
		// label here would otherwise reach the UI as `undefined`.
		for (const kind of ALL_KINDS) {
			expect(kindToShortLabel(kind), kind).toBeTruthy();
			expect(kindToPhrase(kind), kind).toBeTruthy();
		}
	});

	it("never leaks the serializer's class-style names", () => {
		// The whole point of this table: `kindToLabel` feeds toString and the
		// save format, and its wording must not be what the user reads.
		for (const kind of ALL_KINDS) {
			expect(kindToShortLabel(kind), kind).not.toBe(kindToLabel(kind));
			expect(kindToShortLabel(kind), kind).not.toMatch(/Track$/);
		}
	});

	it("gives each kind a distinct short label", () => {
		const labels = ALL_KINDS.map(kindToShortLabel);
		expect(new Set(labels).size).toBe(labels.length);
	});

	it("uses title case for captions and lower case for sentence phrases", () => {
		for (const kind of ALL_KINDS) {
			expect(kindToShortLabel(kind).charAt(0), kind).toBe(
				kindToShortLabel(kind).charAt(0).toUpperCase(),
			);
			// Phrases are dropped mid-sentence ("Undo add straight track"), so a
			// capital would read as a proper noun.
			expect(kindToPhrase(kind).charAt(0), kind).toBe(
				kindToPhrase(kind).charAt(0).toLowerCase(),
			);
		}
	});

	it("names the palette's own vocabulary", () => {
		expect(kindToShortLabel("straight")).toBe("Straight");
		expect(kindToShortLabel("bridgeUnderpass")).toBe("Bridge / Underpass");
		expect(kindToPhrase("straight")).toBe("straight track");
		expect(kindToPhrase("switch")).toBe("switch");
	});
});

describe("aspectToLabel", () => {
	it("labels each aspect capability", () => {
		expect(aspectToLabel(SignalAspect.FOUR_ASPECT)).toBe("4-aspect");
		expect(aspectToLabel(SignalAspect.THREE_ASPECT)).toBe("3-aspect");
		expect(aspectToLabel(SignalAspect.TWO_ASPECT)).toBe("2-aspect");
		expect(aspectToLabel(SignalAspect.SHUNT)).toBe("Shunt");
	});

	it("falls back to the raw count for a value outside the enum", () => {
		// A hand-edited save file can carry one; the tooltip should still render.
		expect(aspectToLabel(7)).toBe("7-aspect");
	});
});

describe("subtypeWithAspect", () => {
	it("leaves a subtype alone when no aspect applies", () => {
		expect(subtypeWithAspect("STRAIGHTH")).toBe("STRAIGHTH");
	});

	it("names the aspect that is actually selected", () => {
		// The bug this replaces tested `aspect` for truthiness, and every
		// aspect value is truthy, so all four claimed "(shunt)".
		expect(subtypeWithAspect("SIGNALLEFT", SignalAspect.FOUR_ASPECT)).toBe(
			"SIGNALLEFT (4-aspect)",
		);
		expect(subtypeWithAspect("SIGNALLEFT", SignalAspect.THREE_ASPECT)).toBe(
			"SIGNALLEFT (3-aspect)",
		);
		expect(subtypeWithAspect("SIGNALLEFT", SignalAspect.TWO_ASPECT)).toBe(
			"SIGNALLEFT (2-aspect)",
		);
		expect(subtypeWithAspect("SIGNALLEFT", SignalAspect.SHUNT)).toBe(
			"SIGNALLEFT (Shunt)",
		);
	});

	it("calls only the shunt aspect shunt", () => {
		const nonShunt = [
			SignalAspect.FOUR_ASPECT,
			SignalAspect.THREE_ASPECT,
			SignalAspect.TWO_ASPECT,
		];
		for (const aspect of nonShunt) {
			expect(
				subtypeWithAspect("SIGNALLEFT", aspect).toLowerCase(),
				String(aspect),
			).not.toContain("shunt");
		}
	});
});
