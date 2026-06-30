/**
 * Signal aspect constants that encode the signal's capability type
 * (how many aspects/lights it supports). The displayed colour at placement
 * is always the most restrictive (red for main signals, two reds for shunt).
 *
 * - `FOUR_ASPECT` — red / yellow / double-yellow / green
 * - `THREE_ASPECT` — red / yellow / green
 * - `TWO_ASPECT` — red / green
 * - `SHUNT` — position-light shunt signal (two reds / two whites)
 */
export const SignalAspect = {
	SHUNT: 1,
	TWO_ASPECT: 2,
	THREE_ASPECT: 3,
	FOUR_ASPECT: 4,
} as const;

/** Union of the four valid signal aspect values. */
export type SignalAspectValue =
	(typeof SignalAspect)[keyof typeof SignalAspect];
