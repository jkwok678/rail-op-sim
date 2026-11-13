import { afterEach, describe, expect, it, vi } from "vitest";
import { loadTimetableDocument } from "#/lib/documentActions";
import { loadTimetable } from "#/lib/timetableActions";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

vi.mock("#/lib/timetableActions", () => ({
	loadTimetable: vi.fn(),
	saveTimetable: vi.fn(),
}));

const mockLoadTimetable = vi.mocked(loadTimetable);

describe("loadTimetableDocument", () => {
	afterEach(() => {
		vi.clearAllMocks();
		useModeStore.setState({ mode: "railway" });
		useTimetableStore.setState({ loadError: null });
	});

	it("records a rejected file's error in the timetable store", async () => {
		mockLoadTimetable.mockResolvedValue("That file is not a timetable.");
		await loadTimetableDocument();
		expect(useTimetableStore.getState().loadError).toBe(
			"That file is not a timetable.",
		);
	});

	it("clears any previous loadError on success or cancel", async () => {
		useTimetableStore.setState({ loadError: "Previous error" });
		mockLoadTimetable.mockResolvedValue(null);
		await loadTimetableDocument();
		expect(useTimetableStore.getState().loadError).toBeNull();
	});
});
