import { CurvedType } from "../enums";
import { Track } from "./track-base";

// ============================================================================
// CurvedTrack — 12 types (4 tight, 8 wide), 2 links
// ============================================================================

/**
 * @brief Curved track with 12 types. Cannot have platforms or level crossings.
 * Ported from RailwayBuilder track.h / track.cpp CurvedTrack class.
 */
export class CurvedTrack extends Track {
  private curvedType: CurvedType;

  constructor(
    newCurvedType: CurvedType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super(newLocationX, newLocationY);
    this.curvedType = newCurvedType;
    switch (this.curvedType) {
      case CurvedType.TIGHTCURVE1:
        this.links[5] = true;
        this.links[7] = true;
        break;
      case CurvedType.TIGHTCURVE2:
        this.links[3] = true;
        this.links[7] = true;
        break;
      case CurvedType.TIGHTCURVE3:
        this.links[1] = true;
        this.links[5] = true;
        break;
      case CurvedType.TIGHTCURVE4:
        this.links[1] = true;
        this.links[3] = true;
        break;
      case CurvedType.CURVE1:
        this.links[5] = true;
        this.links[6] = true;
        break;
      case CurvedType.CURVE2:
        this.links[3] = true;
        this.links[8] = true;
        break;
      case CurvedType.CURVE3:
        this.links[0] = true;
        this.links[5] = true;
        break;
      case CurvedType.CURVE4:
        this.links[2] = true;
        this.links[3] = true;
        break;
      case CurvedType.CURVE5:
        this.links[1] = true;
        this.links[8] = true;
        break;
      case CurvedType.CURVE6:
        this.links[1] = true;
        this.links[6] = true;
        break;
      case CurvedType.CURVE7:
        this.links[2] = true;
        this.links[7] = true;
        break;
      case CurvedType.CURVE8:
        this.links[0] = true;
        this.links[7] = true;
        break;
    }
  }

  getCurvedType(): CurvedType {
    return this.curvedType;
  }

  setCurvedType(newCurvedType: CurvedType): void {
    this.curvedType = newCurvedType;
  }

  /** @returns "TC1"-"TC4" | "C1"-"C8" */
  curvedTypeToString(): string {
    switch (this.curvedType) {
      case CurvedType.CURVE1:
        return "C1";
      case CurvedType.CURVE2:
        return "C2";
      case CurvedType.CURVE3:
        return "C3";
      case CurvedType.CURVE4:
        return "C4";
      case CurvedType.CURVE5:
        return "C5";
      case CurvedType.CURVE6:
        return "C6";
      case CurvedType.CURVE7:
        return "C7";
      case CurvedType.CURVE8:
        return "C8";
      case CurvedType.TIGHTCURVE1:
        return "TC1";
      case CurvedType.TIGHTCURVE2:
        return "TC2";
      case CurvedType.TIGHTCURVE3:
        return "TC3";
      case CurvedType.TIGHTCURVE4:
        return "TC4";
    }
  }

  /** @returns "CurvedTrack,<type>,x,y,speed,length[,Text...]" */
  toString(): string {
    let result = `CurvedTrack,${this.curvedTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length[,readableText]" */
  toSaveString(): string {
    let result = `${this.curvedTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
