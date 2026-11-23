import { itemAt } from "./checked";
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
			const child = itemAt(items, i);
			const up = itemAt(items, parent);
			if (!this.before(child, up)) break;
			items[i] = up;
			items[parent] = child;
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
			if (
				l < items.length &&
				this.before(itemAt(items, l), itemAt(items, best))
			)
				best = l;
			if (
				r < items.length &&
				this.before(itemAt(items, r), itemAt(items, best))
			)
				best = r;
			if (best === i) break;
			const down = itemAt(items, i);
			items[i] = itemAt(items, best);
			items[best] = down;
			i = best;
		}
		return top;
	}
}
