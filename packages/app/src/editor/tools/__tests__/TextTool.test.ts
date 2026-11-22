import { Platform, type Text } from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { TextTool } from "#/editor/tools/TextTool";
import { gridToWorld } from "#/lib/grid";
import { useEditorStore } from "#/store/editor-store";
import {
	addLine,
	at,
	atWorld,
	type Harness,
	makeHarness,
	resetStores,
} from "./toolHarness";

const FONT = { family: "sans-serif", pointSize: 12 };

describe("TextTool", () => {
	let h: Harness;
	let tool: TextTool;

	beforeEach(() => {
		resetStores();
		useEditorStore.getState().setTool("text");
		h = makeHarness();
		tool = new TextTool(h.ctx);
	});

	/** Place a text and make the stub layer report it under every pointer. */
	function placeHitText(): Text {
		tool.placeText(64, -64, "Hello", FONT);
		const text = h.map.getTextList()[0];
		h.layers.text.hitTest.mockReturnValue(text);
		return text;
	}

	it("a click on empty ground opens the dialog to place text there", () => {
		tool.click(atWorld(40, -10));
		expect(useEditorStore.getState().pendingText).toEqual({
			mode: "place",
			x: 40,
			y: -10,
		});
	});

	it("a click on a text opens it for editing", () => {
		const text = placeHitText();
		tool.click(atWorld(70, -64));
		expect(useEditorStore.getState().pendingText).toEqual({
			mode: "edit",
			tx: text.getLocationX(),
			ty: text.getLocationY(),
		});
	});

	it("a click on a platform track opens the naming dialog", () => {
		addLine(h.map, 0, 2);
		h.map.addPlatform(Platform.UP, 1, 0);
		tool.click(at(1, 0));
		expect(useEditorStore.getState().pendingNameTarget).toEqual({
			gx: 1,
			gy: 0,
			kind: "platform",
		});
	});

	it("places text at fractional grid coordinates that round-trip to the pixel", () => {
		tool.placeText(40, -16, "Hi", FONT);
		const text = h.map.getTextList()[0];
		expect(gridToWorld(text.getLocationX(), text.getLocationY())).toEqual({
			x: 40,
			y: -16,
		});
		expect(h.commits.map((c) => c.label)).toEqual(["Add text"]);
	});

	it("a drag past the threshold moves the text, keeping the grab offset", () => {
		const text = placeHitText();
		tool.pointerDown(atWorld(70, -60));
		expect(tool.pointerMove(atWorld(100, -60))).toBe(true);
		expect(h.layers.text.moveTo).toHaveBeenCalledWith(text, 94, -64);

		expect(tool.release(atWorld(100, -60), "drag")).toBe(true);
		expect(gridToWorld(text.getLocationX(), text.getLocationY())).toEqual({
			x: 94,
			y: -64,
		});
		expect(h.commits.at(-1)?.label).toBe("Move text");
	});

	it("a sub-threshold release falls through to the click", () => {
		placeHitText();
		tool.pointerDown(atWorld(70, -60));
		h.layers.text.sync.mockClear();
		expect(tool.release(atWorld(71, -60), "click")).toBe(false);
		expect(h.layers.text.sync).toHaveBeenCalled();
		expect(h.commits.at(-1)?.label).toBe("Add text");
	});

	it("does not arm a drag while the viewport is panning", () => {
		placeHitText();
		h.panning.value = true;
		tool.pointerDown(atWorld(70, -60));
		expect(tool.pointerMove(atWorld(100, -60))).toBe(false);
	});

	it("leaving the canvas mid-drag restores the text where it was", () => {
		const text = placeHitText();
		const before = [text.getLocationX(), text.getLocationY()];
		tool.pointerDown(atWorld(70, -60));
		tool.pointerMove(atWorld(120, -60));
		h.layers.text.sync.mockClear();

		tool.clear();
		expect(h.layers.text.sync).toHaveBeenCalled();
		expect([text.getLocationX(), text.getLocationY()]).toEqual(before);
		expect(tool.pointerMove(atWorld(130, -60))).toBe(false);
	});

	it("right-click deletes the text under the pointer", () => {
		placeHitText();
		tool.rightClick(atWorld(70, -64, 2));
		expect(h.map.getTextList()).toHaveLength(0);
		expect(h.commits.at(-1)?.label).toBe("Delete text");
	});

	it("hover shows the move cursor over a text and the text cursor elsewhere", () => {
		tool.preview(atWorld(0, 0));
		expect(h.setCursor).toHaveBeenLastCalledWith("text");
		placeHitText();
		tool.preview(atWorld(70, -64));
		expect(h.setCursor).toHaveBeenLastCalledWith("move");
	});

	it("updating a text to empty deletes it", () => {
		const text = placeHitText();
		tool.updateTextAt(text.getLocationX(), text.getLocationY(), "  ");
		expect(h.map.getTextList()).toHaveLength(0);
	});

	it("names a platform track", () => {
		addLine(h.map, 0, 2);
		h.map.addPlatform(Platform.UP, 1, 0);
		tool.nameElementAt(1, 0, "Ashfield", "platform");
		expect(h.map.getTrackAt(1, 0)?.getNamed()).toBe(true);
		expect(h.commits.at(-1)?.label).toBe("Name element");
	});

	it("reset cancels a drag, whose text an undo may have removed", () => {
		placeHitText();
		tool.pointerDown(atWorld(70, -60));
		tool.reset();
		expect(tool.pointerMove(atWorld(100, -60))).toBe(false);
	});
});
