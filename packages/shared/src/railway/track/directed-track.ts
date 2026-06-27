import { DirectedType } from "../enums";
import { StraightTrack } from "./straight-track";

// ============================================================================
// DirectedTrack — 8 directional types, inherits StraightTrack, 2 links
// ============================================================================

/**
 * @brief Directed (one-way) track with 8 directional variants.
 * Ported from RailwayBuilder track.h / track.cpp DirectedTrack class.
 */
export class DirectedTrack extends StraightTrack {
  private directedType: DirectedType;

  constructor(
    newDirectedType: DirectedType,
    newLocationX: number,
    newLocationY: number,
  ) {
    // Call StraightTrack default constructor first, then set up
    super();
    this.directedType = newDirectedType;
    this.locationX = newLocationX;
    this.locationY = newLocationY;

    switch (this.directedType) {
      case DirectedType.DIRECTEDLEFT:
      case DirectedType.DIRECTEDRIGHT:
        this.links[3] = true;
        this.links[5] = true;
        break;
      case DirectedType.DIRECTEDUP:
      case DirectedType.DIRECTEDDOWN:
        this.links[1] = true;
        this.links[7] = true;
        break;
      case DirectedType.DIRECTEDLEFTUP:
      case DirectedType.DIRECTEDRIGHTDOWN:
        this.links[0] = true;
        this.links[8] = true;
        break;
      case DirectedType.DIRECTEDRIGHTUP:
      case DirectedType.DIRECTEDLEFTDOWN:
        this.links[2] = true;
        this.links[6] = true;
        break;
    }
  }

  getDirectType(): DirectedType {
    return this.directedType;
  }

  setDirectedType(newDirectedType: DirectedType): void {
    this.directedType = newDirectedType;
  }

  /** @returns "DL" | "DR" | "DU" | "DD" | "DLU" | "DRU" | "DLD" | "DRD" */
  directedTypeToString(): string {
    switch (this.directedType) {
      case DirectedType.DIRECTEDLEFT:
        return "DL";
      case DirectedType.DIRECTEDRIGHT:
        return "DR";
      case DirectedType.DIRECTEDUP:
        return "DU";
      case DirectedType.DIRECTEDDOWN:
        return "DD";
      case DirectedType.DIRECTEDLEFTUP:
        return "DLU";
      case DirectedType.DIRECTEDRIGHTUP:
        return "DRU";
      case DirectedType.DIRECTEDLEFTDOWN:
        return "DLD";
      case DirectedType.DIRECTEDRIGHTDOWN:
        return "DRD";
    }
  }

  /** @returns "DirectedTrack,<type>,x,y,speed,length,p1,p2[,Text...]" */
  toString(): string {
    let result = `DirectedTrack,${this.directedTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length,p1,p2[,readableText]" */
  toSaveString(): string {
    let result = `${this.directedTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
