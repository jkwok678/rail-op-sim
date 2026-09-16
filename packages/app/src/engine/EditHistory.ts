import type { EffectEntry } from "@rail-op-sim/shared";

/** Undo depth. Older steps fall off the bottom of the stack. */
export const DEFAULT_HISTORY_LIMIT = 100;

/**
 * Which render layers a command's changes affect.
 *
 * Only the track layer has genuine targeted update paths, and even those cannot
 * express the Set/Unset sprite swaps that naming and portal pairing cause, so
 * these are full re-syncs. A command records the same set the forward edit
 * already refreshed, and undo and redo both replay it.
 */
export interface RefreshFlags {
	track?: boolean;
	element?: boolean;
	text?: boolean;
	direction?: boolean;
	linkHighlight?: boolean;
	trackColor?: boolean;
	/** Recompute the connectivity summary the toolbar and footer read. */
	status?: boolean;
}

/** One undoable edit: what it was called, what it changed, what to redraw. */
export interface EditCommand {
	/** User-facing, lowercase-able for tooltips — e.g. "Add platform". */
	label: string;
	entries: EffectEntry[];
	refresh: RefreshFlags;
}

/** Plain-data view of the stack, for mirroring into the store. */
export interface HistoryState {
	canUndo: boolean;
	canRedo: boolean;
	/** Name of the action undo would reverse, or null when there is none. */
	undoLabel: string | null;
	/** Name of the action redo would re-apply, or null when there is none. */
	redoLabel: string | null;
}

/**
 * Undo/redo stack of recorded edits.
 *
 * Holds no model state of its own — a command carries the journal entries that
 * invert it, so the history is O(size of each edit) rather than O(size of the
 * map). Pure data and logic, deliberately free of pixi and of the map itself,
 * so it can be unit-tested on its own.
 */
export class EditHistory {
	private past: EditCommand[] = [];
	private future: EditCommand[] = [];

	constructor(private readonly limit: number = DEFAULT_HISTORY_LIMIT) {}

	/** Record a new edit, which invalidates any redo branch. */
	push(command: EditCommand): void {
		this.past.push(command);
		if (this.past.length > this.limit) this.past.shift();
		this.future = [];
	}

	/** Take the most recent edit off the undo stack, or null if there is none. */
	undo(): EditCommand | null {
		const command = this.past.pop();
		if (!command) return null;
		this.future.push(command);
		return command;
	}

	/** Take the most recently undone edit back off the redo stack. */
	redo(): EditCommand | null {
		const command = this.future.pop();
		if (!command) return null;
		this.past.push(command);
		return command;
	}

	/**
	 * Drop all history. Used when a file load replaces the document: clearAll is
	 * not invertible from a delta, and the steps that built the previous map are
	 * not reachable from the new one.
	 */
	clear(): void {
		this.past = [];
		this.future = [];
	}

	getState(): HistoryState {
		return {
			canUndo: this.past.length > 0,
			canRedo: this.future.length > 0,
			undoLabel: this.past[this.past.length - 1]?.label ?? null,
			redoLabel: this.future[this.future.length - 1]?.label ?? null,
		};
	}
}
