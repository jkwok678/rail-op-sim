import type { TrainTimetableEntry } from "@rail-op-sim/shared";
import { useEditorStore } from "#/store/editor-store";

const TIMETABLE_ROW_CLASS: Record<TrainTimetableEntry["state"], string> = {
	done: "opacity-50 line-through",
	next: "font-semibold",
	upcoming: "opacity-80",
};

/**
 * Floating tooltip that follows the pointer while "Show train info" or
 * "Show train timetable" is enabled, displaying data for the train under the
 * cursor. Reads a plain-data snapshot from the store (pushed by the placement
 * controller) and renders nothing when the pointer isn't over a train.
 * Fixed-positioned, so it tracks the viewport.
 */
export function TrainInfoTooltip() {
	const info = useEditorStore((s) => s.hoveredTrainInfo);
	if (!info) return null;

	return (
		<div
			data-testid="train-info-tooltip"
			className="pointer-events-none fixed z-50 rounded-none bg-foreground px-2 py-1 text-[11px] leading-tight text-background"
			style={{ left: info.screenX + 14, top: info.screenY - 14 }}
		>
			<div className="font-medium">
				{info.headcode}
				{info.description ? ` · ${info.description}` : ""}
			</div>
			{info.statusLabel !== null ? (
				<div className="opacity-80">
					{info.statusLabel}
					{info.next ? ` · ${info.next}` : ""}
				</div>
			) : null}
			{info.timetable !== null && info.timetable.length > 0 ? (
				<ul className="mt-1 space-y-0.5 border-t border-background/20 pt-1 font-mono text-[10px]">
					{info.timetable.map((entry, index) => (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: positional timetable entries
							key={index}
							className={`flex gap-2 ${TIMETABLE_ROW_CLASS[entry.state]}`}
						>
							<span className="shrink-0 tabular-nums">{entry.time ?? "—"}</span>
							<span>{entry.label}</span>
						</li>
					))}
				</ul>
			) : null}
		</div>
	);
}
