// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NewDocumentControl } from "#/components/sim/NewDocumentControl";
import { clearTimetable, newRailway } from "#/lib/documentActions";
import { useModeStore } from "#/store/mode-store";

vi.mock("#/lib/documentActions", () => ({
	newRailway: vi.fn(),
	clearTimetable: vi.fn(),
}));

describe("NewDocumentControl", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		useModeStore.setState({ mode: "railway" });
	});

	it("asks before starting a new railway", () => {
		render(<NewDocumentControl />);
		fireEvent.click(screen.getByRole("button", { name: "New railway" }));
		expect(newRailway).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole("button", { name: "Start new railway" }));
		expect(newRailway).toHaveBeenCalledOnce();
		expect(clearTimetable).not.toHaveBeenCalled();
	});

	it("does nothing when cancelled", () => {
		render(<NewDocumentControl />);
		fireEvent.click(screen.getByRole("button", { name: "New railway" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(newRailway).not.toHaveBeenCalled();
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("clears only the timetable in timetable mode", () => {
		useModeStore.setState({ mode: "timetable" });
		render(<NewDocumentControl />);
		fireEvent.click(screen.getByRole("button", { name: "Clear timetable" }));
		fireEvent.click(
			screen.getByRole("button", { name: "Remove all services" }),
		);
		expect(clearTimetable).toHaveBeenCalledOnce();
		expect(newRailway).not.toHaveBeenCalled();
	});

	it("is hidden while operating", () => {
		useModeStore.setState({ mode: "operate" });
		render(<NewDocumentControl />);
		expect(screen.queryByRole("button")).toBeNull();
	});
});
