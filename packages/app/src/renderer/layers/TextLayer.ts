import type { Map as Map_, Text as MapText } from "@rail-op-sim/shared";
import { Container, Graphics, Text as PixiText, TextStyle } from "pixi.js";
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
	/**
	 * Reposition an already-rendered text (and its decoration) without a full
	 * rebuild. Used for live drag feedback, where the model is only written once
	 * the drag is released — a {@link sync} puts everything back.
	 */
	moveTo(text: MapText, worldX: number, worldY: number): void;
	/** Drop everything so the next sync rebuilds. */
	clear(): void;
	destroy(): void;
}

/**
 * Renders text labels on their own dedicated layer above elements and tracks.
 */
/** Whether a drawn text's box covers the world-space point `(x, y)`. */
function covers(p: PixiText, x: number, y: number): boolean {
	// anchor (0, 0.5): x grows right from position, y centred on position.
	const { x: left, y: middle } = p.position;
	return (
		x >= left &&
		x <= left + p.width &&
		y >= middle - p.height / 2 &&
		y <= middle + p.height / 2
	);
}

export function createTextLayer(): TextLayer {
	const container = new Container();
	container.label = "text-layer";

	const textEntries: PixiText[] = [];
	// Parallel to textEntries: the map Text model each PixiText renders, so
	// hitTest can map a rendered box back to its model. Kept in sync (pushed
	// together, cleared together).
	const textModels: MapText[] = [];
	// Parallel to textEntries: underline/strikethrough decoration for each text,
	// or null when it has neither. Pixi TextStyle can't draw these, so we render
	// them as manual Graphics lines. Removed/destroyed alongside textEntries.
	const decorations: (Graphics | null)[] = [];

	/** Remove and destroy every rendered text and its decoration. */
	function removeAll() {
		for (const text of textEntries) {
			container.removeChild(text);
			text.destroy();
		}
		for (const deco of decorations) {
			if (deco) {
				container.removeChild(deco);
				deco.destroy();
			}
		}
		textEntries.length = 0;
		textModels.length = 0;
		decorations.length = 0;
	}

	return {
		container,

		sync(map) {
			// PixiJS v8 can't parse the `oklch(…)` values shadcn/ui ships, so
			// normalise the design token to a concrete `#rrggbb` first.
			const textColor = normalizeCssColor("var(--foreground)");

			// Remove old text objects and their decorations
			removeAll();

			const textList = map.getTextList();
			for (const [i, t] of textList.entries()) {
				const font = t.getFont();
				const fill = font.color ? normalizeCssColor(font.color) : textColor;
				const style = new TextStyle({
					fontFamily: font.family,
					fontSize: font.pointSize * 2, // scale up from point size to pixel size
					fontWeight: font.bold ? "bold" : "normal",
					fontStyle: font.italic ? "italic" : "normal",
					fill,
				});
				const pixiText = new PixiText({ text: t.getReadableText(), style });
				const { x, y } = gridToWorld(t.getLocationX(), t.getLocationY());
				pixiText.position.set(x, y);
				pixiText.anchor.set(0, 0.5);
				pixiText.label = `text-${i}`;
				container.addChild(pixiText);
				textEntries.push(pixiText);
				textModels.push(t);

				// Underline / strikethrough: Pixi TextStyle has no native support,
				// so draw manual lines across the rendered box. anchor (0, 0.5)
				// centres the text vertically on position.y and grows right.
				if (font.underline || font.strikethrough) {
					const deco = new Graphics();
					const thickness = Math.max(1, font.pointSize / 8);
					// Drawn in the text's own local space and then positioned on top of
					// it, so moveTo() can shift text and decoration together.
					if (font.strikethrough) {
						deco
							.moveTo(0, 0)
							.lineTo(pixiText.width, 0)
							.stroke({ color: fill, width: thickness });
					}
					if (font.underline) {
						const uy = pixiText.height / 2 - thickness;
						deco
							.moveTo(0, uy)
							.lineTo(pixiText.width, uy)
							.stroke({ color: fill, width: thickness });
					}
					deco.position.set(x, y);
					deco.label = `text-deco-${i}`;
					container.addChild(deco);
					decorations.push(deco);
				} else {
					decorations.push(null);
				}
			}

			debugLog(
				"trackLayer",
				`textLayer sync complete — ${textEntries.length} texts`,
			);
		},

		hitTest(worldX, worldY) {
			// Topmost first — iterate in reverse draw order.
			for (const [i, p] of [...textEntries.entries()].reverse()) {
				if (covers(p, worldX, worldY)) return textModels[i] ?? null;
			}
			return null;
		},

		moveTo(text, worldX, worldY) {
			const i = textModels.indexOf(text);
			if (i === -1) return;
			textEntries[i]?.position.set(worldX, worldY);
			decorations[i]?.position.set(worldX, worldY);
		},

		clear() {
			removeAll();
		},

		destroy() {
			this.clear();
			container.destroy({ children: true });
		},
	};
}
