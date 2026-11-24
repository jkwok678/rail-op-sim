import { Minus, Plus } from "@phosphor-icons/react";
import type React from "react";
import type { ViewportController } from "#/editor/ViewportController";
import { shortcutDisplay } from "#/lib/shortcuts";
import { zoomIn, zoomOut } from "#/lib/viewportActions";
import {
	DEFAULT_MAX_ZOOM,
	DEFAULT_MIN_ZOOM,
	ZOOM_SLIDER_STEP,
} from "#/lib/zoomConstants";
import { useEditorStore } from "#/store/editor-store";
import { Button } from "../ui/button";

interface ZoomSliderProps {
	viewportRef: React.RefObject<ViewportController | null>;
}

export function ZoomSlider({ viewportRef }: ZoomSliderProps) {
	const zoom = useEditorStore((s) => s.zoom);

	// The clamping lives in viewportActions so these buttons and their hotkeys
	// can't drift apart.
	const handleZoomIn = () => zoomIn(viewportRef.current);
	const handleZoomOut = () => zoomOut(viewportRef.current);

	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (viewportRef.current) {
			viewportRef.current.zoomTo(Number(e.target.value));
		}
	};

	return (
		<div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-xl border bg-background/80 backdrop-blur-sm p-1 shadow-sm">
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={handleZoomOut}
				title={`Zoom out (${shortcutDisplay("zoomOut")})`}
				className="rounded-lg"
			>
				<Minus />
			</Button>

			<input
				type="range"
				min={DEFAULT_MIN_ZOOM}
				max={DEFAULT_MAX_ZOOM}
				step={ZOOM_SLIDER_STEP}
				value={zoom}
				onChange={handleSliderChange}
				className="w-24 accent-primary cursor-pointer"
			/>

			<Button
				variant="ghost"
				size="icon-xs"
				onClick={handleZoomIn}
				title={`Zoom in (${shortcutDisplay("zoomIn")})`}
				className="rounded-lg"
			>
				<Plus />
			</Button>

			<span className="w-10 text-center text-xs font-medium tabular-nums text-muted-foreground mr-1">
				{Math.round(zoom * 100)}%
			</span>
		</div>
	);
}
