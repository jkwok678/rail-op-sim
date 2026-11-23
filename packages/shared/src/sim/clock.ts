/**
 * The timetable clock: how fast it runs and how the run state moves.
 *
 * The engine itself only ever advances in fixed {@link SIM_DT} steps, so the
 * same session plays out identically at any speed and on any frame rate — the
 * host turns wall-clock time into a number of steps, the engine never reads a
 * clock of its own.
 */

import type { RunState } from "./types";

/** Seconds of timetable time per engine step. */
export const SIM_DT = 0.1;

/** The clock speeds on offer, slowest first. */
export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8, 16] as const;

/** The next speed up (`+1`) or down (`-1`) from `speed`, clamped to the ends. */
export function stepSpeed(speed: number, direction: 1 | -1): number {
	const i = SPEEDS.findIndex((s) => s >= speed);
	const at = i === -1 ? SPEEDS.length - 1 : i;
	const next = Math.min(SPEEDS.length - 1, Math.max(0, at + direction));
	return SPEEDS[next] ?? speed;
}

/** Whether `speed` is one of {@link SPEEDS}. */
export function isSpeed(speed: number): boolean {
	return (SPEEDS as readonly number[]).includes(speed);
}

/** The run state after pressing Run, or null when already running. */
export function afterRun(run: RunState): RunState | null {
	return run === "running" ? null : "running";
}

/** The run state after pressing Pause, or null when not running. */
export function afterPause(run: RunState): RunState | null {
	return run === "running" ? "paused" : null;
}
