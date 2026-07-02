import type { Track } from "./track";
import { hasSecondaryPath } from "./track-data";

// ============================================================================
// Single source of truth for default values & colour palette
// ============================================================================

/** Default speed for both main and secondary paths (km/h). */
export const DEFAULT_MAIN_SPEED = 200;
/** Default length for both main and secondary paths (m). */
export const DEFAULT_MAIN_LENGTH = 100;
/** Default secondary-path speed (km/h). */
export const DEFAULT_SECONDARY_SPEED = 200;
/** Default secondary-path length (m). */
export const DEFAULT_SECONDARY_LENGTH = 100;

// Colour palette (hex values for PixiJS Graphics)
export const TRACK_COLOR_SPEED = 0xef4444; // red-500
export const TRACK_COLOR_LENGTH = 0xeab308; // yellow-500
export const TRACK_COLOR_BOTH = 0x3b82f6; // blue-500
export const TRACK_COLOR_ALPHA = 0.3;

// ============================================================================
// Colour state classification
// ============================================================================

/**
 * Colour state for a track cell based on deviation from default speed/length.
 * - `"default"` — both speed and length match defaults
 * - `"speed"`  — speed deviates, length matches
 * - `"length"` — length deviates, speed matches
 * - `"both"`   — both speed and length deviate
 */
export type TrackColorState = "default" | "speed" | "length" | "both";

/**
 * Classify a track's colour state based on speed/length deviation from defaults.
 *
 * For tracks without a secondary path, only main values are checked.
 * For tracks with a secondary path, both main and secondary values are
 * considered: "speed" means any speed deviates and all lengths match;
 * "length" means any length deviates and all speeds match;
 * "both" means at least one speed AND one length deviate.
 */
export function getTrackColorState(track: Track): TrackColorState {
	const mainSpeed = track.getTrackMainSpeed();
	const mainLength = track.getTrackMainLength();
	const secondary = hasSecondaryPath(track.data.kind);

	const speedDiff =
		mainSpeed !== DEFAULT_MAIN_SPEED ||
		(secondary && track.getTrackSecondarySpeed() !== DEFAULT_SECONDARY_SPEED);

	const lengthDiff =
		mainLength !== DEFAULT_MAIN_LENGTH ||
		(secondary && track.getTrackSecondaryLength() !== DEFAULT_SECONDARY_LENGTH);

	if (speedDiff && lengthDiff) return "both";
	if (speedDiff) return "speed";
	if (lengthDiff) return "length";
	return "default";
}
