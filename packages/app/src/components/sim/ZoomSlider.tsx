import { Minus, Plus } from "@phosphor-icons/react";
import type React from "react";
import type { ViewportController } from "#/engine/ViewportController";
import {
	DEFAULT_MAX_ZOOM,
	DEFAULT_MIN_ZOOM,
	ZOOM_BUTTON_STEP,
	ZOOM_SLIDER_STEP,
} from "#/engine/zoomConstants";
import { useEditorStore } from "#/store/editor-store";
import { Button } from "../ui/button";

interface ZoomSliderProps {
	viewportRef: React.RefObject<ViewportController | null>;
}

export function ZoomSlider({ viewportRef }: ZoomSliderProps) {
	const zoom = useEditorStore((s) => s.zoom);

	const handleZoomIn = () => {
		if (viewportRef.current) {
			const newZoom = Math.min(
				DEFAULT_MAX_ZOOM,
				viewportRef.current.state.zoom + ZOOM_BUTTON_STEP,
			);
			viewportRef.current.zoomTo(newZoom);
		}
	};

	const handleZoomOut = () => {
		if (viewportRef.current) {
			const newZoom = Math.max(
				DEFAULT_MIN_ZOOM,
				viewportRef.current.state.zoom - ZOOM_BUTTON_STEP,
			);
			viewportRef.current.zoomTo(newZoom);
		}
	};

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
				title="Zoom out"
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
				title="Zoom in"
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
