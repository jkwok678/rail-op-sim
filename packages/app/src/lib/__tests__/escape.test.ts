import { describe, expect, it } from "vitest";
import { type EscapeContext, resolveEscape } from "#/lib/escape";

const base: EscapeContext = {
	tool: "select",
	selectedKind: null,
	pendingText: null,
	pendingNameTarget: null,
	showShortcuts: false,
	sectionStart: null,
	directionStart: null,
	timetableCellPick: null,
};

const at = (over: Partial<EscapeContext>): EscapeContext => ({
	...base,
	...over,
});

describe("resolveEscape", () => {
	it("does nothing when there is nothing to cancel", () => {
		expect(resolveEscape(base)).toEqual({ type: "none" });
	});

	describe("yields to an open dialog, which Radix already dismisses", () => {
		const cases: [string, Partial<EscapeContext>][] = [
			["the text dialog", { pendingText: { mode: "place", x: 0, y: 0 } }],
			[
				"the name dialog",
				{ pendingNameTarget: { gx: 1, gy: 1, kind: "platform" } },
			],
			["the shortcuts overlay", { showShortcuts: true }],
		];
		for (const [name, over] of cases) {
			it(name, () => {
				// Even with work underneath that Escape would otherwise cancel — the
				// dialog is what the user means, and cancelling both would throw away
				// a selection they never touched.
				const ctx = at({
					...over,
					tool: "section",
					sectionStart: { gx: 2, gy: 3 },
				});
				expect(resolveEscape(ctx)).toEqual({ type: "none" });
			});
		}
	});

	it("cancels an armed map pick before anything else", () => {
		// The canvas is waiting for one specific click; everything underneath
		// can wait its turn.
		const ctx = at({
			timetableCellPick: { serviceRef: "1A01", actionIndex: 0, field: "rear" },
			tool: "section",
			sectionStart: { gx: 2, gy: 3 },
		});
		expect(resolveEscape(ctx)).toEqual({ type: "cancelCellPick" });
	});

	it("cancels a section selection before anything else", () => {
		const ctx = at({
			tool: "section",
			sectionStart: { gx: 2, gy: 3 },
			directionStart: { gx: 4, gy: 5 },
		});
		expect(resolveEscape(ctx)).toEqual({ type: "cancelSection" });
	});

	it("cancels a half-drawn direction", () => {
		const ctx = at({ tool: "direction", directionStart: { gx: 4, gy: 5 } });
		expect(resolveEscape(ctx)).toEqual({ type: "cancelDirection" });
	});

	it("steps back to the palette categories before leaving the add tool", () => {
		const ctx = at({ tool: "add", selectedKind: "straight" });
		expect(resolveEscape(ctx)).toEqual({ type: "paletteBack" });
	});

	it("leaves the add tool once the palette is already at its categories", () => {
		expect(resolveEscape(at({ tool: "add" }))).toEqual({ type: "resetTool" });
	});

	it("returns any other tool to select", () => {
		expect(resolveEscape(at({ tool: "link" }))).toEqual({ type: "resetTool" });
		expect(resolveEscape(at({ tool: "text" }))).toEqual({ type: "resetTool" });
	});

	it("stops at select rather than cycling", () => {
		expect(resolveEscape(at({ tool: "select" }))).toEqual({ type: "none" });
	});

	it("closes an open train menu before cancelling routes, and yields to open train dialogs", () => {
		expect(
			resolveEscape(
				at({
					operateTrainMenuOpen: true,
					operateRouteStart: { gx: 1, gy: 0 },
				}),
			),
		).toEqual({ type: "closeTrainMenu" });
		expect(
			resolveEscape(
				at({
					operateTrainDialogOpen: true,
					operateTrainMenuOpen: true,
				}),
			),
		).toEqual({ type: "none" });
	});
});
