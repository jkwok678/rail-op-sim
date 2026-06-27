import { describe, it, expect, vi } from "vitest";
import { Map_ } from "../map";
import { checkAllTracksConnected } from "../map/map-connectivity";
import {
  StraightType,
  LinkedType,
  SwitchType,
  CurvedType,
  ExitType,
} from "../enums";
// ============================================================================
// checkAllTracksConnected
// ============================================================================

describe("checkAllTracksConnected", () => {
  it("empty map returns false and calls onMessage with error", () => {
    const onMessage = vi.fn();
    const map = new Map_({ onMessage });
    expect(checkAllTracksConnected(map)).toBe(false);
    expect(onMessage).toHaveBeenCalledWith(
      "error",
      "There are zero tracks stored.",
    );
  });

  it("single track returns false", () => {
    const map = new Map_();
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    expect(checkAllTracksConnected(map)).toBe(false);
  });

  it("two connected horizontal straight tracks terminated by exit tracks return true", () => {
    const map = new Map_();
    // STRAIGHTH: links[3]=left (checks cx-16,cy), links[5]=right (checks cx+16,cy)
    map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);     // link[5] checks (0,0) ✓
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      16,
      0,
    );
    map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);     // link[3] checks (16,0) ✓
    expect(checkAllTracksConnected(map)).toBe(true);
  });

  it("two tracks not at 16px offset return false", () => {
    const map = new Map_();
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      32,
      0,
    );
    // Track at (0,0) links[5] checks (16,0) -> no track
    expect(checkAllTracksConnected(map)).toBe(false);
  });

  it("two disconnected tracks at different y values return false", () => {
    const map = new Map_();
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      16,
    );
    // STRAIGHTH is horizontal: links left/right, not up/down
    expect(checkAllTracksConnected(map)).toBe(false);
  });

  it("two connected vertical straight tracks terminated by exit tracks return true", () => {
    const map = new Map_();
    // STRAIGHTV: links[1]=top (checks cx, cy+16), links[7]=bottom (checks cx, cy-16)
    map.addTrack({ kind: "exit", subtype: ExitType.EXITDOWN }, 0, -16);     // link[1] checks (0,0) ✓
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTV, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTV, platform1: false, platform2: false, levelCrossing: false },
      0,
      16,
    );
    map.addTrack({ kind: "exit", subtype: ExitType.EXITUP }, 0, 32);        // link[7] checks (0,16) ✓
    expect(checkAllTracksConnected(map)).toBe(true);
  });

  it("TIGHTCURVE1 + STRAIGHTH at correct offset terminated by exit tracks returns true", () => {
    const map = new Map_();
    // TIGHTCURVE1: links[5]=right (checks 16,0), links[7]=bottom (checks 0,-16)
    // STRAIGHTH at (16,0): links[3]=left (checks 0,0), links[5]=right (checks 32,0)
    map.addTrack({ kind: "exit", subtype: ExitType.EXITDOWN }, 0, -16);     // link[1] checks (0,0) ✓
    map.addTrack({ kind: "curved", subtype: CurvedType.TIGHTCURVE1 }, 0, 0);
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      16,
      0,
    );
    map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);     // link[3] checks (16,0) ✓
    expect(checkAllTracksConnected(map)).toBe(true);
  });

  it("switch track with 3 exit tracks resolves all links", () => {
    const map = new Map_();
    // SWITCHTIGHT1: links[1]=top, [3]=left, [5]=right
    map.addTrack(
      { kind: "switch", subtype: SwitchType.SWITCHTIGHT1, platform1: false, platform2: false },
      0,
      0,
    );
    // link[1] checks (0, 16) → EXITUP at (0,16): link[7]=bottom checks (0,0) ✓
    // link[3] checks (-16, 0) → EXITLEFT at (-16,0): link[5]=right checks (0,0) ✓
    // link[5] checks (16, 0) → EXITRIGHT at (16,0): link[3]=left checks (0,0) ✓
    map.addTrack({ kind: "exit", subtype: ExitType.EXITUP }, 0, 16);
    map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
    map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 16, 0);
    expect(checkAllTracksConnected(map)).toBe(true);
  });

  it("switch track with only 2 of 3 links connected returns false", () => {
    const map = new Map_();
    map.addTrack(
      { kind: "switch", subtype: SwitchType.SWITCHTIGHT1, platform1: false, platform2: false },
      0,
      0,
    );
    map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0); // for link[3]
    map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 16, 0);  // for link[5]
    // Missing track at (0, 16) for link[1]
    expect(checkAllTracksConnected(map)).toBe(false);
  });

  it("all tracks connected but LinkedTracks unlinked returns false", () => {
    const map = new Map_();
    // Create a connected stretch: EXITLEFT(-16,0) -> STRAIGHTH(0,0) -> STRAIGHTH(16,0) -> EXITRIGHT(32,0)
    map.addTrack({ kind: "exit", subtype: ExitType.EXITLEFT }, -16, 0);
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      16,
      0,
    );
    map.addTrack({ kind: "exit", subtype: ExitType.EXITRIGHT }, 32, 0);
    // Add unlinked LinkedTracks — odd count means checkAllLinkedTrackLinked fails
    map.addTrack({ kind: "linked", subtype: LinkedType.LINKLEFT }, 48, 0);
    expect(checkAllTracksConnected(map)).toBe(false);
  });

  it("onMessage not called when there are tracks (even if disconnected)", () => {
    const onMessage = vi.fn();
    const map = new Map_({ onMessage });
    map.addTrack(
      { kind: "straight", subtype: StraightType.STRAIGHTH, platform1: false, platform2: false, levelCrossing: false },
      0,
      0,
    );
    checkAllTracksConnected(map);
    // onMessage should not be called because trackList is not empty
    expect(onMessage).not.toHaveBeenCalled();
  });
});
