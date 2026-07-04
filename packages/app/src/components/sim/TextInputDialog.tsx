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
import { PlacementController } from "#/engine/PlacementController";
import { useEditorStore } from "#/store/editor-store";

interface TextInputDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog shown after the user clicks the canvas with the Text tool active.
 * In `place` mode it collects content for a new standalone text; in `edit` mode
 * it pre-fills the existing content and either renames the text or (on empty
 * confirm) deletes it and unlinks it everywhere.
 */
export function TextInputDialog({ open, onOpenChange }: TextInputDialogProps) {
	const pendingText = useEditorStore((s) => s.pendingText);
	const setPendingText = useEditorStore((s) => s.setPendingText);

	const [content, setContent] = useState("");

	// Prevent re-entrant execution when Radix Dialog re-dispatches the same
	// confirmation event (Enter key or button click).
	const confirmingRef = useRef(false);

	// Pre-fill from the existing text when opening in edit mode.
	useEffect(() => {
		if (pendingText?.mode === "edit") {
			const text = PlacementController.instance?.getTextByLocation(
				pendingText.tx,
				pendingText.ty,
			);
			setContent(text?.getReadableText() ?? "");
		} else {
			setContent("");
		}
	}, [pendingText]);

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
					controller?.placeText(pendingText.x, pendingText.y, trimmed);
			} else {
				// Edit mode → rename, or delete when cleared.
				controller?.updateTextAt(pendingText.tx, pendingText.ty, trimmed);
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
				onEscapeKeyDown={handleCancel}
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
