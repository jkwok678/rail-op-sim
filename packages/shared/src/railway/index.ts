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
export type { TrackData, TrackKind, TrackKindMeta } from "./track";
// Track class
export {
	getLinksForSubtype,
	hasSecondaryPath,
	KIND_META,
	kindToLabel,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
	Track,
} from "./track";
// Types
export type {
	FontInfo,
	MessageCallback,
	Point,
	TextSelectionPrompt,
} from "./types";
