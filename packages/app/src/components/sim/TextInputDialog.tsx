import type { FontInfo } from "@rail-op-sim/shared";
import { useEffect, useRef, useState } from "react";
import { TextPromptDialog } from "#/components/sim/TextPromptDialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { PlacementController } from "#/editor/PlacementController";
import { normalizeCssColor } from "#/lib/svgColors";
import { type PendingText, useEditorStore } from "#/store/editor-store";

interface TextInputDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Font families offered in the picker, mapped to the CSS families in styles.css. */
const FONT_FAMILIES = [
	{ label: "Sans (Manrope)", value: "Manrope" },
	{ label: "Mono (JetBrains Mono)", value: "JetBrains Mono Variable" },
	{ label: "Serif (Fraunces)", value: "Fraunces" },
] as const;

const DEFAULT_FAMILY = "JetBrains Mono Variable";
const DEFAULT_POINT_SIZE = 12;

const STYLE_TOGGLES: {
	key: "bold" | "italic" | "underline" | "strikethrough";
	label: string;
	className: string;
}[] = [
	{ key: "bold", label: "B", className: "font-bold" },
	{ key: "italic", label: "I", className: "italic" },
	{ key: "underline", label: "U", className: "underline" },
	{ key: "strikethrough", label: "S", className: "line-through" },
];

function defaultFontInfo(): Required<FontInfo> {
	return {
		family: DEFAULT_FAMILY,
		pointSize: DEFAULT_POINT_SIZE,
		bold: false,
		italic: false,
		underline: false,
		strikethrough: false,
		color: normalizeCssColor("var(--foreground)"),
	};
}

function mergeDefined<T extends object>(defaults: T, patch?: Partial<T>): T {
	if (!patch) return defaults;
	const result = { ...defaults };
	for (const key of Object.keys(patch) as (keyof T)[]) {
		const value = patch[key];
		if (value !== undefined) result[key] = value;
	}
	return result;
}

function loadPendingTextDraft(pendingText: PendingText | null): {
	content: string;
	font: FontInfo;
} {
	const defaults = defaultFontInfo();
	if (pendingText?.mode !== "edit") {
		return { content: "", font: defaults };
	}
	const text = PlacementController.instance?.getTextByLocation(
		pendingText.tx,
		pendingText.ty,
	);
	return {
		content: text?.getReadableText() ?? "",
		font: mergeDefined(defaults, text?.getFont()),
	};
}

function FontFamilyAndSizeRow({
	font,
	onChange,
}: {
	font: FontInfo;
	onChange: (patch: Partial<FontInfo>) => void;
}) {
	return (
		<div className="flex gap-3">
			<div className="flex flex-1 flex-col gap-1.5">
				<label
					htmlFor="text-font"
					className="text-xs font-medium text-muted-foreground"
				>
					Font
				</label>
				<Select
					value={font.family}
					onValueChange={(family) => onChange({ family })}
				>
					<SelectTrigger id="text-font" size="sm" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{FONT_FAMILIES.map((f) => (
							<SelectItem key={f.value} value={f.value}>
								{f.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex w-20 flex-col gap-1.5">
				<label
					htmlFor="text-size"
					className="text-xs font-medium text-muted-foreground"
				>
					Size
				</label>
				<Input
					id="text-size"
					type="number"
					min={6}
					max={200}
					value={font.pointSize}
					onChange={(e) =>
						onChange({ pointSize: Math.max(1, Number(e.target.value) || 0) })
					}
				/>
			</div>
		</div>
	);
}

function FontStyleFields({
	font,
	onChange,
}: {
	font: FontInfo;
	onChange: (patch: Partial<FontInfo>) => void;
}) {
	return (
		<>
			<FontFamilyAndSizeRow font={font} onChange={onChange} />
			<div className="flex items-end justify-between gap-3">
				<div className="flex flex-col gap-1.5">
					<span className="text-xs font-medium text-muted-foreground">
						Style
					</span>
					<div className="flex gap-1">
						{STYLE_TOGGLES.map(({ key, label, className }) => (
							<Button
								key={key}
								type="button"
								size="icon"
								variant={font[key] ? "default" : "outline"}
								aria-pressed={font[key]}
								onClick={() => onChange({ [key]: !font[key] })}
								className={className}
							>
								{label}
							</Button>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="text-color"
						className="text-xs font-medium text-muted-foreground"
					>
						Color
					</label>
					<input
						id="text-color"
						type="color"
						value={font.color}
						onChange={(e) => onChange({ color: e.target.value })}
						className="h-9 w-12 cursor-pointer rounded-none border border-input bg-transparent p-1"
					/>
				</div>
			</div>
		</>
	);
}

function commitPendingText(
	pendingText: PendingText,
	trimmed: string,
	font: FontInfo,
): void {
	const controller = PlacementController.instance;
	if (pendingText.mode === "place") {
		// Empty content in place mode → cancel (nothing to create).
		if (trimmed) {
			controller?.placeText(pendingText.x, pendingText.y, trimmed, font);
		}
		return;
	}
	// Edit mode → restyle/rename, or delete when cleared.
	controller?.updateTextAt(pendingText.tx, pendingText.ty, trimmed, font);
}

/**
 * Modal dialog shown after the user clicks the canvas with the Text tool active.
 * In `place` mode it collects content and styling for a new standalone text; in
 * `edit` mode it pre-fills the existing content/style and either restyles/renames
 * the text or (on empty confirm) deletes it and unlinks it everywhere.
 */
export function TextInputDialog({ open, onOpenChange }: TextInputDialogProps) {
	const pendingText = useEditorStore((s) => s.pendingText);
	const setPendingText = useEditorStore((s) => s.setPendingText);
	const [content, setContent] = useState("");
	const [font, setFont] = useState<FontInfo>(defaultFontInfo);

	// Prevent re-entrant execution when Radix Dialog re-dispatches the same
	// confirmation event (Enter key or button click).
	const confirmingRef = useRef(false);

	// Pre-fill from the existing text when opening in edit mode, else reset.
	useEffect(() => {
		const draft = loadPendingTextDraft(pendingText);
		setContent(draft.content);
		setFont(draft.font);
	}, [pendingText]);

	const handleCancel = () => {
		setContent("");
		setPendingText(null);
		onOpenChange(false);
	};

	const handleConfirm = () => {
		if (confirmingRef.current) return;
		if (!pendingText) return handleCancel();
		confirmingRef.current = true;
		try {
			commitPendingText(pendingText, content.trim(), font);
		} finally {
			handleCancel();
			confirmingRef.current = false;
		}
	};

	return (
		<TextPromptDialog
			open={open}
			onOpenChange={onOpenChange}
			title={pendingText?.mode === "edit" ? "Edit Text" : "Add Text"}
			inputId="text-content"
			label="Content"
			placeholder="Enter text…"
			value={content}
			onValueChange={setContent}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		>
			<FontStyleFields
				font={font}
				onChange={(patch) => setFont((prev) => ({ ...prev, ...patch }))}
			/>
		</TextPromptDialog>
	);
}
