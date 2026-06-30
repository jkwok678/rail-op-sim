import { describe, expect, it } from "vitest";
import {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	SignalType,
	StraightType,
	SwitchType,
} from "../enums";
import { Track } from "../track/track";
import { createTrackData } from "../track/track-factory";
import { KIND_META, type TrackKind } from "../track/track-data";
import { SignalAspect } from "../track/signal-aspects";

/** One representative subtype per kind, used to exercise every branch. */
const SAMPLE_SUBTYPE: Record<TrackKind, string> = {
	straight: StraightType.STRAIGHTH,
	directed: DirectedType.DIRECTEDLEFT,
	curved: CurvedType.CURVE1,
	linked: LinkedType.LINKLEFT,
	exit: ExitType.EXITLEFT,
	buffer: BufferType.BUFFERLEFT,
	signal: SignalType.SIGNALLEFT,
	bridgeUnderpass: BridgeUnderpassType.BRIDGE1,
	switch: SwitchType.SWITCH1,
	crossover: CrossoverType.CROSSOVER1,
	flyover: FlyoverType.FLYOVER1,
};

const ALL_KINDS = Object.keys(KIND_META) as TrackKind[];

describe("createTrackData", () => {
	it("covers every TrackKind in KIND_META", () => {
		// Guards against a kind being added to the model but not the factory.
		expect(ALL_KINDS.length).toBe(11);
	});

	for (const kind of ALL_KINDS) {
		const subtype = SAMPLE_SUBTYPE[kind];

		it(`builds valid ${kind} data that a Track accepts`, () => {
			const data = createTrackData(kind, subtype);
			expect(data.kind).toBe(kind);
			expect(data.subtype).toBe(subtype);

			// The constructed data must be accepted by the Track class without throwing.
			const track = new Track(data, 0, 0);
			expect(track.data.kind).toBe(kind);
			expect(track.data.subtype).toBe(subtype);
		});

		it(`applies platform/level-crossing defaults for ${kind}`, () => {
			const meta = KIND_META[kind];
			const data = createTrackData(kind, subtype) as Record<string, unknown>;
			if (meta.supportsPlatforms) {
				expect(data.platform1).toBe(false);
				expect(data.platform2).toBe(false);
			}
			if (kind === "straight") {
				expect(data.levelCrossing).toBe(false);
			}
			if (kind === "signal") {
				expect(data.aspect).toBe(SignalAspect.FOUR_ASPECT);
			}
		});
	}

	it("honours explicit options", () => {
		const data = createTrackData("signal", SignalType.SIGNALLEFT, {
			aspect: 2,
			platform1: true,
		});
		expect(data).toMatchObject({ aspect: 2, platform1: true, platform2: false });
	});

	it.each([
		[SignalAspect.FOUR_ASPECT, "4-aspect"],
		[SignalAspect.THREE_ASPECT, "3-aspect"],
		[SignalAspect.TWO_ASPECT, "2-aspect"],
		[SignalAspect.SHUNT, "shunt"],
	])("honours explicit aspect %s (%s)", (aspect, _label) => {
		const data = createTrackData("signal", SignalType.SIGNALLEFT, { aspect });
		expect(data.aspect).toBe(aspect);
	});

	it("throws on an unknown kind", () => {
		expect(() =>
			createTrackData("nope" as TrackKind, "X"),
		).toThrow(/Unknown track kind/);
	});
});
