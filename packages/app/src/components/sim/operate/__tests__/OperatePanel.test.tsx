// @vitest-environment jsdom
import type { SimView } from "@rail-op-sim/shared";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperatePanel } from "#/components/sim/operate/OperatePanel";
import { useOperateStore } from "#/store/operate-store";

const sent = vi.hoisted(() => [] as unknown[]);
vi.mock("#/store/sim-bridge", () => ({
	simCommand: async (cmd: unknown) => {
		sent.push(cmd);
		return { ok: true };
	},
}));

const view = (over: Partial<SimView> = {}): SimView => ({
	time: 6 * 3600 + 5,
	run: "prestart",
	speed: 1,
	signals: [],
	points: [],
	levelCrossings: [],
	routes: [],
	pendingRoute: null,
	trains: [],
	counters: {} as SimView["counters"],
	...over,
});

beforeEach(() => {
	sent.length = 0;
	useOperateStore.getState().reset();
});
afterEach(cleanup);

describe("OperatePanel", () => {
	it("renders while the engine is still loading", () => {
		render(<OperatePanel />);
		expect(screen.getByText("Loading")).toBeTruthy();
		expect(screen.getByText("No trains on the railway yet.")).toBeTruthy();
	});

	it("shows the clock and starts it", () => {
		useOperateStore.setState({ view: view() });
		render(<OperatePanel />);
		expect(screen.getByLabelText("Timetable clock").textContent).toBe(
			"06:00:05",
		);
		expect(screen.getByText("Ready to start")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: /Run/ }));
		expect(sent).toEqual([{ type: "run" }]);
	});

	it("pauses a running clock and changes its speed", () => {
		useOperateStore.setState({ view: view({ run: "running", speed: 2 }) });
		render(<OperatePanel />);
		fireEvent.click(screen.getByRole("button", { name: /Pause/ }));
		fireEvent.click(screen.getByRole("button", { name: "Faster" }));
		expect(sent).toEqual([{ type: "pause" }, { type: "setSpeed", speed: 4 }]);
	});

	it("chooses the route kind and arms cancelling", () => {
		useOperateStore.setState({ view: view() });
		render(<OperatePanel />);
		fireEvent.click(screen.getByRole("radio", { name: /Unrestricted/ }));
		expect(useOperateStore.getState().routeKind).toBe("unrestricted");
		const callOnBtn = screen.getByRole("button", {
			name: /Calling-on/,
		}) as HTMLButtonElement;
		expect(callOnBtn.disabled).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
		expect(useOperateStore.getState().cancelArmed).toBe(true);
		expect(screen.getByText("Right-click a route to cancel it.")).toBeTruthy();
	});

	it("sets every automatic route at once", async () => {
		useOperateStore.setState({ view: view(), routeStart: { gx: 1, gy: 0 } });
		render(<OperatePanel />);
		fireEvent.click(screen.getByRole("button", { name: /Set all automatic/ }));
		expect(sent).toEqual([{ type: "setAllAutoRoutes" }]);
		await vi.waitFor(() =>
			expect(useOperateStore.getState().routeStart).toBeNull(),
		);
	});

	it("will not set every automatic route while paused", () => {
		useOperateStore.setState({ view: view({ run: "paused" }) });
		render(<OperatePanel />);
		const button = screen.getByRole("button", {
			name: /Set all automatic/,
		}) as HTMLButtonElement;
		expect(button.disabled).toBe(true);
	});

	it("lists trains and what they do next, and opens train menu on right-click", () => {
		useOperateStore.setState({
			view: view({
				trains: [
					{
						id: 1,
						headcode: "1A01",
						description: "",
						status: "waiting",
						wait: "signal",
						speedKmh: 0,
						segs: [],
						next: "arr Barton 06:10",
						timetableIndex: 0,
						workingDone: false,
						signallerControl: true,
						signallerMode: "stop",
						canRestoreTimetable: true,
						followOnServiceRef: null,
						reminder: "Hold at home",
						callingOnAllowed: false,
					},
				],
			}),
		});
		render(<OperatePanel />);
		expect(screen.getByText("1A01")).toBeTruthy();
		expect(screen.getByText("SC")).toBeTruthy();
		expect(screen.getByText("Note")).toBeTruthy();
		expect(screen.getByText("At signal")).toBeTruthy();
		expect(screen.getByText("arr Barton 06:10")).toBeTruthy();
		expect(
			(screen.getByRole("button", { name: /Calling-on/ }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
		fireEvent.contextMenu(screen.getByText("1A01"), {
			clientX: 120,
			clientY: 240,
		});
		expect(useOperateStore.getState().trainMenu).toEqual({
			trainId: 1,
			screenX: 120,
			screenY: 240,
		});
	});

	it("shows the log and the last refusal", () => {
		useOperateStore.setState({
			view: view(),
			log: [{ seq: 1, time: 0, level: "error", text: "06:00:00 ERROR: oops" }],
			notice: "There is a train in the way.",
		});
		render(<OperatePanel />);
		expect(screen.getByRole("log").textContent).toContain("ERROR: oops");
		expect(screen.getByText("There is a train in the way.")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Hide" }));
		expect(screen.queryByRole("log")).toBeNull();
	});
});
