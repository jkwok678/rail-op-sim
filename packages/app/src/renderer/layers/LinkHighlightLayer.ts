import type { Map as Map_ } from "@rail-op-sim/shared";
import { itemAt } from "@rail-op-sim/shared";
import { Container, Graphics, type Sprite } from "pixi.js";
import { gridToWorld } from "#/lib/grid";
import {
	type Coord,
	createEndpointOutlines,
	dashedLine,
	GESTURE_PREVIEW_COLOR,
	queueCellRect,
	STATE_CONNECTOR_ALPHA,
	STATE_CONNECTOR_WIDTH,
	STATE_FILL_ALPHA,
	STATE_INCOMPLETE_COLOR,
	STATE_OK_COLOR,
	STATE_OUTLINE_ALPHA,
	STATE_OUTLINE_WIDTH,
	strokeCellOutline,
} from "#/renderer/gestureOverlay";
import { makeTrackSprite } from "#/renderer/layers/TrackLayer";
import type { TextureCache } from "#/renderer/textureCache";

/** Purple fill baked into the track art along a selected section (purple-500). */
const SECTION_TRACK_COLOR = "#a855f7";
/** Kept translucent so track colours underneath show through. */
const SECTION_TRACK_ALPHA = 0.55;
/** Stroke width of a previewed route or portal pairing. */
const PREVIEW_WIDTH = 3;

export interface LinkHighlightLayer {
	container: Container;
	sync(map: Map_): void;
	/** Outline the currently-selected portal (link tool first click). */
	syncSelection(map: Map_): void;
	/**
	 * Preview the pairing the link tool would make: `hovered` is outlined amber
	 * when it is a portal the selected one can pair with and red when it is not,
	 * and a dashed connector runs between the two. A null `hovered` clears it.
	 */
	setLinkPreview(map: Map_, hovered: Coord | null): void;
	/**
	 * Show the section selection: the track art at `coords` is tinted purple and
	 * the `start`/`end` cells are outlined. Pass an empty `coords` with only a
	 * `start` to mark the pending first click.
	 */
	highlightSection(
		map: Map_,
		coords: Coord[],
		start: Coord | null,
		end: Coord | null,
	): void;
	/**
	 * Preview the run the section tool would select: the path through `coords`
	 * is stroked and `end` is outlined amber. A null `coords` with an `end`
	 * marks that cell as unreachable (red outline); a null `end` clears the
	 * preview, leaving the pending start outline in place.
	 */
	setSectionPreview(coords: Coord[] | null, end: Coord | null): void;
	/**
	 * Show/hide just the purple route tint, keeping the endpoint outlines. The
	 * tint sits above the track layer and would otherwise hide the speed/length
	 * colours, so it is dropped once a section edit is applied.
	 */
	setSectionRouteVisible(visible: boolean): void;
	/** Clear the section highlight overlay. */
	clearSectionHighlight(): void;
}

/**
 * Draws semi-transparent coloured rectangles over linked track cells:
 * - Green for paired (isLinked() === true)
 * - Red for unpaired (isLinked() === false)
 *
 * That shading is the standing picture of portal state, independent of any
 * tool. On top of it sit the two gestures this layer hosts, both drawn in the
 * shared language from `gestureOverlay` — blue outline for the pending first
 * pick, amber for a hovered second pick that works, red for one that does not,
 * blue stroke for what committing would change:
 *
 * - The link tool outlines the selected portal rather than shading its cell,
 *   so the selection reads as a pick rather than as another state colour, and
 *   the green/red paired shading stays visible underneath it.
 * - The section tool tints the track art along the chosen route purple and
 *   outlines its two endpoints, so the exact shape of the route reads off the
 *   rails; hovering before the second click strokes the candidate route first.
 */
