// @vitest-environment jsdom
import { itemAt, Platform, StraightType } from "@rail-op-sim/shared";
import { type Application, Container, Texture } from "pixi.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	PlacementController,
	resolveClickTarget,
} from "#/editor/PlacementController";
import { resetStores, stubLayers } from "#/editor/tools/__tests__/toolHarness";
import type { ViewportController } from "#/editor/ViewportController";
import type { TextureCache } from "#/renderer/textureCache";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

describe("resolveClickTarget", () => {
	it("sends every click in operate mode to the signalling", () => {
		expect(resolveClickTarget("operate", 0, false)).toBe("operate");
		expect(resolveClickTarget("operate", 2, true)).toBe("operate");
	});

	it("lets a pending cell pick borrow a primary click in any other mode", () => {
		expect(resolveClickTarget("railway", 0, true)).toBe("cellPick");
		expect(resolveClickTarget("timetable", 0, true)).toBe("cellPick");
	});

	it("gives right-clicks to the tool, even with a cell pick pending", () => {
		expect(resolveClickTarget("railway", 2, true)).toBe("tool");
	});

	it("keeps the map read-only outside railway mode", () => {
		expect(resolveClickTarget("timetable", 0, false)).toBeNull();
		expect(resolveClickTarget("timetable", 2, false)).toBeNull();
		expect(resolveClickTarget("railway", 0, false)).toBe("tool");
	});
});

/** Grid cell → client position, for a world at the origin and scale 1. */
const cx = (gx: number) => gx * 32;
const cy = (gy: number) => -gy * 32;

