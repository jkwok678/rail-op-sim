import type { NamedElement } from "@rail-op-sim/shared";
import { useEffect, useRef, useState } from "react";
import { TextPromptDialog } from "#/components/sim/TextPromptDialog";
import { PlacementController } from "#/editor/PlacementController";
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
		const element =
			pendingNameTarget && map
				? getElementAt(
						map,
						pendingNameTarget.gx,
						pendingNameTarget.gy,
						pendingNameTarget.kind,
					)
				: null;
		setContent(element?.getText()?.getReadableText() ?? "");
	}, [pendingNameTarget, map]);

	const handleCancel = () => {
		setContent("");
		setPendingNameTarget(null);
		onOpenChange(false);
	};

	const handleConfirm = () => {
		if (confirmingRef.current) return; // gate: already executing
		if (!pendingNameTarget || !map) return handleCancel();
		confirmingRef.current = true;
		try {
			controller?.nameElementAt(
				pendingNameTarget.gx,
				pendingNameTarget.gy,
				content.trim(),
				pendingNameTarget.kind,
			);
		} finally {
			// Always clean up dialog state, even if the model call or PixiJS
			// layer sync throws unexpectedly.
			handleCancel();
			confirmingRef.current = false;
		}
	};

	return (
		<TextPromptDialog
			open={open}
			onOpenChange={onOpenChange}
			title={
				pendingNameTarget ? KIND_TITLES[pendingNameTarget.kind] : "Name Element"
			}
			inputId="name-content"
			label="Label"
			placeholder="Enter name…"
			value={content}
			onValueChange={setContent}
			onConfirm={handleConfirm}
			onCancel={handleCancel}
		/>
	);
}
