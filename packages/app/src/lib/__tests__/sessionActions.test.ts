import "fake-indexeddb/auto";
import {
	createEmptyTimetable,
	Map as Map_,
	parseSimTime,
	SERIALIZED_MAP_VERSION,
	type SerializedMap,
} from "@rail-op-sim/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlacementController } from "#/engine/PlacementController";
import {
	AUTOSAVE_SESSION_ID,
	deleteSession,
	loadSession,
	saveSession,
} from "#/lib/db";
import {
	applySession,
	autosaveNow,
	captureSession,
	restoreAutosave,
} from "#/lib/sessionActions";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";

const map: SerializedMap = {
	version: SERIALIZED_MAP_VERSION,
	imageSize: 16,
	tracks: [],
	namedLocations: [],
	concourses: [],
	parapets: [],
	texts: [],
};

const loadFromData = vi.fn();
const stub = { map: new Map_(), serialize: () => map, loadFromData };

const state = (overrides: Record<string, unknown> = {}) => ({
	version: 1,
	map,
	timetable: createEmptyTimetable(parseSimTime("04:30")),
	saveFormat: "yaml",
	...overrides,
});

describe("sessionActions", () => {
	beforeEach(() => {
		PlacementController.instance = stub as unknown as PlacementController;
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		loadFromData.mockReset();
		PlacementController.instance = null;
		await deleteSession(AUTOSAVE_SESSION_ID);
		useTimetableStore.setState({ timetable: createEmptyTimetable() });
		useEditorStore.setState({ saveFormat: "json" });
	});

	it("captures nothing without a controller", () => {
		PlacementController.instance = null;
		expect(captureSession()).toBeNull();
	});

	it("round-trips a session through the autosave slot", async () => {
		useTimetableStore.setState({
			timetable: createEmptyTimetable(parseSimTime("05:00")),
		});
		useEditorStore.setState({ saveFormat: "yaml" });
		await autosaveNow();

		useTimetableStore.setState({ timetable: createEmptyTimetable() });
		useEditorStore.setState({ saveFormat: "json" });

		expect(await restoreAutosave()).toBe(true);
		expect(loadFromData).toHaveBeenCalledWith(map);
		expect(useTimetableStore.getState().timetable.startTime).toBe(
			parseSimTime("05:00"),
		);
		expect(useEditorStore.getState().saveFormat).toBe("yaml");
	});

	it("applies nothing when the timetable is invalid", () => {
		expect(applySession(state({ timetable: { version: 99 } }))).toBe(false);
		expect(loadFromData).not.toHaveBeenCalled();
		expect(useEditorStore.getState().saveFormat).toBe("json");
	});

	it("applies nothing when the map is invalid", () => {
		const before = useTimetableStore.getState().timetable;
		expect(applySession(state({ map: { version: 99 } }))).toBe(false);
		expect(loadFromData).not.toHaveBeenCalled();
		expect(useTimetableStore.getState().timetable).toBe(before);
	});

	it("rejects an unknown session version", () => {
		expect(applySession(state({ version: 2 }))).toBe(false);
		expect(applySession(null)).toBe(false);
	});

	it("deletes a corrupt autosave record on restore", async () => {
		await saveSession({
			id: AUTOSAVE_SESSION_ID,
			name: "Autosave",
			description: "",
			createdAt: 1,
			updatedAt: 1,
			state: state({ map: null }) as never,
		});
		expect(await restoreAutosave()).toBe(false);
		expect(await loadSession(AUTOSAVE_SESSION_ID)).toBeNull();
	});

	it("reports whether the autosave was written", async () => {
		expect(await autosaveNow()).toBe(true);
		PlacementController.instance = null;
		expect(await autosaveNow()).toBe(false);
	});

	it("keeps the autosave but skips it when the session already changed", async () => {
		await autosaveNow();
		expect(await restoreAutosave(() => false)).toBe(false);
		expect(loadFromData).not.toHaveBeenCalled();
		expect(await loadSession(AUTOSAVE_SESSION_ID)).not.toBeNull();
	});

	it("restores nothing when there is no autosave", async () => {
		expect(await restoreAutosave()).toBe(false);
		expect(loadFromData).not.toHaveBeenCalled();
	});
});
