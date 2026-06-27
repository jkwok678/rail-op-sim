import { describe, it, expect } from "vitest";
import {
  Track,
  StraightTrack,
  DirectedTrack,
  CurvedTrack,
  LinkedTrack,
  ExitTrack,
  BufferTrack,
  SignalTrack,
  BridgeUnderpassTrack,
  SwitchTrack,
  CrossoverTrack,
  FlyoverTrack,
} from "../track";
import { Element, NamedElement, Text } from "../element";
import type { FontInfo } from "../types";
import {
  StraightType,
  DirectedType,
  CurvedType,
  LinkedType,
  ExitType,
  BufferType,
  SignalType,
  BridgeUnderpassType,
  SwitchType,
  CrossoverType,
  FlyoverType,
} from "../enums";

const testFont: FontInfo = { family: "Arial", pointSize: 12 };

// helper: check which link indices are true
function trueLinks(track: Track): number[] {
  const result: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (track.getLinkAt(i)) result.push(i);
  }
  return result;
}

// ============================================================================
// Track (abstract base)
// ============================================================================

describe("Track", () => {
  describe("default constructor", () => {
    class TestTrack extends Track {
      toString(): string {
        return this.toString();
      }
      toSaveString(): string {
        return this.toSaveString();
      }
    }
    // We can't instantiate Track directly (abstract), test via concrete subclass
    // but test the base behavior via StraightTrack default constructor

    it("defaults location to (0,0) via StraightTrack default constructor", () => {
      const t = new StraightTrack();
      expect(t.getLocationX()).toBe(0);
      expect(t.getLocationY()).toBe(0);
    });

    it("defaults main speed/length to 200/100", () => {
      const t = new StraightTrack();
      expect(t.getTrackMainSpeed()).toBe(200);
      expect(t.getTrackMainLength()).toBe(100);
    });

    it("defaults secondary speed/length to -1/-1", () => {
      const t = new StraightTrack();
      expect(t.getTrackSecondarySpeed()).toBe(-1);
      expect(t.getTrackSecondaryLength()).toBe(-1);
    });

    it("all 9 links default to false", () => {
      const t = new StraightTrack();
      expect(trueLinks(t)).toEqual([]);
    });

    it("linkedNamedLocation defaults to null", () => {
      const t = new StraightTrack();
      expect(t.getLinkedNamedLocation()).toBeNull();
    });

    it("found defaults to false", () => {
      const t = new StraightTrack();
      expect(t.getFound()).toBe(false);
    });

    it("text defaults to null (from NamedElement)", () => {
      const t = new StraightTrack();
      expect(t.getText()).toBeNull();
    });
  });

  describe("parameterized constructor", () => {
    it("sets location from arguments", () => {
      const t = new StraightTrack(StraightType.STRAIGHTH, 5, 10);
      expect(t.getLocationX()).toBe(5);
      expect(t.getLocationY()).toBe(10);
    });
  });

  describe("speed/length setters", () => {
    it("updates main speed/length", () => {
      const t = new StraightTrack();
      t.setTrackMainSpeed(300);
      t.setTrackMainLength(150);
      expect(t.getTrackMainSpeed()).toBe(300);
      expect(t.getTrackMainLength()).toBe(150);
    });

    it("updates secondary speed/length", () => {
      const t = new StraightTrack();
      t.setTrackSecondarySpeed(250);
      t.setTrackSecondaryLength(120);
      expect(t.getTrackSecondarySpeed()).toBe(250);
      expect(t.getTrackSecondaryLength()).toBe(120);
    });
  });

  describe("setDefaultSecondarySpeedLength", () => {
    it("sets secondary to 200/100", () => {
      // Use SwitchTrack which calls setDefaultSecondarySpeedLength in constructor
      const t = new SwitchTrack(SwitchType.SWITCH1, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("mainSpeedLengthToString", () => {
    it('returns "speed,length"', () => {
      const t = new StraightTrack();
      expect(t.mainSpeedLengthToString()).toBe("200,100");
    });
  });

  describe("secondarySpeedLengthToString", () => {
    it('returns "speed,length"', () => {
      const t = new StraightTrack();
      expect(t.secondarySpeedLengthToString()).toBe("-1,-1");
    });
  });

  describe("link grid", () => {
    it("link index 4 is always false (unused)", () => {
      const t = new StraightTrack(StraightType.STRAIGHTH, 0, 0);
      expect(t.getLinkAt(4)).toBe(false);
    });
  });

  describe("toString", () => {
    it("concrete subclass overrides toString (format is subclass-specific)", () => {
      // The base Track.toString() is always overridden; test concrete formats
      // via the subclass tests (e.g., StraightTrack.toString, etc.)
      const t = new StraightTrack();
      expect(t.toString()).toContain("StraightTrack");
    });
  });

  describe("toSaveString", () => {
    it("concrete subclass overrides toSaveString (format is subclass-specific)", () => {
      // The base Track.toSaveString() is always overridden; test concrete formats
      // via the subclass tests (e.g., StraightTrack.toSaveString, etc.)
      const t = new StraightTrack();
      expect(t.toSaveString()).toContain("SH");
    });
  });
});

// ============================================================================
// StraightTrack
// ============================================================================

describe("StraightTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [StraightType.STRAIGHTH, [3, 5]],
      [StraightType.STRAIGHTV, [1, 7]],
      [StraightType.STRAIGHTLEFTUP, [0, 8]],
      [StraightType.STRAIGHTRIGHTUP, [2, 6]],
    ])("%s has correct links", (type, expected) => {
      const t = new StraightTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("default constructor", () => {
    it("defaults to STRAIGHTH", () => {
      const t = new StraightTrack();
      expect(t.getStraightType()).toBe(StraightType.STRAIGHTH);
    });
  });

  describe("platforms", () => {
    it("platform1 and platform2 default to false", () => {
      const t = new StraightTrack();
      expect(t.getPlatform1()).toBe(false);
      expect(t.getPlatform2()).toBe(false);
    });

    it("hasPlatform returns false initially", () => {
      const t = new StraightTrack();
      expect(t.hasPlatform()).toBe(false);
    });

    it("hasPlatform returns true when platform1 is set", () => {
      const t = new StraightTrack();
      t.setPlatform1(true);
      expect(t.hasPlatform()).toBe(true);
    });

    it("hasPlatform returns true when platform2 is set", () => {
      const t = new StraightTrack();
      t.setPlatform2(true);
      expect(t.hasPlatform()).toBe(true);
    });

    it('setPlatforms update correctly', () => {
      const t = new StraightTrack();
      t.setPlatform1(true);
      t.setPlatform2(true);
      expect(t.getPlatform1()).toBe(true);
      expect(t.getPlatform2()).toBe(true);
    });
  });

  describe("levelCrossing", () => {
    it("defaults to false", () => {
      const t = new StraightTrack();
      expect(t.hasLevelCrossing()).toBe(false);
    });

    it("addLevelCrossing sets to true", () => {
      const t = new StraightTrack();
      t.addLevelCrossing();
      expect(t.hasLevelCrossing()).toBe(true);
    });

    it("removeLevelCrossing sets to false", () => {
      const t = new StraightTrack();
      t.addLevelCrossing();
      t.removeLevelCrossing();
      expect(t.hasLevelCrossing()).toBe(false);
    });
  });

  describe("platformsToString", () => {
    it("returns '0,0' by default", () => {
      const t = new StraightTrack();
      expect(t.platformsToString()).toBe("0,0");
    });

    it("returns '1,0' when only platform1", () => {
      const t = new StraightTrack();
      t.setPlatform1(true);
      expect(t.platformsToString()).toBe("1,0");
    });

    it("returns '0,1' when only platform2", () => {
      const t = new StraightTrack();
      t.setPlatform2(true);
      expect(t.platformsToString()).toBe("0,1");
    });

    it("returns '1,1' when both", () => {
      const t = new StraightTrack();
      t.setPlatform1(true);
      t.setPlatform2(true);
      expect(t.platformsToString()).toBe("1,1");
    });
  });

  describe("levelCrossingToString", () => {
    it('returns "0" by default', () => {
      const t = new StraightTrack();
      expect(t.levelCrossingToString()).toBe("0");
    });

    it('returns "1" when added', () => {
      const t = new StraightTrack();
      t.addLevelCrossing();
      expect(t.levelCrossingToString()).toBe("1");
    });
  });

  describe("straightTypeToString", () => {
    it.each([
      [StraightType.STRAIGHTH, "SH"],
      [StraightType.STRAIGHTV, "SV"],
      [StraightType.STRAIGHTLEFTUP, "SLU"],
      [StraightType.STRAIGHTRIGHTUP, "SRU"],
    ])("%s -> %s", (type, expected) => {
      const t = new StraightTrack(type, 0, 0);
      expect(t.straightTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("formats correctly without text", () => {
      const t = new StraightTrack(StraightType.STRAIGHTH, 5, 10);
      expect(t.toString()).toBe("StraightTrack,SH,5,10,200,100,0,0,0");
    });

    it("formats correctly with text", () => {
      const t = new StraightTrack(StraightType.STRAIGHTH, 5, 10);
      t.setText(new Text(0, 0, "Platform A", testFont));
      expect(t.toString()).toContain("StraightTrack,SH,5,10,200,100,0,0,0,Text,");
    });
  });

  describe("toSaveString", () => {
    it("formats correctly without text", () => {
      const t = new StraightTrack(StraightType.STRAIGHTH, 5, 10);
      expect(t.toSaveString()).toBe("SH,5,10,200,100,0,0,0");
    });
  });
});

// ============================================================================
// DirectedTrack
// ============================================================================

describe("DirectedTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [DirectedType.DIRECTEDLEFT, [3, 5]],
      [DirectedType.DIRECTEDRIGHT, [3, 5]],
      [DirectedType.DIRECTEDUP, [1, 7]],
      [DirectedType.DIRECTEDDOWN, [1, 7]],
      [DirectedType.DIRECTEDLEFTUP, [0, 8]],
      [DirectedType.DIRECTEDRIGHTDOWN, [0, 8]],
      [DirectedType.DIRECTEDRIGHTUP, [2, 6]],
      [DirectedType.DIRECTEDLEFTDOWN, [2, 6]],
    ])("%s has correct links", (type, expected) => {
      const t = new DirectedTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("constructor", () => {
    it("sets location correctly", () => {
      const t = new DirectedTrack(DirectedType.DIRECTEDLEFT, 5, 10);
      expect(t.getLocationX()).toBe(5);
      expect(t.getLocationY()).toBe(10);
    });
  });

  describe("directedTypeToString", () => {
    it.each([
      [DirectedType.DIRECTEDLEFT, "DL"],
      [DirectedType.DIRECTEDRIGHT, "DR"],
      [DirectedType.DIRECTEDUP, "DU"],
      [DirectedType.DIRECTEDDOWN, "DD"],
      [DirectedType.DIRECTEDLEFTUP, "DLU"],
      [DirectedType.DIRECTEDRIGHTUP, "DRU"],
      [DirectedType.DIRECTEDLEFTDOWN, "DLD"],
      [DirectedType.DIRECTEDRIGHTDOWN, "DRD"],
    ])("%s -> %s", (type, expected) => {
      const t = new DirectedTrack(type, 0, 0);
      expect(t.directedTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("has no levelCrossing field (unlike StraightTrack base)", () => {
      const t = new DirectedTrack(DirectedType.DIRECTEDLEFT, 5, 10);
      expect(t.toString()).toBe("DirectedTrack,DL,5,10,200,100,0,0");
    });
  });

  describe("toSaveString", () => {
    it("has compact format", () => {
      const t = new DirectedTrack(DirectedType.DIRECTEDLEFT, 5, 10);
      expect(t.toSaveString()).toBe("DL,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// CurvedTrack
// ============================================================================

describe("CurvedTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [CurvedType.TIGHTCURVE1, [5, 7]],
      [CurvedType.TIGHTCURVE2, [3, 7]],
      [CurvedType.TIGHTCURVE3, [1, 5]],
      [CurvedType.TIGHTCURVE4, [1, 3]],
      [CurvedType.CURVE1, [5, 6]],
      [CurvedType.CURVE8, [0, 7]],
    ])("%s has correct links", (type, expected) => {
      const t = new CurvedTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("constructor", () => {
    it("sets location correctly", () => {
      const t = new CurvedTrack(CurvedType.CURVE1, 5, 10);
      expect(t.getLocationX()).toBe(5);
      expect(t.getLocationY()).toBe(10);
    });
  });

  describe("curvedTypeToString", () => {
    it.each([
      [CurvedType.TIGHTCURVE1, "TC1"],
      [CurvedType.TIGHTCURVE4, "TC4"],
      [CurvedType.CURVE1, "C1"],
      [CurvedType.CURVE8, "C8"],
    ])("%s -> %s", (type, expected) => {
      const t = new CurvedTrack(type, 0, 0);
      expect(t.curvedTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("has no platform or levelCrossing fields", () => {
      const t = new CurvedTrack(CurvedType.CURVE1, 5, 10);
      expect(t.toString()).toBe("CurvedTrack,C1,5,10,200,100");
    });
  });

  describe("toSaveString", () => {
    it("compact format", () => {
      const t = new CurvedTrack(CurvedType.CURVE1, 5, 10);
      expect(t.toSaveString()).toBe("C1,5,10,200,100");
    });
  });
});

// ============================================================================
// LinkedTrack
// ============================================================================

describe("LinkedTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [LinkedType.LINKLEFT, [5]],
      [LinkedType.LINKRIGHT, [3]],
      [LinkedType.LINKUP, [7]],
      [LinkedType.LINKDOWN, [1]],
      [LinkedType.LINKLEFTUP, [8]],
      [LinkedType.LINKRIGHTDOWN, [0]],
      [LinkedType.LINKLEFTDOWN, [2]],
      [LinkedType.LINKRIGHTUP, [6]],
    ])("%s has correct link", (type, expected) => {
      const t = new LinkedTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("default constructor", () => {
    it("defaults to LINKLEFT", () => {
      const t = new LinkedTrack();
      expect(t.getLinkedType()).toBe(LinkedType.LINKLEFT);
    });

    it("default location is (0,0)", () => {
      const t = new LinkedTrack();
      expect(t.getLocationX()).toBe(0);
      expect(t.getLocationY()).toBe(0);
    });
  });

  describe("pairing", () => {
    it("isLinked returns false initially", () => {
      const t = new LinkedTrack(LinkedType.LINKLEFT, 0, 0);
      expect(t.isLinked()).toBe(false);
    });

    it("getOtherLinkedTrack returns null initially", () => {
      const t = new LinkedTrack(LinkedType.LINKLEFT, 0, 0);
      expect(t.getOtherLinkedTrack()).toBeNull();
    });

    it("setOtherLinkedTrack and getOtherLinkedTrack work", () => {
      const a = new LinkedTrack(LinkedType.LINKLEFT, 0, 0);
      const b = new LinkedTrack(LinkedType.LINKRIGHT, 16, 0);
      a.setOtherLinkedTrack(b);
      expect(a.getOtherLinkedTrack()).toBe(b);
      expect(a.isLinked()).toBe(true);
    });

    it("removeOtherLinkedTrack clears the link", () => {
      const a = new LinkedTrack(LinkedType.LINKLEFT, 0, 0);
      const b = new LinkedTrack(LinkedType.LINKRIGHT, 16, 0);
      a.setOtherLinkedTrack(b);
      a.removeOtherLinkedTrack();
      expect(a.isLinked()).toBe(false);
      expect(a.getOtherLinkedTrack()).toBeNull();
    });

    it("bidirectional pairing", () => {
      const a = new LinkedTrack(LinkedType.LINKLEFT, 0, 0);
      const b = new LinkedTrack(LinkedType.LINKRIGHT, 16, 0);
      a.setOtherLinkedTrack(b);
      b.setOtherLinkedTrack(a);
      expect(a.isLinked()).toBe(true);
      expect(b.isLinked()).toBe(true);
    });
  });

  describe("linkedTypeToString", () => {
    it.each([
      [LinkedType.LINKLEFT, "LL"],
      [LinkedType.LINKRIGHT, "LR"],
      [LinkedType.LINKUP, "LU"],
      [LinkedType.LINKDOWN, "LD"],
      [LinkedType.LINKLEFTDOWN, "LLD"],
      [LinkedType.LINKLEFTUP, "LLU"],
      [LinkedType.LINKRIGHTDOWN, "LRD"],
      [LinkedType.LINKRIGHTUP, "LRU"],
    ])("%s -> %s", (type, expected) => {
      const t = new LinkedTrack(type, 0, 0);
      expect(t.linkedTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes ',0' when not linked", () => {
      const t = new LinkedTrack(LinkedType.LINKLEFT, 5, 10);
      expect(t.toString()).toBe("LinkedTrack,LL,5,10,200,100,0");
    });

    it("includes ',1,otherTrack' when linked", () => {
      const a = new LinkedTrack(LinkedType.LINKLEFT, 5, 10);
      const b = new LinkedTrack(LinkedType.LINKRIGHT, 21, 10);
      a.setOtherLinkedTrack(b);
      // The otherLinkedTrackToString uses the OTHER track's data but the link's own mainSpeedLengthToString
      expect(a.toString()).toContain(",1,");
    });
  });

  describe("toSaveString", () => {
    it("includes ',0' when not linked", () => {
      const t = new LinkedTrack(LinkedType.LINKLEFT, 5, 10);
      expect(t.toSaveString()).toBe("LL,5,10,200,100,0");
    });
  });
});

// ============================================================================
// ExitTrack
// ============================================================================

describe("ExitTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [ExitType.EXITLEFT, [5]],
      [ExitType.EXITRIGHT, [3]],
      [ExitType.EXITUP, [7]],
      [ExitType.EXITDOWN, [1]],
    ])("%s has correct link", (type, expected) => {
      const t = new ExitTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("exitTypeToString", () => {
    it.each([
      [ExitType.EXITLEFT, "EL"],
      [ExitType.EXITRIGHT, "ER"],
      [ExitType.EXITUP, "EU"],
      [ExitType.EXITDOWN, "ED"],
    ])("%s -> %s", (type, expected) => {
      const t = new ExitTrack(type, 0, 0);
      expect(t.exitTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("has correct format", () => {
      const t = new ExitTrack(ExitType.EXITLEFT, 5, 10);
      expect(t.toString()).toBe("ExitTrack,EL,5,10,200,100");
    });
  });

  describe("toSaveString", () => {
    it("compact format", () => {
      const t = new ExitTrack(ExitType.EXITLEFT, 5, 10);
      expect(t.toSaveString()).toBe("EL,5,10,200,100");
    });
  });
});

// ============================================================================
// BufferTrack
// ============================================================================

describe("BufferTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [BufferType.BUFFERLEFT, [5]],
      [BufferType.BUFFERRIGHT, [3]],
      [BufferType.BUFFERUP, [7]],
      [BufferType.BUFFERDOWN, [1]],
    ])("%s has correct link", (type, expected) => {
      const t = new BufferTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("bufferTypeToString", () => {
    it.each([
      [BufferType.BUFFERLEFT, "BL"],
      [BufferType.BUFFERRIGHT, "BR"],
      [BufferType.BUFFERUP, "BU"],
      [BufferType.BUFFERDOWN, "BD"],
    ])("%s -> %s", (type, expected) => {
      const t = new BufferTrack(type, 0, 0);
      expect(t.bufferTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes platform fields (inherits from StraightTrack)", () => {
      const t = new BufferTrack(BufferType.BUFFERLEFT, 5, 10);
      expect(t.toString()).toBe("BufferTrack,BL,5,10,200,100,0,0");
    });
  });

  describe("toSaveString", () => {
    it("compact format with platforms", () => {
      const t = new BufferTrack(BufferType.BUFFERLEFT, 5, 10);
      expect(t.toSaveString()).toBe("BL,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// SignalTrack
// ============================================================================

describe("SignalTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [SignalType.SIGNALLEFT, [3, 5]],
      [SignalType.SIGNALRIGHT, [3, 5]],
      [SignalType.SIGNALUP, [1, 7]],
      [SignalType.SIGNALDOWN, [1, 7]],
    ])("%s has correct links", (type, expected) => {
      const t = new SignalTrack(type, 2, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("aspect", () => {
    it("constructor sets aspect", () => {
      const t = new SignalTrack(SignalType.SIGNALLEFT, 3, 0, 0);
      expect(t.getAspect()).toBe(3);
    });

    it("setAspect updates aspect", () => {
      const t = new SignalTrack(SignalType.SIGNALLEFT, 2, 0, 0);
      t.setAspect(4);
      expect(t.getAspect()).toBe(4);
    });

    it("aspectToString returns string", () => {
      const t = new SignalTrack(SignalType.SIGNALLEFT, 2, 0, 0);
      expect(t.aspectToString()).toBe("2");
    });
  });

  describe("signalTypeToString", () => {
    it.each([
      [SignalType.SIGNALLEFT, "SIGL"],
      [SignalType.SIGNALRIGHT, "SIGR"],
      [SignalType.SIGNALUP, "SIGU"],
      [SignalType.SIGNALDOWN, "SIGD"],
    ])("%s -> %s", (type, expected) => {
      const t = new SignalTrack(type, 1, 0, 0);
      expect(t.signalTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes aspect", () => {
      const t = new SignalTrack(SignalType.SIGNALLEFT, 2, 5, 10);
      expect(t.toString()).toBe("SignalTrack,SIGL,2,5,10,200,100,0,0");
    });
  });

  describe("toSaveString", () => {
    it("includes aspect", () => {
      const t = new SignalTrack(SignalType.SIGNALLEFT, 2, 5, 10);
      expect(t.toSaveString()).toBe("SIGL,2,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// BridgeUnderpassTrack
// ============================================================================

describe("BridgeUnderpassTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [BridgeUnderpassType.BRIDGE1, [3, 5]],
      [BridgeUnderpassType.UNDERPASS1, [3, 5]],
      [BridgeUnderpassType.BRIDGE2, [1, 7]],
      [BridgeUnderpassType.UNDERPASS2, [1, 7]],
    ])("%s has correct links", (type, expected) => {
      const t = new BridgeUnderpassTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("bridgeUnderpassTypeToString", () => {
    it.each([
      [BridgeUnderpassType.BRIDGE1, "BR1"],
      [BridgeUnderpassType.BRIDGE2, "BR2"],
      [BridgeUnderpassType.UNDERPASS1, "UP1"],
      [BridgeUnderpassType.UNDERPASS2, "UP2"],
    ])("%s -> %s", (type, expected) => {
      const t = new BridgeUnderpassTrack(type, 0, 0);
      expect(t.bridgeUnderpassTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes platforms", () => {
      const t = new BridgeUnderpassTrack(BridgeUnderpassType.BRIDGE1, 5, 10);
      expect(t.toString()).toBe(
        "BridgeUnderpassTrack,BR1,5,10,200,100,0,0",
      );
    });
  });
});

// ============================================================================
// SwitchTrack
// ============================================================================

describe("SwitchTrack", () => {
  describe("link grid per type", () => {
    it.each([
      [SwitchType.SWITCHTIGHT1, [1, 3, 5]],
      [SwitchType.SWITCHTIGHT3, [3, 5, 7]],
      [SwitchType.SWITCHSPLIT1, [2, 3, 8]],
      [SwitchType.SWITCHSPLIT3, [2, 3, 7]],
      [SwitchType.SWITCH1, [2, 3, 5]],
      [SwitchType.SWITCH5, [0, 1, 7]],
      [SwitchType.SWITCH16, [0, 5, 8]],
    ])("%s has correct 3-link grid", (type, expected) => {
      const t = new SwitchTrack(type, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("secondary speed/length", () => {
    it("defaults to 200/100", () => {
      const t = new SwitchTrack(SwitchType.SWITCH1, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("switchTypeToString", () => {
    it.each([
      [SwitchType.SWITCHTIGHT1, "SWT1"],
      [SwitchType.SWITCHSPLIT1, "SWS1"],
      [SwitchType.SWITCH1, "SW1"],
      [SwitchType.SWITCH16, "SW16"],
    ])("%s -> %s", (type, expected) => {
      const t = new SwitchTrack(type, 0, 0);
      expect(t.switchTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes secondary speed/length + platforms", () => {
      const t = new SwitchTrack(SwitchType.SWITCH1, 5, 10);
      expect(t.toString()).toBe(
        "SwitchTrack,SW1,5,10,200,100,200,100,0,0",
      );
    });
  });
});

// ============================================================================
// CrossoverTrack
// ============================================================================

describe("CrossoverTrack", () => {
  describe("link grid per type", () => {
    it("CROSSOVER1 has 4 cardinal links", () => {
      const t = new CrossoverTrack(CrossoverType.CROSSOVER1, 0, 0);
      expect(trueLinks(t)).toEqual([1, 3, 5, 7]);
    });

    it("CROSSOVER2 has 4 diagonal links", () => {
      const t = new CrossoverTrack(CrossoverType.CROSSOVER2, 0, 0);
      expect(trueLinks(t)).toEqual([0, 2, 6, 8]);
    });
  });

  describe("secondary speed/length", () => {
    it("defaults to 200/100", () => {
      const t = new CrossoverTrack(CrossoverType.CROSSOVER1, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("crossoverTypeToString", () => {
    it.each([
      [CrossoverType.CROSSOVER1, "CR1"],
      [CrossoverType.CROSSOVER6, "CR6"],
    ])("%s -> %s", (type, expected) => {
      const t = new CrossoverTrack(type, 0, 0);
      expect(t.crossoverTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes secondary speed/length", () => {
      const t = new CrossoverTrack(CrossoverType.CROSSOVER1, 5, 10);
      expect(t.toString()).toBe(
        "CrossoverTrack,CR1,5,10,200,100,200,100",
      );
    });
  });
});

// ============================================================================
// FlyoverTrack
// ============================================================================

describe("FlyoverTrack", () => {
  describe("link grid per type", () => {
    it("FLYOVER1 has 4 cardinal links", () => {
      const t = new FlyoverTrack(FlyoverType.FLYOVER1, 0, 0);
      expect(trueLinks(t)).toEqual([1, 3, 5, 7]);
    });
  });

  describe("secondary speed/length", () => {
    it("defaults to 200/100", () => {
      const t = new FlyoverTrack(FlyoverType.FLYOVER1, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("flyoverTypeToString", () => {
    it.each([
      [FlyoverType.FLYOVER1, "F1"],
      [FlyoverType.FLYOVER12, "F12"],
    ])("%s -> %s", (type, expected) => {
      const t = new FlyoverTrack(type, 0, 0);
      expect(t.flyoverTypeToString()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes secondary speed/length", () => {
      const t = new FlyoverTrack(FlyoverType.FLYOVER1, 5, 10);
      expect(t.toString()).toBe("FlyoverTrack,F1,5,10,200,100,200,100");
    });
  });
});

// ============================================================================
// Inheritance chains
// ============================================================================

describe("Track inheritance chains", () => {
  it("StraightTrack instanceof Track, NamedElement, Element", () => {
    const t = new StraightTrack();
    expect(t).toBeInstanceOf(Track);
    expect(t).toBeInstanceOf(NamedElement);
    expect(t).toBeInstanceOf(Element);
  });

  it("DirectedTrack instanceof StraightTrack and Track", () => {
    const t = new DirectedTrack(DirectedType.DIRECTEDLEFT, 0, 0);
    expect(t).toBeInstanceOf(StraightTrack);
    expect(t).toBeInstanceOf(Track);
  });

  it("CurvedTrack instanceof Track", () => {
    const t = new CurvedTrack(CurvedType.CURVE1, 0, 0);
    expect(t).toBeInstanceOf(Track);
  });

  it("LinkedTrack instanceof Track but NOT StraightTrack", () => {
    const t = new LinkedTrack();
    expect(t).toBeInstanceOf(Track);
    expect(t).not.toBeInstanceOf(StraightTrack);
  });

  it("ExitTrack instanceof Track but NOT StraightTrack", () => {
    const t = new ExitTrack(ExitType.EXITLEFT, 0, 0);
    expect(t).toBeInstanceOf(Track);
    expect(t).not.toBeInstanceOf(StraightTrack);
  });

  it("BufferTrack instanceof StraightTrack", () => {
    const t = new BufferTrack(BufferType.BUFFERLEFT, 0, 0);
    expect(t).toBeInstanceOf(StraightTrack);
    expect(t).toBeInstanceOf(Track);
  });

  it("SignalTrack instanceof StraightTrack", () => {
    const t = new SignalTrack(SignalType.SIGNALLEFT, 2, 0, 0);
    expect(t).toBeInstanceOf(StraightTrack);
    expect(t).toBeInstanceOf(Track);
  });

  it("BridgeUnderpassTrack instanceof StraightTrack", () => {
    const t = new BridgeUnderpassTrack(BridgeUnderpassType.BRIDGE1, 0, 0);
    expect(t).toBeInstanceOf(StraightTrack);
  });

  it("SwitchTrack instanceof StraightTrack", () => {
    const t = new SwitchTrack(SwitchType.SWITCH1, 0, 0);
    expect(t).toBeInstanceOf(StraightTrack);
  });

  it("CrossoverTrack instanceof Track but NOT StraightTrack", () => {
    const t = new CrossoverTrack(CrossoverType.CROSSOVER1, 0, 0);
    expect(t).toBeInstanceOf(Track);
    expect(t).not.toBeInstanceOf(StraightTrack);
  });

  it("FlyoverTrack instanceof Track but NOT StraightTrack", () => {
    const t = new FlyoverTrack(FlyoverType.FLYOVER1, 0, 0);
    expect(t).toBeInstanceOf(Track);
    expect(t).not.toBeInstanceOf(StraightTrack);
  });
});
