// Barrel exports for the unified Track class
export { Track } from "./track";
export type { TrackData, TrackKind, TrackKindMeta } from "./track-data";
export {
	getLinksForSubtype,
	hasSecondaryPath,
	KIND_META,
	kindToLabel,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
} from "./track-data";
