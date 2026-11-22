import type { Tool, ToolContext, ToolPointer } from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";

/**
 * Pairs linked-track portals: the first click picks a portal, the second
 * pairs it with another. While the tool is active every portal is
 * highlighted, and once one is picked the hovered cell previews whether it can
 * pair (amber) or not (red).
 */
export class LinkTool implements Tool {
	/** Cell key of the last pairing preview (avoids redrawing per pointermove). */
	private hoverKey: string | null = null;

	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return "pointer";
	}

	activate(): void {
		const { map, layers } = this.ctx;
		layers.linkHighlight.container.visible = true;
		layers.linkHighlight.sync(map);
		layers.linkHighlight.syncSelection(map);
	}

	/** Leaving the tool resets the pick, and hides the highlights unless pinned on. */
	deactivate(): void {
		const { map, layers, stores } = this.ctx;
		map.setLinkedTrack1(null);
		map.setLinkedTrack2(null);
		this.clear();
		if (!stores.editor.getState().showLinkHighlights) {
			layers.linkHighlight.container.visible = false;
		} else {
			// Keep highlights visible, but clear selection
			layers.linkHighlight.sync(map);
			layers.linkHighlight.syncSelection(map);
		}
	}

	click(p: ToolPointer): void {
		const { map, layers } = this.ctx;
		const { gx, gy } = p.cell;
		this.ctx.commit(
			"Link portals",
			{ track: true, linkHighlight: true, status: true },
			() => {
				map.connectTwoLinkedTracks(gx, gy);
			},
		);
		this.ctx.publishTrackStatus();
		layers.track.sync(map);
		// Always keep highlight data fresh; visibility controls display
		layers.linkHighlight.sync(map);
		layers.linkHighlight.syncSelection(map);
		// The click either took the first pick or completed the pairing, so
		// whatever was being previewed no longer describes the next click.
		this.clear();
		debugLog("placement", `link click → grid(${gx},${gy})`);
	}

	/**
	 * Preview the pairing a click would make: once a portal is picked, the
	 * hovered cell is outlined and a dashed connector shows the link.
	 */
	preview(p: ToolPointer): void {
		const { map, layers } = this.ctx;
		if (!map.getLinkedTrack1()) {
			this.clear();
			return;
		}
		const key = `${p.cell.gx},${p.cell.gy}`;
		if (key === this.hoverKey) return;
		this.hoverKey = key;
		layers.linkHighlight.setLinkPreview(map, p.cell);
	}

	/** Drop any pairing preview (hovered outline + dashed connector). */
	clear(): void {
		if (this.hoverKey === null) return;
		this.hoverKey = null;
		this.ctx.layers.linkHighlight.setLinkPreview(this.ctx.map, null);
	}

	/**
	 * A picked portal is held on the map by reference, and an undo can remove
	 * the track it points at, so the pick is dropped along with the preview.
	 */
	reset(): void {
		const { map, layers } = this.ctx;
		this.clear();
		map.setLinkedTrack1(null);
		map.setLinkedTrack2(null);
		layers.linkHighlight.syncSelection(map);
	}
}
