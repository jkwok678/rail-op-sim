import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";

interface TextPromptDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	inputId: string;
	label: string;
	placeholder: string;
	value: string;
	onValueChange: (value: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
	children?: ReactNode;
}

function handlePromptKeyDown(
	e: React.KeyboardEvent<HTMLInputElement>,
	onConfirm: () => void,
	onCancel: () => void,
): void {
	if (e.key === "Enter") {
		e.preventDefault();
		e.stopPropagation();
		onConfirm();
	} else if (e.key === "Escape") {
		e.preventDefault();
		e.stopPropagation();
		onCancel();
	}
}

/**
 * Shared modal prompt shell for naming elements and editing standalone canvas
 * text. Stops Escape propagation so dismissing the dialog does not also cancel
 * the underlying canvas gesture.
 */
export function TextPromptDialog(props: TextPromptDialogProps) {
	const { open, onOpenChange, title, inputId, label, placeholder } = props;
	const { value, onValueChange, onConfirm, onCancel, children } = props;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				onEscapeKeyDown={(e) => {
					// Radix dismisses from a capture-phase listener on document; stopping
					// propagation here keeps the global Escape from *also* firing and
					// cancelling the tool gesture sitting underneath this dialog.
					e.stopPropagation();
					onCancel();
				}}
				onPointerDownOutside={onCancel}
			>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-1.5">
					<label
						htmlFor={inputId}
						className="text-xs font-medium text-muted-foreground"
					>
						{label}
					</label>
					<Input
						id={inputId}
						placeholder={placeholder}
						value={value}
						onChange={(e) => onValueChange(e.target.value)}
						onKeyDown={(e) => handlePromptKeyDown(e, onConfirm, onCancel)}
						autoFocus
					/>
				</div>
				{children}
				<DialogFooter>
					<Button variant="outline" size="sm" onClick={onCancel}>
						Cancel
					</Button>
					<Button size="sm" onClick={onConfirm}>
						Confirm
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
