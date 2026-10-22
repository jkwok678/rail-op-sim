// @vitest-environment jsdom
import { SignalAspect } from "@rail-op-sim/shared";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AddPalette } from "#/components/sim/AddPalette";
import { useEditorStore } from "#/store/editor-store";

/** Open the palette on the signal category with `aspect` selected. */
function showSignals(aspect: number) {
	useEditorStore.setState({
		tool: "add",
		selectedKind: "signal",
		selectedSubtype: null,
		selectedAspect: aspect as never,
	});
	render(<AddPalette />);
}

describe("AddPalette signal tiles", () => {
	afterEach(() => {
		cleanup();
		useEditorStore.setState({
			tool: "select",
			selectedKind: null,
			selectedSubtype: null,
		});
	});

	it("names the aspect the user actually picked", () => {
		showSignals(SignalAspect.FOUR_ASPECT);
		expect(
			screen.getByRole("button", { name: "SIGNALLEFT (4-aspect)" }),
		).toBeDefined();
	});

	it("does not call a non-shunt signal a shunt", () => {
		// The reported bug: the tile's title tested `aspect` for truthiness, so
		// every aspect — all of them truthy — read "(shunt)".
		for (const aspect of [
			SignalAspect.FOUR_ASPECT,
			SignalAspect.THREE_ASPECT,
			SignalAspect.TWO_ASPECT,
		]) {
			showSignals(aspect);
			// Direction tiles only — the aspect picker beside them has a button
			// legitimately named "Shunt".
			const tiles = screen
				.getAllByRole("button")
				.map((b) => b.getAttribute("aria-label") ?? "")
				.filter((name) => name.startsWith("SIGNAL"));
			expect(tiles.length, `aspect ${aspect}`).toBe(8);
			for (const name of tiles) {
				expect(name.toLowerCase(), `aspect ${aspect}`).not.toContain("shunt");
			}
			cleanup();
		}
	});

	it("relabels every tile when the aspect changes", () => {
		showSignals(SignalAspect.SHUNT);
		expect(
			screen.getByRole("button", { name: "SIGNALRIGHT (Shunt)" }),
		).toBeDefined();
		cleanup();
		showSignals(SignalAspect.TWO_ASPECT);
		expect(
			screen.getByRole("button", { name: "SIGNALRIGHT (2-aspect)" }),
		).toBeDefined();
	});

	it("leaves non-signal tiles unqualified", () => {
		useEditorStore.setState({
			tool: "add",
			selectedKind: "straight",
			selectedSubtype: null,
		});
		render(<AddPalette />);
		expect(screen.getByRole("button", { name: "STRAIGHTH" })).toBeDefined();
	});
});
