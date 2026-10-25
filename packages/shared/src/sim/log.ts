/**
 * The performance log and the counters it feeds, after RailOS's `LogAction`
 * and `LogActionError` (OPERATE-MODE §10).
 *
 * Every line starts with the timetable clock. Lateness is whole minutes,
 * truncated toward zero — 59 seconds late is on time.
 */

import { formatSimTime } from "../railway/timetable/time";
import type { Counters, LogLevel, LogLine } from "./types";

function clockText(time: number): string {
	return formatSimTime(time, true);
}

/** Whole minutes late (positive) or early (negative), truncated toward zero. */
function minutesLate(now: number, booked: number): number {
	return Math.trunc((now - booked) / 60);
}

/** RailOS's lateness suffix: " on time", " 1 minute late", " 3 minutes early". */
function latenessText(mins: number): string {
	if (mins === 0) return " on time";
	const n = Math.abs(mins);
	const unit = n === 1 ? "minute" : "minutes";
	return ` ${n} ${unit} ${mins > 0 ? "late" : "early"}`;
}

type TimedKind = "arrival" | "pass" | "departure" | "exit";

/** The counters each kind of timed event feeds. */
const COUNTED: Record<
	TimedKind,
	{
		onTime: keyof Counters;
		late: keyof Counters;
		early: keyof Counters;
		lateMins: keyof Counters;
		earlyMins: keyof Counters | null;
	}
> = {
	arrival: {
		onTime: "onTimeArrivals",
		late: "lateArrivals",
		early: "earlyArrivals",
		lateMins: "totLateArrMins",
		earlyMins: "totEarlyArrMins",
	},
	pass: {
		onTime: "onTimePasses",
		late: "latePasses",
		early: "earlyPasses",
		lateMins: "totLatePassMins",
		earlyMins: "totEarlyPassMins",
	},
	// A train cannot leave early, so an early departure counts as on time.
	departure: {
		onTime: "onTimeDeps",
		late: "lateDeps",
		early: "onTimeDeps",
		lateMins: "totLateDepMins",
		earlyMins: null,
	},
	exit: {
		onTime: "onTimeExits",
		late: "lateExits",
		early: "earlyExits",
		lateMins: "totLateExitMins",
		earlyMins: "totEarlyExitMins",
	},
};

export class PerformanceLog {
	readonly lines: LogLine[] = [];

	constructor(private readonly counters: Counters) {}

	private add(time: number, level: LogLevel, text: string): void {
		const prefix =
			level === "error" ? " ERROR:" : level === "warning" ? " WARNING:" : ":";
		this.lines.push({
			time,
			level,
			text: `${clockText(time)}${prefix} ${text}`,
		});
	}

	info(time: number, text: string): void {
		this.add(time, "info", text);
	}

	warning(time: number, text: string): void {
		this.add(time, "warning", text);
	}

	error(time: number, text: string): void {
		this.add(time, "error", text);
	}

	/** A timetabled event, logged with its lateness and counted. */
	timed(time: number, booked: number, text: string, kind: TimedKind): void {
		const mins = minutesLate(time, booked);
		this.count(kind, mins);
		this.add(time, "info", `${text}${latenessText(mins)}`);
	}

	private count(kind: TimedKind, mins: number): void {
		const fields = COUNTED[kind];
		const c = this.counters;
		if (mins === 0) c[fields.onTime]++;
		else if (mins > 0) c[fields.late]++;
		else c[fields.early]++;
		c[fields.lateMins] += Math.max(0, mins);
		if (fields.earlyMins) c[fields.earlyMins] += Math.max(0, -mins);
	}
}
