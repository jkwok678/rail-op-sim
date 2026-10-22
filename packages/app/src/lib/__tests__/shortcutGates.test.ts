import { describe, expect, it } from "vitest";
import { liveShortcuts, type ShortcutGateState } from "#/lib/shortcutGates";

const state = (
	overrides: Partial<ShortcutGateState> = {},
): ShortcutGateState => ({
	mode: "railway",
	tool: "select",
	canUndo: true,
	canRedo: true,
	railwayConnected: true,
	timetableBlocked: false,
	editDialogOpen: false,
	shortcutsOpen: false,
	...overrides,
});

describe("liveShortcuts", () => {
	it("leaves the railway tools live while editing the railway", () => {
		const live = liveShortcuts(state());
		expect(live.toolAdd).toBe(true);
		expect(live.toolDirection).toBe(true);
		expect(live.undo).toBe(true);
		expect(live.toggleGrid).toBe(true);
	});

	it("takes every map edit off the keyboard outside railway mode", () => {
		const live = liveShortcuts(state({ mode: "timetable" }));
		expect(live.toolAdd).toBe(false);
		expect(live.undo).toBe(false);
		expect(live.redo).toBe(false);
		expect(live.modeRailway).toBe(true);
	});

	it("holds back the direction tool until the railway is joined", () => {
		expect(
			liveShortcuts(state({ railwayConnected: false })).toolDirection,
		).toBe(false);
	});

	it("offers erase mode only with the direction tool in hand", () => {
		expect(liveShortcuts(state()).toggleEraseMode).toBe(false);
		expect(liveShortcuts(state({ tool: "direction" })).toggleEraseMode).toBe(
			true,
		);
	});

	it("follows the switcher in refusing an incomplete railway's timetable", () => {
		expect(liveShortcuts(state({ timetableBlocked: true })).modeTimetable).toBe(
			false,
		);
	});

	it("silences single keys behind the shortcuts overlay, except the one that closes it", () => {
		const live = liveShortcuts(state({ shortcutsOpen: true }));
		expect(live.toolAdd).toBe(false);
		expect(live.toggleGrid).toBe(false);
		expect(live.help).toBe(true);
		expect(live.escape).toBe(true);
		expect(live.save).toBe(true);
	});

	it("keeps help closed while the user is typing in a dialog", () => {
		expect(liveShortcuts(state({ editDialogOpen: true })).help).toBe(false);
	});
});
