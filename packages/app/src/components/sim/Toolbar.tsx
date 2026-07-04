import type { Icon } from "@phosphor-icons/react";
import {
	Cursor,
	DotsSixVertical,
	Eye,
	EyeSlash,
	Link,
	Plus,
	Ruler,
	TextT,
} from "@phosphor-icons/react";
import { useRef } from "react";
import { Button } from "#/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { type Tool, useEditorStore } from "#/store/editor-store";

const TOOLS: { tool: Tool; label: string; Icon: Icon }[] = [
	{ tool: "select", label: "Select", Icon: Cursor },
	{ tool: "add", label: "Add track", Icon: Plus },
	{ tool: "text", label: "Add Text", Icon: TextT },
	{ tool: "link", label: "Link", Icon: Link },
	{ tool: "section", label: "Set speed & length", Icon: Ruler },
];

/** Floating left toolbar for choosing the active editing tool. */
export function Toolbar() {
	const tool = useEditorStore((s) => s.tool);
	const setTool = useEditorStore((s) => s.setTool);
	const showLinkHighlights = useEditorStore((s) => s.showLinkHighlights);
	const toggleLinkHighlights = useEditorStore((s) => s.toggleLinkHighlights);
	const pos = useEditorStore((s) => s.toolbarPos);
	const setPos = useEditorStore((s) => s.setToolbarPos);

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
			{TOOLS.map(({ tool: t, label, Icon }) => (
				<Tooltip key={t}>
					<TooltipTrigger asChild>
						<Button
							variant={tool === t ? "secondary" : "ghost"}
							size="icon"
							aria-label={label}
							aria-pressed={tool === t}
							onClick={() => setTool(t)}
						>
							<Icon size={18} />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right">{label}</TooltipContent>
				</Tooltip>
			))}
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
		</div>
	);
}
