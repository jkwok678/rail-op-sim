import { Container, Text as PixiText, TextStyle } from "pixi.js";
import { Map as Map_ } from "@rail-op-sim/shared";
import { gridToWorld } from "#/lib/grid";
import { normalizeCssColor } from "#/lib/svgColors";
import { debugLog } from "#/lib/debugLogger";

// ============================================================================
// Layer interface
// ============================================================================

export interface TextLayer {
	container: Container;
	/** Full reconcile against the map's text list. */
	sync(map: Map_): void;
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
			}

			debugLog("trackLayer", `textLayer sync complete — ${textEntries.length} texts`);
		},

		clear() {
			for (const text of textEntries) {
				container.removeChild(text);
				text.destroy();
			}
			textEntries.length = 0;
		},

		destroy() {
			this.clear();
			container.destroy({ children: true });
		},
	};
}
