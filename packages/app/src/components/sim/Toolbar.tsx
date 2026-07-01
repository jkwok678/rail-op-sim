import type { Icon } from "@phosphor-icons/react";
import { Cursor, Plus, Tag, Trash } from "@phosphor-icons/react";
import { Button } from "#/components/ui/button";
import { type Tool, useEditorStore } from "#/store/editor-store";

const TOOLS: { tool: Tool; label: string; Icon: Icon }[] = [
	{ tool: "select", label: "Select", Icon: Cursor },
	{ tool: "add", label: "Add track", Icon: Plus },
	{ tool: "name", label: "Name", Icon: Tag },
	{ tool: "delete", label: "Delete", Icon: Trash },
];

/** Floating left toolbar for choosing the active editing tool. */
export function Toolbar() {
	const tool = useEditorStore((s) => s.tool);
	const setTool = useEditorStore((s) => s.setTool);

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
		</div>
	);
}
