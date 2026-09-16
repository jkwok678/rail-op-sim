// ============================================================================
// Effect journal — records primitive mutations so an edit can be inverted
// ============================================================================

/**
 * One recorded state change, with both directions of travel.
 *
 * Entries hold closures over the live objects they mutated rather than
 * coordinates, because every structural relationship in this package is an
 * object reference: `Track.otherLinkedTrack`, `Track.linkedNamedLocation`, and
 * a `Text` shared by reference across many elements. Restoring the original
 * objects is what makes those references valid again — re-running a
 * constructor would mint a new object and leave every other holder pointing at
 * the dead one. The cost is that an entry pins whatever it captured in memory
 * until its command falls off the history cap; don't "fix" that by storing
 * coordinates instead.
 *
 * The journal is in-memory only and never serialized, so closures are safe here
 * in a way they would not be for a save file.
 */
export interface EffectEntry {
	/** Primitive that produced this entry, for debugging. Not user-facing. */
	readonly kind: string;
	/** Put the model back the way it was before this change. */
	undo(): void;
	/** Re-apply this change. */
	redo(): void;
}

let entries: EffectEntry[] | null = null;
let suspended = false;

/**
 * Start a recording window. Mutations made until {@link endRecording} are
 * captured as invertible entries.
 *
 * Throws if a window is already open: windows are not nestable, and silently
 * merging two edits into one command would produce an undo step that reverses
 * more than the user did.
 */
export function beginRecording(): void {
	if (entries !== null) {
		throw new Error(
			"effect-journal: recording already in progress — windows cannot nest",
		);
	}
	entries = [];
}

/** Close the recording window and return what was captured, oldest first. */
export function endRecording(): EffectEntry[] {
	const recorded = entries ?? [];
	entries = null;
	return recorded;
}

/** True while a recording window is open and not suspended. */
export function isRecording(): boolean {
	return entries !== null && !suspended;
}

/**
 * Append an entry. A no-op when no window is open, which is every code path
 * outside an undoable edit — so instrumenting a primitive costs one boolean
 * check in the common case.
 */
export function record(kind: string, undo: () => void, redo: () => void): void {
	if (entries === null || suspended) return;
	entries.push({ kind, undo, redo });
}

/**
 * Record a field change, skipping no-ops.
 *
 * Several setters in this package are silently ignored for the wrong kind of
 * track (the secondary speed/length pair) or are called with the value already
 * in place. Comparing before and after keeps those off the journal, which is
 * what lets an edit that changed nothing push no command at all.
 */
export function recordField<T>(
	kind: string,
	prev: T,
	next: T,
	set: (value: T) => void,
): void {
	if (entries === null || suspended || Object.is(prev, next)) return;
	entries.push({
		kind,
		undo: () => set(prev),
		redo: () => set(next),
	});
}

/**
 * Run `fn` with recording paused. Replay mutates the model through the same
 * instrumented primitives, so without this an undo would record its own
 * inverse into whatever window happened to be open.
 */
function withoutRecording(fn: () => void): void {
	const wasSuspended = suspended;
	suspended = true;
	try {
		fn();
	} finally {
		suspended = wasSuspended;
	}
}

/** Minimal view of Map_ needed for replay, to keep this module dependency-free. */
interface ReplayTarget {
	deferPreferredDirectionRevalidation(fn: () => void): void;
	makeTrackList(): void;
}

/**
 * Apply the inverse of each entry, newest first.
 *
 * The whole replay runs inside `deferPreferredDirectionRevalidation` because
 * restoring a track is a topology change: left to itself it would trigger a
 * prune pass that deletes the very preferred directions the remaining entries
 * are about to put back. One pass at the end judges the finished map instead.
 */
export function undoEntries(map: ReplayTarget, recorded: EffectEntry[]): void {
	withoutRecording(() => {
		map.deferPreferredDirectionRevalidation(() => {
			for (let i = recorded.length - 1; i >= 0; i--) recorded[i].undo();
		});
		// trackList is a derived cache that goes stale on every add or delete.
		map.makeTrackList();
	});
}

/** Re-apply each entry in the order it was recorded. */
export function redoEntries(map: ReplayTarget, recorded: EffectEntry[]): void {
	withoutRecording(() => {
		map.deferPreferredDirectionRevalidation(() => {
			for (const entry of recorded) entry.redo();
		});
		map.makeTrackList();
	});
}
