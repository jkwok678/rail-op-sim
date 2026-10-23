/**
 * Where the timetable list keys land, decided from the document alone.
 *
 * The hotkey hook applies the result; keeping the choice here — pure, no store
 * — means the wrap-around and "skip the row you are already on" rules can be
 * tested without a keyboard.
 */

/** A problem, addressed the way {@link TimetableIssue} addresses one. */
export interface IssuePlace {
	serviceRef?: string;
	/** Absent when the problem is the service itself, not one of its actions. */
	actionIndex?: number;
}

/** The service and action a list key should select. */
export interface NavTarget {
	serviceRef: string | null;
	actionIndex: number | null;
}

/**
 * The service `[` or `]` should select.
 *
 * Wraps, so a timetable is a loop rather than a dead end. One service that is
 * already selected has nowhere to go; one that is not selected is where either
 * key lands. A selection that names a service no longer in the list is treated
 * as no selection.
 */
export function stepService(
	refs: readonly string[],
	selected: string | null,
	direction: 1 | -1,
): string | null {
	if (refs.length === 0) return null;
	const index = selected === null ? -1 : refs.indexOf(selected);
	if (index === -1) return direction === 1 ? refs[0] : refs[refs.length - 1];
	if (refs.length === 1) return null;
	return refs[(index + direction + refs.length) % refs.length];
}

/**
 * The next problem `N` should open.
 *
 * Scoped to the selected service, because that is the list the issue panel is
 * showing. With nothing selected, the whole timetable is in play and the key
 * may change service. Problems that share the current row are skipped, and the
 * search continues past the end back to the top.
 */
export function nextIssueTarget(
	issues: readonly IssuePlace[],
	selectedService: string | null,
	selectedAction: number | null,
): NavTarget | null {
	const scoped =
		selectedService === null
			? issues
			: issues.filter((issue) => issue.serviceRef === selectedService);
	if (scoped.length === 0) return null;

	const here = (issue: IssuePlace): boolean =>
		(issue.serviceRef ?? null) === selectedService &&
		(issue.actionIndex ?? null) === selectedAction;

	// Prefer a problem further down the service. Falling off the end wraps.
	const later = scoped.find((issue) => {
		if (here(issue)) return false;
		if (selectedService !== null && issue.serviceRef === selectedService) {
			const at = issue.actionIndex ?? -1;
			return selectedAction === null || at > selectedAction;
		}
		return true;
	});
	const chosen = later ?? scoped.find((issue) => !here(issue));
	if (!chosen) return null;
	return {
		serviceRef: chosen.serviceRef ?? null,
		actionIndex: chosen.actionIndex ?? null,
	};
}

/**
 * The index Alt+Up / Alt+Down should move the selected action to.
 *
 * Null at either end, and when no action is selected: the buttons are disabled
 * there, and the key must refuse the same move.
 */
export function moveActionTo(
	count: number,
	index: number | null,
	direction: -1 | 1,
): number | null {
	if (index === null) return null;
	const to = index + direction;
	if (to < 0 || to >= count) return null;
	return to;
}
