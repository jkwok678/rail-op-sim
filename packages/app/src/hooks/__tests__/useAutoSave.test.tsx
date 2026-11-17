// @vitest-environment jsdom
import { createEmptyTimetable, parseSimTime } from "@rail-op-sim/shared";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTOSAVE_DEBOUNCE_MS, useAutoSave } from "#/hooks/useAutoSave";
import { autosaveNow, restoreAutosave } from "#/lib/sessionActions";
import { useEditorStore } from "#/store/editor-store";
import { useTimetableStore } from "#/store/timetable-store";

vi.mock("#/lib/sessionActions", () => ({
	autosaveNow: vi.fn(),
	restoreAutosave: vi.fn(),
}));

const save = vi.mocked(autosaveNow);
const restore = vi.mocked(restoreAutosave);

function Harness({ ready }: { ready: boolean }) {
	useAutoSave(ready);
	return null;
}

const editTimetable = () =>
	act(() => {
		useTimetableStore.setState({
			timetable: createEmptyTimetable(parseSimTime("06:00")),
		});
	});

describe("useAutoSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		save.mockResolvedValue(true);
		restore.mockResolvedValue(true);
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		vi.clearAllMocks();
		useTimetableStore.setState({ timetable: createEmptyTimetable() });
		useEditorStore.setState({
			autosave: { lastSavedAt: null, error: false },
			saveFormat: "json",
		});
	});

	it("does nothing until ready", async () => {
		render(<Harness ready={false} />);
		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2);
		expect(restore).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
	});

	it("does not save before the restore has finished", async () => {
		let finish: (restored: boolean) => void = () => {};
		restore.mockReturnValue(new Promise((resolve) => (finish = resolve)));
		render(<Harness ready />);

		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2);
		expect(save).not.toHaveBeenCalled();

		await act(async () => finish(true));
	});

	it("saves a timetable edit after the debounce", async () => {
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS - 1);
		expect(save).not.toHaveBeenCalled();
		await vi.advanceTimersByTimeAsync(1);
		expect(save).toHaveBeenCalledTimes(1);
		expect(useEditorStore.getState().autosave.lastSavedAt).not.toBeNull();
		expect(useEditorStore.getState().autosave.error).toBe(false);
	});

	it("saves after a map change", async () => {
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		act(() => {
			useEditorStore.getState().setHistoryState({
				canUndo: true,
				canRedo: false,
				undoLabel: "x",
				redoLabel: null,
			});
		});
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("flushes a pending save on pagehide", async () => {
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		editTimetable();
		expect(save).not.toHaveBeenCalled();
		act(() => {
			window.dispatchEvent(new Event("pagehide"));
		});
		await vi.advanceTimersByTimeAsync(0);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("flags a failed save", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		save.mockRejectedValue(new Error("quota"));
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(useEditorStore.getState().autosave.error).toBe(true);
	});

	it("saves a save-format change on its own", async () => {
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		act(() => {
			useEditorStore.getState().setSaveFormat("yaml");
		});
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("flags a save that had no storage to write to", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		save.mockResolvedValue(false);
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(useEditorStore.getState().autosave).toEqual({
			lastSavedAt: null,
			error: true,
		});
	});

	it("retries a failed save when the page is hidden", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		save.mockRejectedValueOnce(new Error("quota"));
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(0);

		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(save).toHaveBeenCalledTimes(1);

		act(() => {
			window.dispatchEvent(new Event("pagehide"));
		});
		await vi.advanceTimersByTimeAsync(0);
		expect(save).toHaveBeenCalledTimes(2);
		expect(useEditorStore.getState().autosave.error).toBe(false);
	});

	it("keeps and saves an edit made while the restore was reading", async () => {
		let finish: (restored: boolean) => void = () => {};
		restore.mockReturnValue(new Promise((resolve) => (finish = resolve)));
		render(<Harness ready />);
		const shouldApply = restore.mock.calls[0]?.[0];
		expect(shouldApply?.()).toBe(true);

		editTimetable();
		expect(shouldApply?.()).toBe(false);
		await act(async () => finish(false));

		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("does not save straight after a successful restore", async () => {
		render(<Harness ready />);
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2);
		expect(save).not.toHaveBeenCalled();
	});

	it("stops watching once unmounted, even mid-restore", async () => {
		let finish: (restored: boolean) => void = () => {};
		restore.mockReturnValue(new Promise((resolve) => (finish = resolve)));
		const view = render(<Harness ready />);
		view.unmount();
		await act(async () => finish(true));

		editTimetable();
		await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS * 2);
		expect(save).not.toHaveBeenCalled();
	});
});
