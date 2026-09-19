import {
	createTrackData,
	SignalAspect,
	SignalType,
	StraightType,
	SwitchType,
	Track,
	type TrackKind,
} from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import { buildHoveredTrackInfo } from "#/lib/trackInfo";

function makeTrack(
	kind: TrackKind,
	subtype: string,
	options?: { aspect?: number },
): Track {
	return new Track(createTrackData(kind, subtype, options), 0, 0);
}

describe("buildHoveredTrackInfo", () => {
	it("reports the kind in the palette's vocabulary, not the serializer's", () => {
		const info = buildHoveredTrackInfo(
			makeTrack("straight", StraightType.STRAIGHTH),
			3,
			4,
			100,
			200,
		);
		expect(info.kindLabel).toBe("Straight");
		expect(info.subtypeCode).toBe("SH");
	});

	it("passes the hovered cell and pointer position straight through", () => {
		const info = buildHoveredTrackInfo(
			makeTrack("straight", StraightType.STRAIGHTH),
			3,
			4,
			100,
			200,
		);
		expect([info.gx, info.gy]).toEqual([3, 4]);
		expect([info.screenX, info.screenY]).toEqual([100, 200]);
	});

	it("reports main speed and length", () => {
		const track = makeTrack("straight", StraightType.STRAIGHTH);
		track.setTrackMainSpeed(120);
		track.setTrackMainLength(75);
		const info = buildHoveredTrackInfo(track, 0, 0, 0, 0);
		expect(info.mainSpeed).toBe(120);
		expect(info.mainLength).toBe(75);
	});

	it("omits the second path on a kind that has none", () => {
		const info = buildHoveredTrackInfo(
			makeTrack("straight", StraightType.STRAIGHTH),
			0,
			0,
			0,
			0,
		);
		expect(info.secondarySpeed).toBeNull();
		expect(info.secondaryLength).toBeNull();
	});

	it("reports the second path on a switch", () => {
		// The gap this fixes: a switch's main figures alone read as the whole
		// track, hiding a diverging route with a different limit.
		const track = makeTrack("switch", SwitchType.SWITCH1);
		track.setTrackMainSpeed(120);
		track.setTrackMainLength(75);
		track.setTrackSecondarySpeed(40);
		track.setTrackSecondaryLength(60);
		const info = buildHoveredTrackInfo(track, 0, 0, 0, 0);
		expect(info.mainSpeed).toBe(120);
		expect(info.secondarySpeed).toBe(40);
		expect(info.secondaryLength).toBe(60);
	});

	it("reports the second path on crossovers and flyovers too", () => {
		for (const track of [
			makeTrack("crossover", "CROSSOVER1"),
			makeTrack("flyover", "FLYOVER1"),
		]) {
			const info = buildHoveredTrackInfo(track, 0, 0, 0, 0);
			expect(info.secondarySpeed, track.data.kind).not.toBeNull();
			expect(info.secondaryLength, track.data.kind).not.toBeNull();
		}
	});

	it("distinguishes signals that share a subtype but differ by aspect", () => {
		const four = buildHoveredTrackInfo(
			makeTrack("signal", SignalType.SIGNALLEFT, {
				aspect: SignalAspect.FOUR_ASPECT,
			}),
			0,
			0,
			0,
			0,
		);
		const shunt = buildHoveredTrackInfo(
			makeTrack("signal", SignalType.SIGNALLEFT, {
				aspect: SignalAspect.SHUNT,
			}),
			0,
			0,
			0,
			0,
		);
		expect(four.subtypeCode).toBe(shunt.subtypeCode);
		expect(four.aspectLabel).toBe("4-aspect");
		expect(shunt.aspectLabel).toBe("Shunt");
	});

	it("carries no aspect on a non-signal", () => {
		const info = buildHoveredTrackInfo(
			makeTrack("straight", StraightType.STRAIGHTH),
			0,
			0,
			0,
			0,
		);
		expect(info.aspectLabel).toBeNull();
	});
});
