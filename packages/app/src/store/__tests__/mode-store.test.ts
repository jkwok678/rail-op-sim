import { beforeEach, describe, expect, it } from "vitest";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import {
	blockedReason,
	operateBlockedReason,
	timetableBlockedReason,
	useModeStore,
} from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";
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

describe("operate mode", () => {
	const service = {
		ref: "1A01",
		actions: [{ kind: "finishRemainHere" as const }],
	};

	beforeEach(() => {
		useTimetableStore.setState({
			timetable: { version: 1, startTime: 0, services: [service] },
			issues: [],
		});
		useOperateStore.getState().reset();
		useModeStore.setState({ confirmLeaveOperate: () => true });
	});

	it("needs services in the timetable", () => {
		useTimetableStore.setState({
			timetable: { version: 1, startTime: 0, services: [] },
		});
		expect(blockedReason("operate")).toBe("Write a timetable first");
		expect(mode().setMode("operate")).toBe(false);
	});

	it("needs a timetable without errors", () => {
		useTimetableStore.setState({
			issues: [{ severity: "error", code: "x", message: "bad" }],
		});
		expect(blockedReason("operate")).toBe("Fix the timetable's errors first");
	});

	it("needs a complete railway first of all", () => {
		useEditorStore.setState({ trackStatus: status({ complete: false }) });
		expect(blockedReason("operate")).toMatch(/Finish the railway/);
	});

	it("enters when everything is ready", () => {
		expect(mode().setMode("operate")).toBe(true);
		expect(mode().mode).toBe("operate");
	});

	it("asks before throwing away a session that has run", () => {
		mode().setMode("operate");
		useOperateStore.setState({ view: { run: "running" } as never });
		useModeStore.setState({ confirmLeaveOperate: () => false });
		expect(mode().setMode("railway")).toBe(false);
		useModeStore.setState({ confirmLeaveOperate: () => true });
		expect(mode().setMode("railway")).toBe(true);
	});

	it("leaves a session that never started without asking", () => {
		mode().setMode("operate");
		useOperateStore.setState({ view: { run: "prestart" } as never });
		useModeStore.setState({ confirmLeaveOperate: () => false });
		expect(mode().setMode("timetable")).toBe(true);
	});
});

describe("operateBlockedReason", () => {
	const tt = (services: number) => ({
		version: 1 as const,
		startTime: 0,
		services: Array.from({ length: services }, (_, i) => ({
			ref: `1A0${i}`,
			actions: [{ kind: "finishRemainHere" as const }],
		})),
	});

	it("passes a complete railway with a clean timetable", () => {
		expect(operateBlockedReason(status({}), tt(1), [])).toBeNull();
	});

	it("puts the railway first, then the services, then the errors", () => {
		expect(operateBlockedReason(null, tt(0), [])).toBe("Build a railway first");
		expect(operateBlockedReason(status({}), tt(0), [])).toBe(
			"Write a timetable first",
		);
		const warning = { severity: "warning" as const, code: "w", message: "w" };
		expect(operateBlockedReason(status({}), tt(1), [warning])).toBeNull();
	});
});
