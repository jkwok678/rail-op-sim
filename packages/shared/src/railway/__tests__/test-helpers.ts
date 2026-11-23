// Shared assertions for the railway tests. They narrow a nullable lookup to
// its value and fail the test with a readable message when it is missing,
// in place of a `!` that would surface later as a TypeError.
import type { Map_ } from "../map";
import type { Track } from "../track";

/** Returns `value`, failing the test if it is `null` or `undefined`. */
export function defined<T>(value: T | null | undefined, what = "value"): T {
	if (value === null || value === undefined) {
		throw new Error(`expected ${what} to be defined, got ${value}`);
	}
	return value;
}

/** Returns the track at grid position (x, y), failing the test if there is none. */
export function trackAt(map: Map_, x: number, y: number): Track {
	return defined(map.getTrackAt(x, y), `a track at (${x}, ${y})`);
}
