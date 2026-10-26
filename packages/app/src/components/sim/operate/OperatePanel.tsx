import { Minus, Pause, Play, Plus, Prohibit } from "@phosphor-icons/react";
import {
	formatSimTime,
	type RouteKind,
	type TrainView,
} from "@rail-op-sim/shared";
import { useEffect, useRef } from "react";
import { Button } from "#/components/ui/button";
import { PlacementController } from "#/engine/PlacementController";
import { gridToWorld } from "#/lib/grid";
import {
	changeSpeed,
	chooseRouteKind,
	runOrPause,
	toggleLog,
	toggleRouteCancel,
} from "#/lib/operateActions";
import {
	needsAttention,
	runLabel,
	speedLabel,
	trainStatusLabel,
} from "#/lib/operateText";
import { useOperateStore } from "#/store/operate-store";

/** The route kinds, coloured as RailOS draws them. */
const ROUTE_KINDS: { kind: RouteKind; label: string; swatch: string }[] = [
	{ kind: "auto", label: "Automatic", swatch: "bg-sky-500" },
	{ kind: "preferred", label: "Preferred", swatch: "bg-emerald-500" },
	{ kind: "unrestricted", label: "Unrestricted", swatch: "bg-red-500" },
];

/**
 * The signalling panel docked beside the canvas in operate mode: the clock,
 * the route controls, the trains on the railway and the performance log.
 */
export function OperatePanel() {
	const status = useOperateStore((s) => s.status);
	const error = useOperateStore((s) => s.error);
	const notice = useOperateStore((s) => s.notice);
	const showLog = useOperateStore((s) => s.showLog);

	return (
		<aside
			aria-label="Operate panel"
			className="flex w-[24rem] shrink-0 flex-col border-l border-border bg-background text-xs"
		>
			<ClockControls />
			<RouteControls />
			{status === "error" ? (
				<p
					role="alert"
					className="border-b border-border bg-destructive/10 px-3 py-1.5 text-destructive"
				>
					{error}
				</p>
			) : null}
			{notice ? (
				<p
					role="status"
					className="border-b border-border bg-amber-500/10 px-3 py-1.5 text-amber-700 dark:text-amber-300"
				>
					{notice}
				</p>
			) : null}
			<TrainList />
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

function ClockControls() {
	const view = useOperateStore((s) => s.view);
	const running = view?.run === "running";
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
				disabled={!view}
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
				disabled={!view}
				onClick={() => changeSpeed(1)}
			>
				<Plus />
			</Button>
			<Button size="sm" disabled={!view} onClick={runOrPause}>
				{running ? <Pause /> : <Play />}
				{running ? "Pause" : "Run"}
			</Button>
		</div>
	);
}

function RouteControls() {
	const routeKind = useOperateStore((s) => s.routeKind);
	const cancelArmed = useOperateStore((s) => s.cancelArmed);
	const routeStart = useOperateStore((s) => s.routeStart);
	return (
		<div className="flex flex-col gap-1.5 border-b border-border px-3 py-2">
			<div role="radiogroup" aria-label="Route kind" className="flex gap-1">
				{ROUTE_KINDS.map(({ kind, label, swatch }) => (
					<Button
						key={kind}
						role="radio"
						aria-checked={routeKind === kind && !cancelArmed}
						variant={routeKind === kind && !cancelArmed ? "secondary" : "ghost"}
						size="xs"
						onClick={() => chooseRouteKind(kind)}
					>
						<span className={`size-2 rounded-full ${swatch}`} />
						{label}
					</Button>
				))}
				<Button
					aria-pressed={cancelArmed}
					variant={cancelArmed ? "destructive" : "ghost"}
					size="xs"
					onClick={toggleRouteCancel}
				>
					<Prohibit />
					Cancel
				</Button>
			</div>
			<p className="text-[10px] text-muted-foreground">
				{cancelArmed
					? "Right-click a route to cancel it."
					: routeStart
						? "Click where the route ends — right-click to abandon."
						: "Click a signal to start a route; click points to change them."}
			</p>
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

function TrainList() {
	const trains = useOperateStore((s) => s.view?.trains ?? NO_TRAINS);
	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			{trains.length === 0 ? (
				<p className="p-3 text-muted-foreground">
					No trains on the railway yet.
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
								title={train.description || undefined}
							>
								<td className="px-3 py-0.5 font-mono">{train.headcode}</td>
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
