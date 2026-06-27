import { CrossoverType } from "../enums";
import { Track } from "./track-base";

// ============================================================================
// CrossoverTrack — 6 types, 4 links, secondary speed/length
// ============================================================================

/**
 * @brief Two tracks crossing at a point (diamond crossing). 6 types, 4 links.
 * Ported from RailwayBuilder track.h / track.cpp CrossoverTrack class.
 */
export class CrossoverTrack extends Track {
  private crossoverType: CrossoverType;

  constructor(
    newCrossoverType: CrossoverType,
    newLocationX: number,
    newLocationY: number,
  ) {
    super(newLocationX, newLocationY);
    this.crossoverType = newCrossoverType;
    this.setDefaultSecondarySpeedLength();
    switch (this.crossoverType) {
      case CrossoverType.CROSSOVER1:
        // Horizontal is main, vertical is secondary
        this.links[1] = true;
        this.links[3] = true;
        this.links[5] = true;
        this.links[7] = true;
        break;
      case CrossoverType.CROSSOVER2:
        // Top left to Bottom right is main, other is secondary
        this.links[0] = true;
        this.links[2] = true;
        this.links[6] = true;
        this.links[8] = true;
        break;
      case CrossoverType.CROSSOVER3:
        // Vertical is main, other is secondary
        this.links[0] = true;
        this.links[1] = true;
        this.links[7] = true;
        this.links[8] = true;
        break;
      case CrossoverType.CROSSOVER4:
        // Vertical is main, other is secondary
        this.links[1] = true;
        this.links[2] = true;
        this.links[6] = true;
        this.links[7] = true;
        break;
      case CrossoverType.CROSSOVER5:
        // Horizontal is main, other is secondary
        this.links[0] = true;
        this.links[3] = true;
        this.links[5] = true;
        this.links[8] = true;
        break;
      case CrossoverType.CROSSOVER6:
        // Horizontal is main, other is secondary
        this.links[2] = true;
        this.links[3] = true;
        this.links[5] = true;
        this.links[6] = true;
        break;
    }
  }

  getCrossoverType(): CrossoverType {
    return this.crossoverType;
  }

  setCrossoverType(newCrossoverType: CrossoverType): void {
    this.crossoverType = newCrossoverType;
  }

  /** @returns "CR1" through "CR6" */
  crossoverTypeToString(): string {
    switch (this.crossoverType) {
      case CrossoverType.CROSSOVER1:
        return "CR1";
      case CrossoverType.CROSSOVER2:
        return "CR2";
      case CrossoverType.CROSSOVER3:
        return "CR3";
      case CrossoverType.CROSSOVER4:
        return "CR4";
      case CrossoverType.CROSSOVER5:
        return "CR5";
      case CrossoverType.CROSSOVER6:
        return "CR6";
    }
  }

  /** @returns "CrossoverTrack,<type>,x,y,mainSpd,mainLen,secSpd,secLen" */
  toString(): string {
    return `CrossoverTrack,${this.crossoverTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.secondarySpeedLengthToString()}`;
  }

  /** @returns "<type>,x,y,mainSpd,mainLen,secSpd,secLen" */
  toSaveString(): string {
    return `${this.crossoverTypeToString()},${this.locationToString()},${this.mainSpeedLengthToString()},${this.secondarySpeedLengthToString()}`;
  }
}
