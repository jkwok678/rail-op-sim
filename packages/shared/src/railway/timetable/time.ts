/**
 * Clock arithmetic for timetables.
 *
 * Every time in a timetable is a {@link SimTime}: whole seconds since 00:00 on
 * the first day of the timetable. Overnight services are the reason it is not
 * wrapped into a 0–86399 range — a sleeper booked 23:50 → 06:20 has a departure
 * of 85800 and an arrival of 109200, and comparing the two has to stay a plain
 * `<`. Wrapping would make "arrives before it departs" indistinguishable from
 * "arrives the next morning", and the validator leans on that difference.
 */

/** Whole seconds since 00:00 on day one. May exceed a day for overnight work. */
export type SimTime = number;

/** Seconds in a day, the modulus for the wall-clock part of a {@link SimTime}. */
export const SECONDS_PER_DAY = 24 * 60 * 60;

/** Thrown by {@link parseSimTime} when the text is not a clock time. */
export class InvalidTimeError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidTimeError";
	}
}

/**
 * Parse `HH:MM` or `HH:MM:SS` into a {@link SimTime}.
 *
 * Hours beyond 23 are accepted and carried rather than wrapped, so `25:10`
 * round-trips as the next day's 01:10 — the notation the railway itself uses
 * for late-night services, and the one that keeps a timetable's times sorted.
 */
export function parseSimTime(text: string): SimTime {
	const match = /^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/.exec(text.trim());
	if (!match) {
		throw new InvalidTimeError(
			`"${text}" is not a time — expected HH:MM or HH:MM:SS.`,
		);
	}
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	const seconds = match[3] ? Number(match[3]) : 0;
	return hours * 3600 + minutes * 60 + seconds;
}

/** {@link parseSimTime} that answers `null` instead of throwing, for live input. */
export function tryParseSimTime(text: string): SimTime | null {
	try {
		return parseSimTime(text);
	} catch {
		return null;
	}
}

/**
 * Render a {@link SimTime} as `HH:MM`, or `HH:MM:SS` when `withSeconds`.
 *
 * Hours keep counting past 24 (`25:10`, not `01:10`) so the text a user reads
 * back is the text {@link parseSimTime} accepted. Use {@link formatWallClock}
 * for the face of a station clock, which has no such memory.
 */
export function formatSimTime(time: SimTime, withSeconds = false): string {
	const total = Math.max(0, Math.round(time));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	const hh = String(hours).padStart(2, "0");
	const mm = String(minutes).padStart(2, "0");
	if (!withSeconds) return `${hh}:${mm}`;
	return `${hh}:${mm}:${String(seconds).padStart(2, "0")}`;
}

/** Render the wall-clock face of a {@link SimTime}, wrapping 25:10 back to 01:10. */
export function formatWallClock(time: SimTime, withSeconds = false): string {
	const wrapped =
		((time % SECONDS_PER_DAY) + SECONDS_PER_DAY) % SECONDS_PER_DAY;
	return formatSimTime(wrapped, withSeconds);
}

/** Which day of the timetable a {@link SimTime} falls on (0 = the first day). */
export function dayOffset(time: SimTime): number {
	return Math.floor(time / SECONDS_PER_DAY);
}

/** Render a gap between two times as a short human duration ("4m", "1h 12m"). */
export function formatDuration(seconds: number): string {
	const total = Math.max(0, Math.round(seconds));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const secs = total % 60;
	if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	if (minutes > 0) return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
	return `${secs}s`;
}
