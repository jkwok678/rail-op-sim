import {
	CaretDown,
	CaretLeft,
	CaretRight,
	CaretUp,
} from "@phosphor-icons/react";
import type React from "react";
import { PAN_BUTTON_STEP } from "#/engine/panConstants";
import type { ViewportController } from "#/engine/ViewportController";
import { Button } from "../ui/button";

interface PanControlsProps {
	viewportRef: React.RefObject<ViewportController | null>;
}

/**
 * Floating D-pad for nudging the viewport left/right/up/down without a drag.
 * Mirrors the arrow-key sign convention in ViewportController: a direction
 * button reveals content in that direction (the world shifts the opposite way).
 */
export function PanControls({ viewportRef }: PanControlsProps) {
	const pan = (dx: number, dy: number) => {
		viewportRef.current?.panBy(dx, dy);
	};

	return (
		<div className="absolute bottom-4 left-4 z-10 grid grid-cols-3 grid-rows-3 gap-0.5 rounded-xl border bg-background/80 backdrop-blur-sm p-1 shadow-sm">
			<div className="col-start-2 row-start-1">
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => pan(0, PAN_BUTTON_STEP)}
					title="Pan up"
					className="rounded-lg"
				>
					<CaretUp />
				</Button>
			</div>
			<div className="col-start-1 row-start-2">
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => pan(PAN_BUTTON_STEP, 0)}
					title="Pan left"
					className="rounded-lg"
				>
					<CaretLeft />
				</Button>
			</div>
			<div className="col-start-3 row-start-2">
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => pan(-PAN_BUTTON_STEP, 0)}
					title="Pan right"
					className="rounded-lg"
				>
					<CaretRight />
				</Button>
			</div>
			<div className="col-start-2 row-start-3">
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={() => pan(0, -PAN_BUTTON_STEP)}
					title="Pan down"
					className="rounded-lg"
				>
					<CaretDown />
				</Button>
			</div>
		</div>
	);
}
