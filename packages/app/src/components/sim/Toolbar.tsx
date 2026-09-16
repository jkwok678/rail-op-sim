import type { Icon } from "@phosphor-icons/react";
import {
	ArrowRight,
	ArrowUUpLeft,
	ArrowUUpRight,
	Cursor,
	DotsSixVertical,
	Eraser,
	Eye,
	EyeSlash,
	FlowArrow,
	Link,
	Plus,
	Ruler,
	TextT,
} from "@phosphor-icons/react";
import { useMemo, useRef } from "react";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { PlacementController } from "#/engine/PlacementController";
import { type Tool, useEditorStore } from "#/store/editor-store";

/** Undo/redo buttons, rendered as a pair between the tools and the toggles. */
const HISTORY_ACTIONS: { key: "undo" | "redo"; label: string; Icon: Icon }[] = [
	{ key: "undo", label: "Undo", Icon: ArrowUUpLeft },
	{ key: "redo", label: "Redo", Icon: ArrowUUpRight },
];

const TOOLS: { tool: Tool; label: string; Icon: Icon }[] = [
	{ tool: "select", label: "Select", Icon: Cursor },
	{ tool: "add", label: "Add track", Icon: Plus },
	{ tool: "text", label: "Add Text", Icon: TextT },
	{ tool: "link", label: "Link", Icon: Link },
	{ tool: "section", label: "Set speed & length", Icon: Ruler },
	{ tool: "direction", label: "Set direction", Icon: ArrowRight },
];

