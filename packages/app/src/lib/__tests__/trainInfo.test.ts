import type { TrainView } from "@rail-op-sim/shared";
import { describe, expect, it } from "vitest";
import { buildHoveredTrainInfo, findTrainAt } from "#/lib/trainInfo";

function makeTrain(over: Partial<TrainView> = {}): TrainView {
	return {
		id: 1,
		headcode: "1A01",
		description: "London to Brighton",
		status: "running",
		wait: null,
		speedKmh: 84.6,
		segs: [
			{ gx: 2, gy: 3, entry: 3, exit: 5, from: 0.2, to: 1 },
			{ gx: 3, gy: 3, entry: 3, exit: 5, from: 0, to: 0.6 },
		],
		next: "arr Brighton 06:30",
		timetableIndex: 1,
		workingDone: false,
		signallerControl: false,
		signallerMode: "stop",
		canRestoreTimetable: false,
		followOnServiceRef: null,
		reminder: null,
		...over,
	};
}

describe("findTrainAt", () => {
	it("returns the train occupying the hovered cell", () => {
		const train = makeTrain();
		expect(findTrainAt([train], 2, 3)).toBe(train);
		expect(findTrainAt([train], 3, 3)).toBe(train);
	});

	it("returns null when no train occupies the cell", () => {
		const train = makeTrain();
		expect(findTrainAt([train], 4, 3)).toBeNull();
		expect(findTrainAt([], 2, 3)).toBeNull();
	});

	it("skips a zero-span segment waiting outside an exit", () => {
		const train = makeTrain({
			segs: [{ gx: 0, gy: 0, entry: 3, exit: 5, from: 0, to: 0 }],
		});
		expect(findTrainAt([train], 0, 0)).toBeNull();
	});
});

describe("buildHoveredTrainInfo", () => {
	it("extracts headcode, description, rounded speed status, next action and pointer coords", () => {
		const info = buildHoveredTrainInfo(makeTrain(), 100, 200);
		expect(info).toEqual({
			headcode: "1A01",
			description: "London to Brighton",
			statusLabel: "85 km/h",
			next: "arr Brighton 06:30",
			signallerControl: false,
			reminder: null,
			timetable: null,
			screenX: 100,
			screenY: 200,
		});
	});

	it("maps empty description and next to null", () => {
		const info = buildHoveredTrainInfo(
			makeTrain({ description: "", next: "" }),
			10,
			20,
		);
		expect(info.description).toBeNull();
		expect(info.next).toBeNull();
	});

	it("uses the waiting reason label when stationary", () => {
		const info = buildHoveredTrainInfo(
			makeTrain({ status: "waiting", wait: "signal", speedKmh: 0 }),
			0,
			0,
		);
		expect(info.statusLabel).toBe("At signal");
	});

	it("suppresses redundant next text when crashed or finished", () => {
		const crashed = buildHoveredTrainInfo(
			makeTrain({ status: "crashed", next: "crashed" }),
			0,
			0,
		);
		expect(crashed.statusLabel).toBe("Crashed");
		expect(crashed.next).toBeNull();

		const finished = buildHoveredTrainInfo(
			makeTrain({ status: "finished", next: "finished" }),
			0,
			0,
		);
		expect(finished.statusLabel).toBe("Finished");
		expect(finished.next).toBeNull();
	});

	it("includes signallerControl and reminder when basic info is shown", () => {
		const info = buildHoveredTrainInfo(
			makeTrain({ signallerControl: true, reminder: "Check route" }),
			0,
			0,
		);
		expect(info.signallerControl).toBe(true);
		expect(info.reminder).toBe("Check route");
	});

	it("includes timetable when showTimetable is enabled alongside basic info", () => {
		const timetableRows = [
			{ time: "06:00", label: "start" },
			{ time: "06:30", label: "arr Brighton" },
		];
		const timetable = [
			{ ...timetableRows[0], state: "done" as const },
			{ ...timetableRows[1], state: "next" as const },
		];
		const info = buildHoveredTrainInfo(makeTrain(), 50, 60, {
			timetableRows,
			showBasic: true,
			showTimetable: true,
		});
		expect(info).toEqual({
			headcode: "1A01",
			description: "London to Brighton",
			statusLabel: "85 km/h",
			next: "arr Brighton 06:30",
			signallerControl: false,
			reminder: null,
			timetable,
			screenX: 50,
			screenY: 60,
		});
	});

	it("supports showing only the timetable without basic info", () => {
		const timetableRows = [
			{ time: "06:00", label: "start" },
			{ time: "06:30", label: "arr Brighton" },
		];
		const timetable = [
			{ ...timetableRows[0], state: "done" as const },
			{ ...timetableRows[1], state: "next" as const },
		];
		const info = buildHoveredTrainInfo(makeTrain(), 50, 60, {
			timetableRows,
			showBasic: false,
			showTimetable: true,
		});
		expect(info).toEqual({
			headcode: "1A01",
			description: null,
			statusLabel: null,
			next: null,
			signallerControl: false,
			reminder: null,
			timetable,
			screenX: 50,
			screenY: 60,
		});
	});
});
