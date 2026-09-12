import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "#/store/editor-store";

/** Fresh store between cases — zustand keeps one instance per module. */
const reset = () => {
	useEditorStore.setState({
		tool: "select",
		selectedKind: null,
		selectedSubtype: null,
		pendingText: null,
		pendingNameTarget: null,
		sectionStart: null,
		sectionEnd: null,
		sectionTracks: [],
		directionStart: null,
		directionMode: "set",
	});
};

describe("setTool", () => {
	beforeEach(reset);

	it("cancels a half-made direction gesture when switching to Add", () => {
		const s = useEditorStore.getState();
		s.setTool("direction");
		s.setDirectionStart({ gx: 0, gy: 0 });
		useEditorStore.getState().setTool("add");
		// A stale start would make the next direction click land as a second
		// click of the abandoned gesture.
		expect(useEditorStore.getState().directionStart).toBeNull();
	});

	it("clears a section selection when switching to Add", () => {
		const s = useEditorStore.getState();
		s.setTool("section");
		s.setSectionStart({ gx: 0, gy: 0 });
		s.setSectionEnd({ gx: 2, gy: 0 }, [
			{ gx: 0, gy: 0 },
			{ gx: 1, gy: 0 },
			{ gx: 2, gy: 0 },
		]);
		useEditorStore.getState().setTool("add");
		// The section edit panel is derived from this state and floats over the
		// canvas, so leaving it set swallows clicks meant for the Add tool.
		const next = useEditorStore.getState();
		expect(next.sectionStart).toBeNull();
		expect(next.sectionEnd).toBeNull();
		expect(next.sectionTracks).toEqual([]);
	});

	it("closes pending dialogs when switching tools", () => {
		const s = useEditorStore.getState();
		s.setTool("text");
		s.setPendingText({ mode: "place", x: 1, y: 2 });
		useEditorStore.getState().setTool("direction");
		expect(useEditorStore.getState().pendingText).toBeNull();
	});

	it("keeps the Add palette's selection across a trip to another tool", () => {
		const s = useEditorStore.getState();
		s.setTool("add");
		s.selectKind("straight");
		s.selectSubtype("STRAIGHTH");
		useEditorStore.getState().setTool("select");
		// Leaving Add drops the selection…
		expect(useEditorStore.getState().selectedSubtype).toBeNull();

		// …but a tool switch that lands on Add never clears it.
		s.selectKind("straight");
		useEditorStore.setState({ selectedSubtype: "STRAIGHTH", tool: "add" });
		useEditorStore.getState().setTool("add");
		expect(useEditorStore.getState().selectedSubtype).toBe("STRAIGHTH");
	});

	it("disarms direction erase mode when the tool is left", () => {
		const s = useEditorStore.getState();
		s.setTool("direction");
		s.setDirectionMode("erase");
		useEditorStore.getState().setTool("add");
		useEditorStore.getState().setTool("direction");
		// Coming back to the tool starts in the non-destructive mode.
		expect(useEditorStore.getState().directionMode).toBe("set");
	});

	it("re-picking the direction tool resets its pending start", () => {
		const s = useEditorStore.getState();
		s.setTool("direction");
		s.setDirectionStart({ gx: 3, gy: 4 });
		useEditorStore.getState().setTool("direction");
		expect(useEditorStore.getState().directionStart).toBeNull();
	});
});
