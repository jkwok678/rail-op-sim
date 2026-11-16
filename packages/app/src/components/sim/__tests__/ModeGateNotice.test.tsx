// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ModeGateNotice } from "#/components/sim/ModeGateNotice";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

const complete: TrackStatus = {
	total: 2,
	connected: true,
	complete: true,
	dangling: 0,
	unpairedLinked: 0,
	unnamed: 0,
	undirected: 0,
	brokenRoutes: 0,
	firstIssue: null,
};

afterEach(() => {
	cleanup();
	useModeStore.setState({ mode: "railway", blockedNotice: null });
	useEditorStore.setState({ trackStatus: null });
	useTimetableStore.setState({
		timetable: { version: 1, startTime: 0, services: [] },
		issues: [],
	});
});

describe("ModeGateNotice", () => {
	it("renders nothing without a refusal", () => {
		const { container } = render(<ModeGateNotice />);
		expect(container.firstChild).toBeNull();
	});

	it("says which mode is locked and why", () => {
		useModeStore.getState().setMode("timetable");
		render(<ModeGateNotice />);
		const notice = screen.getByRole("status");
		expect(notice.textContent).toContain("Timetable is locked");
		expect(notice.textContent).toContain("Build a railway first");
		expect(screen.queryByRole("button", { name: "Open timetable" })).toBeNull();
	});

	it("can be dismissed", () => {
		useModeStore.getState().setMode("timetable");
		render(<ModeGateNotice />);
		fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
		expect(screen.queryByRole("status")).toBeNull();
		expect(useModeStore.getState().blockedNotice).toBeNull();
	});

	it("offers the timetable when that is what Operate is waiting for", () => {
		useEditorStore.setState({ trackStatus: complete });
		useModeStore.getState().setMode("operate");
		render(<ModeGateNotice />);
		expect(screen.getByRole("status").textContent).toContain(
			"Operate is locked",
		);
		fireEvent.click(screen.getByRole("button", { name: "Open timetable" }));
		expect(useModeStore.getState().mode).toBe("timetable");
		expect(useModeStore.getState().blockedNotice).toBeNull();
	});

	it("clears itself once the cause is fixed", () => {
		useModeStore.getState().setMode("timetable");
		render(<ModeGateNotice />);
		act(() => useEditorStore.setState({ trackStatus: complete }));
		expect(screen.queryByRole("status")).toBeNull();
		expect(useModeStore.getState().blockedNotice).toBeNull();
	});
});
