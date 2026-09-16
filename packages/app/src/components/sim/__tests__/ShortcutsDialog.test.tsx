// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ShortcutsDialog } from "#/components/sim/ShortcutsDialog";
import { SHORTCUTS, type ShortcutId, shortcutKeys } from "#/lib/shortcuts";
import { useEditorStore } from "#/store/editor-store";

/**
 * The row for a shortcut, found by the label the registry gives it. Scoped to
 * <dt>, because a label can legitimately repeat elsewhere in the dialog — "
 * Keyboard shortcuts" is both the title and the name of the key that opens it.
 */
const rowFor = (id: ShortcutId) => {
	const term = screen
		.getAllByText(SHORTCUTS[id].label)
		.find((el) => el.tagName === "DT");
	if (!term) throw new Error(`no row for ${id}`);
	return term.closest("div") as HTMLElement;
};

const capsIn = (row: HTMLElement) =>
	within(row)
		.queryAllByText((_, el) => el?.getAttribute("data-slot") === "kbd")
		.map((el) => el.textContent);

describe("ShortcutsDialog", () => {
	beforeEach(() => useEditorStore.setState({ showShortcuts: true }));
	afterEach(cleanup);

	// The overlay is generated from the registry rather than hand-maintained, so
	// a shortcut added without a place in the overlay would be a bug in the
	// grouping, not something to remember to update.
	it("lists every shortcut in the registry", () => {
		render(<ShortcutsDialog />);
		for (const id of Object.keys(SHORTCUTS) as ShortcutId[]) {
			expect(rowFor(id), `${id} is missing`).toBeTruthy();
		}
	});

	it("gives a combo one cap per key rather than one wide badge", () => {
		render(<ShortcutsDialog />);
		expect(capsIn(rowFor("redo"))).toEqual(shortcutKeys("redo"));
		expect(capsIn(rowFor("redo")).length).toBeGreaterThan(1);
	});

	it("gives a single key exactly one cap", () => {
		render(<ShortcutsDialog />);
		expect(capsIn(rowFor("toolAdd"))).toEqual(["2"]);
		expect(capsIn(rowFor("help"))).toEqual(["?"]);
	});

	it("stays closed when the store says so", () => {
		useEditorStore.setState({ showShortcuts: false });
		render(<ShortcutsDialog />);
		expect(screen.queryByText("Keyboard shortcuts")).toBeNull();
	});
});
