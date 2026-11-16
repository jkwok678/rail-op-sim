import { PanelCrash } from "#/components/PanelCrash";
import { useEditorStore } from "#/store/editor-store";

/**
 * Fallbacks for the two floating railway panels whose position is the user's
 * to move: they read the toolbar's saved position, as the panels themselves
 * do, so each appears where its panel was. The toolbar's is icon-only because
 * the palette sits 56px to its right and the two must never overlap.
 */
export function ToolbarCrash({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	const pos = useEditorStore((s) => s.toolbarPos);
	return (
		<PanelCrash
			compact
			name="The toolbar"
			error={error}
			reset={reset}
			className="absolute z-10 w-12 rounded-xl border shadow-sm"
			style={{ left: pos.x, top: pos.y }}
		/>
	);
}

export function PaletteCrash({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	const pos = useEditorStore((s) => s.toolbarPos);
	return (
		<PanelCrash
			name="The add palette"
			error={error}
			reset={reset}
			className="absolute z-10 w-[220px] rounded-xl border shadow-sm"
			style={{ left: pos.x + 56, top: pos.y }}
		/>
	);
}
