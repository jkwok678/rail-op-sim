import { useEditorStore } from "#/store/editor-store";

/**
 * Floating tooltip that follows the pointer while "Show track info" is enabled,
 * displaying data for the track under the cursor. Reads a plain-data snapshot
 * from the store (pushed by the placement controller) and renders nothing when
 * the pointer isn't over a track. Fixed-positioned, so it tracks the viewport.
 *
 * The extra rows are conditional rather than blank-filled: a straight track has
 * no second path and no aspect, and an empty "Secondary" row would imply it
 * does.
 */
export function TrackInfoTooltip() {
	const info = useEditorStore((s) => s.hoveredTrackInfo);
	if (!info) return null;

	return (
		<div
			data-testid="track-info-tooltip"
			className="pointer-events-none fixed z-50 rounded-none bg-foreground px-2 py-1 text-[11px] leading-tight text-background"
			style={{ left: info.screenX + 14, top: info.screenY - 14 }}
		>
			<div className="font-medium">
				{info.kindLabel} · {info.subtypeCode}
				{info.aspectLabel ? ` · ${info.aspectLabel}` : ""}
			</div>
			<div className="opacity-80">
				({info.gx}, {info.gy}) · {info.secondarySpeed !== null ? "Main " : ""}
				{info.mainSpeed} km/h · {info.mainLength} m
			</div>
			{info.secondarySpeed !== null && info.secondaryLength !== null && (
				<div className="opacity-80">
					Secondary {info.secondarySpeed} km/h · {info.secondaryLength} m
				</div>
			)}
		</div>
	);
}
