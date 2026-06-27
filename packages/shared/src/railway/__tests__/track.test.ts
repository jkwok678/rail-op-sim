import { describe, it, expect } from "vitest";
import { Track } from "../track/track";
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
// Track (concrete unified class)
// ============================================================================

describe("Track", () => {
  describe("default-like constructor (curved as simplest kind)", () => {
    it("sets location from arguments", () => {
      // Curved is the simplest kind (no platforms, no secondary)
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 5, 10);
      expect(t.getLocationX()).toBe(5);
      expect(t.getLocationY()).toBe(10);
    });

    it("defaults main speed/length to 200/100", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getTrackMainSpeed()).toBe(200);
      expect(t.getTrackMainLength()).toBe(100);
    });

    it("defaults secondary speed/length to -1/-1 for kinds without secondary path", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(-1);
      expect(t.getTrackSecondaryLength()).toBe(-1);
    });

    it("all 9 links default to false for kinds without explicit links, then computed from subtype", () => {
      // CURVE1 has links [5, 6] per the table
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getLinkAt(5)).toBe(true);
      expect(t.getLinkAt(6)).toBe(true);
      // Link 4 is always false (unused)
      expect(t.getLinkAt(4)).toBe(false);
    });

    it("linkedNamedLocation defaults to null", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getLinkedNamedLocation()).toBeNull();
    });

    it("found defaults to false", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getFound()).toBe(false);
    });

    it("text defaults to null (from NamedElement)", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getText()).toBeNull();
    });
  });

  describe("speed/length setters", () => {
    it("reads main speed/length (readonly, set via constructor defaults)", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.getTrackMainSpeed()).toBe(200);
      expect(t.getTrackMainLength()).toBe(100);
    });

    it("reads secondary speed/length correctly based on kind", () => {
      // Switch has secondary path
      const t = new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("setDefaultSecondarySpeedLength", () => {
    it("sets secondary to 200/100 for switch/crossover/flyover kinds", () => {
      const t = new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("mainSpeedLengthToString", () => {
    it('returns "speed,length"', () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.mainSpeedLengthToString()).toBe("200,100");
    });
  });

  describe("secondarySpeedLengthToString", () => {
    it('returns "speed,length"', () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.secondarySpeedLengthToString()).toBe("-1,-1");
    });
  });

  describe("link grid", () => {
    it("link index 4 is always false (unused)", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.getLinkAt(4)).toBe(false);
    });
  });

  describe("toString", () => {
    it("format includes kind label and subtype code", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 5, 10);
      expect(t.toString()).toContain("StraightTrack");
      expect(t.toString()).toContain("SH");
    });
  });

  describe("toSaveString", () => {
    it("format includes subtype code", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.toSaveString()).toContain("SH");
    });
  });

  describe("kindLabel and subtypeCode", () => {
    it("kindLabel returns correct human-readable name", () => {
      expect(new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0).kindLabel()).toBe("StraightTrack");
      expect(new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0).kindLabel()).toBe("CurvedTrack");
      expect(new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0).kindLabel()).toBe("SwitchTrack");
    });

    it("subtypeCode returns correct short code", () => {
      expect(new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0).subtypeCode()).toBe("SH");
      expect(new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0).subtypeCode()).toBe("C1");
      expect(new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0).subtypeCode()).toBe("SW1");
    });
  });
});

// ============================================================================
// StraightTrack (kind: 'straight')
// ============================================================================

