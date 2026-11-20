/** A binary min-heap ordered by `before`: what comes out first. */
export class MinHeap<T> {
	private readonly items: T[] = [];

	constructor(private readonly before: (a: T, b: T) => boolean) {}

	get size(): number {
		return this.items.length;
	}

	push(item: T): void {
		const items = this.items;
		items.push(item);
		let i = items.length - 1;
		while (i > 0) {
			const parent = (i - 1) >> 1;
			if (!this.before(items[i], items[parent])) break;
			[items[i], items[parent]] = [items[parent], items[i]];
			i = parent;
		}
	}

	pop(): T | undefined {
		const items = this.items;
		const top = items[0];
		const last = items.pop();
		if (items.length === 0 || last === undefined) return top;
		items[0] = last;
		for (let i = 0; ; ) {
			const l = i * 2 + 1;
			const r = l + 1;
			let best = i;
			if (l < items.length && this.before(items[l], items[best])) best = l;
			if (r < items.length && this.before(items[r], items[best])) best = r;
			if (best === i) break;
			[items[i], items[best]] = [items[best], items[i]];
			i = best;
		}
		return top;
	}
}
