// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "#/components/ErrorBoundary";
import { PanelCrash } from "#/components/PanelCrash";

let broken = true;
function Bomb() {
	if (broken) throw new Error("kaboom");
	return <p>all well</p>;
}

const guarded = (
	<ErrorBoundary
		name="The bomb"
		fallback={({ error, reset }) => (
			<PanelCrash name="The bomb" error={error} reset={reset} />
		)}
	>
		<Bomb />
	</ErrorBoundary>
);

beforeEach(() => {
	broken = true;
	// React and the boundary both log the caught error; keep the output clean.
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
	it("shows the fallback instead of the crashed children", () => {
		render(guarded);
		const alert = screen.getByRole("alert");
		expect(alert.textContent).toContain("The bomb stopped working");
		expect(alert.textContent).toContain("kaboom");
		expect(screen.queryByText("all well")).toBeNull();
	});

	it("logs what crashed", () => {
		render(guarded);
		expect(console.error).toHaveBeenCalledWith(
			"The bomb crashed",
			expect.any(Error),
			expect.any(String),
		);
	});

	it("remounts the children when reset", () => {
		render(guarded);
		broken = false;
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(screen.getByText("all well")).toBeTruthy();
		expect(screen.queryByRole("alert")).toBeNull();
	});

	it("leaves a sibling outside the boundary untouched", () => {
		render(
			<>
				<p>sibling</p>
				{guarded}
			</>,
		);
		expect(screen.getByText("sibling")).toBeTruthy();
		expect(screen.getByRole("alert")).toBeTruthy();
	});

	it("renders nothing for a null fallback", () => {
		const { container } = render(
			<ErrorBoundary name="Quiet" fallback={() => null}>
				<Bomb />
			</ErrorBoundary>,
		);
		expect(container.textContent).toBe("");
	});
});
