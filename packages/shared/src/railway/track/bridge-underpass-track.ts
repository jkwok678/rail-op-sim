import { BridgeUnderpassType } from "../enums";
import { StraightTrack } from "./straight-track";

// ============================================================================
// BridgeUnderpassTrack — 4 types, 2 links, inherits StraightTrack
// ============================================================================

/**
 * @brief Bridge or underpass track. 4 types, 2 links, inherits StraightTrack.
 * Ported from RailwayBuilder track.h / track.cpp BridgeUnderpassTrack class.
 */
export class BridgeUnderpassTrack extends StraightTrack {
  private bridgeUnderpassType: BridgeUnderpassType;

  constructor(
    newBridgeUnderpassType: BridgeUnderpassType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super();
    this.bridgeUnderpassType = newBridgeUnderpassType;
    this.locationX = newLocationX;
    this.locationY = newLocationY;
    switch (this.bridgeUnderpassType) {
      case BridgeUnderpassType.BRIDGE1:
      case BridgeUnderpassType.UNDERPASS1:
        this.links[3] = true;
        this.links[5] = true;
        break;
      case BridgeUnderpassType.BRIDGE2:
      case BridgeUnderpassType.UNDERPASS2:
        this.links[1] = true;
        this.links[7] = true;
        break;
    }
  }

  getBridgeUnderpassType(): BridgeUnderpassType {
    return this.bridgeUnderpassType;
  }

  setBridgeUnderpassType(
    newBridgeUnderpassType: BridgeUnderpassType,
  ): void {
    this.bridgeUnderpassType = newBridgeUnderpassType;
  }

  /** @returns "BR1" | "BR2" | "UP1" | "UP2" */
  bridgeUnderpassTypeToString(): string {
    switch (this.bridgeUnderpassType) {
      case BridgeUnderpassType.BRIDGE1:
        return "BR1";
      case BridgeUnderpassType.BRIDGE2:
        return "BR2";
      case BridgeUnderpassType.UNDERPASS1:
        return "UP1";
      case BridgeUnderpassType.UNDERPASS2:
        return "UP2";
    }
  }

  /** @returns "BridgeUnderpassTrack,<type>,x,y,speed,length,p1,p2[,Text...]" */
  toString(): string {
    let result = `BridgeUnderpassTrack,${this.bridgeUnderpassTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length,p1,p2[,readableText]" */
  toSaveString(): string {
    let result = `${this.bridgeUnderpassTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