/** Floating left toolbar for choosing the active editing tool. */
export function Toolbar() {
	const tool = useEditorStore((s) => s.tool);
	const setTool = useEditorStore((s) => s.setTool);
	const showLinkHighlights = useEditorStore((s) => s.showLinkHighlights);
	const toggleLinkHighlights = useEditorStore((s) => s.toggleLinkHighlights);
	const directionMode = useEditorStore((s) => s.directionMode);
	const setDirectionMode = useEditorStore((s) => s.setDirectionMode);
	const showDirections = useEditorStore((s) => s.showDirections);
	const toggleShowDirections = useEditorStore((s) => s.toggleShowDirections);
	const trackStatus = useEditorStore((s) => s.trackStatus);
	const canUndo = useEditorStore((s) => s.canUndo);
	const canRedo = useEditorStore((s) => s.canRedo);
	const undoLabel = useEditorStore((s) => s.undoLabel);
	const redoLabel = useEditorStore((s) => s.redoLabel);
	const pos = useEditorStore((s) => s.toolbarPos);
	const setPos = useEditorStore((s) => s.setToolbarPos);

	const railwayComplete = trackStatus?.connected ?? false;

	// Say which fault is blocking the direction tool, not just that one exists.
	const incompleteReason = useMemo(() => {
		if (!trackStatus || trackStatus.total === 0) {
			return "Set direction — place some track first";
		}
		const { dangling, unpairedLinked, firstIssue } = trackStatus;
		const where = firstIssue
			? ` (first at ${firstIssue.gx}, ${firstIssue.gy})`
			: "";
		if (dangling > 0) {
			return `Set direction — ${dangling} ${dangling === 1 ? "track has" : "tracks have"} an open end${where}`;
		}
		if (unpairedLinked > 0) {
			return `Set direction — ${unpairedLinked} unpaired ${unpairedLinked === 1 ? "portal" : "portals"}${where}`;
		}
		return "Set direction — complete the railway first";
	}, [trackStatus]);

	// Offset between the pointer and the toolbar's top-left at drag start, so the
	// toolbar doesn't jump under the cursor when a drag begins. Null when idle.
	const dragOffset = useRef<{ dx: number; dy: number } | null>(null);

	const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
		e.preventDefault();
		dragOffset.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
		const offset = dragOffset.current;
		if (!offset) return;
		// Keep the toolbar within the viewport (leave a small margin visible).
		const margin = 40;
		const x = Math.max(
			0,
			Math.min(e.clientX - offset.dx, window.innerWidth - margin),
		);
		const y = Math.max(
			0,
			Math.min(e.clientY - offset.dy, window.innerHeight - margin),
		);
		setPos({ x, y });
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
		dragOffset.current = null;
		e.currentTarget.releasePointerCapture(e.pointerId);
	};

	return (
		<div
			className="absolute z-10 flex flex-col gap-1 rounded-xl border bg-background/95 p-1 shadow-sm backdrop-blur-sm"
			style={{ left: pos.x, top: pos.y }}
		>
			<button
				type="button"
				aria-label="Move toolbar"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				className="flex touch-none cursor-grab items-center justify-center rounded-md py-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
			>
				<DotsSixVertical size={16} weight="bold" />
			</button>
			{TOOLS.map(({ tool: t, label, Icon }) => {
				// The direction tool needs a complete railway. A disabled <button>
				// swallows pointer events, so wrap it in a focusable <span> to keep
				// the explanatory tooltip firing.
				const disabled = t === "direction" && !railwayComplete;
				const tooltip = disabled ? incompleteReason : label;
				const button = (
					<Button
						variant={tool === t ? "secondary" : "ghost"}
						size="icon"
						aria-label={label}
						aria-pressed={tool === t}
						disabled={disabled}
						onClick={() => setTool(t)}
					>
						<Icon size={18} />
					</Button>
				);
				return (
					<Tooltip key={t}>
						<TooltipTrigger asChild>
							{disabled ? <span tabIndex={-1}>{button}</span> : button}
						</TooltipTrigger>
						<TooltipContent side="right">{tooltip}</TooltipContent>
					</Tooltip>
				);
			})}
			{/* Erase mode belongs to the direction tool, so it only shows while that
			    tool is active — the same two clicks then clear the route they would
			    have set, either way round, which is the way back from a mis-drawn
			    route. */}
			{tool === "direction" && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={directionMode === "erase" ? "destructive" : "ghost"}
							size="icon"
							aria-label="Erase directions"
							aria-pressed={directionMode === "erase"}
							onClick={() =>
								setDirectionMode(directionMode === "erase" ? "set" : "erase")
							}
						>
							<Eraser size={18} />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right">
						{directionMode === "erase"
							? "Erasing directions — click two tracks to clear the route between them"
							: "Erase directions — retrace a route to remove it"}
					</TooltipContent>
				</Tooltip>
			)}
			<div className="mx-1 border-t" />
			{HISTORY_ACTIONS.map(({ key, label, Icon }) => {
				const disabled = key === "undo" ? !canUndo : !canRedo;
				const action = key === "undo" ? undoLabel : redoLabel;
				// Name the step, so the button says what it will reverse rather than
				// only that it can.
				const tip = disabled
					? `Nothing to ${label.toLowerCase()}`
					: action
						? `${label} ${action.charAt(0).toLowerCase()}${action.slice(1)}`
						: label;
				const button = (
					<Button
						variant="ghost"
						size="icon"
						aria-label={label}
						disabled={disabled}
						onClick={() =>
							key === "undo"
								? PlacementController.instance?.undo()
								: PlacementController.instance?.redo()
						}
					>
						<Icon size={18} />
					</Button>
				);
				return (
					<Tooltip key={key}>
						{/* A disabled button swallows pointer events, so the tooltip
						    needs a wrapper to fire from — same as the tool buttons. */}
						<TooltipTrigger asChild>
							{disabled ? <span tabIndex={-1}>{button}</span> : button}
						</TooltipTrigger>
						<TooltipContent side="right">{tip}</TooltipContent>
					</Tooltip>
				);
			})}
			<div className="mx-1 border-t" />
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={showLinkHighlights ? "secondary" : "ghost"}
						size="icon"
						aria-label={
							showLinkHighlights
								? "Hide link highlights"
								: "Show link highlights"
						}
						aria-pressed={showLinkHighlights}
						onClick={toggleLinkHighlights}
					>
						{showLinkHighlights ? <Eye size={18} /> : <EyeSlash size={18} />}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right">
					{showLinkHighlights ? "Hide link highlights" : "Show link highlights"}
				</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant={showDirections ? "secondary" : "ghost"}
						size="icon"
						aria-label={
							showDirections ? "Hide direction arrows" : "Show direction arrows"
						}
						aria-pressed={showDirections}
						onClick={toggleShowDirections}
					>
						{/* A distinct glyph from the link-highlight eye above, so the two
						    toggles are told apart without reading the tooltip; the button
						    variant carries the on/off state. */}
						<FlowArrow size={18} />
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right">
					{showDirections ? "Hide direction arrows" : "Show direction arrows"}
				</TooltipContent>
			</Tooltip>
		</div>
	);
}
