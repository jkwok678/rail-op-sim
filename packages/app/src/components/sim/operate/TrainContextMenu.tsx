import type { TrainView } from "@rail-op-sim/shared";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Separator } from "#/components/ui/separator";
import { useOperateStore } from "#/store/operate-store";
import { simCommand } from "#/store/sim-bridge";

export type TrainMenuItemId =
	| "takeControl"
	| "restoreTimetable"
	| "moveForwards"
	| "changeDirection"
	| "passRed"
	| "stepForward"
	| "stop"
	| "signallerJoin"
	| "skipActions"
	| "becomeNewService"
	| "setReminder"
	| "removeTrain";

export interface TrainMenuItem {
	id: TrainMenuItemId;
	label: string;
	enabled: boolean;
	destructive?: boolean;
	group: 1 | 2 | 3;
}

const MENU_WIDTH = 224;
const DEFAULT_MENU_HEIGHT = 380;
const EDGE_MARGIN = 8;

const BLOCKED_WAITS = new Set(["signal", "train", "points", "buffers"]);

interface TrainMenuContext {
	train: TrainView;
	alive: boolean;
	stopped: boolean;
	controlled: boolean;
	timetableRowCount: number;
}

function controlMenuItems({
	train,
	alive,
	controlled,
}: TrainMenuContext): TrainMenuItem[] {
	return [
		{
			id: "takeControl",
			label: "Take Signaller Control",
			enabled: alive && !controlled,
			group: 1,
		},
		{
			id: "restoreTimetable",
			label: "Restore Timetable Control",
			enabled: alive && controlled && train.canRestoreTimetable,
			group: 1,
		},
	];
}

function movementMenuItems({
	train,
	alive,
	stopped,
	controlled,
}: TrainMenuContext): TrainMenuItem[] {
	const canMove = alive && controlled;
	const canStopAction = canMove && stopped;
	const waitingFor = train.status === "waiting" ? train.wait : null;
	const blocked = train.wait !== null && BLOCKED_WAITS.has(train.wait);
	return [
		{
			id: "moveForwards",
			label: "Move Forwards",
			enabled: canMove && train.signallerMode !== "move",
			group: 2,
		},
		{
			id: "changeDirection",
			label: "Change Direction",
			enabled: canStopAction,
			group: 2,
		},
		{
			id: "passRed",
			label: "Pass Red Signal",
			enabled: canStopAction && waitingFor === "signal",
			group: 2,
		},
		{
			id: "stepForward",
			label: "Step Forward",
			enabled: canStopAction && !blocked,
			group: 2,
		},
		{
			id: "stop",
			label: "Stop",
			enabled: canMove && (train.signallerMode !== "stop" || !stopped),
			group: 2,
		},
		{
			id: "signallerJoin",
			label: "Signaller Join",
			enabled: canStopAction && waitingFor === "train",
			group: 2,
		},
	];
}

function timetableMenuItems({
	train,
	alive,
	stopped,
	controlled,
	timetableRowCount,
}: TrainMenuContext): TrainMenuItem[] {
	const inTimetable = alive && !controlled;
	return [
		{
			id: "skipActions",
			label: "Skip Timetabled Actions…",
			enabled:
				inTimetable &&
				stopped &&
				!train.workingDone &&
				train.timetableIndex + 2 < timetableRowCount,
			group: 3,
		},
		{
			id: "becomeNewService",
			label: train.followOnServiceRef
				? `Become ${train.followOnServiceRef} Early…`
				: "Become New Service Early…",
			enabled: inTimetable && train.followOnServiceRef !== null,
			group: 3,
		},
		{
			id: "setReminder",
			label: train.reminder ? "Edit Reminder…" : "Set Reminder…",
			enabled: true,
			group: 3,
		},
		{
			id: "removeTrain",
			label: "Remove Train",
			enabled: !alive || (controlled && stopped),
			destructive: true,
			group: 3,
		},
	];
}

/** Compute every action for the right-click train popup menu and whether it is available. */
export function trainMenuItems(
	train: TrainView,
	timetableRowCount: number,
): TrainMenuItem[] {
	const ctx: TrainMenuContext = {
		train,
		alive: train.status !== "crashed",
		stopped: train.speedKmh < 0.01,
		controlled: train.signallerControl,
		timetableRowCount,
	};
	return [
		...controlMenuItems(ctx),
		...movementMenuItems(ctx),
		...timetableMenuItems(ctx),
	];
}

function clampMenuPosition(
	screenX: number,
	screenY: number,
	viewportWidth: number,
	viewportHeight: number,
	menuHeight = DEFAULT_MENU_HEIGHT,
): { left: number; top: number } {
	const left = Math.max(
		EDGE_MARGIN,
		Math.min(screenX, viewportWidth - MENU_WIDTH - EDGE_MARGIN),
	);
	const top = Math.max(
		EDGE_MARGIN,
		Math.min(screenY, viewportHeight - menuHeight - EDGE_MARGIN),
	);
	return { left, top };
}

const DIRECT_COMMANDS = new Set<TrainMenuItemId>([
	"takeControl",
	"restoreTimetable",
	"moveForwards",
	"changeDirection",
	"passRed",
	"stepForward",
	"stop",
	"signallerJoin",
]);

