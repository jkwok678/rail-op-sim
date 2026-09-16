import type { NamedElement } from "@rail-op-sim/shared";
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
import type { NameableKind } from "#/store/editor-store";
import { useEditorStore } from "#/store/editor-store";

interface NameElementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Human-readable dialog title for each nameable element kind. */
const KIND_TITLES: Record<NameableKind, string> = {
	namedLocation: "Name Location",
	concourse: "Name Concourse",
	platform: "Name Platform",
	bridgeUnderpass: "Name Bridge / Underpass",
};

/**
 * Look up the NamedElement at (gx, gy) for the given kind.
 * Returns null if no matching element exists.
 */
function getElementAt(
	map: NonNullable<PlacementController["map"]>,
	gx: number,
	gy: number,
	kind: NameableKind,
): NamedElement | null {
	switch (kind) {
		case "namedLocation":
			return map.getNamedLocationAt(gx, gy);
		case "concourse":
			return map.getConcourseAt(gx, gy);
		case "platform":
		case "bridgeUnderpass":
			return map.getTrackAt(gx, gy);
	}
}

/**
 * Modal dialog shown after the user clicks a nameable element (NamedLocation,
 * Concourse, platform track, or bridge/underpass) with the Text tool active.
 * Allows setting, changing, or deleting the label on the element and its
 * cardinally-adjacent group.
 */
export function NameElementDialog({
	open,
	onOpenChange,
}: NameElementDialogProps) {
	const pendingNameTarget = useEditorStore((s) => s.pendingNameTarget);
	const setPendingNameTarget = useEditorStore((s) => s.setPendingNameTarget);

	const controller = PlacementController.instance;
	const map = controller?.map;

	const [content, setContent] = useState("");

	// Prevent re-entrant execution when Radix Dialog re-dispatches the same
	// confirmation event (Enter key or button click).
	const confirmingRef = useRef(false);

	// Pre-fill the input from the current label when the dialog opens for a new target.
	useEffect(() => {
		if (!pendingNameTarget || !map) {
			setContent("");
			return;
		}
		const element = getElementAt(
			map,
			pendingNameTarget.gx,
			pendingNameTarget.gy,
			pendingNameTarget.kind,
		);
		setContent(element?.getText()?.getReadableText() ?? "");
	}, [pendingNameTarget, map]);

	const handleConfirm = () => {
		if (confirmingRef.current) return; // gate: already executing
		if (!pendingNameTarget || !map) {
			handleCancel();
			return;
		}

		confirmingRef.current = true;
		const trimmed = content.trim();

		try {
			controller?.nameElementAt(
				pendingNameTarget.gx,
				pendingNameTarget.gy,
				trimmed,
				pendingNameTarget.kind,
			);
		} finally {
			// Always clean up dialog state, even if the model call or PixiJS
			// layer sync throws unexpectedly.
			setContent("");
			setPendingNameTarget(null);
			onOpenChange(false);
			confirmingRef.current = false;
		}
	};

	const handleCancel = () => {
		setContent("");
		setPendingNameTarget(null);
		onOpenChange(false);
	};

	const title = pendingNameTarget
		? KIND_TITLES[pendingNameTarget.kind]
		: "Name Element";

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
						htmlFor="name-content"
						className="text-xs font-medium text-muted-foreground"
					>
						Label
					</label>
					<Input
						id="name-content"
						placeholder="Enter name…"
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
