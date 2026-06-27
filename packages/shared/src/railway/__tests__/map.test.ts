import { describe, it, expect, vi } from "vitest";
import { Map_ } from "../map";
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
  ParapetType,
} from "../enums";
import type { MessageCallback, TextSelectionPrompt, FontInfo } from "../types";
import { Text } from "../element";

const testFont: FontInfo = { family: "Arial", pointSize: 12 };

function makeMap(onMessage?: MessageCallback): Map_ {
  return new Map_({ onMessage });
}

// ============================================================================
// Initial state
// ============================================================================

describe("Map initial state", () => {
  it("imageSize defaults to 16", () => {
    const map = new Map_();
    expect(map.getImageSize()).toBe(16);
  });

  it("totalTrack defaults to 0", () => {
    const map = new Map_();
    expect(map.getTotalTrack()).toBe(0);
  });

  it("all element lists are empty", () => {
    const map = new Map_();
    expect(map.getStraightTrackList()).toEqual([]);
    expect(map.getDirectedTrackList()).toEqual([]);
    expect(map.getCurvedTrackList()).toEqual([]);
    expect(map.getLinkedTrackList()).toEqual([]);
    expect(map.getExitTrackList()).toEqual([]);
    expect(map.getBufferTrackList()).toEqual([]);
    expect(map.getSignalTrackList()).toEqual([]);
    expect(map.getBridgeUnderpassTrackList()).toEqual([]);
    expect(map.getSwitchTrackList()).toEqual([]);
    expect(map.getCrossoverTrackList()).toEqual([]);
    expect(map.getFlyoverTrackList()).toEqual([]);
    expect(map.getNamedLocationList()).toEqual([]);
    expect(map.getConcourseList()).toEqual([]);
    expect(map.getParapetList()).toEqual([]);
    expect(map.getTextList()).toEqual([]);
  });

  it("linkedTrack1/2 are null", () => {
    const map = new Map_();
    expect(map.getLinkedTrack1()).toBeNull();
    expect(map.getLinkedTrack2()).toBeNull();
  });

  it("textToMove is null", () => {
    const map = new Map_();
    expect(map.getTextToMove()).toBeNull();
  });

  it("callbacks are null when not provided", () => {
    const map = new Map_();
    expect(map.getTextSelectionPrompt()).toBeNull();
    expect(map.getOnMessage()).toBeNull();
  });
});

// ============================================================================
// General
// ============================================================================

describe("setImageSize", () => {
  it("updates image size", () => {
    const map = new Map_();
    map.setImageSize(32);
    expect(map.getImageSize()).toBe(32);
  });
});

// ============================================================================
// CRUD - StraightTrack
// ============================================================================

describe("StraightTrack CRUD", () => {
  it("createAddStraightTrack adds to list", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.getStraightTrackList()).toHaveLength(1);
  });

  it("checkStraightTrackAt returns true after add", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.checkStraightTrackAt(0, 0)).toBe(true);
  });

  it("getStraightTrackAt returns the added instance", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    const track = map.getStraightTrackAt(0, 0);
    expect(track).not.toBeNull();
    expect(track!.getStraightType()).toBe(StraightType.STRAIGHTH);
  });

  it("checkStraightTrackAt returns false for empty coord", () => {
    const map = new Map_();
    expect(map.checkStraightTrackAt(10, 10)).toBe(false);
  });

  it("checkElementExists returns true after add", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.checkElementExists(0, 0)).toBe(true);
  });

  it("totalTrack increments after add", () => {
    const map = new Map_();
    expect(map.getTotalTrack()).toBe(0);
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.getTotalTrack()).toBe(1);
  });

  it("adding at occupied coordinate is silently ignored", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.getStraightTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });
});

// ============================================================================
// CRUD - all track types compact
// ============================================================================

