import {
	createEmptyTimetable,
	Map as Map_,
	parseSimTime,
	type Service,
} from "@rail-op-sim/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlacementController } from "#/engine/PlacementController";
import { clearTimetable, newRailway } from "#/lib/documentActions";
import { useTimetableStore } from "#/store/timetable-store";

const loadFromData = vi.fn();
const stub = { map: new Map_(), loadFromData };

/** A timetable with one (not necessarily valid) service in it. */
function busyTimetable() {
	return {
		...createEmptyTimetable(parseSimTime("06:00")),
		services: [{ ref: "1A01" } as Service],
	};
}

describe("new / clear", () => {
	beforeEach(() => {
		PlacementController.instance = stub as unknown as PlacementController;
		useTimetableStore.setState({
			timetable: busyTimetable(),
			selectedServiceRef: "1A01",
			loadError: "old error",
		});
	});

	afterEach(() => {
		loadFromData.mockReset();
		PlacementController.instance = null;
		useTimetableStore.setState({
			timetable: createEmptyTimetable(),
			selectedServiceRef: null,
			loadError: null,
		});
	});

	it("clearTimetable empties the timetable and leaves the map alone", () => {
		clearTimetable();
		const s = useTimetableStore.getState();
		expect(s.timetable.services).toEqual([]);
		expect(s.selectedServiceRef).toBeNull();
		expect(s.loadError).toBeNull();
		expect(loadFromData).not.toHaveBeenCalled();
	});

	it("newRailway loads an empty map and empties the timetable", () => {
		newRailway();
		expect(loadFromData).toHaveBeenCalledOnce();
		const [data] = loadFromData.mock.calls[0];
		expect(data.tracks).toEqual([]);
		expect(data.texts).toEqual([]);
		expect(useTimetableStore.getState().timetable.services).toEqual([]);
	});

	it("newRailway does nothing before the controller exists", () => {
		PlacementController.instance = null;
		newRailway();
		expect(useTimetableStore.getState().timetable.services).toHaveLength(1);
	});
});
