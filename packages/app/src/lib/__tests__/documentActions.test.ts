import { afterEach, describe, expect, it, vi } from "vitest";
import { loadDocument, saveDocument } from "#/lib/documentActions";
import { pickAndReadDocuments } from "#/lib/documentFile";
import { applyLoadedMap, saveMap } from "#/lib/mapActions";
import { loadTimetable, saveTimetable } from "#/lib/timetableActions";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

vi.mock("#/lib/documentFile", async (importActual) => ({
	...(await importActual<typeof import("#/lib/documentFile")>()),
	pickAndReadDocuments: vi.fn(async () => null),
}));
vi.mock("#/lib/mapActions", () => ({
	applyLoadedMap: vi.fn(),
	saveMap: vi.fn(),
}));
vi.mock("#/lib/timetableActions", () => ({
	loadTimetable: vi.fn(),
	saveTimetable: vi.fn(),
}));

const mockLoadTimetable = vi.mocked(loadTimetable);

describe("loadDocument in timetable mode", () => {
	afterEach(() => {
		vi.clearAllMocks();
		useModeStore.setState({ mode: "railway" });
		useTimetableStore.setState({ loadError: null });
	});

	it("records a rejected file's error in the timetable store", async () => {
		useModeStore.setState({ mode: "timetable" });
		mockLoadTimetable.mockResolvedValue("That file is not a timetable.");
		await loadDocument();
		expect(useTimetableStore.getState().loadError).toBe(
			"That file is not a timetable.",
		);
	});

	it("clears any previous loadError on success or cancel", async () => {
		useModeStore.setState({ mode: "timetable" });
		useTimetableStore.setState({ loadError: "Previous error" });
		mockLoadTimetable.mockResolvedValue(null);
		await loadDocument();
		expect(useTimetableStore.getState().loadError).toBeNull();
	});
});

describe("saveDocument / loadDocument by mode", () => {
	afterEach(() => {
		vi.clearAllMocks();
		useModeStore.setState({ mode: "railway" });
		useTimetableStore.setState({ loadError: null });
	});

	it("saves the map in railway mode and the timetable in timetable mode", () => {
		useModeStore.setState({ mode: "railway" });
		saveDocument();
		expect(saveMap).toHaveBeenCalledOnce();
		expect(saveTimetable).not.toHaveBeenCalled();

		vi.clearAllMocks();
		useModeStore.setState({ mode: "timetable" });
		saveDocument();
		expect(saveTimetable).toHaveBeenCalledOnce();
		expect(saveMap).not.toHaveBeenCalled();
	});

	it("does nothing for save or load in operate mode", async () => {
		useModeStore.setState({ mode: "operate" });
		saveDocument();
		await loadDocument();

		expect(saveMap).not.toHaveBeenCalled();
		expect(saveTimetable).not.toHaveBeenCalled();
		expect(applyLoadedMap).not.toHaveBeenCalled();
		expect(loadTimetable).not.toHaveBeenCalled();
		expect(pickAndReadDocuments).not.toHaveBeenCalled();
	});
});