describe("Track type CRUD (all 11 types)", () => {
  it("createAddDirectedTrack adds to directed list and increments totalTrack", () => {
    const map = new Map_();
    map.createAddDirectedTrack(DirectedType.DIRECTEDLEFT, 0, 0);
    expect(map.getDirectedTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
    expect(map.checkDirectedTrackAt(0, 0)).toBe(true);
  });

  it("createAddCurvedTrack adds to curved list", () => {
    const map = new Map_();
    map.createAddCurvedTrack(CurvedType.CURVE1, 0, 0);
    expect(map.getCurvedTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
    expect(map.checkCurvedTrackAt(0, 0)).toBe(true);
  });

  it("createAddLinkedTrack adds to linked list", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    expect(map.getLinkedTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
    expect(map.checkLinkedTrackAt(0, 0)).toBe(true);
  });

  it("createAddExitTrack adds to exit list", () => {
    const map = new Map_();
    map.createAddExitTrack(ExitType.EXITLEFT, 0, 0);
    expect(map.getExitTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
    expect(map.checkExitTrackAt(0, 0)).toBe(true);
  });

  it("createAddBufferTrack adds to buffer list", () => {
    const map = new Map_();
    map.createAddBufferTrack(BufferType.BUFFERLEFT, 0, 0);
    expect(map.getBufferTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });

  it("createAddSignalTrack adds to signal list", () => {
    const map = new Map_();
    map.createAddSignalTrack(SignalType.SIGNALLEFT, 2, 0, 0);
    expect(map.getSignalTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });

  it("createAddBridgeUnderpassTrack adds to bridge list", () => {
    const map = new Map_();
    map.createAddBridgeUnderpassTrack(BridgeUnderpassType.BRIDGE1, 0, 0);
    expect(map.getBridgeUnderpassTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });

  it("createAddSwitchTrack adds to switch list", () => {
    const map = new Map_();
    map.createAddSwitchTrack(SwitchType.SWITCH1, 0, 0);
    expect(map.getSwitchTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });

  it("createAddCrossoverTrack adds to crossover list", () => {
    const map = new Map_();
    map.createAddCrossoverTrack(CrossoverType.CROSSOVER1, 0, 0);
    expect(map.getCrossoverTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });

  it("createAddFlyoverTrack adds to flyover list", () => {
    const map = new Map_();
    map.createAddFlyoverTrack(FlyoverType.FLYOVER1, 0, 0);
    expect(map.getFlyoverTrackList()).toHaveLength(1);
    expect(map.getTotalTrack()).toBe(1);
  });
});

// ============================================================================
// CRUD - NamedLocation, Concourse, Parapet
// ============================================================================

describe("Non-track element CRUD", () => {
  it("createAddNamedLocation adds to namedLocationList (on empty coord)", () => {
    const map = new Map_();
    map.createAddNamedLocation(0, 0);
    expect(map.getNamedLocationList()).toHaveLength(1);
  });

  it("createAddConcourse adds to concourseList", () => {
    const map = new Map_();
    map.createAddConcourse(0, 0);
    expect(map.getConcourseList()).toHaveLength(1);
  });

  it("createAddParapet adds to parapetList", () => {
    const map = new Map_();
    map.createAddParapet(ParapetType.PARAPET1, 0, 0);
    expect(map.getParapetList()).toHaveLength(1);
  });

  it("non-track elements do NOT increment totalTrack", () => {
    const map = new Map_();
    map.createAddConcourse(0, 0);
    map.createAddParapet(ParapetType.PARAPET1, 16, 0);
    expect(map.getTotalTrack()).toBe(0);
  });
});

// ============================================================================
// existence checks
// ============================================================================

describe("Existence guards", () => {
  it("checkElementExists on empty coord returns false", () => {
    const map = new Map_();
    expect(map.checkElementExists(100, 100)).toBe(false);
  });

  it("checkCanAddNamedLocation on empty coord returns true", () => {
    const map = new Map_();
    expect(map.checkCanAddNamedLocation(100, 100)).toBe(true);
  });

  it("checkCanAddNamedLocation on STRAIGHTH returns true", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.checkCanAddNamedLocation(0, 0)).toBe(true);
  });

  it("checkCanAddNamedLocation on STRAIGHTH with platform returns false", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    const track = map.getStraightTrackAt(0, 0)!;
    track.setPlatform1(true);
    expect(map.checkCanAddNamedLocation(0, 0)).toBe(false);
  });

  it("checkCanAddNamedLocation on angled straight returns false", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTLEFTUP, 0, 0);
    expect(map.checkCanAddNamedLocation(0, 0)).toBe(false);
  });
});

// ============================================================================
// makeTrackList
// ============================================================================

describe("makeTrackList / getTrackList", () => {
  it("empty map produces empty trackList", () => {
    const map = new Map_();
    map.makeTrackList();
    expect(map.getTrackList()).toEqual([]);
  });

  it("one of each track type produces 11 items", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    map.createAddDirectedTrack(DirectedType.DIRECTEDLEFT, 16, 0);
    map.createAddCurvedTrack(CurvedType.CURVE1, 32, 0);
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 48, 0);
    map.createAddExitTrack(ExitType.EXITLEFT, 64, 0);
    map.createAddBufferTrack(BufferType.BUFFERLEFT, 80, 0);
    map.createAddSignalTrack(SignalType.SIGNALLEFT, 2, 96, 0);
    map.createAddBridgeUnderpassTrack(BridgeUnderpassType.BRIDGE1, 112, 0);
    map.createAddSwitchTrack(SwitchType.SWITCH1, 128, 0);
    map.createAddCrossoverTrack(CrossoverType.CROSSOVER1, 144, 0);
    map.createAddFlyoverTrack(FlyoverType.FLYOVER1, 160, 0);
    map.makeTrackList();
    expect(map.getTrackList()).toHaveLength(11);
  });
});

// ============================================================================
// LinkedTrack state machine
// ============================================================================

describe("LinkedTrack state machine", () => {
  it("connectTwoLinkedTracks: first click sets linkedTrack1", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    map.createAddLinkedTrack(LinkedType.LINKRIGHT, 16, 0);
    map.connectTwoLinkedTracks(0, 0);
    expect(map.getLinkedTrack1()).not.toBeNull();
    expect(map.getLinkedTrack2()).toBeNull();
  });

  it("connectTwoLinkedTracks: second click pairs them", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    map.createAddLinkedTrack(LinkedType.LINKRIGHT, 16, 0);
    map.connectTwoLinkedTracks(0, 0);
    map.connectTwoLinkedTracks(16, 0);
    const a = map.getLinkedTrackAt(0, 0)!;
    const b = map.getLinkedTrackAt(16, 0)!;
    expect(a.isLinked()).toBe(true);
    expect(b.isLinked()).toBe(true);
  });

  it("connectTwoLinkedTracks: same location twice is no-op", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    map.connectTwoLinkedTracks(0, 0);
    map.connectTwoLinkedTracks(0, 0); // same location
    // Second click: temp2 === linkedTrack1, so the if block does not execute
    // linkedTrack1 remains set, linkedTrack2 remains null
    expect(map.getLinkedTrack1()).not.toBeNull();
    expect(map.getLinkedTrack2()).toBeNull();
  });

  it("checkAllLinkedTrackLinked: empty list returns true", () => {
    const map = new Map_();
    expect(map.checkAllLinkedTrackLinked()).toBe(true);
  });

  it("checkAllLinkedTrackLinked: odd count returns false", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    expect(map.checkAllLinkedTrackLinked()).toBe(false);
  });

  it("checkAllLinkedTrackLinked: even unlinked returns false", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    map.createAddLinkedTrack(LinkedType.LINKRIGHT, 16, 0);
    expect(map.checkAllLinkedTrackLinked()).toBe(false);
  });

  it("checkAllLinkedTrackLinked: even all linked returns true", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    map.createAddLinkedTrack(LinkedType.LINKRIGHT, 16, 0);
    map.connectTwoLinkedTracks(0, 0);
    map.connectTwoLinkedTracks(16, 0);
    expect(map.checkAllLinkedTrackLinked()).toBe(true);
  });
});

