import { findPathBetween, type Track } from "@rail-op-sim/shared";
import type { EditorTool, ToolContext, ToolPointer } from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";

/** A section edit the speed/length panel applies to every selected track. */
export interface SectionEdit {
	mainSpeed: number;
	mainLength: number;
	secondarySpeed?: number;
	secondaryLength?: number;
}

/**
 * Selects a run of track for the speed/length panel: the first click picks a
 * start, the second the end, and the route between them becomes the section.
 * Before the second click the hovered cell previews the route it would pick.
 * While the tool is active every track is tinted by its speed and length.
 */
export class SectionTool implements EditorTool {
	/** Cell key of the last route preview (avoids re-running BFS per pointermove). */
	private hoverKey: string | null = null;

	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return "pointer";
	}

	/** Show the speed/length colour overlay for all tracks at once. */
	activate(): void {
		this.ctx.layers.trackColor.show(this.ctx.map);
	}

	/** Clear the section highlight and hide the colour overlay. */
	deactivate(): void {
		const { layers, stores } = this.ctx;
		this.hoverKey = null;
		layers.linkHighlight.clearSectionHighlight();
		layers.trackColor.hide();
		if (!stores.editor.getState().showLinkHighlights) {
			layers.linkHighlight.container.visible = false;
		}
	}

	click(p: ToolPointer): void {
		const { map, layers, stores } = this.ctx;
		const { cell } = p;
		const track = map.getTrackAt(cell.gx, cell.gy);
		if (!track) {
			this.cancelSelection("empty cell");
			return;
		}

		const editor = stores.editor.getState();
		const { sectionStart } = editor;
		if (!sectionStart) {
			editor.setSectionStart({ gx: cell.gx, gy: cell.gy });
			this.hoverKey = null;
			// Outline the pending start so the first click has feedback too.
			layers.linkHighlight.highlightSection(map, [], cell, null);
			layers.linkHighlight.container.visible = true;
			debugLog("placement", `section click → start at (${cell.gx},${cell.gy})`);
			return;
		}

		const startTrack = map.getTrackAt(sectionStart.gx, sectionStart.gy);
		if (!startTrack) {
			this.cancelSelection("start track gone");
			return;
		}

		const path = findPathBetween(map, startTrack, track);
		if (!path) {
			// No path — clear and let the user retry.
			this.cancelSelection("no path found");
			return;
		}

		const coords = path.map((t) => ({
			gx: t.getLocationX(),
			gy: t.getLocationY(),
		}));
		const end = { gx: cell.gx, gy: cell.gy };
		editor.setSectionEnd(end, coords);
		layers.linkHighlight.highlightSection(map, coords, sectionStart, end);
		layers.linkHighlight.container.visible = true;
		layers.trackColor.show(map);
		this.hoverKey = null;
		debugLog(
			"placement",
			`section click → end at (${cell.gx},${cell.gy}), path length=${coords.length}`,
		);
	}

	/**
	 * Preview the run a second click would select: the hovered cell is
	 * outlined and, when a path exists, the route to it is stroked. Mirrors the
	 * direction tool's preview so both two-click gestures read the same way.
	 */
	preview(p: ToolPointer): void {
		const { map, layers, stores } = this.ctx;
		const { sectionStart } = stores.editor.getState();
		const { cell } = p;
		const end = sectionStart ? map.getTrackAt(cell.gx, cell.gy) : null;
		// Hovering the start itself would re-pick the same cell, so show no route.
		if (
			!sectionStart ||
			!end ||
			(cell.gx === sectionStart.gx && cell.gy === sectionStart.gy)
		) {
			this.clear();
			return;
		}

		const key = `${cell.gx},${cell.gy}`;
		if (key === this.hoverKey) return;
		this.hoverKey = key;

		const start = map.getTrackAt(sectionStart.gx, sectionStart.gy);
		const path = start ? findPathBetween(map, start, end) : null;
		layers.linkHighlight.setSectionPreview(
			path
				? path.map((t) => ({ gx: t.getLocationX(), gy: t.getLocationY() }))
				: null,
			cell,
		);
	}

	/** Drop any route preview (hovered outline + stroked route). */
	clear(): void {
		if (this.hoverKey === null) return;
		this.hoverKey = null;
		this.ctx.layers.linkHighlight.setSectionPreview(null, null);
	}

	reset(): void {
		this.clear();
	}

	// ── Section edits (called by the section panel) ──

	/** Apply speed/length edits to every track in the selected section. */
	applySectionEdit(values: SectionEdit): void {
		const count = this.mutateSelectedSection(
			"Change speed & length",
			(track) => {
				track.setTrackMainSpeed(values.mainSpeed);
				track.setTrackMainLength(values.mainLength);
				if (values.secondarySpeed !== undefined) {
					track.setTrackSecondarySpeed(values.secondarySpeed);
				}
				if (values.secondaryLength !== undefined) {
					track.setTrackSecondaryLength(values.secondaryLength);
				}
			},
		);
		debugLog("placement", `applySectionEdit — ${count} tracks updated`);
	}

	/** Restore defaults for all tracks in the selected section. */
	restoreSection(): void {
		const count = this.mutateSelectedSection(
			"Restore section defaults",
			(track) => {
				track.restoreDefaults();
			},
		);
		debugLog("placement", `restoreSection — ${count} tracks reset to defaults`);
	}

	/** Clear the section highlight overlay. */
	clearSectionHighlight(): void {
		this.ctx.layers.linkHighlight.clearSectionHighlight();
	}

	/** Apply a mutation to every track in the selected section and refresh layers. */
	private mutateSelectedSection(
		label: string,
		mutate: (track: Track) => void,
	): number {
		const { map, layers, stores } = this.ctx;
		const { sectionTracks } = stores.editor.getState();
		this.ctx.commit(
			label,
			{ track: true, trackColor: true, status: true },
			() => {
				for (const coord of sectionTracks) {
					const track = map.getTrackAt(coord.gx, coord.gy);
					if (track) mutate(track);
				}
			},
		);
		layers.track.sync(map);
		layers.trackColor.show(map);
		// Drop the purple route tint (keeping the endpoint outlines) so the
		// speed/length colours just applied are visible rather than covered.
		layers.linkHighlight.setSectionRouteVisible(false);
		this.ctx.publishTrackStatus();
		return sectionTracks.length;
	}

	/** Abandon the selection — start, end, route and colour overlay. */
	private cancelSelection(reason: string): void {
		const { layers, stores } = this.ctx;
		stores.editor.getState().clearSectionSelection();
		this.clear();
		layers.linkHighlight.clearSectionHighlight();
		layers.trackColor.hide();
		debugLog("placement", `section click → ${reason}, cleared`);
	}
}
