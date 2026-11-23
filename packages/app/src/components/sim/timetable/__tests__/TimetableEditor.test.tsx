// @vitest-environment jsdom
import {
	createEmptyTimetable,
	itemAt,
	parseSimTime,
	type Timetable,
	validateTimetable,
} from "@rail-op-sim/shared";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TimetableEditor } from "#/components/sim/timetable/TimetableEditor";
import { useTimetableStore } from "#/store/timetable-store";

/**
 * Rendered with no placement controller, so there is no map: what matters here
 * is that the panels show the store and send edits back to it.
 */

const store = () => useTimetableStore.getState();

const timetable = (): Timetable => ({
	version: 1,
	title: "Weekday",
	startTime: parseSimTime("05:00"),
	services: [
		{
			ref: "1A01",
			description: "Ashfield to Barton",
			train: {
				startSpeedKmh: 0,
				maxSpeedKmh: 120,
				massTonnes: 200,
				brakeForceTonnes: 100,
				powerKw: 2000,
			},
			actions: [
				{
					kind: "startNew",
					time: parseSimTime("06:00"),
					rear: { gx: 0, gy: 0 },
					front: { gx: 1, gy: 0 },
				},
				{
					kind: "stop",
					location: "Ashfield",
					depart: parseSimTime("06:01"),
				},
				{
					kind: "pass",
					time: parseSimTime("06:10"),
					location: "Barton",
				},
				{ kind: "finishRemainHere" },
			],
		},
		{
			ref: "2B01",
			actions: [
				{
					kind: "startNewService",
					time: parseSimTime("07:00"),
					fromRef: "9Z99",
				},
				{ kind: "finishRemainHere" },
			],
		},
		{ ref: "3C01", actions: [] },
	],
});

function seed(tt: Timetable, selected: string | null = null) {
	useTimetableStore.setState({
		timetable: tt,
		issues: validateTimetable(tt),
		selectedServiceRef: selected,
		selectedActionIndex: null,
		pendingCellPick: null,
		loadError: null,
	});
}

beforeEach(() => seed(timetable()));
afterEach(cleanup);

describe("TimetableEditor service list", () => {
	it("summarises each service by its time and its first and last location", () => {
		render(<TimetableEditor />);
		const first = screen.getByRole("button", { name: /^1A01/ });
		expect(first.textContent).toContain("06:00 Ashfield → Barton");
		// No locations: falls back to the description, or a dash without one.
		expect(screen.getByRole("button", { name: /^2B01/ }).textContent).toContain(
			"07:00 —",
		);
	});

	it("counts each service's errors beside it", () => {
		render(<TimetableEditor />);
		// 2B01 takes over from a service that does not exist.
		expect(screen.getAllByTitle(/problems?$/).length).toBeGreaterThan(0);
	});

	it("selects, adds and deletes services through the store", () => {
		render(<TimetableEditor />);
		fireEvent.click(screen.getByRole("button", { name: /^2B01/ }));
		expect(store().selectedServiceRef).toBe("2B01");

		fireEvent.click(screen.getByRole("button", { name: /Add a service/ }));
		expect(store().timetable.services).toHaveLength(4);

		fireEvent.click(screen.getByRole("button", { name: "Delete 3C01" }));
		expect(store().timetable.services.map((s) => s.ref)).not.toContain("3C01");
	});

	it("prompts for a first service on an empty timetable", () => {
		seed(createEmptyTimetable());
		render(<TimetableEditor />);
		expect(
			screen.getByText("No services yet. Add one to begin."),
		).toBeDefined();
	});

	it("shows a failed load until it is dismissed", () => {
		useTimetableStore.setState({ loadError: "That file is not a timetable." });
		render(<TimetableEditor />);
		expect(screen.getByRole("alert").textContent).toContain(
			"That file is not a timetable.",
		);
		fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
		expect(store().loadError).toBeNull();
	});
});

