/**
 * @brief Error hierarchy replacing QMessageBox patterns.
 *
 * The C++ code used QMessageBox for validation feedback. In the shared
 * library, we throw typed errors. The app layer catches these and
 * presents them in the UI (toast / notification).
 */

export class RailwayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RailwayError";
  }
}

/** An element already exists at the given coordinates. */
export class ElementAlreadyExistsError extends RailwayError {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    super(`An element already exists at (${x}, ${y}).`);
    this.name = "ElementAlreadyExistsError";
  }
}

/** No element was found at the given coordinates. */
export class ElementNotFoundError extends RailwayError {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    super(`No element found at (${x}, ${y}).`);
    this.name = "ElementNotFoundError";
  }
}

/** The track network is not fully connected. */
export class TrackNotConnectedError extends RailwayError {
  constructor() {
    super("Not all tracks are connected.");
    this.name = "TrackNotConnectedError";
  }
}

/** The map contains zero tracks. */
export class ZeroTrackError extends RailwayError {
  constructor() {
    super("There are zero tracks stored.");
    this.name = "ZeroTrackError";
  }
}

/** LinkedTrack validation error (odd count, low count, etc.). */
export class LinkedTrackError extends RailwayError {
  constructor(message: string) {
    super(message);
    this.name = "LinkedTrackError";
  }
}
