import { ExitType } from "../enums";
import { Track } from "./track-base";

// ============================================================================
// ExitTrack — 8 directions, 1 link
// ============================================================================

/**
 * @brief Exit track marking off-map boundary. 8 directional types, 1 link.
 * Ported from RailwayBuilder track.h / track.cpp ExitTrack class.
 */
export class ExitTrack extends Track {
  private exitType: ExitType;

  constructor(
    newExitType: ExitType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super(newLocationX, newLocationY);
    this.exitType = newExitType;
    switch (this.exitType) {
      case ExitType.EXITLEFT:
        this.links[5] = true;
        break;
      case ExitType.EXITRIGHT:
        this.links[3] = true;
        break;
      case ExitType.EXITUP:
        this.links[7] = true;
        break;
      case ExitType.EXITDOWN:
        this.links[1] = true;
        break;
      case ExitType.EXITLEFTUP:
        this.links[8] = true;
        break;
      case ExitType.EXITRIGHTUP:
        this.links[6] = true;
        break;
      case ExitType.EXITLEFTDOWN:
        this.links[2] = true;
        break;
      case ExitType.EXITRIGHTDOWN:
        this.links[0] = true;
        break;
    }
  }

  getExitType(): ExitType {
    return this.exitType;
  }

  setExitType(newExitType: ExitType): void {
    this.exitType = newExitType;
  }

  /** @returns "EL" | "ER" | "EU" | "ED" | "ELD" | "ELU" | "ERD" | "ERU" */
  exitTypeToString(): string {
    switch (this.exitType) {
      case ExitType.EXITLEFT:
        return "EL";
      case ExitType.EXITRIGHT:
        return "ER";
      case ExitType.EXITUP:
        return "EU";
      case ExitType.EXITDOWN:
        return "ED";
      case ExitType.EXITLEFTDOWN:
        return "ELD";
      case ExitType.EXITLEFTUP:
        return "ELU";
      case ExitType.EXITRIGHTDOWN:
        return "ERD";
      case ExitType.EXITRIGHTUP:
        return "ERU";
    }
  }

  /** @returns "ExitTrack,<type>,x,y,speed,length[,Text...]" */
  toString(): string {
    let result = `ExitTrack,${this.exitTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length[,readableText]" */
  toSaveString(): string {
    let result = `${this.exitTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
