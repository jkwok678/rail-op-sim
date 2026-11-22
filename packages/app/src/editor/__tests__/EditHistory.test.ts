import { describe, expect, it } from "vitest";
import { type EditCommand, EditHistory } from "#/editor/EditHistory";

/** Commands are opaque to the history, so an empty journal is fine here. */
const cmd = (label: string): EditCommand => ({
	label,
	entries: [],
	refresh: { track: true },
});

describe("EditHistory", () => {
	it("starts empty", () => {
		const h = new EditHistory();
		expect(h.getState()).toEqual({
			canUndo: false,
			canRedo: false,
			undoLabel: null,
			redoLabel: null,
		});
		expect(h.undo()).toBeNull();
		expect(h.redo()).toBeNull();
	});

	it("names the edit undo would reverse", () => {
		const h = new EditHistory();
		h.push(cmd("Add track"));
		h.push(cmd("Add platform"));
		const state = h.getState();
		expect(state.canUndo).toBe(true);
		expect(state.undoLabel).toBe("Add platform");
		expect(state.redoLabel).toBeNull();
	});

	it("moves a command between the stacks and names both sides", () => {
		const h = new EditHistory();
		h.push(cmd("Add track"));
		h.push(cmd("Add platform"));

		expect(h.undo()?.label).toBe("Add platform");
		expect(h.getState()).toMatchObject({
			canUndo: true,
			canRedo: true,
			undoLabel: "Add track",
			redoLabel: "Add platform",
		});

		expect(h.redo()?.label).toBe("Add platform");
		expect(h.getState()).toMatchObject({
			canRedo: false,
			undoLabel: "Add platform",
		});
	});

	it("disables undo at the bottom of the stack", () => {
		const h = new EditHistory();
		h.push(cmd("Add track"));
		h.undo();
		expect(h.getState()).toMatchObject({ canUndo: false, undoLabel: null });
		expect(h.undo()).toBeNull();
	});

	it("drops the redo branch when a new edit lands", () => {
		const h = new EditHistory();
		h.push(cmd("Add track"));
		h.undo();
		expect(h.getState().canRedo).toBe(true);

		h.push(cmd("Add text"));
		expect(h.getState()).toMatchObject({
			canRedo: false,
			redoLabel: null,
			undoLabel: "Add text",
		});
	});

	it("caps depth by dropping the oldest edit", () => {
		const h = new EditHistory(3);
		for (const label of ["a", "b", "c", "d", "e"]) h.push(cmd(label));

		expect(h.undo()?.label).toBe("e");
		expect(h.undo()?.label).toBe("d");
		expect(h.undo()?.label).toBe("c");
		// "a" and "b" fell off the bottom.
		expect(h.undo()).toBeNull();
	});

	it("clear drops both stacks", () => {
		const h = new EditHistory();
		h.push(cmd("Add track"));
		h.undo();
		h.push(cmd("Add text"));
		h.clear();
		expect(h.getState()).toEqual({
			canUndo: false,
			canRedo: false,
			undoLabel: null,
			redoLabel: null,
		});
	});
});
