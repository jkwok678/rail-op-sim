// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SettingsMenu } from "#/components/sim/SettingsMenu";
import { useEditorStore } from "#/store/editor-store";

describe("SettingsMenu", () => {
	beforeEach(() => useEditorStore.setState({ saveFormat: "json" }));
	afterEach(cleanup);

	it("lets the user pick YAML as the save encoding", () => {
		render(<SettingsMenu />);
		fireEvent.click(screen.getByRole("button", { name: "Settings" }));
		fireEvent.click(screen.getByRole("menuitemradio", { name: "YAML" }));
		expect(useEditorStore.getState().saveFormat).toBe("yaml");
	});
});
