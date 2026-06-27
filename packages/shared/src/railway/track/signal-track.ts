import { SignalType } from "../enums";
import { StraightTrack } from "./straight-track";

// ============================================================================
// SignalTrack — 8 directions + aspect count, 2 links, inherits StraightTrack
// ============================================================================

/**
 * @brief Signal on track. 8 directional types with aspect count.
 * Ported from RailwayBuilder track.h / track.cpp SignalTrack class.
 */
export class SignalTrack extends StraightTrack {
  private signalType: SignalType;
  private aspect: number;

  constructor(
    newSignalType: SignalType,
    newAspect: number,
    newLocationX: number,
    newLocationY: number,
  ) {
    super();
    this.signalType = newSignalType;
    this.aspect = newAspect;
    this.locationX = newLocationX;
    this.locationY = newLocationY;
    switch (this.signalType) {
      case SignalType.SIGNALLEFT:
      case SignalType.SIGNALRIGHT:
        this.links[3] = true;
        this.links[5] = true;
        break;
      case SignalType.SIGNALUP:
      case SignalType.SIGNALDOWN:
        this.links[1] = true;
        this.links[7] = true;
        break;
      case SignalType.SIGNALLEFTUP:
      case SignalType.SIGNALRIGHTDOWN:
        this.links[0] = true;
        this.links[8] = true;
        break;
      case SignalType.SIGNALRIGHTUP:
      case SignalType.SIGNALLEFTDOWN:
        this.links[2] = true;
        this.links[6] = true;
        break;
    }
  }

  getAspect(): number {
    return this.aspect;
  }

  setAspect(newAspect: number): void {
    this.aspect = newAspect;
  }

  aspectToString(): string {
    return `${this.aspect}`;
  }

  getSignalType(): SignalType {
    return this.signalType;
  }

  setSignalType(newSignalType: SignalType): void {
    this.signalType = newSignalType;
  }

  /** @returns "SIGL" | "SIGR" | "SIGU" | "SIGD" | "SIGLD" | "SIGLU" | "SIGRD" | "SIGRU" */
  signalTypeToString(): string {
    switch (this.signalType) {
      case SignalType.SIGNALLEFT:
        return "SIGL";
      case SignalType.SIGNALRIGHT:
        return "SIGR";
      case SignalType.SIGNALUP:
        return "SIGU";
      case SignalType.SIGNALDOWN:
        return "SIGD";
      case SignalType.SIGNALLEFTDOWN:
        return "SIGLD";
      case SignalType.SIGNALLEFTUP:
        return "SIGLU";
      case SignalType.SIGNALRIGHTDOWN:
        return "SIGRD";
      case SignalType.SIGNALRIGHTUP:
        return "SIGRU";
    }
  }

  /** @returns "SignalTrack,<type>,<aspect>,x,y,speed,length,p1,p2[,Text...]" */
  toString(): string {
    let result = `SignalTrack,${this.signalTypeToString()},${this.aspectToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,<aspect>,x,y,speed,length,p1,p2[,readableText]" */
  toSaveString(): string {
    let result = `${this.signalTypeToString()},${this.aspectToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
