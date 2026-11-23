import { beforeEach, describe, expect, it } from "vitest";
import { DirectionTool } from "#/editor/tools/DirectionTool";
import { useEditorStore } from "#/store/editor-store";
import { defined } from "../../../lib/__tests__/test-helpers";
import {
	addLine,
	at,
	type Harness,
	makeHarness,
	resetStores,
} from "./toolHarness";

/** Mark the railway physically joined, which the tool requires. */
function markConnected(connected = true): void {
	useEditorStore.setState({
		trackStatus: {
			total: 7,
			connected,
			complete: false,
			dangling: 0,
			unpairedLinked: 0,
			unnamed: 0,
			undirected: 0,
			brokenRoutes: 0,
			firstIssue: null,
		},
	});
}

describe("DirectionTool", () => {
	let h: Harness;
	let tool: DirectionTool;

	beforeEach(() => {
		resetStores();
		useEditorStore.getState().setTool("direction");
		markConnected();
		h = makeHarness();
		addLine(h.map, 0, 4);
		tool = new DirectionTool(h.ctx);
	});

	it("assigns directions along the route between two clicks", () => {
		tool.click(at(0, 0));
		expect(useEditorStore.getState().directionStart).toEqual({ gx: 0, gy: 0 });
		expect(h.layers.direction.setSelection).toHaveBeenLastCalledWith(
			{ gx: 0, gy: 0 },
			false,
		);

		tool.click(at(4, 0));
		expect(h.map.getTrackAt(2, 0)?.hasPreferredDirection()).toBe(true);
		expect(useEditorStore.getState().directionStart).toBeNull();
		expect(h.commits.map((c) => c.label)).toEqual(["Set directions"]);
		expect(h.publishTrackStatus).toHaveBeenCalled();
	});

	it("erase mode removes the directions along the route", () => {
		tool.click(at(0, 0));
		tool.click(at(4, 0));
		useEditorStore.getState().setDirectionMode("erase");

		tool.click(at(0, 0));
		tool.click(at(4, 0));
		expect(h.map.getTrackAt(2, 0)?.hasPreferredDirection()).toBe(false);
		expect(h.commits.at(-1)?.label).toBe("Erase directions");
	});

	it("clicking the start again cancels the gesture", () => {
		tool.click(at(1, 0));
		tool.click(at(1, 0));
		expect(useEditorStore.getState().directionStart).toBeNull();
		expect(h.commits).toHaveLength(0);
	});

	it("ignores clicks while the railway is not joined", () => {
		markConnected(false);
		tool.click(at(1, 0));
		expect(useEditorStore.getState().directionStart).toBeNull();
	});

	it("right-click clears every direction on one track", () => {
		tool.click(at(0, 0));
		tool.click(at(4, 0));
		tool.rightClick(at(2, 0, 2));
		expect(h.map.getTrackAt(2, 0)?.hasPreferredDirection()).toBe(false);
		expect(h.map.getTrackAt(3, 0)?.hasPreferredDirection()).toBe(true);
		expect(h.commits.at(-1)?.label).toBe("Clear directions");
	});

	it("previews the route from the pending start", () => {
		tool.click(at(0, 0));
		tool.preview(at(3, 0));
		const [map, path, end] = defined(
			h.layers.direction.setRoutePreview.mock.calls[0],
			"calls[0]",
		);
		expect(map).toBe(h.map);
		expect(path).toHaveLength(4);
		expect(end).toEqual({ gx: 3, gy: 0 });

		tool.clear();
		expect(h.layers.direction.setRoutePreview).toHaveBeenLastCalledWith(
			h.map,
			null,
			null,
		);
	});

	it("mirrors a pending start the store clears without a click", () => {
		tool.click(at(0, 0));
		const prev = useEditorStore.getState();
		useEditorStore.getState().setDirectionStart(null);
		tool.editorChanged(useEditorStore.getState(), prev);
		expect(h.layers.direction.setSelection).toHaveBeenLastCalledWith(
			null,
			false,
		);
	});

	it("reset drops the pending start, which may name a vanished track", () => {
		tool.click(at(0, 0));
		tool.reset();
		expect(useEditorStore.getState().directionStart).toBeNull();
		expect(h.layers.direction.setSelection).toHaveBeenLastCalledWith(null);
	});

	it("shows the arrows while active and hides them when left unless pinned", () => {
		tool.activate();
		expect(h.layers.direction.container.visible).toBe(true);
		tool.deactivate();
		expect(h.layers.direction.container.visible).toBe(false);

		useEditorStore.setState({ showDirections: true });
		tool.activate();
		tool.deactivate();
		expect(h.layers.direction.container.visible).toBe(true);
	});
});
