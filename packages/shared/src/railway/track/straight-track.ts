import { StraightType } from "../enums";
import { Track } from "./track-base";

// ============================================================================
// StraightTrack — 4 types, 2 links, supports platforms & level crossings
// ============================================================================

/**
 * @brief Straight track with 4 subtypes. Can have platforms and level crossings.
 * Ported from RailwayBuilder track.h / track.cpp StraightTrack class.
 */
export class StraightTrack extends Track {
  private straightType: StraightType;
  private levelCrossing: boolean = false;
  protected platform1: boolean = false;
  protected platform2: boolean = false;

  constructor();
  constructor(
    newStraightType: StraightType,
    newLocationX: number,
    newLocationY: number,
  );
  constructor(
    newStraightType?: StraightType,
    newLocationX?: number,
    newLocationY?: number,
  ) {
    if (
      newStraightType !== undefined &&
      newLocationX !== undefined &&
      newLocationY !== undefined
    ) {
      super(newLocationX, newLocationY);
      this.straightType = newStraightType;
      switch (this.straightType) {
        case StraightType.STRAIGHTH:
          this.links[3] = true;
          this.links[5] = true;
          break;
        case StraightType.STRAIGHTV:
          this.links[1] = true;
          this.links[7] = true;
          break;
        case StraightType.STRAIGHTLEFTUP:
          this.links[0] = true;
          this.links[8] = true;
          break;
        case StraightType.STRAIGHTRIGHTUP:
          this.links[2] = true;
          this.links[6] = true;
          break;
      }
    } else {
      super();
      this.straightType = StraightType.STRAIGHTH;
    }
  }

  getStraightType(): StraightType {
    return this.straightType;
  }

  setStraightType(newStraightType: StraightType): void {
    this.straightType = newStraightType;
  }

  hasPlatform(): boolean {
    return this.platform1 || this.platform2;
  }

  getPlatform1(): boolean {
    return this.platform1;
  }

  setPlatform1(newPlatform: boolean): void {
    this.platform1 = newPlatform;
  }

  getPlatform2(): boolean {
    return this.platform2;
  }

  setPlatform2(newPlatform: boolean): void {
    this.platform2 = newPlatform;
  }

  /** @returns "0,0" | "1,0" | "0,1" | "1,1" */
  platformsToString(): string {
    return `${Number(this.platform1)},${Number(this.platform2)}`;
  }

  hasLevelCrossing(): boolean {
    return this.levelCrossing;
  }

  addLevelCrossing(): void {
    this.levelCrossing = true;
  }

  removeLevelCrossing(): void {
    this.levelCrossing = false;
  }

  /** @returns "0" or "1" */
  levelCrossingToString(): string {
    return `${Number(this.levelCrossing)}`;
  }

  /** @returns "SH" | "SV" | "SLU" | "SRU" */
  straightTypeToString(): string {
    switch (this.straightType) {
      case StraightType.STRAIGHTH:
        return "SH";
      case StraightType.STRAIGHTV:
        return "SV";
      case StraightType.STRAIGHTLEFTUP:
        return "SLU";
      case StraightType.STRAIGHTRIGHTUP:
        return "SRU";
    }
  }

  /** @returns "StraightTrack,<type>,x,y,speed,length,p1,p2,lc[,Text...]" */
  toString(): string {
    let result = `StraightTrack,${this.straightTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()},${this.levelCrossingToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length,p1,p2,lc[,readableText]" */
  toSaveString(): string {
    let result = `${this.straightTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()},${this.levelCrossingToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
