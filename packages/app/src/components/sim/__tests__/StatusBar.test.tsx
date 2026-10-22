// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatusBar } from "#/components/sim/StatusBar";
import { useEditorStore } from "#/store/editor-store";

// jsdom has no matchMedia; the theme hook asks it for the system preference.
window.matchMedia ??= ((query: string) => ({
	matches: false,
	media: query,
	addEventListener() {},
	removeEventListener() {},
})) as unknown as typeof window.matchMedia;

describe("StatusBar", () => {
	afterEach(() => {
		cleanup();
		useEditorStore.setState({
			trackStatus: null,
			tool: "select",
			directionHint: null,
			showShortcuts: false,
		});
	});

	it("shows how complete the railway is", () => {
		render(<StatusBar />);
		expect(screen.getByRole("contentinfo").textContent).toContain("Loading…");
	});

	it("shows the direction tool's hint only while that tool is in hand", () => {
		useEditorStore.setState({ directionHint: "Click a second track" });
		render(<StatusBar />);
		expect(screen.queryByText(/Click a second track/)).toBeNull();
		cleanup();

		useEditorStore.setState({ tool: "direction" });
		render(<StatusBar />);
		expect(screen.getByText(/Click a second track/)).toBeDefined();
	});

	it("opens the shortcuts reference", () => {
		render(<StatusBar />);
		fireEvent.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));
		expect(useEditorStore.getState().showShortcuts).toBe(true);
	});

	it("offers the other theme, and switches to it", () => {
		render(<StatusBar />);
		const button = screen.getByRole("button", { name: /^Switch to/ });
		const before = button.getAttribute("aria-label");
		fireEvent.click(button);
		expect(button.getAttribute("aria-label")).not.toBe(before);
	});
});
