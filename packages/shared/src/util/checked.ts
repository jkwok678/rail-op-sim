/**
 * Checked element access for lookups the code relies on as invariants.
 *
 * With `noUncheckedIndexedAccess`, `items[i]` is typed `T | undefined`. Where
 * the index is known to be in range (a node id the graph handed out, the
 * front segment of a train that always occupies at least one), these
 * helpers give back a `T` and throw if the invariant is ever broken, rather
 * than letting `undefined` travel on and fail somewhere unrelated.
 */

/** `items[index]`, throwing when the index is out of range. */
export function itemAt<T>(
	items: readonly T[],
	index: number,
	what = "item",
): T {
	const item = items[index];
	if (item === undefined) {
		throw new RangeError(
			`${what} ${index} out of range (length ${items.length})`,
		);
	}
	return item;
}

/** The first element, throwing when `items` is empty. */
export function firstOf<T>(items: readonly T[], what = "item"): T {
	return itemAt(items, 0, what);
}

/** The last element, throwing when `items` is empty. */
export function lastOf<T>(items: readonly T[], what = "item"): T {
	return itemAt(items, items.length - 1, what);
}

/** The only element of `items`, or undefined when there are none or several. */
export function soleItem<T>(items: readonly T[]): T | undefined {
	return items.length === 1 ? items[0] : undefined;
}

/** `value`, throwing when it is undefined. */
export function defined<T>(value: T | undefined, what: string): T {
	if (value === undefined) throw new Error(`missing ${what}`);
	return value;
}
