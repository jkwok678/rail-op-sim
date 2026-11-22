import { beforeEach, describe, expect, it } from "vitest";
import { SectionTool } from "#/editor/tools/SectionTool";
import { useEditorStore } from "#/store/editor-store";
import {
	addLine,
	at,
	type Harness,
	makeHarness,
	resetStores,
} from "./toolHarness";

describe("SectionTool", () => {
	let h: Harness;
	let tool: SectionTool;

	beforeEach(() => {
		resetStores();
		useEditorStore.getState().setTool("section");
		h = makeHarness();
		addLine(h.map, 0, 4);
		tool = new SectionTool(h.ctx);
	});

	it("selects the route between two clicks", () => {
		tool.click(at(1, 0));
		expect(useEditorStore.getState().sectionStart).toEqual({ gx: 1, gy: 0 });

		tool.click(at(3, 0));
		const { sectionEnd, sectionTracks } = useEditorStore.getState();
		expect(sectionEnd).toEqual({ gx: 3, gy: 0 });
		expect(sectionTracks).toEqual([
			{ gx: 1, gy: 0 },
			{ gx: 2, gy: 0 },
			{ gx: 3, gy: 0 },
		]);
		expect(h.layers.linkHighlight.highlightSection).toHaveBeenLastCalledWith(
			h.map,
			sectionTracks,
			{ gx: 1, gy: 0 },
			{ gx: 3, gy: 0 },
		);
	});

	it("a click on empty ground abandons the selection", () => {
		tool.click(at(1, 0));
		tool.click(at(1, 5));
		expect(useEditorStore.getState().sectionStart).toBeNull();
		expect(h.layers.trackColor.hide).toHaveBeenCalled();
	});

	it("previews the route to the hovered track, not to the start itself", () => {
		tool.preview(at(3, 0));
		expect(h.layers.linkHighlight.setSectionPreview).not.toHaveBeenCalled();

		tool.click(at(1, 0));
		tool.preview(at(1, 0));
		expect(h.layers.linkHighlight.setSectionPreview).not.toHaveBeenCalled();

		tool.preview(at(3, 0));
		expect(h.layers.linkHighlight.setSectionPreview).toHaveBeenLastCalledWith(
			[
				{ gx: 1, gy: 0 },
				{ gx: 2, gy: 0 },
				{ gx: 3, gy: 0 },
			],
			{ gx: 3, gy: 0 },
		);
	});

	it("applies speed and length to every selected track as one step", () => {
		tool.click(at(1, 0));
		tool.click(at(3, 0));
		tool.applySectionEdit({ mainSpeed: 80, mainLength: 250 });

		for (const gx of [1, 2, 3]) {
			expect(h.map.getTrackAt(gx, 0)?.getTrackMainSpeed()).toBe(80);
		}
		expect(h.map.getTrackAt(0, 0)?.getTrackMainSpeed()).not.toBe(80);
		expect(h.commits.map((c) => c.label)).toEqual(["Change speed & length"]);
		expect(h.layers.linkHighlight.setSectionRouteVisible).toHaveBeenCalledWith(
			false,
		);
	});

	it("shows the colour overlay while active and clears it when left", () => {
		tool.activate();
		expect(h.layers.trackColor.show).toHaveBeenCalledWith(h.map);
		tool.deactivate();
		expect(h.layers.trackColor.hide).toHaveBeenCalled();
		expect(h.layers.linkHighlight.clearSectionHighlight).toHaveBeenCalled();
	});

	it("reset drops the route preview", () => {
		tool.click(at(1, 0));
		tool.preview(at(3, 0));
		tool.reset();
		expect(h.layers.linkHighlight.setSectionPreview).toHaveBeenLastCalledWith(
			null,
			null,
		);
	});
});
