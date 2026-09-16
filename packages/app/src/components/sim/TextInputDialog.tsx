import type { FontInfo } from "@rail-op-sim/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { PlacementController } from "#/engine/PlacementController";
import { normalizeCssColor } from "#/lib/svgColors";
import { useEditorStore } from "#/store/editor-store";

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
	const [family, setFamily] = useState<string>(DEFAULT_FAMILY);
	const [pointSize, setPointSize] = useState(DEFAULT_POINT_SIZE);
	const [bold, setBold] = useState(false);
	const [italic, setItalic] = useState(false);
	const [underline, setUnderline] = useState(false);
	const [strikethrough, setStrikethrough] = useState(false);
	const [color, setColor] = useState(() =>
		normalizeCssColor("var(--foreground)"),
	);

	// Prevent re-entrant execution when Radix Dialog re-dispatches the same
	// confirmation event (Enter key or button click).
	const confirmingRef = useRef(false);

	// Pre-fill from the existing text when opening in edit mode, else reset.
	useEffect(() => {
		const foreground = normalizeCssColor("var(--foreground)");
		if (pendingText?.mode === "edit") {
			const text = PlacementController.instance?.getTextByLocation(
				pendingText.tx,
				pendingText.ty,
			);
			setContent(text?.getReadableText() ?? "");
			const font = text?.getFont();
			setFamily(font?.family ?? DEFAULT_FAMILY);
			setPointSize(font?.pointSize ?? DEFAULT_POINT_SIZE);
			setBold(font?.bold ?? false);
			setItalic(font?.italic ?? false);
			setUnderline(font?.underline ?? false);
			setStrikethrough(font?.strikethrough ?? false);
			setColor(font?.color ?? foreground);
		} else {
			setContent("");
			setFamily(DEFAULT_FAMILY);
			setPointSize(DEFAULT_POINT_SIZE);
			setBold(false);
			setItalic(false);
			setUnderline(false);
			setStrikethrough(false);
			setColor(foreground);
		}
	}, [pendingText]);

	const buildFont = (): FontInfo => ({
		family,
		pointSize,
		bold,
		italic,
		underline,
		strikethrough,
		color,
	});

	const handleConfirm = () => {
		if (confirmingRef.current) return;
		if (!pendingText) {
			handleCancel();
			return;
		}

		confirmingRef.current = true;
		const trimmed = content.trim();
		try {
			const controller = PlacementController.instance;
			if (pendingText.mode === "place") {
				// Empty content in place mode → cancel (nothing to create).
				if (trimmed)
					controller?.placeText(
						pendingText.x,
						pendingText.y,
						trimmed,
						buildFont(),
					);
			} else {
				// Edit mode → restyle/rename, or delete when cleared.
				controller?.updateTextAt(
					pendingText.tx,
					pendingText.ty,
					trimmed,
					buildFont(),
				);
			}
		} finally {
			setContent("");
			setPendingText(null);
			onOpenChange(false);
			confirmingRef.current = false;
		}
	};

	const handleCancel = () => {
		setContent("");
		setPendingText(null);
		onOpenChange(false);
	};

	const title = pendingText?.mode === "edit" ? "Edit Text" : "Add Text";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				// Radix dismisses from a capture-phase listener on document; stopping
				// propagation here keeps the global Escape from *also* firing and
				// cancelling the tool gesture sitting underneath this dialog.
				onEscapeKeyDown={(e) => {
					e.stopPropagation();
					handleCancel();
				}}
				onPointerDownOutside={handleCancel}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-1.5">
					<label
						htmlFor="text-content"
						className="text-xs font-medium text-muted-foreground"
					>
						Content
					</label>
					<Input
						id="text-content"
						placeholder="Enter text…"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								e.stopPropagation();
								handleConfirm();
							}
							if (e.key === "Escape") {
								e.preventDefault();
								e.stopPropagation();
								handleCancel();
							}
						}}
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus
					/>
				</div>

				<div className="flex gap-3">
					<div className="flex flex-1 flex-col gap-1.5">
						<label
							htmlFor="text-font"
							className="text-xs font-medium text-muted-foreground"
						>
							Font
						</label>
						<Select value={family} onValueChange={setFamily}>
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
							value={pointSize}
							onChange={(e) =>
								setPointSize(Math.max(1, Number(e.target.value) || 0))
							}
						/>
					</div>
				</div>

				<div className="flex items-end justify-between gap-3">
					<div className="flex flex-col gap-1.5">
						<span className="text-xs font-medium text-muted-foreground">
							Style
						</span>
						<div className="flex gap-1">
							<Button
								type="button"
								size="icon"
								variant={bold ? "default" : "outline"}
								aria-pressed={bold}
								onClick={() => setBold((v) => !v)}
								className="font-bold"
							>
								B
							</Button>
							<Button
								type="button"
								size="icon"
								variant={italic ? "default" : "outline"}
								aria-pressed={italic}
								onClick={() => setItalic((v) => !v)}
								className="italic"
							>
								I
							</Button>
							<Button
								type="button"
								size="icon"
								variant={underline ? "default" : "outline"}
								aria-pressed={underline}
								onClick={() => setUnderline((v) => !v)}
								className="underline"
							>
								U
							</Button>
							<Button
								type="button"
								size="icon"
								variant={strikethrough ? "default" : "outline"}
								aria-pressed={strikethrough}
								onClick={() => setStrikethrough((v) => !v)}
								className="line-through"
							>
								S
							</Button>
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
							value={color}
							onChange={(e) => setColor(e.target.value)}
							className="h-9 w-12 cursor-pointer rounded-none border border-input bg-transparent p-1"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" size="sm" onClick={handleCancel}>
						Cancel
					</Button>
					<Button size="sm" onClick={handleConfirm}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
