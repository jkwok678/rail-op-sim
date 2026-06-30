import { useState } from "react";
import { PlacementController } from "#/engine/PlacementController";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { useEditorStore } from "#/store/editor-store";

interface TextInputDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog shown after the user clicks on the canvas with the text tool
 * active. Collects text content and places the element at the clicked location.
 */
export function TextInputDialog({ open, onOpenChange }: TextInputDialogProps) {
	const pendingTextLocation = useEditorStore((s) => s.pendingTextLocation);
	const setPendingTextLocation = useEditorStore((s) => s.setPendingTextLocation);

	const [content, setContent] = useState("");

	const handleConfirm = () => {
		const trimmed = content.trim();
		if (!trimmed || !pendingTextLocation) {
			handleCancel();
			return;
		}

		PlacementController.instance?.placeText(
			pendingTextLocation.x,
			pendingTextLocation.y,
			trimmed,
		);

		setContent("");
		setPendingTextLocation(null);
		onOpenChange(false);
	};

	const handleCancel = () => {
		setContent("");
		setPendingTextLocation(null);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				onEscapeKeyDown={handleCancel}
				onPointerDownOutside={handleCancel}
			>
				<DialogHeader>
					<DialogTitle>Add Text</DialogTitle>
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
							if (e.key === "Enter") handleConfirm();
							if (e.key === "Escape") handleCancel();
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
