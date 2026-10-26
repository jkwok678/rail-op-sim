import type { RunState, TrainView } from "@rail-op-sim/shared";

/**
 * Words for the operate panel, kept pure so they can be tested as tables.
 */

export function runLabel(run: RunState | undefined): string {
	switch (run) {
		case "running":
			return "Running";
		case "paused":
			return "Paused";
		case "prestart":
			return "Ready to start";
		default:
			return "Loading";
	}
}

/** How a speed multiplier reads: ×¼, ×½, ×1, ×16. */
export function speedLabel(speed: number): string {
	if (speed === 0.25) return "×¼";
	if (speed === 0.5) return "×½";
	return `×${speed}`;
}

const WAITING: Record<NonNullable<TrainView["wait"]>, string> = {
	signal: "At signal",
	train: "Behind train",
	buffers: "At buffers",
	points: "Points against",
	station: "At platform",
};

/** What a train is doing, in a couple of words. */
export function trainStatusLabel(train: TrainView): string {
	switch (train.status) {
		case "running":
			return `${Math.round(train.speedKmh)} km/h`;
		case "dwelling":
			return "At platform";
		case "waiting":
			return train.wait ? WAITING[train.wait] : "Waiting";
		case "spad":
			return "SPAD";
		case "crashed":
			return "Crashed";
		case "finished":
			return "Finished";
	}
}

/** Whether a train needs the signaller's attention. */
export function needsAttention(train: TrainView): boolean {
	return (
		train.status === "spad" ||
		train.status === "crashed" ||
		(train.status === "waiting" &&
			(train.wait === "signal" || train.wait === "points"))
	);
}
