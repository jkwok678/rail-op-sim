import type { Map as Map_, Text as MapText } from "@rail-op-sim/shared";
import { Container, Text as PixiText, TextStyle } from "pixi.js";
import { debugLog } from "#/lib/debugLogger";
import { gridToWorld } from "#/lib/grid";
import { normalizeCssColor } from "#/lib/svgColors";

// ============================================================================
// Layer interface
// ============================================================================

export interface TextLayer {
	container: Container;
	/** Full reconcile against the map's text list. */
	sync(map: Map_): void;
	/**
	 * Return the topmost {@link MapText} whose rendered box contains the given
	 * world-space point, or null. Uses the actual PixiText bounds (not the
	 * legacy `Map_.getTextAt` bounding box, which doesn't match rendered pixels).
	 */
	hitTest(worldX: number, worldY: number): MapText | null;
	/** Drop everything so the next sync rebuilds. */
	clear(): void;
	destroy(): void;
}

/**
 * Renders text labels on their own dedicated layer above elements and tracks.
 */
export function createTextLayer(): TextLayer {
	const container = new Container();
	container.label = "text-layer";

	const textEntries: PixiText[] = [];
	// Parallel to textEntries: the map Text model each PixiText renders, so
	// hitTest can map a rendered box back to its model. Kept in sync (pushed
	// together, cleared together).
	const textModels: MapText[] = [];

	return {
		container,

		sync(map) {
			// PixiJS v8 can't parse the `oklch(…)` values shadcn/ui ships, so
			// normalise the design token to a concrete `#rrggbb` first.
			const textColor = normalizeCssColor("var(--foreground)");

			// Remove old text objects
			for (const text of textEntries) {
				container.removeChild(text);
				text.destroy();
			}
			textEntries.length = 0;
			textModels.length = 0;

			const textList = map.getTextList();
			for (let i = 0; i < textList.length; i++) {
				const t = textList[i];
				const style = new TextStyle({
					fontFamily: t.getFont().family,
					fontSize: t.getFont().pointSize * 2, // scale up from point size to pixel size
					fill: textColor,
				});
				const pixiText = new PixiText({ text: t.getReadableText(), style });
				const { x, y } = gridToWorld(t.getLocationX(), t.getLocationY());
				pixiText.position.set(x, y);
				pixiText.anchor.set(0, 0.5);
				pixiText.label = `text-${i}`;
				container.addChild(pixiText);
				textEntries.push(pixiText);
				textModels.push(t);
			}

			debugLog(
				"trackLayer",
				`textLayer sync complete — ${textEntries.length} texts`,
			);
		},

		hitTest(worldX, worldY) {
			// Topmost first — iterate in reverse draw order.
			for (let i = textEntries.length - 1; i >= 0; i--) {
				const p = textEntries[i];
				// anchor (0, 0.5): x grows right from position, y centred on position.
				const left = p.position.x;
				const right = p.position.x + p.width;
				const top = p.position.y - p.height / 2;
				const bottom = p.position.y + p.height / 2;
				if (
					worldX >= left &&
					worldX <= right &&
					worldY >= top &&
					worldY <= bottom
				) {
					return textModels[i];
				}
			}
			return null;
		},

		clear() {
			for (const text of textEntries) {
				container.removeChild(text);
				text.destroy();
			}
			textEntries.length = 0;
			textModels.length = 0;
		},

		destroy() {
			this.clear();
			container.destroy({ children: true });
		},
	};
}