// ============================================================================
// deleteElement
// ============================================================================

describe("deleteElement", () => {
  it("deletes track from list and decrements totalTrack", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.getTotalTrack()).toBe(1);
    expect(map.deleteElement(0, 0)).toBe(true);
    expect(map.getTotalTrack()).toBe(0);
    expect(map.getStraightTrackList()).toHaveLength(0);
  });

  it("deletes NamedLocation", () => {
    const map = new Map_();
    map.createAddNamedLocation(0, 0);
    expect(map.deleteElement(0, 0)).toBe(true);
    expect(map.getNamedLocationList()).toHaveLength(0);
  });

  it("deletes Concourse", () => {
    const map = new Map_();
    map.createAddConcourse(0, 0);
    expect(map.deleteElement(0, 0)).toBe(true);
    expect(map.getConcourseList()).toHaveLength(0);
  });

  it("deletes Parapet", () => {
    const map = new Map_();
    map.createAddParapet(ParapetType.PARAPET1, 0, 0);
    expect(map.deleteElement(0, 0)).toBe(true);
    expect(map.getParapetList()).toHaveLength(0);
  });

  it("returns false for empty coordinate", () => {
    const map = new Map_();
    expect(map.deleteElement(999, 999)).toBe(false);
  });

  it("deleting linked track disconnects the pair", () => {
    const map = new Map_();
    map.createAddLinkedTrack(LinkedType.LINKLEFT, 0, 0);
    map.createAddLinkedTrack(LinkedType.LINKRIGHT, 16, 0);
    map.connectTwoLinkedTracks(0, 0);
    map.connectTwoLinkedTracks(16, 0);
    const b = map.getLinkedTrackAt(16, 0)!;
    expect(b.isLinked()).toBe(true);
    map.deleteElement(0, 0);
    expect(b.isLinked()).toBe(false);
  });

  it("deleteElement cascades text cleanup for named tracks", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    const track = map.getStraightTrackAt(0, 0)!;
    const text = map.createAddText(0, 0, "Platform A", testFont);
    track.setText(text);
    expect(map.getTextList()).toHaveLength(1);
    map.deleteElement(0, 0);
    // The text should be removed from all elements and deleted
    expect(map.getTextList()).toHaveLength(0);
  });
});

