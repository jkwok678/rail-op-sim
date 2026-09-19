// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Toolbar } from "#/components/sim/Toolbar";
import { TooltipProvider } from "#/components/ui/tooltip";
import { SHORTCUTS } from "#/lib/shortcuts";
import { useEditorStore } from "#/store/editor-store";

// Radix measures its floating content, and jsdom ships no ResizeObserver. The
// tooltip only needs to render here, not to be positioned.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??=
	ResizeObserverStub as unknown as typeof ResizeObserver;

function renderToolbar() {
	render(
		<TooltipProvider delayDuration={0}>
			<Toolbar />
		</TooltipProvider>,
	);
}

describe("Toolbar labels", () => {
	afterEach(cleanup);

	it("does not call the add tool track-only", () => {
		// The same palette also places platforms, concourses, parapets, named
		// locations and level crossings, so "Add track" undersold it.
		renderToolbar();
		expect(
			screen.getByRole("button", { name: "Add track or element" }),
		).toBeDefined();
		expect(screen.queryByRole("button", { name: "Add track" })).toBeNull();
	});

	it("spells each tool the same way in the toolbar and the shortcuts dialog", () => {
		// The two surfaces drifted apart once ("Add Text" vs "Add text").
		renderToolbar();
		for (const id of [
			"toolSelect",
			"toolAdd",
			"toolText",
			"toolLink",
		] as const) {
			expect(
				screen.getByRole("button", { name: SHORTCUTS[id].label }),
				id,
			).toBeDefined();
		}
	});
});

describe("Toolbar undo label", () => {
	afterEach(() => {
		cleanup();
		useEditorStore.setState({ canUndo: false, undoLabel: null });
	});

	it("names the step in the app's vocabulary, not the serializer's", async () => {
		// The commit label now comes from kindToPhrase, so the tooltip reads
		// "Undo add straight track" rather than "Undo add StraightTrack".
		useEditorStore.setState({
			canUndo: true,
			undoLabel: "Add straight track",
		});
		renderToolbar();
		fireEvent.focus(screen.getByRole("button", { name: "Undo" }));
		const tip = await screen.findByRole("tooltip");
		expect(tip.textContent).toContain("Undo add straight track");
	});
});
