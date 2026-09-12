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
export type {
	ConnectivityReport,
	DanglingLink,
	LinkedTrackPair,
	LinkedTrackReport,
	PathOptions,
} from "./map/map-connectivity";
export {
	findPathBetween,
	getConnectivityReport,
} from "./map/map-connectivity";
export type {
	SerializedMap,
	SerializedNamedElement,
	SerializedParapet,
	SerializedText,
	SerializedTrack,
} from "./map/map-serialization";
export {
	deserializeMap,
	SERIALIZED_MAP_VERSION,
	serializeMap,
} from "./map/map-serialization";
export type {
	CreateTrackDataOptions,
	SignalAspectValue,
	TrackColorState,
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
	getDirectedFlow,
	getLinksForSubtype,
	getTrackColorState,
	hasSecondaryPath,
	isTraversableLinkPair,
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
// Types
export type {
	FontInfo,
	MessageCallback,
	Point,
	TextSelectionPrompt,
} from "./types";
// Units
export {
	formatImperialLength,
	kmhToMph,
	metresToImperial,
	round1,
} from "./units";
