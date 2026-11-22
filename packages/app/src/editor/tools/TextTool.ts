import type { FontInfo, NamedElement, Text } from "@rail-op-sim/shared";
import type {
	ReleaseKind,
	Tool,
	ToolContext,
	ToolPointer,
} from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";
import type { NameableKind } from "#/store/editor-store";

/**
 * Places, edits, names, moves and deletes text.
 *
 * - A click on a text opens it for editing; on a nameable element (named
 *   location, concourse, bridge/underpass, platform track) it opens the naming
 *   dialog; anywhere else it places new text.
 * - Pressing on a text and dragging past the threshold moves it.
 * - A right-click deletes the text under the pointer.
 *
 * The dialogs the clicks open call back into the document operations below
 * (through the controller), so the text model is changed in one place.
 */
export class TextTool implements Tool {
	/**
	 * In-progress drag: the grabbed Text plus the world-space offset from its
	 * anchor to the pointer, so the text keeps its grab point under the cursor.
	 * Only the rendered sprite follows the pointer — the model is written once
	 * on release, so every cancel path is just a re-sync.
	 */
	private drag: { text: Text; offsetX: number; offsetY: number } | null = null;

	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return "text";
	}

	/** Hovering a placed text advertises the drag-to-move gesture. */
	preview(p: ToolPointer): void {
		const hit = this.ctx.layers.text.hitTest(p.world.x, p.world.y);
		this.ctx.setCursor(hit ? "move" : "text");
	}

	/** Pressing on an existing text arms a drag-to-move. */
	pointerDown(p: ToolPointer): void {
		this.drag = null;
		if (p.button !== 0 || this.ctx.isPanning()) return;
		const hit = this.ctx.layers.text.hitTest(p.world.x, p.world.y);
		if (!hit) return;
		const anchor = gridToWorld(hit.getLocationX(), hit.getLocationY());
		this.drag = {
			text: hit,
			offsetX: p.world.x - anchor.x,
			offsetY: p.world.y - anchor.y,
		};
		debugLog(
			"placement",
			`text drag armed at grid(${hit.getLocationX()},${hit.getLocationY()})`,
		);
	}

	/** Drive the rendered text while dragging; the model is untouched until release. */
	pointerMove(p: ToolPointer): boolean {
		if (!this.drag) return false;
		this.ctx.layers.text.moveTo(
			this.drag.text,
			p.world.x - this.drag.offsetX,
			p.world.y - this.drag.offsetY,
		);
		return true;
	}

	/**
	 * A drag past the threshold commits the move and swallows the click. Below
	 * it the text never really moved, so the release falls through to the
	 * click, which opens the edit dialog.
	 */
	release(p: ToolPointer, kind: ReleaseKind): boolean {
		const drag = this.drag;
		this.drag = null;
		if (!drag) return false;
		if (kind === "drag") {
			this.moveTextTo(
				drag.text,
				p.world.x - drag.offsetX,
				p.world.y - drag.offsetY,
			);
			return true;
		}
		// Cancelled, or a sub-threshold wobble: drop any preview drift.
		this.ctx.layers.text.sync(this.ctx.map);
		return kind === "cancelled";
	}

	click(p: ToolPointer): void {
		const { layers, stores } = this.ctx;
		const editor = stores.editor.getState();

		// 1) Clicked an existing text → edit it.
		const hit = layers.text.hitTest(p.world.x, p.world.y);
		if (hit) {
			editor.setPendingText({
				mode: "edit",
				tx: hit.getLocationX(),
				ty: hit.getLocationY(),
			});
			debugLog(
				"placement",
				`text click → edit text at grid(${hit.getLocationX()},${hit.getLocationY()})`,
			);
			return;
		}

		// 2) Clicked a nameable element → open the naming dialog.
		const { gx, gy } = p.cell;
		const kind = this.nameableKindAt(gx, gy);
		if (kind) {
			editor.setPendingNameTarget({ gx, gy, kind });
			return;
		}

		// 3) Empty / non-nameable cell → place a new standalone text.
		editor.setPendingText({ mode: "place", x: p.world.x, y: p.world.y });
		debugLog(
			"placement",
			`text click → place at world(${p.world.x.toFixed(1)},${p.world.y.toFixed(1)})`,
		);
	}

	rightClick(p: ToolPointer): void {
		const hit = this.ctx.layers.text.hitTest(p.world.x, p.world.y);
		if (hit) this.deleteTextObject(hit);
	}

	clear(): void {
		if (!this.drag) return;
		this.drag = null;
		this.ctx.layers.text.sync(this.ctx.map);
		debugLog("placement", "text drag cancelled");
	}

	reset(): void {
		this.clear();
	}

	// ── Document operations (called by the text and naming dialogs) ──

	/**
	 * Place a text element at the given world coordinates.
	 * Converts to fractional grid coords so gridToWorld() round-trips correctly.
	 */
	placeText(wx: number, wy: number, content: string, font: FontInfo): void {
		const gx = wx / CELL_SIZE;
		const gy = -wy / CELL_SIZE;
		this.ctx.commit("Add text", { text: true }, () => {
			this.ctx.map.createAddText(gx, gy, content, font);
		});
		this.ctx.layers.text.sync(this.ctx.map);
		debugLog(
			"placement",
			`placeText "${content}" at world(${wx.toFixed(1)},${wy.toFixed(1)}) grid(${gx.toFixed(2)},${gy.toFixed(2)})`,
		);
	}

	/**
	 * Move a Text to the given world position — the left edge and vertical
	 * centre of its rendered box, matching how the text layer anchors it.
	 * Fractional grid coords keep gridToWorld() round-tripping to the same pixel.
	 */
	moveTextTo(text: Text, wx: number, wy: number): void {
		const { map } = this.ctx;
		const gx = wx / CELL_SIZE;
		const gy = -wy / CELL_SIZE;
		// moveText() also refreshes the editable bounds the model keeps alongside
		// the location, so go through the map rather than setLocationX/Y.
		this.ctx.commit("Move text", { text: true }, () => {
			map.setTextToMove(text);
			map.moveText(gx, gy);
			map.setTextToMove(null);
		});
		this.ctx.layers.text.sync(map);
		debugLog(
			"placement",
			`moveTextTo "${text.getReadableText()}" → grid(${gx.toFixed(2)},${gy.toFixed(2)})`,
		);
	}

	/** Find the Text at exact grid coordinates (used to prefill/apply text edits). */
	getTextByLocation(tx: number, ty: number): Text | null {
		for (const t of this.ctx.map.getTextList()) {
			if (t.getLocationX() === tx && t.getLocationY() === ty) return t;
		}
		return null;
	}

	/**
	 * Rename (or delete, when content is empty) the Text at the given grid
	 * coordinates, then re-sync the affected layers.
	 */
	updateTextAt(tx: number, ty: number, content: string, font?: FontInfo): void {
		const text = this.getTextByLocation(tx, ty);
		if (!text) return;
		const trimmed = content.trim();
		this.ctx.commit(
			trimmed === "" ? "Delete text" : "Edit text",
			{ text: true, element: true, track: true },
			() => {
				this.ctx.map.changeDeleteText(trimmed, trimmed !== "", text);
				// changeDeleteText deletes the text when trimmed is empty; only
				// restyle when it survived (non-empty content) and a font was given.
				if (trimmed !== "" && font) text.setFont(font);
			},
		);
		this.syncAfterTextChange();
		debugLog("placement", `updateTextAt (${tx},${ty}) → "${trimmed}"`);
	}

	/** Delete a Text and unlink it from every element that shared it. */
	deleteTextObject(text: Text): void {
		this.ctx.commit(
			"Delete text",
			{ text: true, element: true, track: true },
			() => {
				this.ctx.map.changeDeleteText("", false, text);
			},
		);
		this.syncAfterTextChange();
		debugLog("placement", "deleteTextObject");
	}

	/**
	 * Name (or rename/delete) any nameable element at the given grid
	 * coordinates.
	 *
	 * For unnamed elements with non-empty content this calls
	 * `Map.createAddLinkText`, which flood-fills the text to adjacent elements
	 * of the same domain (NamedLocations stay in the NamedLocation domain;
	 * tracks/concourses/bridges share the other domain).
	 */
	nameElementAt(
		gx: number,
		gy: number,
		content: string,
		kind: NameableKind,
	): void {
		const { map, layers } = this.ctx;
		const element = this.nameableElementAt(gx, gy, kind);
		if (!element) return;

		const trimmed = content.trim();

		this.ctx.commit(
			trimmed === "" ? "Remove name" : "Name element",
			{ text: true, element: true, track: kind === "bridgeUnderpass" },
			() => {
				if (element.getNamed()) {
					const text = element.getText();
					if (text) map.changeDeleteText(trimmed, trimmed !== "", text);
				} else if (trimmed !== "") {
					map.createAddLinkText(gx, gy, trimmed, true, {
						family: "JetBrains Mono",
						pointSize: 12,
					});
				}
			},
		);

		layers.text.sync(map);
		layers.element.sync(map);
		// Bridge / Underpass base sprites live in the track layer and swap
		// between Set/Unset based on named state — re-sync when naming.
		if (kind === "bridgeUnderpass") layers.track.sync(map);
		debugLog(
			"placement",
			`nameElementAt "${trimmed}" kind=${kind} at (${gx},${gy})`,
		);
	}

	/**
	 * What a click at this cell would name, by priority: NamedLocation >
	 * Concourse > bridgeUnderpass > platform track. Null when nothing is
	 * nameable there.
	 */
	private nameableKindAt(gx: number, gy: number): NameableKind | null {
		const { map } = this.ctx;
		if (map.getNamedLocationAt(gx, gy)) return "namedLocation";
		if (map.getConcourseAt(gx, gy)) return "concourse";
		const track = map.getTrackAt(gx, gy);
		if (track?.data.kind === "bridgeUnderpass") return "bridgeUnderpass";
		if (track?.hasPlatform()) return "platform";
		return null;
	}

	private nameableElementAt(
		gx: number,
		gy: number,
		kind: NameableKind,
	): NamedElement | null {
		const { map } = this.ctx;
		switch (kind) {
			case "namedLocation":
				return map.getNamedLocationAt(gx, gy);
			case "concourse":
				return map.getConcourseAt(gx, gy);
			case "platform":
			case "bridgeUnderpass":
				return map.getTrackAt(gx, gy);
		}
	}

	/**
	 * Re-sync layers touched by a text rename/delete. The track layer is
	 * included because bridge/underpass base sprites swap between Set/Unset on
	 * name change.
	 */
	private syncAfterTextChange(): void {
		const { map, layers } = this.ctx;
		layers.text.sync(map);
		layers.element.sync(map);
		layers.track.sync(map);
	}
}
