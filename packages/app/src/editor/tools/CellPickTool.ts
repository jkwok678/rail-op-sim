import type { Tool, ToolContext, ToolPointer } from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";

/**
 * Borrows one primary click for the timetable editor's "pick on map": the
 * cell clicked fills the pending timetable field.
 *
 * It is not an editor tool the user picks — the controller hands it the click
 * whenever a cell pick is pending, ahead of whatever tool is active, since the
 * user asked for this click specifically. The map stays on its own tool.
 */
export class CellPickTool implements Tool {
	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return "";
	}

	click(p: ToolPointer): void {
		const timetable = this.ctx.stores.timetable.getState();
		const field = timetable.pendingCellPick?.field ?? "?";
		timetable.completeCellPick(p.cell, this.ctx.map);
		debugLog(
			"placement",
			`cell pick → (${p.cell.gx},${p.cell.gy}) into ${field}`,
		);
	}

	clear(): void {}
}
