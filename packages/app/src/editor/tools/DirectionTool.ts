import {
	clearPreferredDirectionsAlongPath,
	findPathBetween,
	setPreferredDirectionsAlongPath,
	type Track,
} from "@rail-op-sim/shared";
import type { EditorTool, ToolContext, ToolPointer } from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";
import type { EditorState } from "#/store/editor-store";

/**
 * Assigns preferred directions with a two-click gesture: the first click
 * picks a start track, the second assigns the direction along the route to it
 * (or, in erase mode, removes the directions along it). A right-click clears
 * every preferred direction on one track. Before the second click the hovered
 * cell previews the route.
 *
 * The tool needs physically joined track; the controller drops back to the
 * select tool if the map becomes disconnected.
 */
export class DirectionTool implements EditorTool {
	/** Cell key of the last route preview (avoids re-running BFS per pointermove). */
	private hoverKey: string | null = null;

	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return "pointer";
	}

	/** Show the arrow overlay for all tracks. */
	activate(): void {
		const { map, layers } = this.ctx;
		layers.direction.sync(map);
		layers.direction.container.visible = true;
	}

	/** Clear the pending start, and hide the overlay unless pinned visible. */
	deactivate(): void {
		const { layers, stores } = this.ctx;
		this.clear();
		layers.direction.setSelection(null);
		if (!stores.editor.getState().showDirections) {
			layers.direction.container.visible = false;
		}
	}

	/**
	 * Mirror the pending start and the set/erase mode from the store: either
	 * can change without a canvas click — re-clicking the active tool resets
	 * the start, and the toolbar flips the mode.
	 */
	editorChanged(state: EditorState, prev: EditorState): void {
		const startChanged =
			state.directionStart !== prev.directionStart && state.tool === prev.tool;
		if (startChanged || state.directionMode !== prev.directionMode) {
			this.ctx.layers.direction.setSelection(
				state.directionStart,
				state.directionMode === "erase",
			);
			this.hoverKey = null;
		}
	}

	click(p: ToolPointer): void {
		const { map, stores } = this.ctx;
		const editor = stores.editor.getState();
		// Gated on physically joined track; the toolbar disables the tool
		// otherwise, but guard here too in case the map changed mid-gesture.
		if (!editor.trackStatus?.connected) {
			debugLog("placement", "direction click ignored — railway not joined");
			return;
		}

		const erasing = editor.directionMode === "erase";
		const { cell } = p;
		const track = map.getTrackAt(cell.gx, cell.gy);
		if (!track) {
			this.endGesture("empty cell, cleared");
			return;
		}

		const { directionStart } = editor;
		if (!directionStart) {
			editor.setDirectionStart(cell);
			this.ctx.layers.direction.setSelection(cell, erasing);
			this.hoverKey = null;
			debugLog(
				"placement",
				`direction ${erasing ? "erase" : "set"} click → start at (${cell.gx},${cell.gy})`,
			);
			return;
		}

		if (directionStart.gx === cell.gx && directionStart.gy === cell.gy) {
			this.endGesture("cancelled start");
			return;
		}

		const startTrack = map.getTrackAt(directionStart.gx, directionStart.gy);
		if (!startTrack) {
			this.endGesture("start track gone, cleared");
			return;
		}

		if (erasing) this.eraseAlong(startTrack, track);
		else if (!this.assignAlong(startTrack, track)) return;
		this.endGesture(null);
	}

	/** Right-click clears every preferred direction on the track under the pointer. */
	rightClick(p: ToolPointer): void {
		const { map, layers } = this.ctx;
		const { gx, gy } = p.cell;
		const track = map.getTrackAt(gx, gy);
		if (!track?.hasPreferredDirection()) return;
		this.ctx.commit(
			"Clear directions",
			{ direction: true, status: true },
			() => {
				track.clearPreferredDirections();
			},
		);
		layers.direction.sync(map);
		this.ctx.publishTrackStatus();
		debugLog(
			"placement",
			`right-click → clearPreferredDirections at (${gx},${gy})`,
		);
	}

	/**
	 * Preview the route a second click would act on: the hovered cell is
	 * outlined and, when a path exists, each leg the gesture would assign (or
	 * remove) is stroked.
	 */
	preview(p: ToolPointer): void {
		const { map, layers, stores } = this.ctx;
		const { directionStart } = stores.editor.getState();
		const { cell } = p;
		const end = directionStart ? map.getTrackAt(cell.gx, cell.gy) : null;
		// Hovering the start itself would cancel on click, so show no route.
		if (
			!directionStart ||
			!end ||
			(cell.gx === directionStart.gx && cell.gy === directionStart.gy)
		) {
			this.clear();
			return;
		}

		const key = `${cell.gx},${cell.gy}`;
		if (key === this.hoverKey) return;
		this.hoverKey = key;

		const start = map.getTrackAt(directionStart.gx, directionStart.gy);
		const path = start
			? findPathBetween(map, start, end, { respectOneWay: true })
			: null;
		layers.direction.setRoutePreview(map, path, cell);
	}

	/** Drop any route preview (endpoint outline + stroked legs). */
	clear(): void {
		if (this.hoverKey === null) return;
		this.hoverKey = null;
		this.ctx.layers.direction.setRoutePreview(this.ctx.map, null, null);
	}

	/** The pending start may name a track that an undo is about to remove. */
	reset(): void {
		this.clear();
		this.ctx.layers.direction.setSelection(null);
		this.ctx.stores.editor.getState().setDirectionStart(null);
	}

	/** Remove the directions along the route. */
	private eraseAlong(startTrack: Track, track: Track): void {
		const { map } = this.ctx;
		const result = this.ctx.commit(
			"Erase directions",
			{ direction: true, status: true },
			() => clearPreferredDirectionsAlongPath(map, startTrack, track),
		);
		if (result === null) {
			debugLog("placement", "direction erase click → no path found");
		} else if (result.removed === 0) {
			// Path exists but carried no directions either way round, so there
			// was nothing along it to undo.
			debugLog(
				"placement",
				`direction erase click → nothing to remove (path length=${result.path.length})`,
			);
		} else {
			this.syncAfterChange();
			debugLog(
				"placement",
				`direction erase click → removed ${result.removed} along path length=${result.path.length}`,
			);
		}
	}

	/**
	 * Assign the directions along the route. Returns false when the gesture
	 * should stay open — the route ends facing a switch, so the next click past
	 * it chooses the branch.
	 */
	private assignAlong(startTrack: Track, track: Track): boolean {
		const { map, stores } = this.ctx;
		const result = this.ctx.commit(
			"Set directions",
			{ direction: true, status: true },
			() => setPreferredDirectionsAlongPath(map, startTrack, track),
		);
		if (result === null) {
			debugLog("placement", "direction click → no path found");
		} else if (result.facingSwitchEndpoint) {
			// Nothing was written. Keep the start click so the next cell past
			// the switch can choose the branch.
			stores.editor
				.getState()
				.setDirectionHint("Click past the switch to choose a branch");
			debugLog(
				"placement",
				`direction click → facing switch, kept start (path length=${result.path.length})`,
			);
			return false;
		} else if (result.applied === 0) {
			// Path exists but nothing changed — every pair was already set, or
			// none could be determined.
			debugLog(
				"placement",
				`direction click → no directions applied (path length=${result.path.length})`,
			);
		} else {
			this.syncAfterChange();
			debugLog(
				"placement",
				`direction click → assigned ${result.applied} along path length=${result.path.length}`,
			);
		}
		return true;
	}

	private syncAfterChange(): void {
		this.ctx.layers.direction.sync(this.ctx.map);
		this.ctx.publishTrackStatus();
	}

	/** Close the gesture: drop the pending start and its highlight. */
	private endGesture(reason: string | null): void {
		const { layers, stores } = this.ctx;
		const editor = stores.editor.getState();
		editor.setDirectionStart(null);
		layers.direction.setSelection(null, editor.directionMode === "erase");
		this.hoverKey = null;
		if (reason) debugLog("placement", `direction click → ${reason}`);
	}
}
