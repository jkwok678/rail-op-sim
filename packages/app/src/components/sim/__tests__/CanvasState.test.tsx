// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasState } from "#/components/sim/CanvasState";

afterEach(cleanup);

describe("CanvasState", () => {
	it("shows a spinner while loading", () => {
		render(<CanvasState variant="loading" />);
		expect(screen.getByRole("status", { name: "Loading the canvas" }));
		expect(screen.getByText("Loading the canvas…")).toBeTruthy();
	});

	it("explains a failed start, with the reason and a reload button", () => {
		const reload = vi.fn();
		vi.stubGlobal("location", { ...window.location, reload });
		render(<CanvasState variant="error" message="no context" />);
		const alert = screen.getByRole("alert");
		expect(alert.textContent).toContain("The canvas could not start");
		expect(alert.textContent).toContain("no context");
		expect(alert.textContent).toContain("WebGL");
		fireEvent.click(screen.getByRole("button", { name: "Reload" }));
		expect(reload).toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it("copes with a failure that has no message", () => {
		render(<CanvasState variant="error" message={null} />);
		expect(screen.getByText("The canvas could not start")).toBeTruthy();
	});

	it("prompts for a first track piece without catching clicks", () => {
		const { container } = render(<CanvasState variant="empty" />);
		expect(screen.getByText("Start your railway")).toBeTruthy();
		expect(screen.getByText(/palette/)).toBeTruthy();
		expect(
			(container.firstElementChild as HTMLElement).classList.contains(
				"pointer-events-none",
			),
		).toBe(true);
	});
});
