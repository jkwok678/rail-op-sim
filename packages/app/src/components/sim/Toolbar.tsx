import type { Icon } from "@phosphor-icons/react";
import {
	Cursor,
	Eye,
	EyeSlash,
	Link,
	Plus,
	Ruler,
	TextT,
} from "@phosphor-icons/react";
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

	return (
		<div className="absolute left-4 top-4 z-10 flex flex-col gap-1 rounded-xl border bg-background/95 p-1 shadow-sm backdrop-blur-sm">
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
