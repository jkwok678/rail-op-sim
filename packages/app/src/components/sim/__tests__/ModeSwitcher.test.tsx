// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ModeSwitcher } from "#/components/sim/ModeSwitcher";
import { TooltipProvider } from "#/components/ui/tooltip";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";

class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??=
	ResizeObserverStub as unknown as typeof ResizeObserver;

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

function renderSwitcher() {
	render(
		<TooltipProvider delayDuration={0}>
			<ModeSwitcher />
		</TooltipProvider>,
	);
}

describe("ModeSwitcher", () => {
	afterEach(() => {
		cleanup();
		useModeStore.setState({ mode: "railway" });
		useEditorStore.setState({ trackStatus: null });
	});

	it("marks the current mode as the checked one", () => {
		renderSwitcher();
		const railway = screen.getByRole("radio", { name: /Railway/ });
		expect(railway.getAttribute("aria-checked")).toBe("true");
	});

	it("keeps Timetable disabled, with the reason, until the railway is complete", async () => {
		renderSwitcher();
		const timetable = screen.getByRole("radio", { name: /Timetable/ });
		expect((timetable as HTMLButtonElement).disabled).toBe(true);

		// The disabled button is wrapped so its tooltip still fires.
		fireEvent.focus(timetable.parentElement as HTMLElement);
		const tip = await screen.findByRole("tooltip");
		expect(tip.textContent).toContain("Build a railway first");
	});

	it("switches to the timetable once the railway is complete", () => {
		useEditorStore.setState({ trackStatus: complete });
		renderSwitcher();
		fireEvent.click(screen.getByRole("radio", { name: /Timetable/ }));
		expect(useModeStore.getState().mode).toBe("timetable");
	});

	it("names the mode and its shortcut in the tooltip", async () => {
		renderSwitcher();
		fireEvent.focus(screen.getByRole("radio", { name: /Railway/ }));
		const tip = await screen.findByRole("tooltip");
		expect(tip.textContent).toContain("Railway mode");
	});
});
