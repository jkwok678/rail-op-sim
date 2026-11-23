// Shared assertions for the app tests, matching packages/shared's
// railway/__tests__/test-helpers.ts. They narrow a nullable lookup to its
// value and fail the test with a readable message when it is missing, in
// place of a `!` that would surface later as a TypeError.

/** Returns `value`, failing the test if it is `null` or `undefined`. */
export function defined<T>(value: T | null | undefined, what = "value"): T {
	if (value === null || value === undefined) {
		throw new Error(`expected ${what} to be defined, got ${value}`);
	}
	return value;
}
