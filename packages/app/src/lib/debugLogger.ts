/**
 * Debug logger for the rail-op-sim placement pipeline.
 *
 * Silent unless asked for: start the app with VITE_DEBUG_LOG set to a
 * comma-separated list of subsystems (VITE_DEBUG_LOG=placement,store) or to
 * `*` for all of them. Output uses `console.debug` so it's filterable in
 * DevTools.
 */

type Subsystem =
	| "store"
	| "placement"
	| "trackLayer"
	| "directionLayer"
	| "textureCache"
	| "pixi"
	| "saveload"
	| "sim";

const enabled = new Set(
	(import.meta.env.VITE_DEBUG_LOG ?? "")
		.split(",")
		.map((part: string) => part.trim())
		.filter(Boolean),
);
const allEnabled = enabled.has("*");

export function debugLog(
	subsystem: Subsystem,
	message: string,
	...data: unknown[]
): void {
	if (!allEnabled && !enabled.has(subsystem)) return;
	console.debug(`[${subsystem}] ${message}`, ...data);
}