// ============================================================================
// Text CRUD
// ============================================================================

describe("Text CRUD", () => {
  it("createAddText adds to textList and returns Text", () => {
    const map = new Map_();
    const text = map.createAddText(0, 0, "Station", testFont);
    expect(text).toBeInstanceOf(Text);
    expect(map.getTextList()).toHaveLength(1);
    expect(text.getReadableText()).toBe("Station");
  });

  it("createAddLinkText: empty string does nothing", () => {
    const map = new Map_();
    map.createAddLinkText(0, 0, "", true, testFont);
    expect(map.getTextList()).toHaveLength(0);
  });

  it("createAddLinkText: leading space string treated as empty", () => {
    const map = new Map_();
    map.createAddLinkText(0, 0, " test", true, testFont);
    expect(map.getTextList()).toHaveLength(0);
  });

  it("createAddLinkText: non-empty creates text", () => {
    const map = new Map_();
    map.createAddLinkText(0, 0, "Platform A", true, testFont);
    expect(map.getTextList()).toHaveLength(1);
  });

  it("setTextToMove finds text and sets textToMove", () => {
    const map = new Map_();
    map.createAddText(0, 0, "Station", testFont);
    const result = map.setTextToMove(0, 0);
    expect(result).toBe(true);
    expect(map.getTextToMove()).not.toBeNull();
  });

  it("setTextToMove returns false when no text at coordinate", () => {
    const map = new Map_();
    const result = map.setTextToMove(100, 100);
    expect(result).toBe(false);
    expect(map.getTextToMove()).toBeNull();
  });

  it("moveText updates location and editable offsets", () => {
    const map = new Map_();
    const text = map.createAddText(0, 0, "Station", testFont);
    map.setTextToMove(0, 0);
    map.moveText(50, 50);
    expect(text.getLocationX()).toBe(50);
    expect(text.getLocationY()).toBe(50);
    expect(text.getEditableX()).toBe(62); // 50 + fontSize(12)
    expect(text.getEditableY()).toBe(62);
  });

  it("deleteText removes from textList", () => {
    const map = new Map_();
    const text = map.createAddText(0, 0, "Station", testFont);
    expect(map.getTextList()).toHaveLength(1);
    map.deleteText(text);
    expect(map.getTextList()).toHaveLength(0);
  });

  it("deleteText returns false for text not in list", () => {
    const map = new Map_();
    const text = new Text(0, 0, "orphan", testFont);
    expect(map.deleteText(text)).toBe(false);
  });
});

