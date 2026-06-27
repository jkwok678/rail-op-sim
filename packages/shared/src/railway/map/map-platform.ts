import {
  Platform,
  StraightType,
  DirectedType,
  BufferType,
  SignalType,
  BridgeUnderpassType,
  SwitchType,
} from "../enums";
import type { Map_ } from "./map";
import { linkNewElementToText } from "./map-text-linking";

// ============================================================================
// Platform & level-crossing helpers for Map_
// ============================================================================
//
// Extracted from the Map_ class. Each function receives the Map_ instance
// and uses its public API to iterate track lists.
// ============================================================================

/**
 * Add a platform to a track at the given coordinates.
 * (Formerly Map_.addPlatform.)
 */
export function addPlatform(
  map: Map_,
  side: Platform,
  locationX: number,
  locationY: number,
): void {
  let added = false;

  // StraightTrack
  for (const ct of map.getStraightTrackList()) {
    if (
      ct.getLocationX() === locationX &&
      ct.getLocationY() === locationY
    ) {
      if (!ct.hasLevelCrossing() && !ct.hasLinkedNamedLocation()) {
        switch (side) {
          case Platform.UP:
            if (ct.getStraightType() === StraightType.STRAIGHTH) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.DOWN:
            if (ct.getStraightType() === StraightType.STRAIGHTH) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case Platform.LEFT:
            if (ct.getStraightType() === StraightType.STRAIGHTV) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.RIGHT:
            if (ct.getStraightType() === StraightType.STRAIGHTV) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
        }
      }
    }
  }

  // DirectedTrack
  if (!added) {
    for (const ct of map.getDirectedTrackList()) {
      if (
        ct.getLocationX() === locationX &&
        ct.getLocationY() === locationY &&
        !ct.hasLinkedNamedLocation()
      ) {
        switch (side) {
          case Platform.LEFT:
            if (
              ct.getDirectType() === DirectedType.DIRECTEDUP ||
              ct.getDirectType() === DirectedType.DIRECTEDDOWN
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.RIGHT:
            if (
              ct.getDirectType() === DirectedType.DIRECTEDUP ||
              ct.getDirectType() === DirectedType.DIRECTEDDOWN
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case Platform.UP:
            if (
              ct.getDirectType() === DirectedType.DIRECTEDLEFT ||
              ct.getDirectType() === DirectedType.DIRECTEDRIGHT
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.DOWN:
            if (
              ct.getDirectType() === DirectedType.DIRECTEDLEFT ||
              ct.getDirectType() === DirectedType.DIRECTEDRIGHT
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
        }
      }
    }
  }

  // BufferTrack
  if (!added) {
    for (const ct of map.getBufferTrackList()) {
      if (
        ct.getLocationX() === locationX &&
        ct.getLocationY() === locationY &&
        !ct.hasLinkedNamedLocation()
      ) {
        switch (side) {
          case Platform.LEFT:
            if (
              ct.getBufferType() === BufferType.BUFFERUP ||
              ct.getBufferType() === BufferType.BUFFERDOWN
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.RIGHT:
            if (
              ct.getBufferType() === BufferType.BUFFERUP ||
              ct.getBufferType() === BufferType.BUFFERDOWN
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case Platform.UP:
            if (
              ct.getBufferType() === BufferType.BUFFERLEFT ||
              ct.getBufferType() === BufferType.BUFFERRIGHT
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.DOWN:
            if (
              ct.getBufferType() === BufferType.BUFFERLEFT ||
              ct.getBufferType() === BufferType.BUFFERRIGHT
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
        }
      }
    }
  }

  // SignalTrack
  if (!added) {
    for (const ct of map.getSignalTrackList()) {
      if (
        ct.getLocationX() === locationX &&
        ct.getLocationY() === locationY &&
        !ct.hasLinkedNamedLocation()
      ) {
        switch (side) {
          case Platform.LEFT:
            if (
              ct.getSignalType() === SignalType.SIGNALUP ||
              ct.getSignalType() === SignalType.SIGNALDOWN
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.RIGHT:
            if (
              ct.getSignalType() === SignalType.SIGNALUP ||
              ct.getSignalType() === SignalType.SIGNALDOWN
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case Platform.UP:
            if (
              ct.getSignalType() === SignalType.SIGNALLEFT ||
              ct.getSignalType() === SignalType.SIGNALRIGHT
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.DOWN:
            if (
              ct.getSignalType() === SignalType.SIGNALLEFT ||
              ct.getSignalType() === SignalType.SIGNALRIGHT
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
        }
      }
    }
  }

  // BridgeUnderpassTrack
  if (!added) {
    for (const ct of map.getBridgeUnderpassTrackList()) {
      if (
        ct.getLocationX() === locationX &&
        ct.getLocationY() === locationY
      ) {
        switch (side) {
          case Platform.LEFT:
            if (
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.BRIDGE2 ||
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.UNDERPASS2
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.RIGHT:
            if (
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.BRIDGE2 ||
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.UNDERPASS2
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case Platform.UP:
            if (
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.BRIDGE1 ||
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.UNDERPASS1
            ) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case Platform.DOWN:
            if (
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.BRIDGE1 ||
              ct.getBridgeUnderpassType() ===
                BridgeUnderpassType.UNDERPASS1
            ) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
        }
      }
    }
  }

  // SwitchTrack
  if (!added) {
    for (const ct of map.getSwitchTrackList()) {
      if (
        ct.getLocationX() === locationX &&
        ct.getLocationY() === locationY
      ) {
        switch (ct.getSwitchType()) {
          case SwitchType.SWITCHTIGHT1:
          case SwitchType.SWITCHTIGHT2:
          case SwitchType.SWITCH1:
          case SwitchType.SWITCH2:
            if (side === Platform.DOWN) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case SwitchType.SWITCHTIGHT3:
          case SwitchType.SWITCHTIGHT4:
          case SwitchType.SWITCH3:
          case SwitchType.SWITCH4:
            if (side === Platform.UP) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
          case SwitchType.SWITCHTIGHT5:
          case SwitchType.SWITCHTIGHT7:
          case SwitchType.SWITCH5:
          case SwitchType.SWITCH7:
            if (side === Platform.RIGHT) {
              ct.setPlatform2(true);
              added = true;
            }
            break;
          case SwitchType.SWITCHTIGHT6:
          case SwitchType.SWITCHTIGHT8:
          case SwitchType.SWITCH6:
          case SwitchType.SWITCH8:
            if (side === Platform.LEFT) {
              ct.setPlatform1(true);
              added = true;
            }
            break;
        }
      }
    }
  }

  linkNewElementToText(map, locationX, locationY);
}

/**
 * Add a level crossing at the given coordinates.
 * (Formerly Map_.addLevelCrossing.)
 */
export function addLevelCrossing(
  map: Map_,
  locationX: number,
  locationY: number,
): void {
  for (const el of map.getStraightTrackList()) {
    if (
      el.getLocationX() === locationX &&
      el.getLocationY() === locationY
    ) {
      if (
        !(
          el.hasPlatform() ||
          el.hasLevelCrossing() ||
          el.hasLinkedNamedLocation()
        )
      ) {
        el.addLevelCrossing();
      }
    }
  }
}
