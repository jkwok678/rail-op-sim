// Barrel exports for the railway module

// Types
export type { FontInfo, Point, TextSelectionPrompt, MessageCallback } from "./types";

// Enums
export {
  ParapetType,
  Platform,
  StraightType,
  DirectedType,
  CurvedType,
  LinkedType,
  ExitType,
  BufferType,
  SignalType,
  BridgeUnderpassType,
  SwitchType,
  CrossoverType,
  FlyoverType,
} from "./enums";

// Errors
export {
  RailwayError,
  ElementAlreadyExistsError,
  ElementNotFoundError,
  TrackNotConnectedError,
  ZeroTrackError,
  LinkedTrackError,
} from "./errors";

// Element classes
export { Element, Text, NamedElement, NamedLocation, Concourse, Parapet } from "./element";

// Track classes
export {
  Track,
  StraightTrack,
  DirectedTrack,
  CurvedTrack,
  LinkedTrack,
  ExitTrack,
  BufferTrack,
  SignalTrack,
  BridgeUnderpassTrack,
  SwitchTrack,
  CrossoverTrack,
  FlyoverTrack,
} from "./track";

// Map class
export { Map_ as Map } from "./map";
