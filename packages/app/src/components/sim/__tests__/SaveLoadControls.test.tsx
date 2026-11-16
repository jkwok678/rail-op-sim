// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SaveLoadControls } from "#/components/sim/SaveLoadControls";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";

vi.mock("#/lib/documentActions", () => ({
	saveDocument: vi.fn(),
	loadDocument: vi.fn(async () => {}),
}));

describe("SaveLoadControls", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		useModeStore.setState({ mode: "railway" });
		useEditorStore.setState({ saveFormat: "json" });
	});

	it("names the map and the format it will be saved in", () => {
		useEditorStore.setState({ saveFormat: "yaml" });
		render(<SaveLoadControls />);
		expect(
			screen.getByRole("button", { name: "Save map as YAML" }),
		).toBeDefined();
		expect(
			screen.getByRole("button", {
				name: "Load railway and/or timetable from JSON or YAML (select both to load together)",
			}),
		).toBeDefined();
	});

	it("names the timetable in timetable mode", () => {
		useModeStore.setState({ mode: "timetable" });
		render(<SaveLoadControls />);
		expect(
			screen.getByRole("button", { name: "Save timetable as JSON" }),
		).toBeDefined();
	});

	it("runs the same save and load as the hotkeys", () => {
		render(<SaveLoadControls />);
		fireEvent.click(screen.getByRole("button", { name: /^Save/ }));
		fireEvent.click(screen.getByRole("button", { name: /^Load/ }));
		expect(saveDocument).toHaveBeenCalledOnce();
		expect(loadDocument).toHaveBeenCalledOnce();
	});

	it("has no separate timetable upload button", () => {
		render(<SaveLoadControls />);
		expect(
			screen.queryByRole("button", {
				name: "Upload timetable from JSON or YAML",
			}),
		).toBeNull();
	});
});
