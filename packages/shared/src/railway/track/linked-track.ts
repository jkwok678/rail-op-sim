import { LinkedType } from "../enums";
import { Track } from "./track-base";

// ============================================================================
// LinkedTrack — 8 directions, 1 link, pairs with another LinkedTrack
// ============================================================================

/**
 * @brief Track that can be linked (teleport-connected) to another LinkedTrack.
 * Ported from RailwayBuilder track.h / track.cpp LinkedTrack class.
 */
export class LinkedTrack extends Track {
  private linkedType: LinkedType;
  private otherLinkTrack: LinkedTrack | null = null;

  constructor();
  constructor(
    newLinkedType: LinkedType,
    newLocationX: number,
    newLocationY: number,
  );
  constructor(
    newLinkedType?: LinkedType,
    newLocationX?: number,
    newLocationY?: number,
  ) {
    if (
      newLinkedType !== undefined &&
      newLocationX !== undefined &&
      newLocationY !== undefined
    ) {
      super(newLocationX, newLocationY);
      this.linkedType = newLinkedType;
      switch (this.linkedType) {
        case LinkedType.LINKLEFT:
          this.links[5] = true;
          break;
        case LinkedType.LINKRIGHT:
          this.links[3] = true;
          break;
        case LinkedType.LINKUP:
          this.links[7] = true;
          break;
        case LinkedType.LINKDOWN:
          this.links[1] = true;
          break;
        case LinkedType.LINKLEFTUP:
          this.links[8] = true;
          break;
        case LinkedType.LINKRIGHTDOWN:
          this.links[0] = true;
          break;
        case LinkedType.LINKLEFTDOWN:
          this.links[2] = true;
          break;
        case LinkedType.LINKRIGHTUP:
          this.links[6] = true;
          break;
      }
    } else {
      super();
      this.linkedType = LinkedType.LINKLEFT;
      this.otherLinkTrack = null;
    }
  }

  getLinkedType(): LinkedType {
    return this.linkedType;
  }

  setLinkedType(newLinkedType: LinkedType): void {
    this.linkedType = newLinkedType;
  }

  isLinked(): boolean {
    return this.otherLinkTrack !== null;
  }

  getOtherLinkedTrack(): LinkedTrack | null {
    return this.otherLinkTrack;
  }

  setOtherLinkedTrack(newLinkedTrack: LinkedTrack | null): void {
    this.otherLinkTrack = newLinkedTrack;
  }

  removeOtherLinkedTrack(): void {
    this.otherLinkTrack = null;
  }

  /** @returns "LL" | "LR" | "LU" | "LD" | "LLD" | "LLU" | "LRD" | "LRU" */
  linkedTypeToString(): string {
    switch (this.linkedType) {
      case LinkedType.LINKLEFT:
        return "LL";
      case LinkedType.LINKRIGHT:
        return "LR";
      case LinkedType.LINKUP:
        return "LU";
      case LinkedType.LINKDOWN:
        return "LD";
      case LinkedType.LINKLEFTDOWN:
        return "LLD";
      case LinkedType.LINKLEFTUP:
        return "LLU";
      case LinkedType.LINKRIGHTDOWN:
        return "LRD";
      case LinkedType.LINKRIGHTUP:
        return "LRU";
    }
  }

  /** @returns "LinkedTrack,<type>,x,y" for the other linked track */
  otherLinkedTrackToString(): string {
    return `LinkedTrack,${this.otherLinkTrack!.linkedTypeToString()},${this.otherLinkTrack!.locationToString()},${this.mainSpeedLengthToString()}`;
  }

  /** @returns "<type>,x,y,speed,length" for the other linked track (save) */
  otherLinkedTrackToSaveString(): string {
    return `${this.otherLinkTrack!.linkedTypeToString()},${this.otherLinkTrack!.locationToString()},${this.otherLinkTrack!.getTrackMainSpeed()},${this.otherLinkTrack!.getTrackMainLength()}`;
  }

  /** @returns "LinkedTrack,<type>,x,y,speed,length,isLinked[,otherTrack][,Text...]" */
  toString(): string {
    let result = `LinkedTrack,${this.linkedTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()}`;
    if (this.isLinked()) {
      result += `,1,${this.otherLinkedTrackToString()}`;
    } else {
      result += ",0";
    }
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length,isLinked[,otherTrackSave][,readableText]" */
  toSaveString(): string {
    let result = `${this.linkedTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()}`;
    if (this.isLinked()) {
      result += `,1,${this.otherLinkedTrackToSaveString()}`;
    } else {
      result += ",0";
    }
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
