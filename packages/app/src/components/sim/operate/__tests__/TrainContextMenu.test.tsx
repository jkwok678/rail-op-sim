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
import {
	TrainContextMenu,
	trainMenuItems,
} from "#/components/sim/operate/TrainContextMenu";
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
	status: "running",
	wait: null,
	speedKmh: 50,
	segs: [],
	next: "",
	timetableIndex: 1,
	workingDone: false,
	signallerControl: false,
	signallerMode: "stop",
	canRestoreTimetable: false,
	followOnServiceRef: null,
	reminder: null,
	...over,
});

const byId = (items: ReturnType<typeof trainMenuItems>, id: string) =>
	items.find((item) => item.id === id);

beforeEach(() => {
	sent.length = 0;
	useOperateStore.getState().reset();
});
afterEach(cleanup);

describe("trainMenuItems", () => {
	it("enables takeControl and disables movement, join, skip, and remove while running in timetable control", () => {
		const items = trainMenuItems(train(), 4);
		expect(byId(items, "takeControl")?.enabled).toBe(true);
		expect(byId(items, "restoreTimetable")?.enabled).toBe(false);
		expect(byId(items, "moveForwards")?.enabled).toBe(false);
		expect(byId(items, "stop")?.enabled).toBe(false);
		expect(byId(items, "signallerJoin")?.enabled).toBe(false);
		expect(byId(items, "skipActions")?.enabled).toBe(false);
		expect(byId(items, "becomeNewService")?.enabled).toBe(false);
		expect(byId(items, "setReminder")?.enabled).toBe(true);
		expect(byId(items, "removeTrain")?.enabled).toBe(false);
	});

	it("enables skipActions and becomeNewService only when stopped in timetable mode with valid targets", () => {
		const atStop = train({
			status: "dwelling",
			speedKmh: 0,
			timetableIndex: 1,
			followOnServiceRef: "2B99",
		});
		const items = trainMenuItems(atStop, 4);
		expect(byId(items, "skipActions")?.enabled).toBe(true);
		expect(byId(items, "becomeNewService")?.enabled).toBe(true);
		expect(byId(items, "becomeNewService")?.label).toBe("Become 2B99 Early…");

		// Index 2 of 4 rows only has row 3 (the finish row) after it, so skipActions is disabled.
		const beforeFinish = trainMenuItems(
			train({ status: "dwelling", speedKmh: 0, timetableIndex: 2 }),
			4,
		);
		expect(byId(beforeFinish, "skipActions")?.enabled).toBe(false);
	});

	it("enables passRed, signallerJoin, restoreTimetable, and removeTrain according to signaller state", () => {
		const atRed = train({
			status: "waiting",
			wait: "signal",
			speedKmh: 0,
			signallerControl: true,
			signallerMode: "stop",
			canRestoreTimetable: true,
		});
		const items = trainMenuItems(atRed, 4);
		expect(byId(items, "restoreTimetable")?.enabled).toBe(true);
		expect(byId(items, "passRed")?.enabled).toBe(true);
		expect(byId(items, "stepForward")?.enabled).toBe(false);
		expect(byId(items, "changeDirection")?.enabled).toBe(true);
		expect(byId(items, "moveForwards")?.enabled).toBe(true);
		expect(byId(items, "removeTrain")?.enabled).toBe(true);
		expect(byId(items, "skipActions")?.enabled).toBe(false);

		const awayFromRestore = train({
			status: "waiting",
			wait: "train",
			speedKmh: 0,
			signallerControl: true,
			signallerMode: "stop",
			canRestoreTimetable: false,
		});
		const joinItems = trainMenuItems(awayFromRestore, 4);
		expect(byId(joinItems, "signallerJoin")?.enabled).toBe(true);
		expect(byId(joinItems, "restoreTimetable")?.enabled).toBe(false);

		// Crashed trains can always be removed even without signaller control.
		const crashed = train({ status: "crashed", speedKmh: 0 });
		expect(byId(trainMenuItems(crashed, 4), "removeTrain")?.enabled).toBe(true);
	});
});

describe("TrainContextMenu", () => {
	it("renders all 12 items, dispatches commands/dialogs, and supports arrow-key navigation", () => {
		const t = train({
			signallerControl: true,
			signallerMode: "stop",
			speedKmh: 0,
			canRestoreTimetable: true,
		});
		useOperateStore.setState({
			view: { trains: [t] } as SimView,
			timetables: {
				1: [
					{ time: "06:00", label: "start" },
					{ time: "06:02", label: "Ashfield" },
					{ time: "06:05", label: "Barton" },
					{ time: "06:10", label: "exit" },
				],
			},
			trainMenu: { trainId: 1, screenX: 100, screenY: 120 },
		});

		render(<TrainContextMenu />);
		expect(screen.getAllByRole("menuitem")).toHaveLength(12);

		const menu = screen.getByRole("menu");
		fireEvent.keyDown(menu, { key: "ArrowDown" });
		expect(document.activeElement).toBe(
			screen.getByRole("menuitem", { name: "Restore Timetable Control" }),
		);

		fireEvent.click(screen.getByRole("menuitem", { name: "Step Forward" }));
		expect(sent).toEqual([{ type: "stepForward", trainId: 1 }]);
		expect(useOperateStore.getState().trainMenu).toBeNull();

		act(() => {
			useOperateStore.getState().openTrainMenu(1, 100, 120);
		});
		fireEvent.click(screen.getByRole("menuitem", { name: "Remove Train" }));
		expect(useOperateStore.getState().trainDialog).toEqual({
			kind: "removeTrain",
			trainId: 1,
		});
	});
});
