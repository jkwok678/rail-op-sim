import type { SimTransport } from "../types";

/** Two ends of an in-memory connection, delivering synchronously. */
export function memoryTransports<A, B>(): [
	SimTransport<B, A>,
	SimTransport<A, B>,
	{
		sentByLeft: A[];
		sentByRight: B[];
		closed: { left: boolean; right: boolean };
		/** Make the connection fail, as seen by one end's `onError` handlers. */
		fail: { left(message: string): void; right(message: string): void };
	},
] {
	const leftHandlers = new Set<(m: B) => void>();
	const rightHandlers = new Set<(m: A) => void>();
	const leftErrors = new Set<(message: string) => void>();
	const rightErrors = new Set<(message: string) => void>();
	const record = {
		sentByLeft: [] as A[],
		sentByRight: [] as B[],
		closed: { left: false, right: false },
		fail: {
			left: (message: string) => {
				for (const h of [...leftErrors]) h(message);
			},
			right: (message: string) => {
				for (const h of [...rightErrors]) h(message);
			},
		},
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
		onError(h) {
			leftErrors.add(h);
			return () => leftErrors.delete(h);
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
		onError(h) {
			rightErrors.add(h);
			return () => rightErrors.delete(h);
		},
		close() {
			record.closed.right = true;
		},
	};
	return [left, right, record];
}
