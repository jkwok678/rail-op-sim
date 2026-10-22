// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrackInfoTooltip } from "#/components/sim/TrackInfoTooltip";
import { type HoveredTrackInfo, useEditorStore } from "#/store/editor-store";

const BASE: HoveredTrackInfo = {
	kindLabel: "Straight",
	subtypeCode: "SH",
	mainSpeed: 120,
	mainLength: 75,
	secondarySpeed: null,
	secondaryLength: null,
	aspectLabel: null,
	gx: 3,
	gy: 4,
	screenX: 100,
	screenY: 200,
};

function show(info: Partial<HoveredTrackInfo> = {}) {
	useEditorStore.setState({ hoveredTrackInfo: { ...BASE, ...info } });
	render(<TrackInfoTooltip />);
	return screen.getByTestId("track-info-tooltip");
}

describe("TrackInfoTooltip", () => {
	afterEach(() => {
		cleanup();
		useEditorStore.setState({ hoveredTrackInfo: null });
	});

	it("renders nothing when the pointer isn't over a track", () => {
		useEditorStore.setState({ hoveredTrackInfo: null });
		render(<TrackInfoTooltip />);
		expect(screen.queryByTestId("track-info-tooltip")).toBeNull();
	});

	it("shows the kind, code, cell and figures for a plain track", () => {
		const tip = show();
		expect(tip.textContent).toContain("Straight · SH");
		expect(tip.textContent).toContain("(3, 4)");
		expect(tip.textContent).toContain("120 km/h");
		expect(tip.textContent).toContain("75 m");
	});

	it("does not label the figures 'Main' when there is no second path", () => {
		// A lone "Main" row would imply a second one exists.
		expect(show().textContent).not.toContain("Main");
		expect(screen.getByTestId("track-info-tooltip").textContent).not.toContain(
			"Secondary",
		);
	});

	it("labels both paths when the track has a second one", () => {
		const tip = show({
			kindLabel: "Switch",
			subtypeCode: "SW1",
			secondarySpeed: 40,
			secondaryLength: 60,
		});
		expect(tip.textContent).toContain("Main 120 km/h");
		expect(tip.textContent).toContain("Secondary 40 km/h · 60 m");
	});

	it("shows a signal's aspect alongside its subtype", () => {
		const tip = show({
			kindLabel: "Signal",
			subtypeCode: "SIGL",
			aspectLabel: "Shunt",
		});
		expect(tip.textContent).toContain("Signal · SIGL · Shunt");
	});

	it("follows the pointer", () => {
		const tip = show({ screenX: 100, screenY: 200 });
		expect(tip.style.left).toBe("114px");
		expect(tip.style.top).toBe("186px");
	});
});
