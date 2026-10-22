// @vitest-environment jsdom
import {
	type Action,
	FINISH_KINDS,
	INTERMEDIATE_KINDS,
	parseSimTime,
	START_KINDS,
} from "@rail-op-sim/shared";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActionForm } from "#/components/sim/timetable/ActionForm";
import { createAction } from "#/components/sim/timetable/actionKinds";
import type { PendingCellPick } from "#/store/timetable-store";

const ALL_KINDS: Action["kind"][] = [
	...START_KINDS,
	...INTERMEDIATE_KINDS,
	...FINISH_KINDS,
];
const t = parseSimTime("07:15");

function renderForm(
	action: Action,
	options: {
		locations?: string[];
		otherRefs?: string[];
		pendingPick?: PendingCellPick | null;
	} = {},
) {
	const onChange = vi.fn<(action: Action) => void>();
	const onPick = vi.fn();
	render(
		<ActionForm
			action={action}
			onChange={onChange}
			onPick={onPick}
			locations={options.locations ?? []}
			otherRefs={options.otherRefs ?? []}
			pendingPick={options.pendingPick ?? null}
		/>,
	);
	return { onChange, onPick };
}

describe("ActionForm", () => {
	afterEach(cleanup);

	it.each(ALL_KINDS)("renders a form for %s", (kind) => {
		const { container } = render(
			<ActionForm
				action={createAction(kind, { time: t })}
				onChange={() => {}}
				onPick={() => {}}
				locations={["Ashfield"]}
				otherRefs={["2B01"]}
				pendingPick={null}
			/>,
		);
		expect(container.textContent).not.toBe("");
	});

	it("commits an edited time without changing the action's kind", () => {
		const { onChange } = renderForm(createAction("pass", { time: t }));
		fireEvent.change(screen.getByLabelText("Time"), {
			target: { value: "08:00" },
		});
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ kind: "pass", time: parseSimTime("08:00") }),
		);
	});

	it("edits a stop's dwell", () => {
		const { onChange } = renderForm(createAction("stop", { time: t }));
		fireEvent.change(screen.getByLabelText("Minimum dwell (s)"), {
			target: { value: "45" },
		});
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({ kind: "stop", minDwellSeconds: 45 }),
		);
	});

	it("arms the canvas for the rear cell, and shows when it is armed", () => {
		const action = createAction("startNew", { time: t });
		const { onPick } = renderForm(action, {
			pendingPick: {
				serviceRef: "1A01",
				actionIndex: 0,
				field: "front",
			},
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Pick Rear on the map" }),
		);
		expect(onPick).toHaveBeenCalledWith("rear", undefined);
		expect(
			screen.getByRole("button", { name: "Click the map to set Front" }),
		).toBeDefined();
	});

	it("adds, picks and removes exits by position", () => {
		const action: Action = {
			kind: "finishExit",
			time: t,
			exits: [
				{ gx: 1, gy: 1 },
				{ gx: 2, gy: 2 },
			],
		};
		const { onChange, onPick } = renderForm(action);

		fireEvent.click(screen.getByRole("button", { name: "Remove exit 1" }));
		expect(onChange).toHaveBeenLastCalledWith({
			...action,
			exits: [{ gx: 2, gy: 2 }],
		});

		fireEvent.click(screen.getByRole("button", { name: /Add an exit/ }));
		expect(onChange).toHaveBeenLastCalledWith({
			...action,
			exits: [...action.exits, { gx: 0, gy: 0 }],
		});

		fireEvent.change(screen.getByLabelText("Exit 2 x"), {
			target: { value: "7" },
		});
		expect(onChange).toHaveBeenLastCalledWith({
			...action,
			exits: [
				{ gx: 1, gy: 1 },
				{ gx: 7, gy: 2 },
			],
		});

		fireEvent.click(
			screen.getByRole("button", { name: "Pick Exit 2 on the map" }),
		);
		expect(onPick).toHaveBeenCalledWith("exit", 1);
	});

	it("explains an empty reference list instead of offering nothing", () => {
		renderForm(createAction("joinedBy", { time: t }));
		expect(
			screen.getByText("No other services to refer to yet."),
		).toBeDefined();
	});

	it("keeps a location the railway no longer has, marked invalid", () => {
		renderForm(createAction("pass", { time: t, location: "Gone" }), {
			locations: ["Ashfield"],
		});
		expect(screen.getByLabelText("Location").getAttribute("aria-invalid")).toBe(
			"true",
		);
	});
});