describe("TimetableEditor service detail", () => {
	it("edits the timetable's title and the selected service's identity", () => {
		seed(timetable(), "1A01");
		render(<TimetableEditor />);
		fireEvent.change(screen.getByLabelText("Timetable"), {
			target: { value: "Saturday" },
		});
		expect(store().timetable.title).toBe("Saturday");

		fireEvent.change(screen.getByLabelText("Description"), {
			target: { value: "Ashfield to Coton" },
		});
		expect(itemAt(store().timetable.services, 0).description).toBe(
			"Ashfield to Coton",
		);
	});

	it("offers a train only to a service that creates one", () => {
		seed(timetable(), "1A01");
		render(<TimetableEditor />);
		fireEvent.change(screen.getByLabelText("Max (km/h)"), {
			target: { value: "160" },
		});
		expect(itemAt(store().timetable.services, 0).train?.maxSpeedKmh).toBe(160);
		cleanup();

		seed(timetable(), "2B01");
		render(<TimetableEditor />);
		expect(screen.queryByLabelText("Max (km/h)")).toBeNull();
	});

	it("says what a service with no actions is missing", () => {
		seed(timetable(), "3C01");
		render(<TimetableEditor />);
		expect(
			screen.getByText("A service needs a start, and a finish."),
		).toBeDefined();
	});

	it("expands, reorders and removes action rows", () => {
		seed(timetable(), "1A01");
		render(<TimetableEditor />);
		const actions = screen.getByRole("list", { name: "" });
		const rows = within(actions).getAllByRole("listitem");
		expect(rows).toHaveLength(4);

		fireEvent.click(itemAt(within(itemAt(rows, 1)).getAllByRole("button"), 0));
		expect(store().selectedActionIndex).toBe(1);

		fireEvent.click(
			screen.getByRole("button", { name: "Move Pass a location up" }),
		);
		expect(itemAt(itemAt(store().timetable.services, 0).actions, 1).kind).toBe(
			"pass",
		);

		fireEvent.click(screen.getByRole("button", { name: "Remove Remain here" }));
		expect(itemAt(store().timetable.services, 0).actions).toHaveLength(3);
	});

	it("opens the selected action's form, and arms a cell pick from it", () => {
		seed(timetable(), "1A01");
		useTimetableStore.setState({ selectedActionIndex: 0 });
		render(<TimetableEditor />);
		fireEvent.click(
			screen.getByRole("button", { name: "Pick Rear on the map" }),
		);
		expect(store().pendingCellPick).toEqual({
			serviceRef: "1A01",
			actionIndex: 0,
			field: "rear",
			exitIndex: undefined,
		});
	});

	it("jumps to the action an issue is about", () => {
		seed(timetable(), "2B01");
		render(<TimetableEditor />);
		// The issue, not the action row's summary, which also names 9Z99.
		const issue = screen
			.getAllByRole("button", { name: /9Z99/ })
			.find((b) => !b.textContent?.includes("from"));
		if (!issue) throw new Error("no issue names 9Z99");
		fireEvent.click(issue);
		expect(store().selectedActionIndex).toBe(0);
	});

	it("says so when the selected service has no problems", () => {
		const tt = timetable();
		tt.services = [itemAt(tt.services, 0)];
		seed(tt, "1A01");
		render(<TimetableEditor />);
		expect(screen.getByText("No problems.")).toBeDefined();
	});

	it("seeds a default train when adding a train-creating start action", () => {
		Element.prototype.scrollIntoView = () => {};
		seed(timetable(), "3C01");
		render(<TimetableEditor />);
		expect(itemAt(store().timetable.services, 2).train).toBeUndefined();

		fireEvent.click(screen.getByRole("combobox", { name: "Add an action" }));
		fireEvent.click(
			screen.getByRole("option", { name: "Start a new shuttle train" }),
		);

		expect(itemAt(itemAt(store().timetable.services, 2).actions, 0).kind).toBe(
			"startNewShuttle",
		);
		expect(itemAt(store().timetable.services, 2).train).toBeDefined();
	});

	it("adds, edits and removes a service repeat", () => {
		seed(timetable(), "1A01");
		render(<TimetableEditor />);
		fireEvent.click(screen.getByRole("button", { name: /Add repeat/ }));
		expect(itemAt(store().timetable.services, 0).repeat).toEqual({
			intervalMinutes: 30,
			headcodeIncrement: 1,
			count: 1,
		});

		fireEvent.change(screen.getByLabelText("Interval (min)"), {
			target: { value: "20" },
		});
		fireEvent.change(screen.getByLabelText("Headcode +"), {
			target: { value: "2" },
		});
		fireEvent.change(screen.getByLabelText("Count"), {
			target: { value: "3" },
		});
		expect(itemAt(store().timetable.services, 0).repeat).toEqual({
			intervalMinutes: 20,
			headcodeIncrement: 2,
			count: 3,
		});

		fireEvent.click(screen.getByRole("button", { name: "Remove repeat" }));
		expect(itemAt(store().timetable.services, 0).repeat).toBeUndefined();
	});
});
