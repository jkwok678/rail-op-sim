import { BufferType } from "../enums";
import { StraightTrack } from "./straight-track";

// ============================================================================
// BufferTrack — 8 directions, 1 link, inherits StraightTrack
// ============================================================================

/**
 * @brief Buffer stop / dead-end track. 8 types, 1 link, inherits StraightTrack.
 * Ported from RailwayBuilder track.h / track.cpp BufferTrack class.
 */
export class BufferTrack extends StraightTrack {
  private bufferType: BufferType;

  constructor(
    newBufferType: BufferType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super();
    this.bufferType = newBufferType;
    this.locationX = newLocationX;
    this.locationY = newLocationY;
    switch (this.bufferType) {
      case BufferType.BUFFERLEFT:
        this.links[5] = true;
        break;
      case BufferType.BUFFERRIGHT:
        this.links[3] = true;
        break;
      case BufferType.BUFFERUP:
        this.links[7] = true;
        break;
      case BufferType.BUFFERDOWN:
        this.links[1] = true;
        break;
      case BufferType.BUFFERLEFTUP:
        this.links[8] = true;
        break;
      case BufferType.BUFFERRIGHTUP:
        this.links[6] = true;
        break;
      case BufferType.BUFFERLEFTDOWN:
        this.links[2] = true;
        break;
      case BufferType.BUFFERRIGHTDOWN:
        this.links[0] = true;
        break;
    }
  }

  getBufferType(): BufferType {
    return this.bufferType;
  }

  setBufferType(newBufferType: BufferType): void {
    this.bufferType = newBufferType;
  }

  /** @returns "BL" | "BR" | "BU" | "BD" | "BLD" | "BLU" | "BRD" | "BRU" */
  bufferTypeToString(): string {
    switch (this.bufferType) {
      case BufferType.BUFFERLEFT:
        return "BL";
      case BufferType.BUFFERRIGHT:
        return "BR";
      case BufferType.BUFFERUP:
        return "BU";
      case BufferType.BUFFERDOWN:
        return "BD";
      case BufferType.BUFFERLEFTDOWN:
        return "BLD";
      case BufferType.BUFFERLEFTUP:
        return "BLU";
      case BufferType.BUFFERRIGHTDOWN:
        return "BRD";
      case BufferType.BUFFERRIGHTUP:
        return "BRU";
    }
  }

  /** @returns "BufferTrack,<type>,x,y,speed,length,p1,p2[,Text...]" */
  toString(): string {
    let result = `BufferTrack,${this.bufferTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,speed,length,p1,p2[,readableText]" */
  toSaveString(): string {
    let result = `${this.bufferTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
