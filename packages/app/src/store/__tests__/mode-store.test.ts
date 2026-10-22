import { beforeEach, describe, expect, it } from "vitest";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { timetableBlockedReason, useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

const mode = () => useModeStore.getState();

const status = (over: Partial<TrackStatus>): TrackStatus => ({
	total: 4,
	connected: true,
	complete: true,
	dangling: 0,
	unpairedLinked: 0,
	unnamed: 0,
	undirected: 0,
	brokenRoutes: 0,
	firstIssue: null,
	...over,
});

beforeEach(() => {
	useModeStore.setState({ mode: "railway" });
	useEditorStore.setState({
		tool: "select",
		selectedKind: null,
		trackStatus: status({}),
		sectionStart: null,
		sectionEnd: null,
		sectionTracks: [],
		directionStart: null,
		directionMode: "set",
	});
	useTimetableStore.setState({ pendingCellPick: null });
});

describe("timetableBlockedReason", () => {
	it("asks for a railway when there is none", () => {
		expect(timetableBlockedReason(null)).toBe("Build a railway first");
		expect(timetableBlockedReason(status({ total: 0, complete: false }))).toBe(
			"Build a railway first",
		);
	});

	// Joined is not enough: services book named platforms and run along
	// preferred directions.
	it("asks for a finished railway when it is joined but not complete", () => {
		expect(
			timetableBlockedReason(status({ complete: false, undirected: 2 })),
		).toMatch(/Finish the railway/);
	});

	it("allows a complete railway", () => {
		expect(timetableBlockedReason(status({}))).toBeNull();
	});
});

describe("setMode", () => {
	it("starts in railway mode", () => {
		expect(mode().mode).toBe("railway");
	});

	it("refuses timetable mode on an incomplete railway", () => {
		useEditorStore.setState({ trackStatus: status({ complete: false }) });
		expect(mode().setMode("timetable")).toBe(false);
		expect(mode().mode).toBe("railway");
	});

	it("enters timetable mode on a complete railway", () => {
		expect(mode().setMode("timetable")).toBe(true);
		expect(mode().mode).toBe("timetable");
	});

	it("puts the railway tools down on the way in", () => {
		useEditorStore.getState().setTool("direction");
		useEditorStore.getState().setDirectionStart({ gx: 1, gy: 2 });

		mode().setMode("timetable");

		const editor = useEditorStore.getState();
		expect(editor.tool).toBe("select");
		expect(editor.directionStart).toBeNull();
	});

	it("returns to railway mode whatever state the railway is in", () => {
		mode().setMode("timetable");
		useEditorStore.setState({ trackStatus: status({ complete: false }) });
		expect(mode().setMode("railway")).toBe(true);
		expect(mode().mode).toBe("railway");
	});

	it("abandons an armed map pick on the way out of timetable mode", () => {
		mode().setMode("timetable");
		useTimetableStore.getState().beginCellPick({
			serviceRef: "1A01",
			actionIndex: 0,
			field: "rear",
		});

		mode().setMode("railway");

		expect(useTimetableStore.getState().pendingCellPick).toBeNull();
	});

	it("keeps the timetable across a round trip", () => {
		mode().setMode("timetable");
		const ref = useTimetableStore.getState().addService(null);

		mode().setMode("railway");
		mode().setMode("timetable");

		expect(
			useTimetableStore.getState().timetable.services.map((s) => s.ref),
		).toContain(ref);
	});
});
