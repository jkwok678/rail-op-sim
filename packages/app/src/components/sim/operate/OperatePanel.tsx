import { Minus, Pause, Play, Plus, Prohibit } from "@phosphor-icons/react";
import {
	formatSimTime,
	type RouteKind,
	type TrainView,
} from "@rail-op-sim/shared";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";
import { PlacementController } from "#/editor/PlacementController";
import { gridToWorld } from "#/lib/grid";
import {
	changeSpeed,
	chooseRouteKind,
	runOrPause,
	setAllAutoRoutes,
	toggleCallOn,
	toggleLog,
	toggleRouteCancel,
	toggleSummary,
} from "#/lib/operateActions";
import {
	needsAttention,
	runLabel,
	speedLabel,
	trainStatusLabel,
} from "#/lib/operateText";
import {
	formatMinutes,
	type IncidentSeverity,
	summariseCounters,
} from "#/lib/performanceSummary";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";
import { restartSimSession } from "#/store/sim-bridge";

/** The route kinds, coloured as RailOS draws them. */
const ROUTE_KINDS: { kind: RouteKind; label: string; swatch: string }[] = [
	{ kind: "auto", label: "Automatic", swatch: "bg-sky-500" },
	{ kind: "preferred", label: "Preferred", swatch: "bg-emerald-500" },
	{ kind: "unrestricted", label: "Unrestricted", swatch: "bg-red-500" },
];

/**
 * The signalling panel docked beside the canvas in operate mode: the clock,
 * the route controls, the trains on the railway, the performance summary and
 * the performance log.
 */
export function OperatePanel() {
	const notice = useOperateStore((s) => s.notice);
	const showLog = useOperateStore((s) => s.showLog);

	return (
		<aside
			aria-label="Operate panel"
			className="flex w-[24rem] shrink-0 flex-col border-l border-border bg-background text-xs"
		>
			<ClockControls />
			<RouteControls />
			{notice ? (
				<p
					role="status"
					className="border-b border-border bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300"
				>
					{notice}
				</p>
			) : null}
			<TrainList />
			<PerformanceSummary />
			<div className="flex items-center justify-between border-t border-border px-3 py-1">
				<span className="font-medium">Performance log</span>
				<Button variant="ghost" size="xs" onClick={toggleLog}>
					{showLog ? "Hide" : "Show"}
				</Button>
			</div>
			{showLog ? <PerformanceLog /> : null}
		</aside>
	);
}

/** Whether the session has died, leaving its controls with nothing to drive. */
function useErrored(): boolean {
	return useOperateStore((s) => s.status === "error");
}

function ClockControls() {
	const view = useOperateStore((s) => s.view);
	const errored = useErrored();
	const running = view?.run === "running";
	const live = view !== null && !errored;
	return (
		<div className="flex items-center gap-2 border-b border-border px-3 py-2">
			<div className="flex flex-1 flex-col">
				<span
					role="timer"
					className="font-mono text-lg tabular-nums"
					aria-label="Timetable clock"
				>
					{view ? formatSimTime(view.time, true) : "--:--:--"}
				</span>
				<span className="text-[10px] text-muted-foreground">
					{runLabel(view?.run)}
				</span>
			</div>
			<Button
				variant="ghost"
				size="icon-xs"
				aria-label="Slower"
				disabled={!live}
				onClick={() => changeSpeed(-1)}
			>
				<Minus />
			</Button>
			<span
				role="status"
				className="w-8 text-center tabular-nums"
				aria-label="Clock speed"
			>
				{speedLabel(view?.speed ?? 1)}
			</span>
			<Button
				variant="ghost"
				size="icon-xs"
				aria-label="Faster"
				disabled={!live}
				onClick={() => changeSpeed(1)}
			>
				<Plus />
			</Button>
			<Button size="sm" disabled={!live} onClick={runOrPause}>
				{running ? <Pause /> : <Play />}
				{running ? "Pause" : "Run"}
			</Button>
		</div>
	);
}

function routeControlsHint(
	callOnArmed: boolean,
	cancelArmed: boolean,
	hasRouteStart: boolean,
): string {
	if (callOnArmed) return "Click the stop signal to call the waiting train on.";
	if (cancelArmed) return "Right-click a route to cancel it.";
	if (hasRouteStart) {
		return "Click where the route ends — right-click to abandon.";
	}
	return "Click a signal to start a route; click points to change them.";
}

function useRouteControlState() {
	const errored = useErrored();
	const routeKind = useOperateStore((s) => s.routeKind);
	const cancelArmed = useOperateStore((s) => s.cancelArmed);
	const callOnArmed = useOperateStore((s) => s.callOnArmed);
	const routeStart = useOperateStore((s) => s.routeStart);
	const run = useOperateStore((s) => s.view?.run);
	const canCallOn = useOperateStore(
		(s) => s.view?.trains.some((t) => t.callingOnAllowed) ?? false,
	);
	const actionDisabled = errored || !run || run === "paused";
	return {
		errored,
		routeKind,
		cancelArmed,
		callOnArmed,
		actionDisabled,
		callOnDisabled: actionDisabled || !canCallOn,
		hint: routeControlsHint(callOnArmed, cancelArmed, routeStart !== null),
	};
}

