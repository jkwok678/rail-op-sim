// @vitest-environment jsdom

import {
	createEmptyTimetable,
	parseSimTime,
	type Timetable,
	type TimetableIssue,
} from "@rail-op-sim/shared";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorHotkeys } from "#/hooks/useEditorHotkeys";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import { SHORTCUTS, shortcutDisplay } from "#/lib/shortcuts";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";
import { defined } from "../../lib/__tests__/test-helpers";

vi.mock("#/lib/documentActions", () => ({
	saveDocument: vi.fn(),
	loadDocument: vi.fn(async () => {}),
}));

/**
 * Exercises the bindings end to end against a real DOM, because the things most
 * likely to break — a key firing behind an overlay, or a disabled tool being
 * reachable anyway — only show up once the manager is actually listening.
 */
function Harness() {
	useEditorHotkeys();
	return null;
}

const completeRailway: TrackStatus = {
	total: 4,
	connected: true,
	complete: true,
	dangling: 0,
	unpairedLinked: 0,
	unnamed: 0,
	undirected: 0,
	brokenRoutes: 0,
	firstIssue: null,
};

const reset = () => {
	useModeStore.setState({ mode: "railway" });
	useTimetableStore.setState({
		timetable: createEmptyTimetable(),
		selectedServiceRef: null,
		selectedActionIndex: null,
		issues: [],
		pendingCellPick: null,
	});
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
};

/** Press a key on the document, the way the manager hears it. */
const press = (key: string, init: KeyboardEventInit = {}) => {
	const event = new KeyboardEvent("keydown", {
		key,
		bubbles: true,
		cancelable: true,
		...init,
	});
	document.dispatchEvent(event);
	return event;
};

/** Modifier flags matching `Mod` on whatever platform jsdom reports. */
const modInit = (): KeyboardEventInit =>
	shortcutDisplay("save").startsWith("⌘")
		? { metaKey: true }
		: { ctrlKey: true };

describe("useEditorHotkeys", () => {
	beforeEach(reset);
	// Cleanup is explicit: vitest isn't configured with globals, so testing
	// library's automatic teardown never runs. Without this each test leaves its
	// harness mounted and the next one registers a second set of bindings — every
	// key then fires once per leftover instance, which reads as a toggle that
	// won't toggle.
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
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
				complete: false,
				dangling: 0,
				unpairedLinked: 0,
				unnamed: 0,
				undirected: 4,
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
	it("refuses timetable mode until the railway is complete", () => {
		render(<Harness />);
		press(String(SHORTCUTS.modeTimetable.hotkey));
		expect(useModeStore.getState().mode).toBe("railway");
	});

	it("switches between the modes on their keys", () => {
		const { rerender } = render(<Harness />);
		useEditorStore.setState({ trackStatus: completeRailway });
		rerender(<Harness />);

		press(String(SHORTCUTS.modeTimetable.hotkey));
		expect(useModeStore.getState().mode).toBe("timetable");

		rerender(<Harness />);
		press(String(SHORTCUTS.modeRailway.hotkey));
		expect(useModeStore.getState().mode).toBe("railway");
	});

	// The toolbar is off screen in timetable mode, so its keys must be too —
	// otherwise the map is editable from the keyboard behind the timetable.
	it("leaves the railway tools and undo unreachable in timetable mode", () => {
		const { rerender } = render(<Harness />);
		useEditorStore.setState({
			trackStatus: completeRailway,
			canUndo: true,
		});
		useModeStore.getState().setMode("timetable");
		rerender(<Harness />);

		press(String(SHORTCUTS.toolAdd.hotkey));
		press(String(SHORTCUTS.toolDirection.hotkey));
		expect(useEditorStore.getState().tool).toBe("select");

		// View keys are not edits, and stay live.
		press(String(SHORTCUTS.toggleGrid.hotkey));
		expect(useEditorStore.getState().showGrid).toBe(false);
	});

	it("suppresses save and load hotkeys in operate mode without letting browser defaults through", () => {
		const { rerender } = render(<Harness />);
		press("s", modInit());
		press("o", modInit());
		expect(saveDocument).toHaveBeenCalledOnce();
		expect(loadDocument).toHaveBeenCalledOnce();

		vi.clearAllMocks();
		useModeStore.setState({ mode: "operate" });
		rerender(<Harness />);

		const saveEvent = press("s", modInit());
		const loadEvent = press("o", modInit());
		expect(saveDocument).not.toHaveBeenCalled();
		expect(loadDocument).not.toHaveBeenCalled();
		expect(saveEvent.defaultPrevented).toBe(true);
		expect(loadEvent.defaultPrevented).toBe(true);
	});
});