describe("StraightTrack (kind: 'straight')", () => {
  describe("link grid per type", () => {
    it.each([
      [StraightType.STRAIGHTH, [3, 5]],
      [StraightType.STRAIGHTV, [1, 7]],
      [StraightType.STRAIGHTLEFTUP, [0, 8]],
      [StraightType.STRAIGHTRIGHTUP, [2, 6]],
    ])("%s has correct links", (type, expected) => {
      const t = new Track({ kind: "straight", subtype: type, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("data.subtype", () => {
    it("accesses subtype via data.subtype", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.data.subtype).toBe(StraightType.STRAIGHTH);
    });
  });

  describe("data.kind", () => {
    it("data.kind is 'straight'", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.data.kind).toBe("straight");
    });
  });

  describe("platforms", () => {
    it("platform1 and platform2 default to false", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.getPlatform1()).toBe(false);
      expect(t.getPlatform2()).toBe(false);
    });

    it("hasPlatform returns false initially", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.hasPlatform()).toBe(false);
    });

    it("hasPlatform returns true when platform1 is set", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.setPlatform1(true);
      expect(t.hasPlatform()).toBe(true);
    });

    it("hasPlatform returns true when platform2 is set", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.setPlatform2(true);
      expect(t.hasPlatform()).toBe(true);
    });

    it('setPlatforms update correctly', () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.setPlatform1(true);
      t.setPlatform2(true);
      expect(t.getPlatform1()).toBe(true);
      expect(t.getPlatform2()).toBe(true);
    });
  });

  describe("levelCrossing", () => {
    it("defaults to false", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.hasLevelCrossing()).toBe(false);
    });

    it("addLevelCrossing sets to true", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.addLevelCrossing();
      expect(t.hasLevelCrossing()).toBe(true);
    });

    it("removeLevelCrossing sets to false", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.addLevelCrossing();
      t.removeLevelCrossing();
      expect(t.hasLevelCrossing()).toBe(false);
    });
  });

  describe("platformsToString", () => {
    it("returns '0,0' by default", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.platformsToString()).toBe("0,0");
    });

    it("returns '1,0' when only platform1", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.setPlatform1(true);
      expect(t.platformsToString()).toBe("1,0");
    });

    it("returns '0,1' when only platform2", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.setPlatform2(true);
      expect(t.platformsToString()).toBe("0,1");
    });

    it("returns '1,1' when both", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.setPlatform1(true);
      t.setPlatform2(true);
      expect(t.platformsToString()).toBe("1,1");
    });
  });

  describe("levelCrossingToString", () => {
    it('returns "0" by default', () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.levelCrossingToString()).toBe("0");
    });

    it('returns "1" when added', () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      t.addLevelCrossing();
      expect(t.levelCrossingToString()).toBe("1");
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [StraightType.STRAIGHTH, "SH"],
      [StraightType.STRAIGHTV, "SV"],
      [StraightType.STRAIGHTLEFTUP, "SLU"],
      [StraightType.STRAIGHTRIGHTUP, "SRU"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "straight", subtype: type, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("formats correctly without text", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 5, 10);
      expect(t.toString()).toBe("StraightTrack,SH,5,10,200,100,0,0,0");
    });

    it("formats correctly with text", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 5, 10);
      t.setText(new Text(0, 0, "Platform A", testFont));
      expect(t.toString()).toContain("StraightTrack,SH,5,10,200,100,0,0,0,Text,");
    });
  });

  describe("toSaveString", () => {
    it("formats correctly without text", () => {
      const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 5, 10);
      expect(t.toSaveString()).toBe("SH,5,10,200,100,0,0,0");
    });
  });
});

// ============================================================================
// DirectedTrack (kind: 'directed')
// ============================================================================