export function createLinkHighlightLayer(
	cache: TextureCache,
): LinkHighlightLayer {
	const container = new Container();
	container.label = "link-highlight-layer";
	container.visible = false;

	const gfx = new Graphics();
	container.addChild(gfx);

	// Section route tint (below) + endpoint outlines (on top). The tint is
	// translucent so the speed/length colours on the track sprites underneath
	// stay readable through it.
	const sectionContainer = new Container();
	sectionContainer.label = "section-route";
	sectionContainer.alpha = SECTION_TRACK_ALPHA;
	container.addChild(sectionContainer);

	const sectionPreviewGfx = new Graphics();
	container.addChild(sectionPreviewGfx);

	const linkPreviewGfx = new Graphics();
	container.addChild(linkPreviewGfx);

	// Outlines last, so a pick is never buried under a tint or a preview stroke.
	const sectionOutlineGfx = new Graphics();
	container.addChild(sectionOutlineGfx);

	const linkOutlineGfx = new Graphics();
	container.addChild(linkOutlineGfx);

	// The two gestures are never live at once (each belongs to its own tool),
	// but they keep separate outline state so switching tools cannot leave one
	// gesture's endpoints painted into the other's.
	const sectionOutlines = createEndpointOutlines(sectionOutlineGfx);
	const linkOutlines = createEndpointOutlines(linkOutlineGfx);

	const sectionSprites: Sprite[] = [];

	function sync(map: Map_): void {
		gfx.clear();

		const report = map.getLinkedTrackReport();

		const pairedCells: Coord[] = [];
		for (const pair of report.pairedPairs) {
			for (const track of [pair.a, pair.b]) {
				pairedCells.push({
					gx: track.getLocationX(),
					gy: track.getLocationY(),
				});
			}
		}
		const unpairedCells: Coord[] = report.unpairedTracks.map((t) => ({
			gx: t.getLocationX(),
			gy: t.getLocationY(),
		}));

		// Each tier is a faint wash under a thin outline, on the same inset
		// square a gesture pick uses — so a pick lands exactly on top of the
		// state it is about to change instead of beside it. Rects are batched so
		// each colour costs one fill however many portals are on the map.
		for (const c of pairedCells) queueCellRect(gfx, c);
		gfx.fill({ color: STATE_OK_COLOR, alpha: STATE_FILL_ALPHA });

		for (const c of unpairedCells) queueCellRect(gfx, c);
		gfx.fill({ color: STATE_INCOMPLETE_COLOR, alpha: STATE_FILL_ALPHA });

		for (const c of pairedCells) {
			strokeCellOutline(gfx, c, STATE_OK_COLOR, {
				width: STATE_OUTLINE_WIDTH,
				alpha: STATE_OUTLINE_ALPHA,
			});
		}
		for (const c of unpairedCells) {
			strokeCellOutline(gfx, c, STATE_INCOMPLETE_COLOR, {
				width: STATE_OUTLINE_WIDTH,
				alpha: STATE_OUTLINE_ALPHA,
			});
		}

		// Connector lines between paired tracks. Solid, against the dashed
		// connector setLinkPreview draws for a pairing that has not been made.
		for (const pair of report.pairedPairs) {
			const a = gridToWorld(pair.a.getLocationX(), pair.a.getLocationY());
			const b = gridToWorld(pair.b.getLocationX(), pair.b.getLocationY());
			gfx.moveTo(a.x, a.y);
			gfx.lineTo(b.x, b.y);
		}
		gfx.stroke({
			color: STATE_OK_COLOR,
			alpha: STATE_CONNECTOR_ALPHA,
			width: STATE_CONNECTOR_WIDTH,
		});
	}

	function syncSelection(map: Map_): void {
		const selected = map.getLinkedTrack1();
		if (!selected) {
			linkPreviewGfx.clear();
			linkOutlines.setStart(null);
			return;
		}
		linkOutlines.setStart({
			gx: selected.getLocationX(),
			gy: selected.getLocationY(),
		});
	}

	function setLinkPreview(map: Map_, hovered: Coord | null): void {
		linkPreviewGfx.clear();

		const selected = map.getLinkedTrack1();
		if (!selected || !hovered) {
			linkOutlines.setEnd(null);
			return;
		}

		const target = map.getTrackAt(hovered.gx, hovered.gy);
		// Pairing needs a second, different portal: anything else is a dead end
		// for this gesture, and clicking it would do nothing.
		const pairable =
			target !== null && target.data.kind === "linked" && target !== selected;
		linkOutlines.setEnd(hovered, pairable);
		if (!pairable) return;

		const a = gridToWorld(selected.getLocationX(), selected.getLocationY());
		const b = gridToWorld(hovered.gx, hovered.gy);
		dashedLine(linkPreviewGfx, a.x, a.y, b.x, b.y);
		linkPreviewGfx.stroke({
			color: GESTURE_PREVIEW_COLOR,
			width: PREVIEW_WIDTH,
			cap: "round",
		});
	}

	function clearSectionSprites(): void {
		for (const s of sectionSprites) {
			sectionContainer.removeChild(s);
			s.destroy(); // keep the shared cached texture
		}
		sectionSprites.length = 0;
	}

	function highlightSection(
		map: Map_,
		coords: Coord[],
		start: Coord | null,
		end: Coord | null,
	): void {
		clearSectionSprites();
		sectionContainer.visible = true;
		// A committed selection replaces whatever the hover was previewing.
		sectionPreviewGfx.clear();

		for (const c of coords) {
			const track = map.getTrackAt(c.gx, c.gy);
			if (!track) continue;
			const aspect = track.getAspect() >= 0 ? track.getAspect() : undefined;
			const texture = cache.getColored(
				track.data.subtype,
				SECTION_TRACK_COLOR,
				aspect,
			);
			if (!texture) continue;
			const sprite = makeTrackSprite(texture, c.gx, c.gy);
			sectionContainer.addChild(sprite);
			sectionSprites.push(sprite);
		}

		sectionOutlines.setStart(start);
		sectionOutlines.setEnd(end, true);
	}

	function setSectionPreview(coords: Coord[] | null, end: Coord | null): void {
		sectionPreviewGfx.clear();
		sectionOutlines.setEnd(end, coords !== null);
		if (!end || !coords || coords.length < 2) return;

		// Stroked through cell centres rather than tinted like a committed
		// selection: the tint needs a recoloured sprite per cell, which is far
		// too much to rebuild on every pointermove.
		const first = gridToWorld(itemAt(coords, 0).gx, itemAt(coords, 0).gy);
		sectionPreviewGfx.moveTo(first.x, first.y);
		for (let i = 1; i < coords.length; i++) {
			const { x, y } = gridToWorld(itemAt(coords, i).gx, itemAt(coords, i).gy);
			sectionPreviewGfx.lineTo(x, y);
		}
		sectionPreviewGfx.stroke({
			color: GESTURE_PREVIEW_COLOR,
			width: PREVIEW_WIDTH,
			cap: "round",
			join: "round",
		});
	}

	function setSectionRouteVisible(visible: boolean): void {
		sectionContainer.visible = visible;
	}

	function clearSectionHighlight(): void {
		sectionOutlines.clear();
		sectionPreviewGfx.clear();
		clearSectionSprites();
	}

	return {
		container,
		sync,
		syncSelection,
		setLinkPreview,
		highlightSection,
		setSectionPreview,
		setSectionRouteVisible,
		clearSectionHighlight,
	};
}
