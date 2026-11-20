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
	editDialogOpen: false,
	shortcutsOpen: false,
	timetableCanStep: false,
	timetableCanMoveUp: false,
	timetableCanMoveDown: false,
	timetableCanNextIssue: false,
	timetablePicking: false,
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

	it("leaves a gated mode's key live so the refusal reaches the notice", () => {
		const live = liveShortcuts(state());
		expect(live.modeTimetable).toBe(true);
		expect(live.modeOperate).toBe(true);
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

	it("offers the timetable list keys only while editing a timetable", () => {
		const ready = {
			timetableCanStep: true,
			timetableCanMoveUp: true,
			timetableCanMoveDown: true,
			timetableCanNextIssue: true,
		};
		const railway = liveShortcuts(state(ready));
		expect(railway.prevService).toBe(false);
		expect(railway.nextService).toBe(false);
		expect(railway.nextIssue).toBe(false);
		expect(railway.moveActionUp).toBe(false);
		expect(railway.moveActionDown).toBe(false);

		const timetable = liveShortcuts(state({ mode: "timetable", ...ready }));
		expect(timetable.prevService).toBe(true);
		expect(timetable.nextService).toBe(true);
		expect(timetable.nextIssue).toBe(true);
		expect(timetable.moveActionUp).toBe(true);
		expect(timetable.moveActionDown).toBe(true);
	});

	it("follows each list key's own availability", () => {
		const live = liveShortcuts(state({ mode: "timetable" }));
		expect(live.prevService).toBe(false);
		expect(live.nextIssue).toBe(false);
		expect(live.moveActionUp).toBe(false);
		expect(live.moveActionDown).toBe(false);
	});

	it("holds the timetable list keys during a cell pick and behind the overlay", () => {
		const ready = {
			mode: "timetable" as const,
			timetableCanStep: true,
			timetableCanMoveUp: true,
			timetableCanMoveDown: true,
			timetableCanNextIssue: true,
		};
		expect(
			liveShortcuts(state({ ...ready, timetablePicking: true })).nextService,
		).toBe(false);
		expect(
			liveShortcuts(state({ ...ready, shortcutsOpen: true })).moveActionDown,
		).toBe(false);
	});
});

describe("liveShortcuts — operate mode", () => {
	const operateKeys = [
		"operateRunPause",
		"operateSlower",
		"operateFaster",
		"routeAuto",
		"routeAutoAll",
		"routePreferred",
		"routeUnrestricted",
		"routeCancel",
		"operateLog",
	] as const;

	it("arms the signalling keys only in operate mode", () => {
		const operating = liveShortcuts(state({ mode: "operate" }));
		const editing = liveShortcuts(state());
		for (const id of operateKeys) {
			expect(operating[id], id).toBe(true);
			expect(editing[id], id).toBe(false);
		}
	});

	it("leaves the railway tools and undo dead while operating", () => {
		const live = liveShortcuts(state({ mode: "operate" }));
		expect(live.toolAdd).toBe(false);
		expect(live.undo).toBe(false);
	});

	it("kills the keys for the other modes while operating", () => {
		const live = liveShortcuts(state({ mode: "operate" }));
		expect(live.modeRailway).toBe(false);
		expect(live.modeTimetable).toBe(false);
		const editing = liveShortcuts(state({ mode: "timetable" }));
		expect(editing.modeRailway).toBe(true);
		expect(editing.modeOperate).toBe(true);
	});

	it("disables save and load while operating", () => {
		const operating = liveShortcuts(state({ mode: "operate" }));
		expect(operating.save).toBe(false);
		expect(operating.load).toBe(false);

		for (const mode of ["railway", "timetable"] as const) {
			const editing = liveShortcuts(state({ mode }));
			expect(editing.save, mode).toBe(true);
			expect(editing.load, mode).toBe(true);
		}
	});

	it("keeps operate keys quiet behind an overlay or open train dialog", () => {
		const live = liveShortcuts(state({ mode: "operate", shortcutsOpen: true }));
		expect(live.operateRunPause).toBe(false);
		const dialog = liveShortcuts(
			state({ mode: "operate", trainDialogOpen: true }),
		);
		expect(dialog.operateRunPause).toBe(false);
		expect(dialog.help).toBe(false);
		expect(dialog.escape).toBe(true);
	});
});
