import { createTrackData, LinkedType } from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { LinkTool } from "#/editor/tools/LinkTool";
import { useEditorStore } from "#/store/editor-store";
import { at, type Harness, makeHarness, resetStores } from "./toolHarness";

describe("LinkTool", () => {
	let h: Harness;
	let tool: LinkTool;

	beforeEach(() => {
		resetStores();
		useEditorStore.getState().setTool("link");
		h = makeHarness();
		h.map.addTrack(createTrackData("linked", LinkedType.LINKLEFT), 0, 0);
		h.map.addTrack(createTrackData("linked", LinkedType.LINKRIGHT), 5, 0);
		tool = new LinkTool(h.ctx);
	});

	it("pairs two portals with two clicks", () => {
		tool.click(at(0, 0));
		expect(h.map.getLinkedTrack1()).toBe(h.map.getTrackAt(0, 0));

		tool.click(at(5, 0));
		expect(h.map.getTrackAt(0, 0)?.isLinked()).toBe(true);
		expect(h.map.getTrackAt(5, 0)?.isLinked()).toBe(true);
		expect(h.commits.map((c) => c.label)).toEqual([
			"Link portals",
			"Link portals",
		]);
		expect(h.layers.linkHighlight.syncSelection).toHaveBeenCalled();
	});

	it("previews a pairing only once a portal is picked, once per cell", () => {
		tool.preview(at(5, 0));
		expect(h.layers.linkHighlight.setLinkPreview).not.toHaveBeenCalled();

		tool.click(at(0, 0));
		tool.preview(at(5, 0));
		tool.preview(at(5, 0));
		expect(h.layers.linkHighlight.setLinkPreview).toHaveBeenCalledTimes(1);
		expect(h.layers.linkHighlight.setLinkPreview).toHaveBeenLastCalledWith(
			h.map,
			{ gx: 5, gy: 0 },
		);

		tool.clear();
		expect(h.layers.linkHighlight.setLinkPreview).toHaveBeenLastCalledWith(
			h.map,
			null,
		);
	});

	it("shows the portal highlights while active", () => {
		tool.activate();
		expect(h.layers.linkHighlight.container.visible).toBe(true);
	});

	it("leaving the tool drops the pick and hides highlights unless pinned on", () => {
		tool.activate();
		tool.click(at(0, 0));

		tool.deactivate();
		expect(h.map.getLinkedTrack1()).toBeNull();
		expect(h.layers.linkHighlight.container.visible).toBe(false);

		useEditorStore.setState({ showLinkHighlights: true });
		tool.activate();
		tool.deactivate();
		expect(h.layers.linkHighlight.container.visible).toBe(true);
	});

	it("reset drops a pick an undo may have removed the track of", () => {
		tool.click(at(0, 0));
		tool.reset();
		expect(h.map.getLinkedTrack1()).toBeNull();
		expect(h.layers.linkHighlight.syncSelection).toHaveBeenLastCalledWith(
			h.map,
		);
	});
});