describe("DirectedTrack (kind: 'directed')", () => {
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
      const t = new Track({ kind: "directed", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("constructor", () => {
    it("sets location correctly", () => {
      const t = new Track({ kind: "directed", subtype: DirectedType.DIRECTEDLEFT, platform1: false, platform2: false }, 5, 10);
      expect(t.getLocationX()).toBe(5);
      expect(t.getLocationY()).toBe(10);
    });
  });

  describe("subtypeCode", () => {
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
      const t = new Track({ kind: "directed", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("has no levelCrossing field", () => {
      const t = new Track({ kind: "directed", subtype: DirectedType.DIRECTEDLEFT, platform1: false, platform2: false }, 5, 10);
      expect(t.toString()).toBe("DirectedTrack,DL,5,10,200,100,0,0");
    });
  });

  describe("toSaveString", () => {
    it("has compact format", () => {
      const t = new Track({ kind: "directed", subtype: DirectedType.DIRECTEDLEFT, platform1: false, platform2: false }, 5, 10);
      expect(t.toSaveString()).toBe("DL,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// CurvedTrack (kind: 'curved')
// ============================================================================

describe("CurvedTrack (kind: 'curved')", () => {
  describe("link grid per type", () => {
    it.each([
      [CurvedType.TIGHTCURVE1, [5, 7]],
      [CurvedType.TIGHTCURVE2, [3, 7]],
      [CurvedType.TIGHTCURVE3, [1, 5]],
      [CurvedType.TIGHTCURVE4, [1, 3]],
      [CurvedType.CURVE1, [5, 6]],
      [CurvedType.CURVE8, [0, 7]],
    ])("%s has correct links", (type, expected) => {
      const t = new Track({ kind: "curved", subtype: type }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("constructor", () => {
    it("sets location correctly", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 5, 10);
      expect(t.getLocationX()).toBe(5);
      expect(t.getLocationY()).toBe(10);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [CurvedType.TIGHTCURVE1, "TC1"],
      [CurvedType.TIGHTCURVE4, "TC4"],
      [CurvedType.CURVE1, "C1"],
      [CurvedType.CURVE8, "C8"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "curved", subtype: type }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("has no platform or levelCrossing fields", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 5, 10);
      expect(t.toString()).toBe("CurvedTrack,C1,5,10,200,100");
    });
  });

  describe("toSaveString", () => {
    it("compact format", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 5, 10);
      expect(t.toSaveString()).toBe("C1,5,10,200,100");
    });
  });

  describe("hasPlatform", () => {
    it("returns false (curved does not support platforms)", () => {
      const t = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
      expect(t.hasPlatform()).toBe(false);
    });
  });
});

// ============================================================================
// LinkedTrack (kind: 'linked')
// ============================================================================

describe("LinkedTrack (kind: 'linked')", () => {
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
      const t = new Track({ kind: "linked", subtype: type }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("constructor", () => {
    it("default location is (0,0)", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      expect(t.getLocationX()).toBe(0);
      expect(t.getLocationY()).toBe(0);
    });
  });

  describe("data.subtype", () => {
    it("accesses subtype via data.subtype", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      expect(t.data.subtype).toBe(LinkedType.LINKLEFT);
    });
  });

  describe("pairing", () => {
    it("isLinked returns false initially", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      expect(t.isLinked()).toBe(false);
    });

    it("getOtherLinkedTrack returns null initially", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      expect(t.getOtherLinkedTrack()).toBeNull();
    });

    it("setOtherLinkedTrack and getOtherLinkedTrack work", () => {
      const a = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      const b = new Track({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
      a.setOtherLinkedTrack(b);
      expect(a.getOtherLinkedTrack()).toBe(b);
      expect(a.isLinked()).toBe(true);
    });

    it("removeOtherLinkedTrack clears the link", () => {
      const a = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      const b = new Track({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
      a.setOtherLinkedTrack(b);
      a.removeOtherLinkedTrack();
      expect(a.isLinked()).toBe(false);
      expect(a.getOtherLinkedTrack()).toBeNull();
    });

    it("bidirectional pairing", () => {
      const a = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      const b = new Track({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 16, 0);
      a.setOtherLinkedTrack(b);
      b.setOtherLinkedTrack(a);
      expect(a.isLinked()).toBe(true);
      expect(b.isLinked()).toBe(true);
    });
  });

  describe("subtypeCode", () => {
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
      const t = new Track({ kind: "linked", subtype: type }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes ',0' when not linked", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 5, 10);
      expect(t.toString()).toBe("LinkedTrack,LL,5,10,200,100,0");
    });

    it("includes ',1,otherTrack' when linked", () => {
      const a = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 5, 10);
      const b = new Track({ kind: "linked", subtype: LinkedType.LINKRIGHT }, 21, 10);
      a.setOtherLinkedTrack(b);
      expect(a.toString()).toContain(",1,");
    });
  });

  describe("toSaveString", () => {
    it("includes ',0' when not linked", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 5, 10);
      expect(t.toSaveString()).toBe("LL,5,10,200,100,0");
    });
  });

  describe("hasPlatform", () => {
    it("returns false (linked does not support platforms)", () => {
      const t = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
      expect(t.hasPlatform()).toBe(false);
    });
  });
});

// ============================================================================
// ExitTrack (kind: 'exit')
// ============================================================================

describe("ExitTrack (kind: 'exit')", () => {
  describe("link grid per type", () => {
    it.each([
      [ExitType.EXITLEFT, [5]],
      [ExitType.EXITRIGHT, [3]],
      [ExitType.EXITUP, [7]],
      [ExitType.EXITDOWN, [1]],
    ])("%s has correct link", (type, expected) => {
      const t = new Track({ kind: "exit", subtype: type }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [ExitType.EXITLEFT, "EL"],
      [ExitType.EXITRIGHT, "ER"],
      [ExitType.EXITUP, "EU"],
      [ExitType.EXITDOWN, "ED"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "exit", subtype: type }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("has correct format", () => {
      const t = new Track({ kind: "exit", subtype: ExitType.EXITLEFT }, 5, 10);
      expect(t.toString()).toBe("ExitTrack,EL,5,10,200,100");
    });
  });

  describe("toSaveString", () => {
    it("compact format", () => {
      const t = new Track({ kind: "exit", subtype: ExitType.EXITLEFT }, 5, 10);
      expect(t.toSaveString()).toBe("EL,5,10,200,100");
    });
  });

  describe("hasPlatform", () => {
    it("returns false (exit does not support platforms)", () => {
      const t = new Track({ kind: "exit", subtype: ExitType.EXITLEFT }, 0, 0);
      expect(t.hasPlatform()).toBe(false);
    });
  });
});

// ============================================================================
// BufferTrack (kind: 'buffer')
// ============================================================================

describe("BufferTrack (kind: 'buffer')", () => {
  describe("link grid per type", () => {
    it.each([
      [BufferType.BUFFERLEFT, [5]],
      [BufferType.BUFFERRIGHT, [3]],
      [BufferType.BUFFERUP, [7]],
      [BufferType.BUFFERDOWN, [1]],
    ])("%s has correct link", (type, expected) => {
      const t = new Track({ kind: "buffer", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [BufferType.BUFFERLEFT, "BL"],
      [BufferType.BUFFERRIGHT, "BR"],
      [BufferType.BUFFERUP, "BU"],
      [BufferType.BUFFERDOWN, "BD"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "buffer", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes platform fields", () => {
      const t = new Track({ kind: "buffer", subtype: BufferType.BUFFERLEFT, platform1: false, platform2: false }, 5, 10);
      expect(t.toString()).toBe("BufferTrack,BL,5,10,200,100,0,0");
    });
  });

  describe("toSaveString", () => {
    it("compact format with platforms", () => {
      const t = new Track({ kind: "buffer", subtype: BufferType.BUFFERLEFT, platform1: false, platform2: false }, 5, 10);
      expect(t.toSaveString()).toBe("BL,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// SignalTrack (kind: 'signal')
// ============================================================================

describe("SignalTrack (kind: 'signal')", () => {
  describe("link grid per type", () => {
    it.each([
      [SignalType.SIGNALLEFT, [3, 5]],
      [SignalType.SIGNALRIGHT, [3, 5]],
      [SignalType.SIGNALUP, [1, 7]],
      [SignalType.SIGNALDOWN, [1, 7]],
    ])("%s has correct links", (type, expected) => {
      const t = new Track({ kind: "signal", subtype: type, aspect: 2, platform1: false, platform2: false }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("aspect", () => {
    it("constructor sets aspect", () => {
      const t = new Track({ kind: "signal", subtype: SignalType.SIGNALLEFT, aspect: 3, platform1: false, platform2: false }, 0, 0);
      expect(t.getAspect()).toBe(3);
    });

    it("aspectToString returns string", () => {
      const t = new Track({ kind: "signal", subtype: SignalType.SIGNALLEFT, aspect: 2, platform1: false, platform2: false }, 0, 0);
      expect(t.aspectToString()).toBe("2");
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [SignalType.SIGNALLEFT, "SIGL"],
      [SignalType.SIGNALRIGHT, "SIGR"],
      [SignalType.SIGNALUP, "SIGU"],
      [SignalType.SIGNALDOWN, "SIGD"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "signal", subtype: type, aspect: 1, platform1: false, platform2: false }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes aspect before coordinates", () => {
      const t = new Track({ kind: "signal", subtype: SignalType.SIGNALLEFT, aspect: 2, platform1: false, platform2: false }, 5, 10);
      expect(t.toString()).toBe("SignalTrack,SIGL,2,5,10,200,100,0,0");
    });
  });

  describe("toSaveString", () => {
    it("includes aspect", () => {
      const t = new Track({ kind: "signal", subtype: SignalType.SIGNALLEFT, aspect: 2, platform1: false, platform2: false }, 5, 10);
      expect(t.toSaveString()).toBe("SIGL,2,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// BridgeUnderpassTrack (kind: 'bridgeUnderpass')
// ============================================================================

describe("BridgeUnderpassTrack (kind: 'bridgeUnderpass')", () => {
  describe("link grid per type", () => {
    it.each([
      [BridgeUnderpassType.BRIDGE1, [3, 5]],
      [BridgeUnderpassType.UNDERPASS1, [3, 5]],
      [BridgeUnderpassType.BRIDGE2, [1, 7]],
      [BridgeUnderpassType.UNDERPASS2, [1, 7]],
    ])("%s has correct links", (type, expected) => {
      const t = new Track({ kind: "bridgeUnderpass", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [BridgeUnderpassType.BRIDGE1, "BR1"],
      [BridgeUnderpassType.BRIDGE2, "BR2"],
      [BridgeUnderpassType.UNDERPASS1, "UP1"],
      [BridgeUnderpassType.UNDERPASS2, "UP2"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "bridgeUnderpass", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes platforms", () => {
      const t = new Track({ kind: "bridgeUnderpass", subtype: BridgeUnderpassType.BRIDGE1, platform1: false, platform2: false }, 5, 10);
      expect(t.toString()).toBe("BridgeUnderpassTrack,BR1,5,10,200,100,0,0");
    });
  });
});

// ============================================================================
// SwitchTrack (kind: 'switch')
// ============================================================================

describe("SwitchTrack (kind: 'switch')", () => {
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
      const t = new Track({ kind: "switch", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(trueLinks(t)).toEqual(expected);
    });
  });

  describe("secondary speed/length", () => {
    it("defaults to 200/100", () => {
      const t = new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [SwitchType.SWITCHTIGHT1, "SWT1"],
      [SwitchType.SWITCHSPLIT1, "SWS1"],
      [SwitchType.SWITCH1, "SW1"],
      [SwitchType.SWITCH16, "SW16"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "switch", subtype: type, platform1: false, platform2: false }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes secondary speed/length + platforms", () => {
      const t = new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 5, 10);
      expect(t.toString()).toBe("SwitchTrack,SW1,5,10,200,100,200,100,0,0");
    });
  });
});

// ============================================================================
// CrossoverTrack (kind: 'crossover')
// ============================================================================

describe("CrossoverTrack (kind: 'crossover')", () => {
  describe("link grid per type", () => {
    it("CROSSOVER1 has 4 cardinal links", () => {
      const t = new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER1 }, 0, 0);
      expect(trueLinks(t)).toEqual([1, 3, 5, 7]);
    });

    it("CROSSOVER2 has 4 diagonal links", () => {
      const t = new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER2 }, 0, 0);
      expect(trueLinks(t)).toEqual([0, 2, 6, 8]);
    });
  });

  describe("secondary speed/length", () => {
    it("defaults to 200/100", () => {
      const t = new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER1 }, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [CrossoverType.CROSSOVER1, "CR1"],
      [CrossoverType.CROSSOVER6, "CR6"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "crossover", subtype: type }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes secondary speed/length", () => {
      const t = new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER1 }, 5, 10);
      expect(t.toString()).toBe("CrossoverTrack,CR1,5,10,200,100,200,100");
    });
  });

  describe("hasPlatform", () => {
    it("returns false (crossover does not support platforms)", () => {
      const t = new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER1 }, 0, 0);
      expect(t.hasPlatform()).toBe(false);
    });
  });
});

// ============================================================================
// FlyoverTrack (kind: 'flyover')
// ============================================================================

describe("FlyoverTrack (kind: 'flyover')", () => {
  describe("link grid per type", () => {
    it("FLYOVER1 has 4 cardinal links", () => {
      const t = new Track({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 0, 0);
      expect(trueLinks(t)).toEqual([1, 3, 5, 7]);
    });
  });

  describe("secondary speed/length", () => {
    it("defaults to 200/100", () => {
      const t = new Track({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 0, 0);
      expect(t.getTrackSecondarySpeed()).toBe(200);
      expect(t.getTrackSecondaryLength()).toBe(100);
    });
  });

  describe("subtypeCode", () => {
    it.each([
      [FlyoverType.FLYOVER1, "F1"],
      [FlyoverType.FLYOVER12, "F12"],
    ])("%s -> %s", (type, expected) => {
      const t = new Track({ kind: "flyover", subtype: type }, 0, 0);
      expect(t.subtypeCode()).toBe(expected);
    });
  });

  describe("toString", () => {
    it("includes secondary speed/length", () => {
      const t = new Track({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 5, 10);
      expect(t.toString()).toBe("FlyoverTrack,F1,5,10,200,100,200,100");
    });
  });

  describe("hasPlatform", () => {
    it("returns false (flyover does not support platforms)", () => {
      const t = new Track({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 0, 0);
      expect(t.hasPlatform()).toBe(false);
    });
  });
});

// ============================================================================
// Inheritance / type-checking via data.kind
// ============================================================================

describe("Track data.kind checks", () => {
  it("a straight track is an instance of Track and NamedElement and Element", () => {
    const t = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
    expect(t).toBeInstanceOf(Track);
    expect(t).toBeInstanceOf(NamedElement);
    expect(t).toBeInstanceOf(Element);
  });

  it("tracks with different kinds are all instances of Track", () => {
    const straight = new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0);
    const curved = new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0);
    const linked = new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0);
    const exit = new Track({ kind: "exit", subtype: ExitType.EXITLEFT }, 0, 0);
    const buffer = new Track({ kind: "buffer", subtype: BufferType.BUFFERLEFT, platform1: false, platform2: false }, 0, 0);
    const signal = new Track({ kind: "signal", subtype: SignalType.SIGNALLEFT, aspect: 2, platform1: false, platform2: false }, 0, 0);
    const bridge = new Track({ kind: "bridgeUnderpass", subtype: BridgeUnderpassType.BRIDGE1, platform1: false, platform2: false }, 0, 0);
    const sw = new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0);
    const crossover = new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER1 }, 0, 0);
    const flyover = new Track({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 0, 0);

    expect(straight).toBeInstanceOf(Track);
    expect(curved).toBeInstanceOf(Track);
    expect(linked).toBeInstanceOf(Track);
    expect(exit).toBeInstanceOf(Track);
    expect(buffer).toBeInstanceOf(Track);
    expect(signal).toBeInstanceOf(Track);
    expect(bridge).toBeInstanceOf(Track);
    expect(sw).toBeInstanceOf(Track);
    expect(crossover).toBeInstanceOf(Track);
    expect(flyover).toBeInstanceOf(Track);
  });

  it("data.kind distinguishes track types", () => {
    expect(new Track({ kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false }, 0, 0).data.kind).toBe("straight");
    expect(new Track({ kind: "curved", subtype: CurvedType.CURVE1 }, 0, 0).data.kind).toBe("curved");
    expect(new Track({ kind: "linked", subtype: LinkedType.LINKLEFT }, 0, 0).data.kind).toBe("linked");
    expect(new Track({ kind: "exit", subtype: ExitType.EXITLEFT }, 0, 0).data.kind).toBe("exit");
    expect(new Track({ kind: "buffer", subtype: BufferType.BUFFERLEFT, platform1: false, platform2: false }, 0, 0).data.kind).toBe("buffer");
    expect(new Track({ kind: "signal", subtype: SignalType.SIGNALLEFT, aspect: 2, platform1: false, platform2: false }, 0, 0).data.kind).toBe("signal");
    expect(new Track({ kind: "bridgeUnderpass", subtype: BridgeUnderpassType.BRIDGE1, platform1: false, platform2: false }, 0, 0).data.kind).toBe("bridgeUnderpass");
    expect(new Track({ kind: "switch", subtype: SwitchType.SWITCH1, platform1: false, platform2: false }, 0, 0).data.kind).toBe("switch");
    expect(new Track({ kind: "crossover", subtype: CrossoverType.CROSSOVER1 }, 0, 0).data.kind).toBe("crossover");
    expect(new Track({ kind: "flyover", subtype: FlyoverType.FLYOVER1 }, 0, 0).data.kind).toBe("flyover");
  });
});
