import { createEmptyTimetable, parseSimTime } from "@rail-op-sim/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadTimetable } from "#/lib/timetableActions";
import { pickAndReadTimetableFile } from "#/lib/timetableFile";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";
import { defined } from "./test-helpers";

vi.mock("#/lib/timetableFile", () => ({
	downloadTimetable: vi.fn(),
	pickAndReadTimetableFile: vi.fn(),
}));

const pick = vi.mocked(pickAndReadTimetableFile);

describe("loadTimetable", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		pick.mockReset();
		useTimetableStore.setState({ timetable: createEmptyTimetable() });
		useEditorStore.setState({ saveFormat: "json" });
	});

	it("replaces the timetable and remembers the file's encoding", async () => {
		const loaded = createEmptyTimetable(parseSimTime("04:30"));
		pick.mockResolvedValue({ data: loaded, format: "yaml" });

		expect(await loadTimetable()).toBeNull();
		expect(useTimetableStore.getState().timetable.startTime).toBe(
			parseSimTime("04:30"),
		);
		expect(useEditorStore.getState().saveFormat).toBe("yaml");
	});

	it("leaves everything alone when the picker is cancelled", async () => {
		pick.mockResolvedValue(null);
		const before = useTimetableStore.getState().timetable;

		expect(await loadTimetable()).toBeNull();
		expect(useTimetableStore.getState().timetable).toBe(before);
	});

	it("hands back why a file was rejected, without replacing anything", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		pick.mockRejectedValue(new Error("Unsupported timetable version: 9"));
		const before = useTimetableStore.getState().timetable;

		expect(await loadTimetable()).toBe("Unsupported timetable version: 9");
		expect(useTimetableStore.getState().timetable).toBe(before);
	});

	it("has a message even for a rejection that is not an Error", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		pick.mockRejectedValue("nope");
		expect(await loadTimetable()).toBe("That file is not a timetable.");
	});

	it("says why a loaded timetable cannot be operated", async () => {
		const service = { ref: "1A01", actions: [] };
		pick.mockResolvedValue({
			data: { ...createEmptyTimetable(), services: [service, service] },
			format: "json",
		});

		const message = await loadTimetable();
		expect(message).toContain("Operate is unavailable");
		const first = defined(useTimetableStore.getState().issues[0], "issues[0]");
		expect(message).toContain(first.message);
	});
});
