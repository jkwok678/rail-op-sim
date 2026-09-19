// Barrel exports for the unified Track class

export type { SignalAspectValue } from "./signal-aspects";
export { SignalAspect } from "./signal-aspects";
export type { PreferredDirection, TrackDirectionality } from "./track";
export { Track } from "./track";
export type { TrackColorState } from "./track-color";
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
export type { TrackData, TrackKind, TrackKindMeta } from "./track-data";
export {
	getDirectedFlow,
	getLinksForSubtype,
	hasSecondaryPath,
	isTraversableLinkPair,
	isValidSubtype,
	KIND_META,
	kindToLabel,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
} from "./track-data";
export type { CreateTrackDataOptions } from "./track-factory";
export { createTrackData } from "./track-factory";
export type { TrackKindLabels } from "./track-labels";
export {
	aspectToLabel,
	kindToPhrase,
	kindToShortLabel,
	subtypeWithAspect,
} from "./track-labels";
