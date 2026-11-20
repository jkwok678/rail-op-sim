// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsMenu } from "#/components/sim/SettingsMenu";
import { useEditorStore } from "#/store/editor-store";

describe("SettingsMenu", () => {
	beforeEach(() =>
		useEditorStore.setState({
			saveFormat: "json",
			showTrackInfo: false,
			showTrainInfo: false,
			showTrainTimetable: false,
		}),
	);
	afterEach(cleanup);

	it("lets the user pick YAML as the save encoding", () => {
		render(<SettingsMenu />);
		fireEvent.click(screen.getByRole("button", { name: "Settings" }));
		fireEvent.click(screen.getByRole("menuitemradio", { name: "YAML" }));
		expect(useEditorStore.getState().saveFormat).toBe("yaml");
	});

	it("toggles Show track info, Show train info, and Show train timetable", () => {
		render(<SettingsMenu />);
		fireEvent.click(screen.getByRole("button", { name: "Settings" }));

		fireEvent.click(
			screen.getByRole("menuitemcheckbox", { name: /Show track info/ }),
		);
		expect(useEditorStore.getState().showTrackInfo).toBe(true);

		fireEvent.click(
			screen.getByRole("menuitemcheckbox", { name: /Show train info/ }),
		);
		expect(useEditorStore.getState().showTrainInfo).toBe(true);

		fireEvent.click(
			screen.getByRole("menuitemcheckbox", { name: /Show train timetable/ }),
		);
		expect(useEditorStore.getState().showTrainTimetable).toBe(true);
	});
});
