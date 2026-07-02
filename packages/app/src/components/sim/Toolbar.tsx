import type { Icon } from "@phosphor-icons/react";
import { Cursor, Eye, EyeSlash, Graph, Link, Plus, Tag, Trash } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { type Tool, useEditorStore } from "#/store/editor-store";

const TOOLS: { tool: Tool; label: string; Icon: Icon }[] = [
	{ tool: "select", label: "Select", Icon: Cursor },
	{ tool: "add", label: "Add track", Icon: Plus },
	{ tool: "link", label: "Link", Icon: Link },
	{ tool: "section", label: "Section", Icon: Graph },
	{ tool: "name", label: "Name", Icon: Tag },
	{ tool: "delete", label: "Delete", Icon: Trash },
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
				<Button
					key={t}
					variant={tool === t ? "secondary" : "ghost"}
					size="icon"
					aria-label={label}
					aria-pressed={tool === t}
					title={label}
					onClick={() => setTool(t)}
				>
					<Icon size={18} />
				</Button>
			))}
			<div className="mx-1 border-t" />
			<Button
				variant={showLinkHighlights ? "secondary" : "ghost"}
				size="icon"
				aria-label={showLinkHighlights ? "Hide link highlights" : "Show link highlights"}
				aria-pressed={showLinkHighlights}
				title={showLinkHighlights ? "Hide link highlights" : "Show link highlights"}
				onClick={toggleLinkHighlights}
			>
				{showLinkHighlights ? <Eye size={18} /> : <EyeSlash size={18} />}
			</Button>
		</div>
	);
}
