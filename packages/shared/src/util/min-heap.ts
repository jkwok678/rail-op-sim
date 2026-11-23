/** A binary min-heap ordered by `before`: what comes out first. */
export class MinHeap<T> {
	private readonly items: T[] = [];

	constructor(private readonly before: (a: T, b: T) => boolean) {}

	get size(): number {
		return this.items.length;
	}

	push(item: T): void {
		const items = this.items;
		let i = items.push(item) - 1;
		// Move parents down into the hole until `item` fits.
		while (i > 0) {
			const parent = (i - 1) >> 1;
			const up = items[parent];
			if (up === undefined || !this.before(item, up)) break;
			items[i] = up;
			i = parent;
		}
		items[i] = item;
	}

	pop(): T | undefined {
		const items = this.items;
		const top = items[0];
		const last = items.pop();
		if (items.length === 0 || last === undefined) return top;
		// Sift `last` down from the root, moving the smaller child up each step.
		let i = 0;
		for (;;) {
			const l = i * 2 + 1;
			const left = items[l];
			const right = items[l + 1];
			let child = l;
			let best = left;
			if (
				right !== undefined &&
				(best === undefined || this.before(right, best))
			) {
				child = l + 1;
				best = right;
			}
			if (best === undefined || !this.before(best, last)) break;
			items[i] = best;
			i = child;
		}
		items[i] = last;
		return top;
	}
}
