// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useEditorHotkeys } from "#/hooks/useEditorHotkeys";
import { SHORTCUTS } from "#/lib/shortcuts";
import { useEditorStore } from "#/store/editor-store";

/**
 * Exercises the bindings end to end against a real DOM, because the things most
 * likely to break — a key firing behind an overlay, or a disabled tool being
 * reachable anyway — only show up once the manager is actually listening.
 */
function Harness() {
	useEditorHotkeys();
	return null;
}

const reset = () =>
	useEditorStore.setState({
		tool: "select",
		selectedKind: null,
		pendingText: null,
		pendingNameTarget: null,
		showShortcuts: false,
		showGrid: true,
		trackStatus: null,
		sectionStart: null,
		directionStart: null,
		directionMode: "set",
	});

/** Press a key on the document, the way the manager hears it. */
const press = (key: string, init: KeyboardEventInit = {}) => {
	document.dispatchEvent(
		new KeyboardEvent("keydown", {
			key,
			bubbles: true,
			cancelable: true,
			...init,
		}),
	);
};

describe("useEditorHotkeys", () => {
	beforeEach(reset);
	// Cleanup is explicit: vitest isn't configured with globals, so testing
	// library's automatic teardown never runs. Without this each test leaves its
	// harness mounted and the next one registers a second set of bindings — every
	// key then fires once per leftover instance, which reads as a toggle that
	// won't toggle.
	afterEach(() => {
		cleanup();
		document.body.innerHTML = "";
	});

	it("switches tools on the digit keys", () => {
		render(<Harness />);
		press(String(SHORTCUTS.toolAdd.hotkey));
		expect(useEditorStore.getState().tool).toBe("add");
		press(String(SHORTCUTS.toolSelect.hotkey));
		expect(useEditorStore.getState().tool).toBe("select");
	});

	it("toggles the grid", () => {
		render(<Harness />);
		press(String(SHORTCUTS.toggleGrid.hotkey));
		expect(useEditorStore.getState().showGrid).toBe(false);
	});

	it("refuses the direction tool until the railway is connected", () => {
		render(<Harness />);
		press(String(SHORTCUTS.toolDirection.hotkey));
		expect(useEditorStore.getState().tool).toBe("select");
	});

	it("allows the direction tool once the railway is connected", () => {
		const { rerender } = render(<Harness />);
		useEditorStore.setState({
			trackStatus: {
				total: 4,
				connected: true,
				dangling: 0,
				unpairedLinked: 0,
				brokenRoutes: 0,
				firstIssue: null,
			},
		});
		rerender(<Harness />);
		press(String(SHORTCUTS.toolDirection.hotkey));
		expect(useEditorStore.getState().tool).toBe("direction");
	});

	// The overlay has no input to focus, so ignoreInputs can't save us here.
	it("does not let single keys through while the shortcuts overlay is open", () => {
		const { rerender } = render(<Harness />);
		useEditorStore.setState({ showShortcuts: true });
		rerender(<Harness />);

		press(String(SHORTCUTS.toolAdd.hotkey));
		press(String(SHORTCUTS.toggleGrid.hotkey));

		expect(useEditorStore.getState().tool).toBe("select");
		expect(useEditorStore.getState().showGrid).toBe(true);
	});

	it("ignores keys typed into an input", () => {
		render(<Harness />);
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.focus();

		input.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: String(SHORTCUTS.toolAdd.hotkey),
				bubbles: true,
				cancelable: true,
			}),
		);

		expect(useEditorStore.getState().tool).toBe("select");
	});

	it("backs out of the add palette before leaving the tool", () => {
		render(<Harness />);
		useEditorStore.getState().setTool("add");
		useEditorStore.getState().selectKind("straight");

		press("Escape");
		expect(useEditorStore.getState().selectedKind).toBeNull();
		expect(useEditorStore.getState().tool).toBe("add");

		press("Escape");
		expect(useEditorStore.getState().tool).toBe("select");
	});

	it("opens and closes the shortcuts overlay on ?", () => {
		const { rerender } = render(<Harness />);
		press("?", { shiftKey: true });
		expect(useEditorStore.getState().showShortcuts).toBe(true);

		// Closing goes through Radix in the real app; here the point is that the
		// key itself stays live while the overlay is up.
		rerender(<Harness />);
		press("?", { shiftKey: true });
		expect(useEditorStore.getState().showShortcuts).toBe(false);
	});
});
