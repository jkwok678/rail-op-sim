/**
 * A partial update to a plain data object. Setting a key to `undefined`
 * clears that optional field rather than storing `undefined` in it.
 */
export type Patch<T> = { [K in keyof T]?: T[K] | undefined };

/**
 * Returns `base` with `patch` applied. Keys left `undefined` are omitted from
 * the result, so an optional field is absent rather than present-but-undefined,
 * which `exactOptionalPropertyTypes` relies on. Only for plain data objects:
 * the result is a fresh object literal, not an instance of `base`'s class.
 */
export function applyPatch<T extends object>(
	base: T,
	patch: Patch<NoInfer<T>>,
): T {
	const merged: Record<string, unknown> = { ...base, ...patch };
	return Object.fromEntries(
		Object.entries(merged).filter(([, value]) => value !== undefined),
	) as T;
}
