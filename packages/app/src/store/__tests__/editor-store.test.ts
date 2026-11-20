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
		directionHint: null,
		directionMode: "set",
		showShortcuts: false,
		showTrackInfo: false,
		showTrainInfo: false,
		showTrainTimetable: false,
		hoveredTrackInfo: null,
		hoveredTrainInfo: null,
		saveFormat: "json",
		canUndo: false,
		canRedo: false,
		undoLabel: null,
		redoLabel: null,
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

	it("clears a facing-switch hint when the gesture is cancelled", () => {
		const s = useEditorStore.getState();
		s.setTool("direction");
		s.setDirectionStart({ gx: 0, gy: 0 });
		s.setDirectionHint("Click past the switch to choose a branch");
		useEditorStore.getState().setDirectionStart(null);
		expect(useEditorStore.getState().directionHint).toBeNull();
	});
});

describe("setHistoryState", () => {
	beforeEach(reset);

	it("defaults to both buttons disabled and unlabelled", () => {
		const s = useEditorStore.getState();
		expect(s.canUndo).toBe(false);
		expect(s.canRedo).toBe(false);
		expect(s.undoLabel).toBeNull();
		expect(s.redoLabel).toBeNull();
	});

	it("mirrors the whole summary the controller pushes", () => {
		useEditorStore.getState().setHistoryState({
			canUndo: true,
			canRedo: true,
			undoLabel: "Add platform",
			redoLabel: "Delete element",
		});
		const s = useEditorStore.getState();
		expect(s.canUndo).toBe(true);
		expect(s.canRedo).toBe(true);
		expect(s.undoLabel).toBe("Add platform");
		expect(s.redoLabel).toBe("Delete element");
	});
});

describe("showShortcuts", () => {
	beforeEach(reset);

	it("starts closed", () => {
		expect(useEditorStore.getState().showShortcuts).toBe(false);
	});

	it("toggles both ways", () => {
		useEditorStore.getState().toggleShortcuts();
		expect(useEditorStore.getState().showShortcuts).toBe(true);
		useEditorStore.getState().toggleShortcuts();
		expect(useEditorStore.getState().showShortcuts).toBe(false);
	});

	it("can be set directly, for the dialog's onOpenChange", () => {
		useEditorStore.getState().setShortcuts(true);
		expect(useEditorStore.getState().showShortcuts).toBe(true);
		useEditorStore.getState().setShortcuts(false);
		expect(useEditorStore.getState().showShortcuts).toBe(false);
	});

	// setTool cancels the tool being left, but the shortcut reference is not part
	// of any tool — closing it on a tool key would fight the key that opened it.
	it("survives a tool change", () => {
		useEditorStore.getState().setShortcuts(true);
		useEditorStore.getState().setTool("add");
		expect(useEditorStore.getState().showShortcuts).toBe(true);
	});
});

describe("saveFormat", () => {
	beforeEach(reset);

	it("defaults to JSON", () => {
		expect(useEditorStore.getState().saveFormat).toBe("json");
	});

	it("remembers YAML for the next save", () => {
		useEditorStore.getState().setSaveFormat("yaml");
		expect(useEditorStore.getState().saveFormat).toBe("yaml");
	});
});

describe("showTrainInfo and showTrainTimetable", () => {
	beforeEach(reset);

	it("start off and clear hoveredTrainInfo only when both are turned off", () => {
		expect(useEditorStore.getState().showTrainInfo).toBe(false);
		expect(useEditorStore.getState().showTrainTimetable).toBe(false);

		useEditorStore.getState().toggleShowTrainInfo();
		useEditorStore.getState().toggleShowTrainTimetable();
		expect(useEditorStore.getState().showTrainInfo).toBe(true);
		expect(useEditorStore.getState().showTrainTimetable).toBe(true);

		useEditorStore.getState().setHoveredTrainInfo({
			headcode: "1A01",
			description: null,
			statusLabel: "60 km/h",
			next: null,
			signallerControl: false,
			reminder: null,
			timetable: [],
			screenX: 10,
			screenY: 20,
		});

		useEditorStore.getState().toggleShowTrainInfo();
		expect(useEditorStore.getState().showTrainInfo).toBe(false);
		expect(useEditorStore.getState().hoveredTrainInfo).not.toBeNull();

		useEditorStore.getState().toggleShowTrainTimetable();
		expect(useEditorStore.getState().showTrainTimetable).toBe(false);
		expect(useEditorStore.getState().hoveredTrainInfo).toBeNull();
	});
});
