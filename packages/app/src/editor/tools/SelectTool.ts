import type { Tool } from "#/editor/tools/Tool";

/**
 * The resting tool. It edits nothing — clicks on the map fall through to
 * nothing, which is why every mode other than railway puts the tool back here.
 * Hover tooltips still work, since the controller runs them for every tool.
 */
export class SelectTool implements Tool {
	cursor(): string {
		return "";
	}

	clear(): void {}
}