// ============================================================================
// Callback injection
// ============================================================================

describe("Callback injection", () => {
  it("constructor stores textSelectionPrompt callback", () => {
    const prompt: TextSelectionPrompt = () => "selected";
    const map = new Map_({ textSelectionPrompt: prompt });
    expect(map.getTextSelectionPrompt()).toBe(prompt);
  });

  it("constructor stores onMessage callback", () => {
    const onMsg: MessageCallback = () => {};
    const map = new Map_({ onMessage: onMsg });
    expect(map.getOnMessage()).toBe(onMsg);
  });

  it("callbacks are null when not provided", () => {
    const map = new Map_();
    expect(map.getTextSelectionPrompt()).toBeNull();
    expect(map.getOnMessage()).toBeNull();
  });
});

// ============================================================================
// Unified lookups
// ============================================================================

describe("Unified lookups", () => {
  it("getTrackAt returns null for empty map", () => {
    const map = new Map_();
    expect(map.getTrackAt(0, 0)).toBeNull();
  });

  it("getTrackAt finds any track type", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    map.createAddCurvedTrack(CurvedType.CURVE1, 16, 0);
    expect(map.getTrackAt(0, 0)).not.toBeNull();
    expect(map.getTrackAt(16, 0)).not.toBeNull();
  });

  it("hasTrackAt returns correct boolean", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    expect(map.hasTrackAt(0, 0)).toBe(true);
    expect(map.hasTrackAt(16, 0)).toBe(false);
  });

  it("getElementAt returns track at coordinate", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    const el = map.getElementAt(0, 0);
    expect(el).not.toBeNull();
    expect(el!.locationToString()).toBe("0,0");
  });

  it("getElementAt returns non-track element", () => {
    const map = new Map_();
    map.createAddConcourse(0, 0);
    const el = map.getElementAt(0, 0);
    expect(el).not.toBeNull();
  });

  it("hasElementAt returns correct boolean", () => {
    const map = new Map_();
    expect(map.hasElementAt(0, 0)).toBe(false);
    map.createAddConcourse(0, 0);
    expect(map.hasElementAt(0, 0)).toBe(true);
  });

  it("getTrackHasPlatformAt returns StraightTrack subclasses only", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    map.createAddCurvedTrack(CurvedType.CURVE1, 16, 0);
    expect(map.getTrackHasPlatformAt(0, 0)).not.toBeNull();
    expect(map.getTrackHasPlatformAt(16, 0)).toBeNull(); // curved has no platforms
  });
});

// ============================================================================
// Save string methods
// ============================================================================

describe("List to save string methods", () => {
  it("straightTrackListToSaveString returns joined save strings", () => {
    const map = new Map_();
    map.createAddStraightTrack(StraightType.STRAIGHTH, 0, 0);
    map.createAddStraightTrack(StraightType.STRAIGHTH, 16, 0);
    const result = map.straightTrackListToSaveString();
    expect(result).toContain("SH,0,0,200,100,0,0,0");
    expect(result).toContain("\n");
  });

  it("textListToSaveString returns joined text save strings", () => {
    const map = new Map_();
    map.createAddText(0, 0, "A", testFont);
    map.createAddText(16, 0, "B", testFont);
    const result = map.textListToSaveString();
    expect(result).toContain("0,0,A,Arial,12");
    expect(result).toContain("\n");
  });
});
