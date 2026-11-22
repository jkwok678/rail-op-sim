import { createTrackData, SwitchType } from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CellPickTool } from "#/editor/tools/CellPickTool";
import { OperateTool } from "#/editor/tools/OperateTool";
import { applyOperateIntent } from "#/lib/operateActions";
import { useTimetableStore } from "#/store/timetable-store";
import { at, makeHarness, resetStores } from "./toolHarness";

vi.mock("#/lib/operateActions", () => ({
	applyOperateIntent: vi.fn(async () => {}),
}));

describe("CellPickTool", () => {
	beforeEach(resetStores);

	it("fills the pending timetable field with the clicked cell", () => {
		const completeCellPick = vi.fn();
		useTimetableStore.setState({
			pendingCellPick: { serviceRef: "1A01", actionIndex: 0, field: "rear" },
			completeCellPick,
		});
		const h = makeHarness();
		new CellPickTool(h.ctx).click(at(3, -2));
		expect(completeCellPick).toHaveBeenCalledWith({ gx: 3, gy: -2 }, h.map);
	});
});

describe("OperateTool", () => {
	beforeEach(() => {
		resetStores();
		vi.mocked(applyOperateIntent).mockClear();
	});

	it("a click on open track starts a route there", () => {
		const tool = new OperateTool(makeHarness().ctx);
		tool.click(at(2, 0));
		expect(applyOperateIntent).toHaveBeenCalledWith(
			expect.objectContaining({ type: "startRoute", at: { gx: 2, gy: 0 } }),
		);
	});

	it("a click on points throws them", () => {
		const h = makeHarness();
		h.map.addTrack(createTrackData("switch", SwitchType.SWITCHTIGHT1), 1, 0);
		new OperateTool(h.ctx).click(at(1, 0));
		expect(applyOperateIntent).toHaveBeenCalledWith({
			type: "togglePoints",
			at: { gx: 1, gy: 0 },
		});
	});

	it("a right-click on nothing does nothing", () => {
		new OperateTool(makeHarness().ctx).rightClick(at(2, 0, 2));
		expect(applyOperateIntent).toHaveBeenCalledWith({ type: "none" });
	});
});
