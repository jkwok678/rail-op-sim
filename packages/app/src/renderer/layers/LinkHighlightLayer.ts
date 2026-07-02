import { Container, Graphics } from "pixi.js";
import type { Map as Map_ } from "@rail-op-sim/shared";
import { CELL_SIZE, gridToWorld } from "#/lib/grid";

const PAIRED_COLOR = 0x22c55e; // green-500
const PAIRED_ALPHA = 0.35;
const UNPAIRED_COLOR = 0xef4444; // red-500
const UNPAIRED_ALPHA = 0.35;
const SELECTION_COLOR = 0x3b82f6; // blue-500
const SELECTION_ALPHA = 0.5;
const LINE_COLOR = 0x22c55e; // green-500
const LINE_ALPHA = 0.7;
const LINE_WIDTH = 2;
const SECTION_COLOR = 0xa855f7; // purple-500
const SECTION_ALPHA = 0.35;

export interface LinkHighlightLayer {
	container: Container;
	sync(map: Map_): void;
	/** Show a highlight on the currently-selected linked track (link tool first click). */
	syncSelection(map: Map_): void;
	/** Highlight the tracks at the given grid coordinates as a selected section. */
	highlightSection(coords: { gx: number; gy: number }[]): void;
	/** Clear the section highlight overlay. */
	clearSectionHighlight(): void;
}

/**
 * Draws semi-transparent coloured rectangles over linked track cells:
 * - Green for paired (isLinked() === true)
 * - Red for unpaired (isLinked() === false)
 * - Blue for the currently selected track in the link-tool state machine
 */
export function createLinkHighlightLayer(): LinkHighlightLayer {
	const container = new Container();
	container.label = "link-highlight-layer";
	container.visible = false;

	const gfx = new Graphics();
	container.addChild(gfx);

	const selectionGfx = new Graphics();
	container.addChild(selectionGfx);

	const sectionGfx = new Graphics();
	container.addChild(sectionGfx);

	const half = CELL_SIZE / 2;

	function sync(map: Map_): void {
		gfx.clear();

		const report = map.getLinkedTrackReport();

		// Paired — green (batch all rects, then fill once)
		for (const pair of report.pairedPairs) {
			for (const track of [pair.a, pair.b]) {
				const { x, y } = gridToWorld(track.getLocationX(), track.getLocationY());
				gfx.rect(x - half, y - half, CELL_SIZE, CELL_SIZE);
			}
		}
		gfx.fill({ color: PAIRED_COLOR, alpha: PAIRED_ALPHA });

		// Connector lines between paired tracks
		for (const pair of report.pairedPairs) {
			const a = gridToWorld(pair.a.getLocationX(), pair.a.getLocationY());
			const b = gridToWorld(pair.b.getLocationX(), pair.b.getLocationY());
			gfx.moveTo(a.x, a.y);
			gfx.lineTo(b.x, b.y);
		}
		gfx.stroke({ color: LINE_COLOR, alpha: LINE_ALPHA, width: LINE_WIDTH });

		// Unpaired — red (batch all rects, then fill once)
		for (const track of report.unpairedTracks) {
			const { x, y } = gridToWorld(track.getLocationX(), track.getLocationY());
			gfx.rect(x - half, y - half, CELL_SIZE, CELL_SIZE);
		}
		gfx.fill({ color: UNPAIRED_COLOR, alpha: UNPAIRED_ALPHA });
	}

	function syncSelection(map: Map_): void {
		selectionGfx.clear();

		const selected = map.getLinkedTrack1();
		if (!selected) return;

		const { x, y } = gridToWorld(selected.getLocationX(), selected.getLocationY());
		selectionGfx.rect(x - half, y - half, CELL_SIZE, CELL_SIZE);
		selectionGfx.fill({ color: SELECTION_COLOR, alpha: SELECTION_ALPHA });
	}

	function highlightSection(coords: { gx: number; gy: number }[]): void {
		sectionGfx.clear();
		for (const c of coords) {
			const { x, y } = gridToWorld(c.gx, c.gy);
			sectionGfx.rect(x - half, y - half, CELL_SIZE, CELL_SIZE);
		}
		sectionGfx.fill({ color: SECTION_COLOR, alpha: SECTION_ALPHA });
	}

	function clearSectionHighlight(): void {
		sectionGfx.clear();
	}

	return { container, sync, syncSelection, highlightSection, clearSectionHighlight };
}
