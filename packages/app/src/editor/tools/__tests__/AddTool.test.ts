import { Platform, StraightType } from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { AddTool } from "#/editor/tools/AddTool";
import { gridToWorld } from "#/lib/grid";
import { useEditorStore } from "#/store/editor-store";
import { at, type Harness, makeHarness, resetStores } from "./toolHarness";

function pick(
	kind: "straight" | "platform" | "levelCrossing",
	subtype: string,
) {
	const editor = useEditorStore.getState();
	editor.setTool("add");
	editor.selectKind(kind);
	editor.selectSubtype(subtype);
}

describe("AddTool", () => {
	let h: Harness;
	let tool: AddTool;

	beforeEach(() => {
		resetStores();
		h = makeHarness();
		tool = new AddTool(h.ctx);
	});

	it("places the selected track on the clicked cell as one undoable step", () => {
		pick("straight", StraightType.STRAIGHTH);
		tool.click(at(2, 3));

		expect(h.map.getTrackAt(2, 3)?.data.kind).toBe("straight");
		expect(h.commits.map((c) => c.label)).toEqual(["Add straight track"]);
		expect(h.layers.track.upsertCell).toHaveBeenCalledWith(
			StraightType.STRAIGHTH,
			2,
			3,
			undefined,
		);
		expect(h.publishTrackStatus).toHaveBeenCalled();
	});

	it("skips a cell another track already occupies without redrawing it", () => {
		pick("straight", StraightType.STRAIGHTH);
		tool.click(at(0, 0));
		h.layers.track.upsertCell.mockClear();

		pick("straight", StraightType.STRAIGHTV);
		tool.click(at(0, 0));
		expect(h.layers.track.upsertCell).not.toHaveBeenCalled();
		expect(h.map.getTrackAt(0, 0)?.data.subtype).toBe(StraightType.STRAIGHTH);
	});

	it("does nothing with no palette selection", () => {
		useEditorStore.getState().setTool("add");
		tool.click(at(0, 0));
		expect(h.map.getTrackAt(0, 0)).toBeNull();
		expect(h.commits).toHaveLength(0);
	});

	it("places a platform on an existing track", () => {
		pick("straight", StraightType.STRAIGHTH);
		tool.click(at(0, 0));
		pick("platform", "PLATFORM_UP_SET");
		tool.click(at(0, 0));

		expect(h.map.getTrackAt(0, 0)?.hasPlatform()).toBe(true);
		expect(h.commits.at(-1)?.label).toBe("Add platform");
		expect(h.layers.element.sync).toHaveBeenCalled();
	});

	it("right-click removes the platform before the track under it", () => {
		pick("straight", StraightType.STRAIGHTH);
		tool.click(at(0, 0));
		h.map.addPlatform(Platform.UP, 0, 0);

		tool.rightClick(at(0, 0, 2));
		expect(h.map.getTrackAt(0, 0)?.hasPlatform()).toBe(false);
		expect(h.map.getTrackAt(0, 0)).not.toBeNull();

		tool.rightClick(at(0, 0, 2));
		expect(h.map.getTrackAt(0, 0)).toBeNull();
		expect(h.layers.track.removeCell).toHaveBeenCalledWith(0, 0);
		expect(h.commits.map((c) => c.label)).toContain("Delete element");
	});

	it("right-click on an empty cell redraws nothing", () => {
		tool.rightClick(at(5, 5, 2));
		expect(h.layers.track.removeCell).not.toHaveBeenCalled();
		expect(h.publishTrackStatus).not.toHaveBeenCalled();
	});

	it("shows a crosshair only once something is selected", () => {
		useEditorStore.getState().setTool("add");
		expect(tool.cursor()).toBe("");
		pick("straight", StraightType.STRAIGHTH);
		expect(tool.cursor()).toBe("crosshair");
	});

	it("builds a ghost for the selection and snaps it to the hovered cell", () => {
		pick("straight", StraightType.STRAIGHTH);
		tool.refresh();
		expect(h.ghost.children).toHaveLength(1);

		tool.preview(at(4, -1));
		const { x, y } = gridToWorld(4, -1);
		expect(h.ghost.visible).toBe(true);
		expect(h.ghost.position.x).toBe(x);
		expect(h.ghost.position.y).toBe(y);

		tool.clear();
		expect(h.ghost.visible).toBe(false);
	});

	it("keeps one ghost sprite across refreshes and drops it on deactivate", () => {
		pick("straight", StraightType.STRAIGHTH);
		tool.refresh();
		tool.refresh();
		expect(h.ghost.children).toHaveLength(1);

		tool.invalidate();
		tool.refresh();
		expect(h.ghost.children).toHaveLength(1);

		tool.deactivate();
		expect(h.ghost.children).toHaveLength(0);
		expect(h.ghost.visible).toBe(false);
	});
});
