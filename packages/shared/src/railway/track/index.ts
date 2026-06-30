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