const twoServices = (): Timetable => ({
	version: 1,
	startTime: parseSimTime("05:00"),
	services: [
		{
			ref: "1A01",
			actions: [
				{ kind: "pass", time: parseSimTime("06:00"), location: "Ashfield" },
				{ kind: "pass", time: parseSimTime("06:10"), location: "Barton" },
				{ kind: "finishRemainHere" },
			],
		},
		{ ref: "1A02", actions: [{ kind: "finishRemainHere" }] },
	],
});

const problems: TimetableIssue[] = [
	{
		severity: "error",
		code: "no-start",
		message: "Ashfield",
		serviceRef: "1A01",
		actionIndex: 0,
	},
	{
		severity: "error",
		code: "no-start",
		message: "Barton",
		serviceRef: "1A01",
		actionIndex: 1,
	},
];

describe("timetable list keys", () => {
	beforeEach(reset);
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		document.body.innerHTML = "";
	});

	const seed = () => {
		useModeStore.setState({ mode: "timetable" });
		useTimetableStore.setState({
			timetable: twoServices(),
			issues: problems,
			selectedServiceRef: "1A01",
			selectedActionIndex: 1,
			pendingCellPick: null,
		});
	};

	it("steps through services and wraps", () => {
		seed();
		const { rerender } = render(<Harness />);

		press("]");
		expect(useTimetableStore.getState().selectedServiceRef).toBe("1A02");

		rerender(<Harness />);
		press("]");
		expect(useTimetableStore.getState().selectedServiceRef).toBe("1A01");

		rerender(<Harness />);
		press("[");
		expect(useTimetableStore.getState().selectedServiceRef).toBe("1A02");
	});

	it("opens the next problem, wrapping within the service", () => {
		seed();
		useTimetableStore.setState({ selectedActionIndex: 0 });
		const { rerender } = render(<Harness />);

		press("N");
		expect(useTimetableStore.getState().selectedActionIndex).toBe(1);

		rerender(<Harness />);
		press("N");
		expect(useTimetableStore.getState().selectedActionIndex).toBe(0);
	});

	it("moves the selected action and follows it", () => {
		seed();
		const { rerender } = render(<Harness />);
		const order = () =>
			defined(
				useTimetableStore.getState().timetable.services[0],
				"services[0]",
			).actions.map((action) =>
				action.kind === "pass" ? action.location : action.kind,
			);

		press("ArrowDown", { altKey: true, code: "ArrowDown" });
		expect(useTimetableStore.getState().selectedActionIndex).toBe(2);
		expect(order()).toEqual(["Ashfield", "finishRemainHere", "Barton"]);

		rerender(<Harness />);
		press("ArrowUp", { altKey: true, code: "ArrowUp" });
		expect(useTimetableStore.getState().selectedActionIndex).toBe(1);
		expect(order()).toEqual(["Ashfield", "Barton", "finishRemainHere"]);
	});

	it("refuses the move at the end of the list", () => {
		seed();
		useTimetableStore.setState({ selectedActionIndex: 2 });
		render(<Harness />);

		press("ArrowDown", { altKey: true, code: "ArrowDown" });
		expect(useTimetableStore.getState().selectedActionIndex).toBe(2);
	});

	it("does not run while a cell pick is armed, or outside timetable mode", () => {
		seed();
		useTimetableStore.setState({
			pendingCellPick: {
				serviceRef: "1A01",
				actionIndex: 1,
				field: "rear",
			},
		});
		const { rerender } = render(<Harness />);
		press("]");
		expect(useTimetableStore.getState().selectedServiceRef).toBe("1A01");

		useModeStore.setState({ mode: "railway" });
		useTimetableStore.setState({ pendingCellPick: null });
		rerender(<Harness />);
		press("]");
		press("N");
		expect(useTimetableStore.getState().selectedServiceRef).toBe("1A01");
		expect(useTimetableStore.getState().selectedActionIndex).toBe(1);
	});

	it("does not steal a key the user is typing", () => {
		seed();
		render(<Harness />);
		const input = document.createElement("input");
		document.body.appendChild(input);
		input.focus();
		input.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "]",
				bubbles: true,
				cancelable: true,
			}),
		);
		expect(useTimetableStore.getState().selectedServiceRef).toBe("1A01");
	});
});