function dispatchTrainMenuItem(
	id: TrainMenuItemId,
	train: TrainView,
	openTrainDialog: ReturnType<
		typeof useOperateStore.getState
	>["openTrainDialog"],
): void {
	if (
		DIRECT_COMMANDS.has(id) ||
		(id === "removeTrain" && train.status === "crashed")
	) {
		void simCommand({
			type: id as
				| "takeControl"
				| "restoreTimetable"
				| "moveForwards"
				| "changeDirection"
				| "passRed"
				| "stepForward"
				| "stop"
				| "signallerJoin"
				| "removeTrain",
			trainId: train.id,
		});
		return;
	}
	openTrainDialog(
		id as "removeTrain" | "skipActions" | "becomeNewService" | "setReminder",
		train.id,
	);
}

export function TrainContextMenu() {
	const menu = useOperateStore((s) => s.trainMenu);
	const trains = useOperateStore((s) => s.view?.trains);
	const timetables = useOperateStore((s) => s.timetables);
	const closeTrainMenu = useOperateStore((s) => s.closeTrainMenu);
	const openTrainDialog = useOperateStore((s) => s.openTrainDialog);
	const ref = useRef<HTMLDivElement>(null);
	const [menuHeight, setMenuHeight] = useState(DEFAULT_MENU_HEIGHT);

	useEffect(() => {
		if (!menu) return;
		const onPointerDown = (e: PointerEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				closeTrainMenu();
			}
		};
		window.addEventListener("pointerdown", onPointerDown, true);
		return () => window.removeEventListener("pointerdown", onPointerDown, true);
	}, [menu, closeTrainMenu]);

	useLayoutEffect(() => {
		if (!menu || !ref.current) return;
		const measured = ref.current.offsetHeight;
		if (measured > 0) setMenuHeight(measured);
		ref.current.focus();
	}, [menu]);

	if (!menu) return null;
	const train = trains?.find((t) => t.id === menu.trainId);
	if (!train) return null;

	const rowCount = timetables[train.id]?.length ?? 0;
	const items = trainMenuItems(train, rowCount);
	const pos = clampMenuPosition(
		menu.screenX,
		menu.screenY,
		typeof window !== "undefined" ? window.innerWidth : 1280,
		typeof window !== "undefined" ? window.innerHeight : 800,
		menuHeight,
	);

	const runItem = (id: TrainMenuItemId) => {
		closeTrainMenu();
		dispatchTrainMenuItem(id, train, openTrainDialog);
	};

	const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape") {
			e.preventDefault();
			closeTrainMenu();
			return;
		}
		if (
			e.key !== "ArrowDown" &&
			e.key !== "ArrowUp" &&
			e.key !== "Home" &&
			e.key !== "End"
		) {
			return;
		}
		const buttons = Array.from(
			ref.current?.querySelectorAll<HTMLButtonElement>(
				'button[role="menuitem"]:not(:disabled)',
			) ?? [],
		);
		if (buttons.length === 0) return;
		e.preventDefault();
		const activeIndex = buttons.indexOf(
			document.activeElement as HTMLButtonElement,
		);
		let nextIndex = 0;
		if (e.key === "ArrowDown") {
			nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % buttons.length;
		} else if (e.key === "ArrowUp") {
			nextIndex =
				activeIndex < 0
					? buttons.length - 1
					: (activeIndex - 1 + buttons.length) % buttons.length;
		} else if (e.key === "End") {
			nextIndex = buttons.length - 1;
		}
		buttons[nextIndex]?.focus();
	};

	return (
		<div
			ref={ref}
			tabIndex={-1}
			role="menu"
			aria-label={`Controls for ${train.headcode}`}
			data-testid="train-context-menu"
			className="fixed z-50 w-56 rounded-md border border-border bg-popover p-1 text-xs text-popover-foreground shadow-lg focus:outline-none"
			style={{ left: pos.left, top: pos.top }}
			onKeyDown={onMenuKeyDown}
			onContextMenu={(e) => e.preventDefault()}
		>
			<div className="flex items-center justify-between px-2 py-1 text-[11px] font-medium text-muted-foreground">
				<span className="font-mono text-foreground">{train.headcode}</span>
				{train.signallerControl ? (
					<span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
						Signaller
					</span>
				) : (
					<span className="text-[10px]">Timetable</span>
				)}
			</div>
			<Separator className="my-1" />
			{items.map((item, idx) => {
				const prevGroup = items[idx - 1]?.group ?? item.group;
				return (
					<div key={item.id}>
						{item.group !== prevGroup ? <Separator className="my-1" /> : null}
						<button
							type="button"
							role="menuitem"
							disabled={!item.enabled}
							onClick={() => runItem(item.id)}
							className={`flex w-full items-center rounded-sm px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground ${
								!item.enabled
									? "cursor-not-allowed text-muted-foreground/45"
									: item.destructive
										? "text-destructive hover:bg-destructive/10"
										: "hover:bg-accent hover:text-accent-foreground"
							}`}
						>
							{item.label}
						</button>
					</div>
				);
			})}
		</div>
	);
}
