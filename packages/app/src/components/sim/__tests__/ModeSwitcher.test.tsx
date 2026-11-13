// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ModeSwitcher } from "#/components/sim/ModeSwitcher";
import { TooltipProvider } from "#/components/ui/tooltip";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

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

	it("keeps Operate disabled until there is a timetable to run", () => {
		useEditorStore.setState({ trackStatus: complete });
		useTimetableStore.setState({
			timetable: { version: 1, startTime: 0, services: [] },
			issues: [],
		});
		renderSwitcher();
		const operate = screen.getByRole("radio", { name: /Operate/ });
		expect((operate as HTMLButtonElement).disabled).toBe(true);
	});

	it("enables Operate once the timetable has services and no errors", () => {
		useEditorStore.setState({ trackStatus: complete });
		useTimetableStore.setState({
			timetable: {
				version: 1,
				startTime: 0,
				services: [{ ref: "1A01", actions: [{ kind: "finishRemainHere" }] }],
			},
			issues: [],
		});
		renderSwitcher();
		const operate = screen.getByRole("radio", { name: /Operate/ });
		expect((operate as HTMLButtonElement).disabled).toBe(false);
	});

	it("enables Operate when a bad timetable is replaced with a valid one", () => {
		useEditorStore.setState({ trackStatus: complete });
		useTimetableStore.getState().replaceTimetable(
			{
				version: 1,
				startTime: 0,
				services: [
					{ ref: "1A01", actions: [{ kind: "finishRemainHere" }] },
					{ ref: "1A01", actions: [{ kind: "finishRemainHere" }] },
				],
			},
			null,
		);
		renderSwitcher();
		expect(
			(screen.getByRole("radio", { name: /Operate/ }) as HTMLButtonElement)
				.disabled,
		).toBe(true);

		act(() => {
			useTimetableStore.getState().replaceTimetable(
				{
					version: 1,
					startTime: 0,
					services: [
						{
							ref: "1A01",
							train: {
								startSpeedKmh: 40,
								maxSpeedKmh: 100,
								massTonnes: 100,
								brakeForceTonnes: 60,
								powerKw: 1000,
							},
							actions: [
								{
									kind: "startNew",
									time: 0,
									rear: { gx: 0, gy: 0 },
									front: { gx: 1, gy: 0 },
								},
								{ kind: "finishRemainHere" },
							],
						},
					],
				},
				null,
			);
		});
		const operate = screen.getByRole("radio", {
			name: /Operate/,
		}) as HTMLButtonElement;
		expect(operate.disabled).toBe(false);
		fireEvent.click(operate);
		expect(useModeStore.getState().mode).toBe("operate");
	});
});
