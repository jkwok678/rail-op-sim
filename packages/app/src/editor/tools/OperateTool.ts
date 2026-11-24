import type { EditorTool, ToolContext, ToolPointer } from "#/editor/tools/Tool";
import { debugLog } from "#/lib/debugLogger";
import { applyOperateIntent } from "#/lib/operateActions";
import { resolveOperateClick } from "#/lib/operateInput";
import { findTrainAt } from "#/lib/trainInfo";

/**
 * Works the signalling in operate mode: a click sets or cancels a route,
 * throws points, or opens a train's menu. The controller hands it every click
 * in operate mode, left or right, since nothing there edits the map.
 */
export class OperateTool implements EditorTool {
	constructor(private readonly ctx: ToolContext) {}

	cursor(): string {
		return "";
	}

	click(p: ToolPointer): void {
		this.handle(p);
	}

	rightClick(p: ToolPointer): void {
		this.handle(p);
	}

	clear(): void {}

	private handle(p: ToolPointer): void {
		const { map, stores } = this.ctx;
		const { cell } = p;
		const step = map.getImageSize();
		const track = map.getTrackAt(cell.gx * step, cell.gy * step);
		const operate = stores.operate.getState();
		const train = findTrainAt(operate.view?.trains ?? [], cell.gx, cell.gy);
		const intent = resolveOperateClick(operate, {
			button: p.button === 2 ? "right" : "left",
			cell,
			onPoints: track?.data.kind === "switch",
			trainId: train?.id ?? null,
			screenX: p.clientX,
			screenY: p.clientY,
		});
		debugLog("placement", `operate click → ${intent.type}`);
		void applyOperateIntent(intent);
	}
}