function RouteControls() {
	const {
		errored,
		routeKind,
		cancelArmed,
		callOnArmed,
		actionDisabled,
		callOnDisabled,
		hint,
	} = useRouteControlState();
	const kindActive = (kind: RouteKind) =>
		routeKind === kind && !cancelArmed && !callOnArmed;

	return (
		<div className="flex flex-col gap-1.5 border-b border-border px-3 py-2">
			<div
				role="radiogroup"
				aria-label="Route kind"
				className="flex flex-wrap gap-1"
			>
				{ROUTE_KINDS.map(({ kind, label, swatch }) => {
					const active = kindActive(kind);
					return (
						<Button
							key={kind}
							role="radio"
							aria-checked={active}
							variant={active ? "secondary" : "ghost"}
							size="xs"
							disabled={errored}
							onClick={() => chooseRouteKind(kind)}
						>
							<span className={`size-2 rounded-full ${swatch}`} />
							{label}
						</Button>
					);
				})}
				<Button
					aria-pressed={cancelArmed}
					variant={cancelArmed ? "destructive" : "ghost"}
					size="xs"
					disabled={errored}
					onClick={toggleRouteCancel}
				>
					<Prohibit />
					Cancel
				</Button>
			</div>
			<div className="flex flex-wrap gap-1">
				<Button
					variant="outline"
					size="xs"
					disabled={actionDisabled}
					title="Set an automatic route on every plain section between signals"
					onClick={() => void setAllAutoRoutes()}
				>
					<span className="size-2 rounded-full bg-sky-500" />
					Set all automatic
				</Button>
				<Button
					variant={callOnArmed ? "secondary" : "outline"}
					size="xs"
					aria-pressed={callOnArmed}
					disabled={callOnDisabled}
					title="Call a train standing at red onto an occupied platform (Shift+O)"
					onClick={toggleCallOn}
				>
					<span className="size-2 rounded-full bg-fuchsia-400" />
					Calling-on
				</Button>
			</div>
			<p className="text-[10px] text-muted-foreground">{hint}</p>
		</div>
	);
}

/** Centre the canvas on a train's front. */
function showTrain(train: TrainView): void {
	const front = train.segs[train.segs.length - 1];
	if (!front) return;
	const { x, y } = gridToWorld(front.gx, front.gy);
	PlacementController.instance?.viewport.centreOn(x, y);
}

/** One shared empty list, so the selector is stable before the first view. */
const NO_TRAINS: TrainView[] = [];

/**
 * The session died: say so and what can be done. The clock and route controls
 * above are disabled meanwhile; the performance log below stays, since it may
 * say what went wrong.
 */
function SessionError() {
	const error = useOperateStore((s) => s.error);
	return (
		<div
			role="alert"
			className="flex flex-col gap-2 border-b border-border bg-destructive/10 p-3"
		>
			<p className="font-medium text-destructive">The simulation stopped</p>
			<p className="break-words text-muted-foreground">{error}</p>
			<div className="flex gap-2">
				<Button size="xs" onClick={restartSimSession}>
					Restart session
				</Button>
				<Button
					variant="outline"
					size="xs"
					onClick={() => useModeStore.getState().setMode("railway")}
				>
					Back to railway
				</Button>
			</div>
		</div>
	);
}

