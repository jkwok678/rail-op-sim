import {
	type TrainTimetableRow,
	type TrainView,
	timetableEntries,
} from "@rail-op-sim/shared";
import { trainStatusLabel } from "#/lib/operateText";
import type { HoveredTrainInfo } from "#/store/editor-store";

export interface BuildHoveredTrainInfoOptions {
	/** The train's formatted timetable rows, from the operate store. */
	timetableRows?: readonly TrainTimetableRow[];
	showBasic?: boolean;
	showTimetable?: boolean;
}

/**
 * Find the train occupying cell `(gx, gy)`, or null when none does. A segment
 * whose `from` and `to` coincide has no span on the railway yet (a train
 * waiting outside an exit to enter) and is skipped, matching `TrainLayer`.
 */
export function findTrainAt(
	trains: readonly TrainView[],
	gx: number,
	gy: number,
): TrainView | null {
	return (
		trains.find((train) =>
			train.segs.some(
				(seg) => seg.gx === gx && seg.gy === gy && seg.to > seg.from,
			),
		) ?? null
	);
}

/**
 * Build the plain-data tooltip snapshot for `train`. Kept out of
 * PlacementController so what the tooltip says about a train is testable
 * without a pixi application; the controller only decides *when* to call this.
 */
export function buildHoveredTrainInfo(
	train: TrainView,
	screenX: number,
	screenY: number,
	options: BuildHoveredTrainInfoOptions = {},
): HoveredTrainInfo {
	const showBasic = options.showBasic ?? true;
	const showTimetable = options.showTimetable ?? false;
	// When a train has finished or crashed, `train.next` repeats that state in
	// lowercase ("finished", "crashed"), which `statusLabel` already states.
	const redundantNext =
		train.status === "crashed" || train.status === "finished";
	return {
		headcode: train.headcode,
		description: showBasic && train.description ? train.description : null,
		statusLabel: showBasic ? trainStatusLabel(train) : null,
		next: showBasic && !redundantNext && train.next ? train.next : null,
		signallerControl: showBasic && train.signallerControl,
		reminder: showBasic ? train.reminder : null,
		timetable: showTimetable
			? timetableEntries(options.timetableRows ?? [], train)
			: null,
		screenX,
		screenY,
	};
}
