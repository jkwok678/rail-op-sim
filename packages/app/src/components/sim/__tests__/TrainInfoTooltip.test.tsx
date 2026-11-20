// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrainInfoTooltip } from "#/components/sim/TrainInfoTooltip";
import { type HoveredTrainInfo, useEditorStore } from "#/store/editor-store";

const BASE: HoveredTrainInfo = {
	headcode: "1A01",
	description: "London to Brighton",
	statusLabel: "85 km/h",
	next: "arr Brighton 06:30",
	signallerControl: false,
	reminder: null,
	timetable: null,
	screenX: 100,
	screenY: 200,
};

function show(info: Partial<HoveredTrainInfo> = {}) {
	useEditorStore.setState({ hoveredTrainInfo: { ...BASE, ...info } });
	render(<TrainInfoTooltip />);
	return screen.getByTestId("train-info-tooltip");
}

describe("TrainInfoTooltip", () => {
	afterEach(() => {
		cleanup();
		useEditorStore.setState({ hoveredTrainInfo: null });
	});

	it("renders nothing when the pointer isn't over a train", () => {
		useEditorStore.setState({ hoveredTrainInfo: null });
		render(<TrainInfoTooltip />);
		expect(screen.queryByTestId("train-info-tooltip")).toBeNull();
	});

	it("shows headcode, description, status and next action", () => {
		const tip = show();
		expect(tip.textContent).toContain("1A01 · London to Brighton");
		expect(tip.textContent).toContain("85 km/h · arr Brighton 06:30");
	});

	it("omits empty description and next separators", () => {
		const tip = show({ description: null, next: null });
		expect(tip.textContent).toContain("1A01");
		expect(tip.textContent).toContain("85 km/h");
		expect(tip.textContent).not.toContain("·");
	});

	it("follows the pointer", () => {
		const tip = show({ screenX: 100, screenY: 200 });
		expect(tip.style.left).toBe("114px");
		expect(tip.style.top).toBe("186px");
	});

	it("renders timetable entries alongside basic info", () => {
		const tip = show({
			timetable: [
				{ time: "06:00", label: "start", state: "done" },
				{ time: "06:15–06:17", label: "Ashfield", state: "next" },
				{ time: "06:30", label: "exit", state: "upcoming" },
			],
		});
		expect(tip.textContent).toContain("1A01 · London to Brighton");
		expect(tip.textContent).toContain("85 km/h · arr Brighton 06:30");
		expect(tip.textContent).toContain("06:00");
		expect(tip.textContent).toContain("06:15–06:17");
		expect(tip.textContent).toContain("Ashfield");
		expect(tip.textContent).toContain("06:30");
		expect(tip.textContent).toContain("exit");
	});

	it("renders timetable-only mode when statusLabel is null", () => {
		const tip = show({
			description: null,
			statusLabel: null,
			next: null,
			timetable: [
				{ time: "06:00", label: "start", state: "done" },
				{ time: null, label: "terminates", state: "next" },
			],
		});
		expect(tip.textContent).toContain("1A01");
		expect(tip.textContent).not.toContain("85 km/h");
		expect(tip.textContent).toContain("06:00");
		expect(tip.textContent).toContain("terminates");
	});

	it("shows signaller control and reminder when set", () => {
		const tip = show({
			signallerControl: true,
			reminder: "Hold for 1B02",
		});
		expect(tip.textContent).toContain("Signaller control");
		expect(tip.textContent).toContain("Reminder: Hold for 1B02");
	});
});
