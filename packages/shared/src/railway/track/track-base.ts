import { NamedElement, NamedLocation } from "../element";

// ============================================================================
// Track — base class for all track types, extends NamedElement
// ============================================================================

/**
 * @brief Foundation for all track types.
 * Ported from RailwayBuilder track.h / track.cpp Track class.
 *
 * Link grid layout (index 4 unused):
 * ```
 * 0 1 2     top-left,    top,      top-right
 * 3 4 5  =  left,        (unused), right
 * 6 7 8     bottom-left, bottom,   bottom-right
 * ```
 */
export abstract class Track extends NamedElement {
  protected trackMainSpeed: number = 200;
  protected trackMainLength: number = 100;
  protected trackSecondarySpeed: number = -1;
  protected trackSecondaryLength: number = -1;
  protected links: boolean[] = new Array<boolean>(9).fill(false);
  protected linkedNamedLocation: NamedLocation | null = null;
  protected found: boolean = false;

  constructor();
  constructor(locationX: number, locationY: number);
  constructor(locationX?: number, locationY?: number) {
    if (locationX !== undefined && locationY !== undefined) {
      super(locationX, locationY);
    } else {
      super();
    }
    this.text = null;
  }

  /** Sets secondary speed/length to defaults (200, 100) */
  protected setDefaultSecondarySpeedLength(): void {
    this.trackSecondarySpeed = 200;
    this.trackSecondaryLength = 100;
  }

  getTrackMainSpeed(): number {
    return this.trackMainSpeed;
  }

  setTrackMainSpeed(speed: number): void {
    this.trackMainSpeed = speed;
  }

  getTrackMainLength(): number {
    return this.trackMainLength;
  }

  setTrackMainLength(length: number): void {
    this.trackMainLength = length;
  }

  getTrackSecondarySpeed(): number {
    return this.trackSecondarySpeed;
  }

  setTrackSecondarySpeed(speed: number): void {
    this.trackSecondarySpeed = speed;
  }

  getTrackSecondaryLength(): number {
    return this.trackSecondaryLength;
  }

  setTrackSecondaryLength(length: number): void {
    this.trackSecondaryLength = length;
  }

  /** @returns "speed,length" for main */
  mainSpeedLengthToString(): string {
    return `${this.trackMainSpeed},${this.trackMainLength}`;
  }

  /** @returns "speed,length" for secondary */
  secondarySpeedLengthToString(): string {
    return `${this.trackSecondarySpeed},${this.trackSecondaryLength}`;
  }

  getLinkAt(link: number): boolean {
    return this.links[link];
  }

  hasLinkedNamedLocation(): boolean {
    return this.linkedNamedLocation !== null;
  }

  getLinkedNamedLocation(): NamedLocation | null {
    return this.linkedNamedLocation;
  }

  setLinkedNamedLocation(newNamedLocation: NamedLocation | null): void {
    this.linkedNamedLocation = newNamedLocation;
  }

  getFound(): boolean {
    return this.found;
  }

  setFound(newFound: boolean): void {
    this.found = newFound;
  }

  /** @returns "Track,x,y,mainSpeed,mainLength" */
  toString(): string {
    return `Track,${this.locationToString()},${this.mainSpeedLengthToString()}`;
  }

  /** @returns "x,y,mainSpeed,mainLength" */
  toSaveString(): string {
    return `${this.locationToString()},${this.mainSpeedLengthToString()}`;
  }
}
