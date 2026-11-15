// @vitest-environment jsdom
import type { SimView, TrainView } from "@rail-op-sim/shared";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainDialogs } from "#/components/sim/operate/TrainDialogs";
import { useOperateStore } from "#/store/operate-store";

const sent = vi.hoisted(() => [] as unknown[]);
vi.mock("#/store/sim-bridge", () => ({
	simCommand: async (cmd: unknown) => {
		sent.push(cmd);
		return { ok: true };
	},
}));

const train = (over: Partial<TrainView> = {}): TrainView => ({
	id: 1,
	headcode: "1A01",
	description: "",
	status: "dwelling",
	wait: null,
	speedKmh: 0,
	segs: [],
	next: "",
	timetableIndex: 1,
	workingDone: false,
	signallerControl: false,
	signallerMode: "stop",
	canRestoreTimetable: false,
	followOnServiceRef: "2B99",
	reminder: null,
	callingOnAllowed: false,
	...over,
});

beforeEach(() => {
	sent.length = 0;
	useOperateStore.getState().reset();
	useOperateStore.setState({
		view: { trains: [train()] } as SimView,
		timetables: {
			1: [
				{ time: "06:00", label: "start" },
				{ time: "06:02", label: "Ashfield" },
				{ time: "06:05", label: "Barton" },
				{ time: "06:10", label: "exit" },
			],
		},
	});
});
afterEach(cleanup);

describe("TrainDialogs", () => {
	it("submits skipActions to selected future step and excludes the finish row", () => {
		useOperateStore.getState().openTrainDialog("skipActions", 1);
		render(<TrainDialogs />);
		expect(screen.queryByRole("option", { name: /exit/ })).toBeNull();
		fireEvent.click(screen.getByRole("option", { name: /Barton/ }));
		fireEvent.click(screen.getByRole("button", { name: "Skip to selected" }));
		expect(sent).toEqual([{ type: "skipActions", trainId: 1, toIndex: 2 }]);
		expect(useOperateStore.getState().trainDialog).toBeNull();
	});

	it("confirms becomeNewService for the booked follow-on service", () => {
		useOperateStore.getState().openTrainDialog("becomeNewService", 1);
		render(<TrainDialogs />);
		expect(screen.getByText(/become follow-on service 2B99/i)).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Become 2B99" }));
		expect(sent).toEqual([{ type: "becomeNewService", trainId: 1 }]);
		expect(useOperateStore.getState().trainDialog).toBeNull();
	});

	it("confirms removeTrain before dispatching command", () => {
		useOperateStore.getState().openTrainDialog("removeTrain", 1);
		render(<TrainDialogs />);
		fireEvent.click(screen.getByRole("button", { name: "Remove train" }));
		expect(sent).toEqual([{ type: "removeTrain", trainId: 1 }]);
		expect(useOperateStore.getState().trainDialog).toBeNull();
	});

	it("saves and clears a reminder", () => {
		useOperateStore.setState({
			view: { trains: [train({ reminder: "Old note" })] } as SimView,
			trainDialog: { kind: "setReminder", trainId: 1 },
		});
		render(<TrainDialogs />);
		const input = screen.getByDisplayValue("Old note");
		fireEvent.change(input, { target: { value: "New note" } });
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(sent).toEqual([
			{ type: "setReminder", trainId: 1, reminder: "New note" },
		]);

		sent.length = 0;
		act(() => {
			useOperateStore.getState().openTrainDialog("setReminder", 1);
		});
		fireEvent.click(screen.getByRole("button", { name: "Clear" }));
		expect(sent).toEqual([{ type: "setReminder", trainId: 1, reminder: null }]);
	});
});
