import { useEditorStore } from "#/store/editor-store";

/**
 * Floating tooltip that follows the pointer while "Show track info" is enabled,
 * displaying data for the track under the cursor. Reads a plain-data snapshot
 * from the store (pushed by the placement controller) and renders nothing when
 * the pointer isn't over a track. Fixed-positioned, so it tracks the viewport.
 */
export function TrackInfoTooltip() {
	const info = useEditorStore((s) => s.hoveredTrackInfo);
	if (!info) return null;

	return (
		<div
			className="pointer-events-none fixed z-50 rounded-none bg-foreground px-2 py-1 text-[11px] leading-tight text-background"
			style={{ left: info.screenX + 14, top: info.screenY - 14 }}
		>
			<div className="font-medium">
				{info.kindLabel} · {info.subtypeCode}
			</div>
			<div className="opacity-80">
				({info.gx}, {info.gy}) · {info.mainSpeed} km/h · {info.mainLength} m
			</div>
		</div>
	);
}
