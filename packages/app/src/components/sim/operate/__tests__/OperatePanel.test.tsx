// @vitest-environment jsdom
import { emptyCounters, type SimView } from "@rail-op-sim/shared";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperatePanel } from "#/components/sim/operate/OperatePanel";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";

const sent = vi.hoisted(() => [] as unknown[]);
vi.mock("#/store/sim-bridge", () => ({
	simCommand: async (cmd: unknown) => {
		sent.push(cmd);
		return { ok: true };
	},
	restartSimSession: () => {
		sent.push("restart");
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
	counters: emptyCounters(),
	...over,
});

beforeEach(() => {
	sent.length = 0;
	useOperateStore.getState().reset();
});
afterEach(cleanup);

describe("OperatePanel", () => {
	it("shows a spinner in the train list while the engine starts", () => {
		render(<OperatePanel />);
		expect(screen.getByRole("status", { name: "Starting the simulation" }));
		expect(screen.getByText("Starting the simulation…")).toBeTruthy();
		useOperateStore.setState({ status: "loading" });
		expect(screen.getByText("Starting the simulation…")).toBeTruthy();
	});

	it("says the clock has not started when nothing is on the railway before Run", () => {
		useOperateStore.setState({ status: "ready", view: view() });
		render(<OperatePanel />);
		expect(screen.getByText(/The clock has not started/)).toBeTruthy();
		expect(screen.queryByText("No trains on the railway yet.")).toBeNull();
	});

	it("keeps the plain empty message once the clock has run", () => {
		useOperateStore.setState({
			status: "ready",
			view: view({ run: "running" }),
		});
		render(<OperatePanel />);
		expect(screen.getByText("No trains on the railway yet.")).toBeTruthy();
	});

	it("replaces the train list with an error state, controls disabled, log kept", () => {
		useOperateStore.setState({
			status: "error",
			error: "worker exploded",
			view: view(),
			log: [{ seq: 1, time: 0, level: "error", text: "06:00:00 ERROR: oops" }],
		});
		render(<OperatePanel />);
		const alert = screen.getByRole("alert");
		expect(alert.textContent).toContain("The simulation stopped");
		expect(alert.textContent).toContain("worker exploded");
		expect(
			(screen.getByRole("button", { name: /Run/ }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
		expect(
			(screen.getByRole("radio", { name: /Unrestricted/ }) as HTMLButtonElement)
				.disabled,
		).toBe(true);
		expect(screen.getByRole("log").textContent).toContain("ERROR: oops");
	});

	it("restarts the session from the error state", () => {
		useOperateStore.setState({ status: "error", error: "boom" });
		render(<OperatePanel />);
		fireEvent.click(screen.getByRole("button", { name: "Restart session" }));
		expect(sent).toEqual(["restart"]);
	});

	it("goes back to the railway from the error state without asking", () => {
		useModeStore.setState({ mode: "operate" });
		useOperateStore.setState({
			status: "error",
			error: "boom",
			view: view({ run: "running" }),
		});
		render(<OperatePanel />);
		fireEvent.click(screen.getByRole("button", { name: "Back to railway" }));
		expect(useModeStore.getState().mode).toBe("railway");
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
			status: "ready",
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

	it("shows the performance summary headline collapsed by default", () => {
		useOperateStore.setState({ status: "ready", view: view() });
		render(<OperatePanel />);
		expect(screen.getByText("Performance summary")).toBeTruthy();
		expect(
			screen.getByText(
				(_, el) => el?.textContent === "— on time · 0 incidents",
			),
		).toBeTruthy();
		expect(
			screen.queryByRole("region", { name: "Performance summary" }),
		).toBeNull();
		const toggle = screen.getByRole("button", { name: "Show" });
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
	});

	it("expands the performance summary with event rows and incidents", () => {
		useOperateStore.setState({
			status: "ready",
			view: view({
				counters: {
					...emptyCounters(),
					onTimeArrivals: 9,
					lateArrivals: 1,
					totLateArrMins: 4,
					spads: 1,
					excessLcDownMins: 2.5,
				},
			}),
		});
		render(<OperatePanel />);
		expect(
			screen.getByText(
				(_, el) =>
					el?.textContent ===
					"90% on time · 1 incident · 2.5 min excess crossing time",
			),
		).toBeTruthy();
		expect(screen.getByText("1 incident").className).toContain(
			"text-destructive",
		);
		expect(
			screen.getByText("2.5 min excess crossing time").className,
		).toContain("text-amber-700");

		const toggle = screen.getByRole("button", { name: "Show" });
		fireEvent.click(toggle);
		expect(toggle.getAttribute("aria-expanded")).toBe("true");

		const region = screen.getByRole("region", { name: "Performance summary" });
		expect(
			within(region)
				.getByRole("columnheader", { name: "Late min Σ" })
				.querySelector("abbr")?.title,
		).toBe("Total minutes late");
		const arrivalsRow = within(region)
			.getByRole("rowheader", { name: "Arrivals" })
			.closest("tr");
		expect(arrivalsRow).not.toBeNull();
		expect(
			within(arrivalsRow as HTMLElement)
				.getAllByRole("cell")
				.map((c) => c.textContent),
		).toEqual(["9", "1", "0", "4", "0"]);

		const departuresRow = within(region)
			.getByRole("rowheader", { name: "Departures" })
			.closest("tr");
		expect(departuresRow).not.toBeNull();
		expect(
			within(departuresRow as HTMLElement)
				.getAllByRole("cell")
				.map((c) => c.textContent),
		).toEqual(["0", "0", "—", "0", "—"]);

		const spadLabel = within(region).getByText("SPADs");
		const spadValue = spadLabel.nextElementSibling;
		expect(spadValue?.textContent).toBe("1");
		expect(spadValue?.className).toContain("text-destructive");

		const lcLabel = within(region).getByText("Excess crossing-down time");
		const lcValue = lcLabel.nextElementSibling;
		expect(lcValue?.textContent).toBe("2.5 min");
		expect(lcValue?.className).toContain("text-amber-700");
	});

	it("renders nothing for the performance summary while loading with no view", () => {
		useOperateStore.setState({ status: "loading", view: null });
		render(<OperatePanel />);
		expect(screen.queryByText("Performance summary")).toBeNull();
		expect(
			screen.queryByRole("region", { name: "Performance summary" }),
		).toBeNull();
	});
});
