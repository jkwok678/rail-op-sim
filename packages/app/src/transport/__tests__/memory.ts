import type { SimTransport } from "../types";

/** Two ends of an in-memory connection, delivering synchronously. */
export function memoryTransports<A, B>(): [
	SimTransport<B, A>,
	SimTransport<A, B>,
	{
		sentByLeft: A[];
		sentByRight: B[];
		closed: { left: boolean; right: boolean };
	},
] {
	const leftHandlers = new Set<(m: B) => void>();
	const rightHandlers = new Set<(m: A) => void>();
	const record = {
		sentByLeft: [] as A[],
		sentByRight: [] as B[],
		closed: { left: false, right: false },
	};
	const left: SimTransport<B, A> = {
		send(m) {
			record.sentByLeft.push(m);
			for (const h of [...rightHandlers]) h(m);
		},
		onMessage(h) {
			leftHandlers.add(h);
			return () => leftHandlers.delete(h);
		},
		close() {
			record.closed.left = true;
		},
	};
	const right: SimTransport<A, B> = {
		send(m) {
			record.sentByRight.push(m);
			for (const h of [...leftHandlers]) h(m);
		},
		onMessage(h) {
			rightHandlers.add(h);
			return () => rightHandlers.delete(h);
		},
		close() {
			record.closed.right = true;
		},
	};
	return [left, right, record];
}
