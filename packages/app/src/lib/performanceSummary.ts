import type { Counters } from "@rail-op-sim/shared";

/**
 * Pure summary of the simulation's performance counters for the operate panel.
 */

export interface EventSummaryRow {
	label: string;
	onTime: number;
	late: number;
	early: number | null;
	lateMins: number;
	earlyMins: number | null;
}

export type IncidentSeverity = "warning" | "error";

export interface IncidentRow {
	label: string;
	value: number;
	severity: IncidentSeverity;
	/** A count of events, or a duration in minutes (shown with `formatMinutes`). */
	unit: "count" | "minutes";
}

export interface PerformanceSummary {
	events: EventSummaryRow[];
	timed: number;
	onTime: number;
	punctuality: number | null;
	incidents: IncidentRow[];
	/**
	 * Distinct incident events: missed events, wrong exits and SPADs. Crashed
	 * trains are left out because the engine counts trains, not events (a
	 * collision adds 2, a level-crossing crash 1), so they get their own
	 * headline part instead.
	 */
	incidentCount: number;
	/** The collapsed one-line scorecard, in display order. */
	headline: HeadlinePart[];
}

/** One `·`-separated item of the collapsed summary line. */
export interface HeadlinePart {
	text: string;
	/** Colour cue; null for neutral. */
	severity: IncidentSeverity | null;
}

/** Summarise raw engine counters into event rows, punctuality and incidents. */
export function summariseCounters(c: Counters): PerformanceSummary {
	const events: EventSummaryRow[] = [
		{
			label: "Arrivals",
			onTime: c.onTimeArrivals,
			late: c.lateArrivals,
			early: c.earlyArrivals,
			lateMins: c.totLateArrMins,
			earlyMins: c.totEarlyArrMins,
		},
		{
			label: "Passes",
			onTime: c.onTimePasses,
			late: c.latePasses,
			early: c.earlyPasses,
			lateMins: c.totLatePassMins,
			earlyMins: c.totEarlyPassMins,
		},
		{
			label: "Departures",
			onTime: c.onTimeDeps,
			late: c.lateDeps,
			early: null,
			lateMins: c.totLateDepMins,
			earlyMins: null,
		},
		{
			label: "Exits",
			onTime: c.onTimeExits,
			late: c.lateExits,
			early: c.earlyExits,
			lateMins: c.totLateExitMins,
			earlyMins: c.totEarlyExitMins,
		},
	];

	let onTime = 0;
	let timed = 0;
	for (const row of events) {
		onTime += row.onTime;
		timed += row.onTime + row.late + (row.early ?? 0);
	}
	const punctuality = timed === 0 ? null : onTime / timed;

	const incidents: IncidentRow[] = [
		{
			label: "Missed stops",
			value: c.missedStops,
			severity: "warning",
			unit: "count",
		},
		{
			label: "Other missed events",
			value: c.otherMissedEvents,
			severity: "warning",
			unit: "count",
		},
		{
			label: "Unexpected exits",
			value: c.unexpectedExits,
			severity: "warning",
			unit: "count",
		},
		{
			label: "Incorrect exits",
			value: c.incorrectExits,
			severity: "warning",
			unit: "count",
		},
		{ label: "SPADs", value: c.spads, severity: "error", unit: "count" },
		{
			label: "Crashed trains",
			value: c.crashedTrains,
			severity: "error",
			unit: "count",
		},
		{
			label: "Excess crossing-down time",
			value: c.excessLcDownMins,
			severity: "warning",
			unit: "minutes",
		},
	];

	const incidentCount =
		c.missedStops +
		c.otherMissedEvents +
		c.unexpectedExits +
		c.incorrectExits +
		c.spads;

	const headline: HeadlinePart[] = [
		{ text: `${formatPunctuality(punctuality)} on time`, severity: null },
		{
			text: `${incidentCount} ${incidentCount === 1 ? "incident" : "incidents"}`,
			severity: c.spads > 0 ? "error" : incidentCount > 0 ? "warning" : null,
		},
	];
	if (c.crashedTrains > 0) {
		headline.push({
			text: `${c.crashedTrains} ${c.crashedTrains === 1 ? "train" : "trains"} crashed`,
			severity: "error",
		});
	}
	const lcText = formatMinutes(c.excessLcDownMins);
	if (lcText !== "0 min") {
		headline.push({
			text: `${lcText} excess crossing time`,
			severity: "warning",
		});
	}

	return {
		events,
		timed,
		onTime,
		punctuality,
		incidents,
		incidentCount,
		headline,
	};
}

/** Format a punctuality fraction as a whole percentage, or "—" before any timed event. */
export function formatPunctuality(p: number | null): string {
	if (p === null) return "—";
	return `${Math.round(p * 100)}%`;
}

/** Format minutes as whole ("12 min") or one decimal ("2.5 min") when fractional. */
export function formatMinutes(m: number): string {
	const rounded = Math.round(m * 10) / 10 || 0;
	return Number.isInteger(rounded)
		? `${rounded} min`
		: `${rounded.toFixed(1)} min`;
}
