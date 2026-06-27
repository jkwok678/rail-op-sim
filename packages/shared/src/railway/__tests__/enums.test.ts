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
	ParapetType,
	Platform,
	SignalType,
	StraightType,
	SwitchType,
} from "../enums";

describe("ParapetType", () => {
	it('PARAPET1 equals "PARAPET1"', () => {
		expect(ParapetType.PARAPET1).toBe("PARAPET1");
	});
	it('PARAPET15 equals "PARAPET15"', () => {
		expect(ParapetType.PARAPET15).toBe("PARAPET15");
	});
	it('PARAPET28 equals "PARAPET28"', () => {
		expect(ParapetType.PARAPET28).toBe("PARAPET28");
	});
});

describe("Platform", () => {
	it("has all four direction values", () => {
		expect(Platform.LEFT).toBe("LEFT");
		expect(Platform.RIGHT).toBe("RIGHT");
		expect(Platform.UP).toBe("UP");
		expect(Platform.DOWN).toBe("DOWN");
	});
});

describe("StraightType", () => {
	it("has all four orientation values", () => {
		expect(StraightType.STRAIGHTH).toBe("STRAIGHTH");
		expect(StraightType.STRAIGHTV).toBe("STRAIGHTV");
		expect(StraightType.STRAIGHTLEFTUP).toBe("STRAIGHTLEFTUP");
		expect(StraightType.STRAIGHTRIGHTUP).toBe("STRAIGHTRIGHTUP");
	});
});

describe("DirectedType", () => {
	it("samples key directional values", () => {
		expect(DirectedType.DIRECTEDLEFT).toBe("DIRECTEDLEFT");
		expect(DirectedType.DIRECTEDRIGHTUP).toBe("DIRECTEDRIGHTUP");
		expect(DirectedType.DIRECTEDLEFTDOWN).toBe("DIRECTEDLEFTDOWN");
	});
});

describe("CurvedType", () => {
	it('TIGHTCURVE1 equals "TIGHTCURVE1"', () => {
		expect(CurvedType.TIGHTCURVE1).toBe("TIGHTCURVE1");
	});
	it('CURVE1 equals "CURVE1"', () => {
		expect(CurvedType.CURVE1).toBe("CURVE1");
	});
	it('CURVE8 equals "CURVE8"', () => {
		expect(CurvedType.CURVE8).toBe("CURVE8");
	});
});

describe("LinkedType", () => {
	it("samples key linked direction values", () => {
		expect(LinkedType.LINKLEFT).toBe("LINKLEFT");
		expect(LinkedType.LINKRIGHTDOWN).toBe("LINKRIGHTDOWN");
	});
});

describe("ExitType", () => {
	it("samples key exit direction values", () => {
		expect(ExitType.EXITLEFT).toBe("EXITLEFT");
		expect(ExitType.EXITRIGHTDOWN).toBe("EXITRIGHTDOWN");
	});
});

describe("BufferType", () => {
	it("samples key buffer direction values", () => {
		expect(BufferType.BUFFERLEFT).toBe("BUFFERLEFT");
		expect(BufferType.BUFFERRIGHTDOWN).toBe("BUFFERRIGHTDOWN");
	});
});

describe("SignalType", () => {
	it("samples key signal direction values", () => {
		expect(SignalType.SIGNALLEFT).toBe("SIGNALLEFT");
		expect(SignalType.SIGNALRIGHTDOWN).toBe("SIGNALRIGHTDOWN");
	});
});

describe("BridgeUnderpassType", () => {
	it("samples bridge and underpass values", () => {
		expect(BridgeUnderpassType.BRIDGE1).toBe("BRIDGE1");
		expect(BridgeUnderpassType.UNDERPASS2).toBe("UNDERPASS2");
	});
});

describe("SwitchType", () => {
	it("samples tight, split, and normal switch values", () => {
		expect(SwitchType.SWITCHTIGHT1).toBe("SWITCHTIGHT1");
		expect(SwitchType.SWITCHSPLIT1).toBe("SWITCHSPLIT1");
		expect(SwitchType.SWITCH1).toBe("SWITCH1");
		expect(SwitchType.SWITCH16).toBe("SWITCH16");
	});
});

describe("CrossoverType", () => {
	it("samples crossover boundary values", () => {
		expect(CrossoverType.CROSSOVER1).toBe("CROSSOVER1");
		expect(CrossoverType.CROSSOVER6).toBe("CROSSOVER6");
	});
});

describe("FlyoverType", () => {
	it("samples flyover boundary values", () => {
		expect(FlyoverType.FLYOVER1).toBe("FLYOVER1");
		expect(FlyoverType.FLYOVER12).toBe("FLYOVER12");
	});
});