function TrainList() {
	const status = useOperateStore((s) => s.status);
	const trains = useOperateStore((s) => s.view?.trains ?? NO_TRAINS);
	const prestart = useOperateStore((s) => s.view?.run === "prestart");
	const openTrainMenu = useOperateStore((s) => s.openTrainMenu);
	if (status === "error") {
		return (
			<div className="min-h-0 flex-1 overflow-y-auto">
				<SessionError />
			</div>
		);
	}
	if (status === "idle" || status === "loading") {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-muted-foreground">
				<Spinner label="Starting the simulation" />
				<span>Starting the simulation…</span>
			</div>
		);
	}
	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			{trains.length === 0 ? (
				<p className="p-3 text-muted-foreground">
					{prestart
						? "The clock has not started. Press Run to start it — trains enter at their booked times."
						: "No trains on the railway yet."}
				</p>
			) : (
				<table className="w-full">
					<thead className="sticky top-0 bg-background text-left text-[10px] text-muted-foreground">
						<tr>
							<th className="px-3 py-1 font-normal">Train</th>
							<th className="py-1 font-normal">Status</th>
							<th className="py-1 pr-3 font-normal">Next</th>
						</tr>
					</thead>
					<tbody>
						{trains.map((train) => (
							<tr
								key={train.id}
								className="cursor-pointer hover:bg-muted/50"
								onClick={() => showTrain(train)}
								onContextMenu={(e) => {
									e.preventDefault();
									openTrainMenu(train.id, e.clientX, e.clientY);
								}}
								title={
									[train.description, train.reminder]
										.filter(Boolean)
										.join(" · ") || undefined
								}
							>
								<td className="px-3 py-0.5 font-mono">
									<span>{train.headcode}</span>
									{train.signallerControl ? (
										<span
											title="Signaller control"
											className="ml-1 inline-block rounded bg-amber-500/15 px-1 text-[9px] font-sans font-medium text-amber-700 dark:text-amber-300"
										>
											SC
										</span>
									) : null}
									{train.reminder ? (
										<span
											title={`Reminder: ${train.reminder}`}
											className="ml-1 inline-block rounded bg-sky-500/15 px-1 text-[9px] font-sans font-medium text-sky-700 dark:text-sky-300"
										>
											Note
										</span>
									) : null}
								</td>
								<td
									className={
										needsAttention(train)
											? "py-0.5 text-amber-700 dark:text-amber-300"
											: "py-0.5"
									}
								>
									{trainStatusLabel(train)}
								</td>
								<td className="py-0.5 pr-3 text-muted-foreground">
									{train.next}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
	warning: "text-amber-700 dark:text-amber-300",
	error: "text-destructive",
};

function PerformanceSummary() {
	const counters = useOperateStore((s) => s.view?.counters);
	const showSummary = useOperateStore((s) => s.showSummary);
	const summary = useMemo(
		() => (counters ? summariseCounters(counters) : null),
		[counters],
	);
	if (!summary) return null;

	return (
		<>
			<div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1">
				<div className="flex min-w-0 items-baseline gap-2">
					<span className="shrink-0 font-medium">Performance summary</span>
					<span className="truncate text-[10px] text-muted-foreground tabular-nums">
						{summary.headline.map((part, i) => (
							<Fragment key={part.text}>
								{i > 0 ? " · " : null}
								<span
									className={
										part.severity ? SEVERITY_CLASS[part.severity] : undefined
									}
								>
									{part.text}
								</span>
							</Fragment>
						))}
					</span>
				</div>
				<Button
					variant="ghost"
					size="xs"
					aria-expanded={showSummary}
					onClick={toggleSummary}
				>
					{showSummary ? "Hide" : "Show"}
				</Button>
			</div>
			{showSummary ? (
				<section
					aria-label="Performance summary"
					className="border-t border-border px-3 py-1.5 text-[10px]"
				>
					<table className="w-full tabular-nums">
						<thead className="text-muted-foreground">
							<tr>
								<th scope="col" className="py-0.5 text-left font-normal">
									<span className="sr-only">Event</span>
								</th>
								<th scope="col" className="py-0.5 text-right font-normal">
									On time
								</th>
								<th scope="col" className="py-0.5 text-right font-normal">
									Late
								</th>
								<th scope="col" className="py-0.5 text-right font-normal">
									Early
								</th>
								<th scope="col" className="py-0.5 text-right font-normal">
									<abbr title="Total minutes late" className="no-underline">
										Late min Σ
									</abbr>
								</th>
								<th scope="col" className="py-0.5 text-right font-normal">
									<abbr title="Total minutes early" className="no-underline">
										Early min Σ
									</abbr>
								</th>
							</tr>
						</thead>
						<tbody>
							{summary.events.map((row) => (
								<tr key={row.label}>
									<th
										scope="row"
										className="py-0.5 text-left font-normal text-muted-foreground"
									>
										{row.label}
									</th>
									<td className="py-0.5 text-right">{row.onTime}</td>
									<td className="py-0.5 text-right">{row.late}</td>
									<td className="py-0.5 text-right">{row.early ?? "—"}</td>
									<td className="py-0.5 text-right">{row.lateMins}</td>
									<td className="py-0.5 text-right">{row.earlyMins ?? "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
					<dl className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-border pt-1.5">
						{summary.incidents.map((item) => {
							const valueText =
								item.unit === "minutes"
									? formatMinutes(item.value)
									: String(item.value);
							const valueClass =
								item.value > 0
									? `font-medium ${SEVERITY_CLASS[item.severity]}`
									: "text-muted-foreground";
							return (
								<Fragment key={item.label}>
									<dt className="text-muted-foreground">{item.label}</dt>
									<dd className={`text-right tabular-nums ${valueClass}`}>
										{valueText}
									</dd>
								</Fragment>
							);
						})}
					</dl>
				</section>
			) : null}
		</>
	);
}

const LEVEL_CLASS = {
	info: "",
	warning: "text-amber-700 dark:text-amber-300",
	error: "text-destructive",
};

function PerformanceLog() {
	const log = useOperateStore((s) => s.log);
	const end = useRef<HTMLDivElement>(null);
	// Keep the newest line in view as the log grows.
	const lines = log.length;
	useEffect(() => {
		if (lines > 0) end.current?.scrollIntoView?.({ block: "end" });
	}, [lines]);
	return (
		<div
			role="log"
			aria-label="Performance log"
			className="h-48 overflow-y-auto border-t border-border px-3 py-1 font-mono text-[10px]"
		>
			{log.map((line) => (
				<div key={line.seq} className={LEVEL_CLASS[line.level]}>
					{line.text}
				</div>
			))}
			<div ref={end} />
		</div>
	);
}
