// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RailosImportControl } from "#/components/sim/RailosImportControl";
import {
	convertRailosFiles,
	downloadRailosImport,
	openRailosImport,
	pickRailosFiles,
	type RailosImport,
} from "#/lib/railosImport";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

const converted: RailosImport = {
	railway: {
		name: "Line.rly",
		data: {} as never,
		summary: "3 track elements",
	},
	warnings: ["RailOS (1, 2): something odd."],
};

vi.mock("#/lib/railosImport", () => ({
	pickRailosFiles: vi.fn(async () => [
		{ name: "Line.rly", bytes: new ArrayBuffer(0) },
	]),
	convertRailosFiles: vi.fn(() => converted),
	downloadRailosImport: vi.fn(),
	openRailosImport: vi.fn(() => "Timetable loaded with an error"),
	railosDownloadNames: vi.fn((_result, format = "json") => ({
		railway: `Line.railway.${format}`,
	})),
}));

const LABEL = "Import from RailOS (.rly / .ttb)";

async function convert() {
	render(<RailosImportControl />);
	fireEvent.click(screen.getByRole("button", { name: LABEL }));
	fireEvent.click(screen.getByRole("button", { name: "Choose files…" }));
	await screen.findByText(/Line\.railway\./);
}

describe("RailosImportControl", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
		useEditorStore.setState({ saveFormat: "json" });
		useModeStore.setState({ mode: "railway" });
		useTimetableStore.getState().setLoadError(null);
	});

	it("is hidden while operating", () => {
		useModeStore.setState({ mode: "operate" });
		render(<RailosImportControl />);
		expect(screen.queryByRole("button", { name: LABEL })).toBeNull();
	});

	it("shows what was converted and its warnings", async () => {
		await convert();
		expect(pickRailosFiles).toHaveBeenCalledOnce();
		expect(convertRailosFiles).toHaveBeenCalledOnce();
		expect(
			screen.getByText("3 track elements", { exact: false }),
		).toBeDefined();
		expect(screen.getByText("1 warning")).toBeDefined();
	});

	it("downloads the JSON without touching the editor", async () => {
		await convert();
		fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
		expect(downloadRailosImport).toHaveBeenCalledWith(converted, "json");
		expect(openRailosImport).not.toHaveBeenCalled();
	});

	it("switches output format to YAML for download and editor open", async () => {
		await convert();
		fireEvent.click(screen.getByRole("radio", { name: "YAML" }));
		expect(
			screen.getByText(/Line\.railway\.yaml/, { exact: false }),
		).toBeDefined();
		fireEvent.click(screen.getByRole("button", { name: "Download YAML" }));
		expect(downloadRailosImport).toHaveBeenCalledWith(converted, "yaml");

		fireEvent.click(screen.getByRole("button", { name: "Open in editor" }));
		expect(openRailosImport).toHaveBeenCalledWith(converted, "yaml");
	});

	it("defaults to the editor's current save format", async () => {
		useEditorStore.setState({ saveFormat: "yaml" });
		await convert();
		expect(
			(screen.getByRole("radio", { name: "YAML" }) as HTMLInputElement).checked,
		).toBe(true);
		expect(screen.getByRole("button", { name: "Download YAML" })).toBeDefined();
	});

	it("opens the result in the editor and surfaces the load message", async () => {
		await convert();
		fireEvent.click(screen.getByRole("button", { name: "Open in editor" }));
		expect(openRailosImport).toHaveBeenCalledWith(converted, "json");
		expect(useTimetableStore.getState().loadError).toBe(
			"Timetable loaded with an error",
		);
	});

	it("shows why a pick was refused", async () => {
		vi.mocked(convertRailosFiles).mockImplementationOnce(() => {
			throw new Error(
				"Pick one .rly railway, one .ttb timetable, or one of each.",
			);
		});
		render(<RailosImportControl />);
		fireEvent.click(screen.getByRole("button", { name: LABEL }));
		fireEvent.click(screen.getByRole("button", { name: "Choose files…" }));
		expect((await screen.findByRole("alert")).textContent).toMatch(/Pick one/);
	});
});
