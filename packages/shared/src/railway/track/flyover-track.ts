import { FlyoverType } from "../enums";
import { Track } from "./track-base";

// ============================================================================
// FlyoverTrack — 12 types, 4 links, secondary speed/length
// ============================================================================

/**
 * @brief Grade-separated crossing. 12 types, 4 links, secondary speed/length.
 * Ported from RailwayBuilder track.h / track.cpp FlyoverTrack class.
 */
export class FlyoverTrack extends Track {
  private flyoverType: FlyoverType;

  constructor(
    newFlyoverType: FlyoverType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super(newLocationX, newLocationY);
    this.flyoverType = newFlyoverType;
    this.setDefaultSecondarySpeedLength();
    switch (this.flyoverType) {
      case FlyoverType.FLYOVER1:
      case FlyoverType.FLYOVER2:
        this.links[1] = true;
        this.links[3] = true;
        this.links[5] = true;
        this.links[7] = true;
        break;
      case FlyoverType.FLYOVER3:
      case FlyoverType.FLYOVER4:
        this.links[0] = true;
        this.links[2] = true;
        this.links[6] = true;
        this.links[8] = true;
        break;
      case FlyoverType.FLYOVER5:
      case FlyoverType.FLYOVER7:
        this.links[0] = true;
        this.links[1] = true;
        this.links[7] = true;
        this.links[8] = true;
        break;
      case FlyoverType.FLYOVER6:
      case FlyoverType.FLYOVER8:
        this.links[1] = true;
        this.links[2] = true;
        this.links[6] = true;
        this.links[7] = true;
        break;
      case FlyoverType.FLYOVER9:
      case FlyoverType.FLYOVER11:
        this.links[0] = true;
        this.links[3] = true;
        this.links[5] = true;
        this.links[8] = true;
        break;
      case FlyoverType.FLYOVER10:
      case FlyoverType.FLYOVER12:
        this.links[2] = true;
        this.links[3] = true;
        this.links[5] = true;
        this.links[6] = true;
        break;
    }
  }

  getFlyoverType(): FlyoverType {
    return this.flyoverType;
  }

  setFlyoverType(newFlyoverType: FlyoverType): void {
    this.flyoverType = newFlyoverType;
  }

  /** @returns "F1" through "F12" */
  flyoverTypeToString(): string {
    switch (this.flyoverType) {
      case FlyoverType.FLYOVER1:
        return "F1";
      case FlyoverType.FLYOVER2:
        return "F2";
      case FlyoverType.FLYOVER3:
        return "F3";
      case FlyoverType.FLYOVER4:
        return "F4";
      case FlyoverType.FLYOVER5:
        return "F5";
      case FlyoverType.FLYOVER6:
        return "F6";
      case FlyoverType.FLYOVER7:
        return "F7";
      case FlyoverType.FLYOVER8:
        return "F8";
      case FlyoverType.FLYOVER9:
        return "F9";
      case FlyoverType.FLYOVER10:
        return "F10";
      case FlyoverType.FLYOVER11:
        return "F11";
      case FlyoverType.FLYOVER12:
        return "F12";
    }
  }

  /** @returns "FlyoverTrack,<type>,x,y,mainSpd,mainLen,secSpd,secLen" */
  toString(): string {
    return `FlyoverTrack,${this.flyoverTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.secondarySpeedLengthToString()}`;
  }

  /** @returns "<type>,x,y,mainSpd,mainLen,secSpd,secLen" */
  toSaveString(): string {
    return `${this.flyoverTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.secondarySpeedLengthToString()}`;
  }
}
