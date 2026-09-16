import type { AddKind, PendingText, Tool } from "#/store/editor-store";

/**
 * What Escape should do, decided from the editor state alone.
 *
 * Escape is one global binding rather than a handler per panel, because "what
 * does Escape cancel right now" is a single ordered question and several
 * competing listeners would answer it in whatever order they happened to mount.
 * Keeping the decision here — pure, no store and no pixi — makes that order
 * testable.
 */
export type EscapeAction =
	| { type: "none" }
	| { type: "cancelSection" }
	| { type: "cancelDirection" }
	| { type: "paletteBack" }
	| { type: "resetTool" };

/** The slice of editor state the cascade reads. */
export interface EscapeContext {
	tool: Tool;
	selectedKind: AddKind | null;
	pendingText: PendingText | null;
	pendingNameTarget: unknown | null;
	showShortcuts: boolean;
	sectionStart: { gx: number; gy: number } | null;
	directionStart: { gx: number; gy: number } | null;
}

/**
 * Resolve Escape against the current state, innermost thing first.
 *
 * An open dialog yields: Radix already dismisses it from a capture-phase
 * listener, and cancelling the tool underneath at the same time would undo work
 * the user never meant to touch.
 */
export function resolveEscape(ctx: EscapeContext): EscapeAction {
	if (ctx.pendingText || ctx.pendingNameTarget || ctx.showShortcuts) {
		return { type: "none" };
	}
	if (ctx.sectionStart) return { type: "cancelSection" };
	if (ctx.directionStart) return { type: "cancelDirection" };
	if (ctx.tool === "add" && ctx.selectedKind) return { type: "paletteBack" };
	if (ctx.tool !== "select") return { type: "resetTool" };
	return { type: "none" };
}
