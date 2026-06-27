import { SwitchType } from "../enums";
import { StraightTrack } from "./straight-track";

// ============================================================================
// SwitchTrack — 32 types, 3 links, inherits StraightTrack
// ============================================================================

/**
 * @brief Railway switch/points. 32 types, 3 links, secondary speed/length.
 * Ported from RailwayBuilder track.h / track.cpp SwitchTrack class.
 */
export class SwitchTrack extends StraightTrack {
  private switchType: SwitchType;

  constructor(
    newSwitchType: SwitchType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super();
    this.switchType = newSwitchType;
    this.locationX = newLocationX;
    this.locationY = newLocationY;
    this.setDefaultSecondarySpeedLength();
    switch (this.switchType) {
      case SwitchType.SWITCHTIGHT1:
      case SwitchType.SWITCHTIGHT2:
        this.links[1] = true;
        this.links[3] = true;
        this.links[5] = true;
        break;
      case SwitchType.SWITCHTIGHT3:
      case SwitchType.SWITCHTIGHT4:
        this.links[3] = true;
        this.links[5] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCHTIGHT5:
      case SwitchType.SWITCHTIGHT7:
        this.links[1] = true;
        this.links[3] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCHTIGHT6:
      case SwitchType.SWITCHTIGHT8:
        this.links[1] = true;
        this.links[5] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCHSPLIT1:
        this.links[2] = true;
        this.links[3] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCHSPLIT2:
        this.links[0] = true;
        this.links[5] = true;
        this.links[6] = true;
        break;
      case SwitchType.SWITCHSPLIT3:
        this.links[2] = true;
        this.links[3] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCHSPLIT4:
        this.links[1] = true;
        this.links[5] = true;
        this.links[6] = true;
        break;
      case SwitchType.SWITCHSPLIT5:
        this.links[1] = true;
        this.links[3] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCHSPLIT6:
        this.links[0] = true;
        this.links[5] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCHSPLIT7:
        this.links[0] = true;
        this.links[2] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCHSPLIT8:
        this.links[1] = true;
        this.links[6] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCH1:
        this.links[2] = true;
        this.links[3] = true;
        this.links[5] = true;
        break;
      case SwitchType.SWITCH2:
        this.links[0] = true;
        this.links[3] = true;
        this.links[5] = true;
        break;
      case SwitchType.SWITCH3:
        this.links[3] = true;
        this.links[5] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCH4:
        this.links[3] = true;
        this.links[5] = true;
        this.links[6] = true;
        break;
      case SwitchType.SWITCH5:
        this.links[0] = true;
        this.links[1] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCH6:
        this.links[1] = true;
        this.links[2] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCH7:
        this.links[1] = true;
        this.links[6] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCH8:
        this.links[1] = true;
        this.links[7] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCH9:
        this.links[0] = true;
        this.links[1] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCH10:
        this.links[1] = true;
        this.links[2] = true;
        this.links[6] = true;
        break;
      case SwitchType.SWITCH11:
        this.links[2] = true;
        this.links[6] = true;
        this.links[7] = true;
        break;
      case SwitchType.SWITCH12:
        this.links[0] = true;
        this.links[7] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCH13:
        this.links[0] = true;
        this.links[3] = true;
        this.links[8] = true;
        break;
      case SwitchType.SWITCH14:
        this.links[2] = true;
        this.links[5] = true;
        this.links[6] = true;
        break;
      case SwitchType.SWITCH15:
        this.links[2] = true;
        this.links[3] = true;
        this.links[6] = true;
        break;
      case SwitchType.SWITCH16:
        this.links[0] = true;
        this.links[5] = true;
        this.links[8] = true;
        break;
    }
  }

  getSwitchType(): SwitchType {
    return this.switchType;
  }

  setSwitchType(newSwitchType: SwitchType): void {
    this.switchType = newSwitchType;
  }

  /** @returns short code for all 32 switch types */
  switchTypeToString(): string {
    switch (this.switchType) {
      case SwitchType.SWITCH1:
        return "SW1";
      case SwitchType.SWITCH2:
        return "SW2";
      case SwitchType.SWITCH3:
        return "SW3";
      case SwitchType.SWITCH4:
        return "SW4";
      case SwitchType.SWITCH5:
        return "SW5";
      case SwitchType.SWITCH6:
        return "SW6";
      case SwitchType.SWITCH7:
        return "SW7";
      case SwitchType.SWITCH8:
        return "SW8";
      case SwitchType.SWITCH9:
        return "SW9";
      case SwitchType.SWITCH10:
        return "SW10";
      case SwitchType.SWITCH11:
        return "SW11";
      case SwitchType.SWITCH12:
        return "SW12";
      case SwitchType.SWITCH13:
        return "SW13";
      case SwitchType.SWITCH14:
        return "SW14";
      case SwitchType.SWITCH15:
        return "SW15";
      case SwitchType.SWITCH16:
        return "SW16";
      case SwitchType.SWITCHTIGHT1:
        return "SWT1";
      case SwitchType.SWITCHTIGHT2:
        return "SWT2";
      case SwitchType.SWITCHTIGHT3:
        return "SWT3";
      case SwitchType.SWITCHTIGHT4:
        return "SWT4";
      case SwitchType.SWITCHTIGHT5:
        return "SWT5";
      case SwitchType.SWITCHTIGHT6:
        return "SWT6";
      case SwitchType.SWITCHTIGHT7:
        return "SWT7";
      case SwitchType.SWITCHTIGHT8:
        return "SWT8";
      case SwitchType.SWITCHSPLIT1:
        return "SWS1";
      case SwitchType.SWITCHSPLIT2:
        return "SWS2";
      case SwitchType.SWITCHSPLIT3:
        return "SWS3";
      case SwitchType.SWITCHSPLIT4:
        return "SWS4";
      case SwitchType.SWITCHSPLIT5:
        return "SWS5";
      case SwitchType.SWITCHSPLIT6:
        return "SWS6";
      case SwitchType.SWITCHSPLIT7:
        return "SWS7";
      case SwitchType.SWITCHSPLIT8:
        return "SWS8";
    }
  }

  /** @returns "SwitchTrack,<type>,x,y,mainSpd,mainLen,secSpd,secLen,p1,p2[,Text...]" */
  toString(): string {
    let result = `SwitchTrack,${this.switchTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.secondarySpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.toString()}`;
    }
    return result;
  }

  /** @returns "<type>,x,y,mainSpd,mainLen,secSpd,secLen,p1,p2[,readableText]" */
  toSaveString(): string {
    let result = `${this.switchTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.secondarySpeedLengthToString()},${this.platformsToString()}`;
    if (this.getNamed()) {
      result += `,${this.text!.getReadableText()}`;
    }
    return result;
  }
}
