/**
 * Debug logger for the rail-op-sim placement pipeline.
 *
 * All output uses `console.debug` so it's filterable in DevTools.
 */

type Subsystem =
	| "store"
	| "placement"
	| "trackLayer"
	| "textureCache"
	| "pixi"
	| "grid"
	| "map";

export function debugLog(
	subsystem: Subsystem,
	message: string,
	...data: unknown[]
): void {
	console.debug(`[${subsystem}] ${message}`, ...data);
}