describe("PlacementController dispatch", () => {
	let canvas: HTMLCanvasElement;
	let layers: ReturnType<typeof stubLayers>;
	let viewport: { isPanning: boolean };
	let controller: PlacementController;

	function press(
		gx: number,
		gy: number,
		opts: { button?: number; toGx?: number; toGy?: number } = {},
	): void {
		const button = opts.button ?? 0;
		const fire = (type: string, x: number, y: number) =>
			canvas.dispatchEvent(
				new MouseEvent(type, { button, clientX: x, clientY: y }),
			);
		fire("pointerdown", cx(gx), cy(gy));
		fire("pointerup", cx(opts.toGx ?? gx), cy(opts.toGy ?? gy));
	}

	function selectStraight(): void {
		const editor = useEditorStore.getState();
		editor.setTool("add");
		editor.selectKind("straight");
		editor.selectSubtype(StraightType.STRAIGHTH);
	}

	beforeEach(() => {
		resetStores();
		canvas = document.createElement("canvas");
		layers = stubLayers();
		viewport = { isPanning: false };
		controller = new PlacementController({
			app: { canvas } as unknown as Application,
			world: new Container(),
			trackLayer: layers.track,
			elementLayer: layers.element,
			textLayer: layers.text,
			linkHighlightLayer: layers.linkHighlight,
			trackColorLayer: layers.trackColor,
			directionLayer: layers.direction,
			textures: { get: vi.fn(() => Texture.WHITE) } as unknown as TextureCache,
			viewport: viewport as unknown as ViewportController,
		});
		controller.attach();
	});

	afterEach(() => controller.detach());

	it("routes a click to the active tool, and undo reverses it", () => {
		selectStraight();
		press(2, 1);
		expect(controller.map.getTrackAt(2, 1)).not.toBeNull();
		expect(useEditorStore.getState().undoLabel).toBe("Add straight track");

		controller.undo();
		expect(controller.map.getTrackAt(2, 1)).toBeNull();
		controller.redo();
		expect(controller.map.getTrackAt(2, 1)).not.toBeNull();
	});

	it("routes a right-click to the active tool's delete", () => {
		selectStraight();
		press(2, 1);
		press(2, 1, { button: 2 });
		expect(controller.map.getTrackAt(2, 1)).toBeNull();
	});

	it("a drag past the threshold is not a click", () => {
		selectStraight();
		press(2, 1, { toGx: 4 });
		expect(controller.map.getTrackAt(2, 1)).toBeNull();
		expect(controller.map.getTrackAt(4, 1)).toBeNull();
	});

	it("a press that began a pan is not a click", () => {
		selectStraight();
		viewport.isPanning = true;
		press(2, 1);
		expect(controller.map.getTrackAt(2, 1)).toBeNull();
	});

	it("outside railway mode the map is not edited", () => {
		selectStraight();
		useModeStore.setState({ mode: "timetable" });
		press(2, 1);
		expect(controller.map.getTrackAt(2, 1)).toBeNull();
	});

	it("a pending cell pick takes the click instead of the tool", () => {
		selectStraight();
		const completeCellPick = vi.fn();
		useTimetableStore.setState({
			pendingCellPick: { serviceRef: "1A01", actionIndex: 0, field: "front" },
			completeCellPick,
		});
		press(2, 1);
		expect(completeCellPick).toHaveBeenCalledWith(
			{ gx: 2, gy: 1 },
			controller.map,
		);
		expect(controller.map.getTrackAt(2, 1)).toBeNull();
	});

	it("hands over between tools on a tool change", () => {
		useEditorStore.getState().setTool("direction");
		expect(layers.direction.container.visible).toBe(true);
		expect(canvas.style.cursor).toBe("pointer");

		useEditorStore.getState().setTool("text");
		expect(layers.direction.container.visible).toBe(false);
		expect(canvas.style.cursor).toBe("text");
	});

	it("applies the Add cursor once something is selected", () => {
		useEditorStore.getState().setTool("add");
		expect(canvas.style.cursor).toBe("");
		selectStraight();
		expect(canvas.style.cursor).toBe("crosshair");
	});

	it("loading a file replaces the map and clears the history", () => {
		selectStraight();
		press(2, 1);
		const saved = controller.serialize();
		press(3, 1);

		controller.loadFromData(saved);
		expect(controller.map.getTrackAt(2, 1)).not.toBeNull();
		expect(controller.map.getTrackAt(3, 1)).toBeNull();
		expect(useEditorStore.getState().canUndo).toBe(false);
	});

	describe("text drag", () => {
		/** A text at grid (2, 2) that the stub layer reports under every pointer. */
		function placeHitText() {
			useEditorStore.getState().setTool("text");
			controller.placeText(64, -64, "Hello", { family: "sans", pointSize: 12 });
			const text = itemAt(controller.map.getTextList(), 0);
			layers.text.hitTest.mockReturnValue(text);
			return text;
		}

		it("moves a text in railway mode", () => {
			const text = placeHitText();
			press(2, 2, { toGx: 4 });
			expect(text.getLocationX()).toBeCloseTo(4);
		});

		it("cannot start outside railway mode, where the map is read-only", () => {
			const text = placeHitText();
			useModeStore.setState({ mode: "timetable" });
			press(2, 2, { toGx: 4 });
			expect(text.getLocationX()).toBeCloseTo(2);
		});

		it("cannot start while a cell pick has borrowed the press", () => {
			const text = placeHitText();
			useTimetableStore.setState({
				pendingCellPick: { serviceRef: "1A01", actionIndex: 0, field: "rear" },
				completeCellPick: vi.fn(),
			});
			press(2, 2, { toGx: 4 });
			expect(text.getLocationX()).toBeCloseTo(2);
		});
	});

	describe("document operations from the dialogs and panels", () => {
		it("edits and deletes a text by its grid location", () => {
			controller.placeText(64, -64, "Hello", { family: "sans", pointSize: 12 });
			const text = itemAt(controller.map.getTextList(), 0);
			const [tx, ty] = [text.getLocationX(), text.getLocationY()];
			expect(controller.getTextByLocation(tx, ty)).toBe(text);

			controller.updateTextAt(tx, ty, "World");
			expect(text.getReadableText()).toBe("World");
			controller.updateTextAt(tx, ty, "");
			expect(controller.map.getTextList()).toHaveLength(0);
		});

		it("applies and restores speed across the selected section", () => {
			selectStraight();
			press(0, 1);
			press(1, 1);
			useEditorStore.getState().setSectionEnd({ gx: 1, gy: 1 }, [
				{ gx: 0, gy: 1 },
				{ gx: 1, gy: 1 },
			]);
			const track = controller.map.getTrackAt(1, 1);
			const before = track?.getTrackMainSpeed();

			controller.applySectionEdit({ mainSpeed: 40, mainLength: 100 });
			expect(track?.getTrackMainSpeed()).toBe(40);
			controller.restoreSection();
			expect(track?.getTrackMainSpeed()).toBe(before);
		});

		it("names a platform track", () => {
			selectStraight();
			press(0, 1);
			controller.map.addPlatform(Platform.UP, 0, 1);
			controller.nameElementAt(0, 1, "Ashfield", "platform");
			expect(controller.map.getTrackAt(0, 1)?.getNamed()).toBe(true);
		});

		it("rebuilds the ghost after the textures change", () => {
			selectStraight();
			controller.refreshGhost();
			expect(controller.ghost.children).toHaveLength(1);
		});
	});
});
