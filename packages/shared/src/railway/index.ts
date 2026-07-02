// Barrel exports for the railway module

// Element classes
export {
	Concourse,
	Element,
	NamedElement,
	NamedLocation,
	Parapet,
	Text,
} from "./element";

// Enums
export {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	ParapetType,
	Platform,
	SignalType,
	StraightType,
	SwitchType,
} from "./enums";

// Errors
export {
	ElementAlreadyExistsError,
	ElementNotFoundError,
	LinkedTrackError,
	RailwayError,
	TrackNotConnectedError,
	ZeroTrackError,
} from "./errors";
// Map class
export { Map_ as Map } from "./map";
export { findPathBetween } from "./map/map-connectivity";
export type { LinkedTrackPair, LinkedTrackReport } from "./map/map-connectivity";
export type {
	CreateTrackDataOptions,
	SignalAspectValue,
	TrackData,
	TrackKind,
	TrackKindMeta,
} from "./track";
// Track class
export {
	createTrackData,
	DEFAULT_MAIN_LENGTH,
	DEFAULT_MAIN_SPEED,
	DEFAULT_SECONDARY_LENGTH,
	DEFAULT_SECONDARY_SPEED,
	getLinksForSubtype,
	getTrackColorState,
	hasSecondaryPath,
	isValidSubtype,
	KIND_META,
	kindToLabel,
	SignalAspect,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
	TRACK_COLOR_ALPHA,
	TRACK_COLOR_BOTH,
	TRACK_COLOR_LENGTH,
	TRACK_COLOR_SPEED,
	Track,
} from "./track";
export type { TrackColorState } from "./track";
// Units
export { formatImperialLength, kmhToMph, metresToImperial, round1 } from "./units";

// Types
export type {
	FontInfo,
	MessageCallback,
	Point,
	TextSelectionPrompt,
} from "./types";
