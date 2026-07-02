// Barrel exports for the unified Track class
export { Track } from "./track";
export { createTrackData } from "./track-factory";
export type { CreateTrackDataOptions } from "./track-factory";
export type { TrackData, TrackKind, TrackKindMeta } from "./track-data";
export {
	getLinksForSubtype,
	hasSecondaryPath,
	isValidSubtype,
	KIND_META,
	kindToLabel,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
} from "./track-data";
export { SignalAspect } from "./signal-aspects";
export type { SignalAspectValue } from "./signal-aspects";
export {
	DEFAULT_MAIN_LENGTH,
	DEFAULT_MAIN_SPEED,
	DEFAULT_SECONDARY_LENGTH,
	DEFAULT_SECONDARY_SPEED,
	getTrackColorState,
	TRACK_COLOR_ALPHA,
	TRACK_COLOR_BOTH,
	TRACK_COLOR_LENGTH,
	TRACK_COLOR_SPEED,
} from "./track-color";
export type { TrackColorState } from "./track-color";
