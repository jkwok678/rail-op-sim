/** The part of a PixiJS `Ticker` the guard needs. */
export interface GuardableTicker {
	update(currentTime?: number): void;
	stop(): void;
}

/**
 * Catch an error thrown from the ticker's frame — a ticker callback, or the
 * render itself — and hand it to `onError` instead of letting it escape.
 *
 * PixiJS only asks for the next animation frame after `update` returns, so an
 * error thrown inside it ends the loop: the canvas stops redrawing and nothing
 * says why. The guard stops the ticker, so a fault that repeats every frame is
 * reported once, and passes the error on to be shown.
 *
 * `update` is replaced on the instance; the ticker's frame loop calls it
 * through `this`, so the wrapper is what runs.
 */
export function guardTicker(
	ticker: GuardableTicker,
	onError: (error: Error) => void,
): void {
	const update = ticker.update.bind(ticker);
	ticker.update = (currentTime?: number) => {
		try {
			update(currentTime);
		} catch (error) {
			ticker.stop();
			onError(error instanceof Error ? error : new Error(String(error)));
		}
	};
}
