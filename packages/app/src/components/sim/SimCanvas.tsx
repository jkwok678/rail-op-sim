import { usePixiApp } from "#/hooks/usePixiApp";
import { PanControls } from "./PanControls";
import { ZoomSlider } from "./ZoomSlider";

/**
 * Thin wrapper that owns the PixiJS canvas lifecycle via usePixiApp.
 * Renders a full-size div that the hook fills with the canvas element.
 */
export function SimCanvas() {
	const { containerRef, viewportRef } = usePixiApp();

	return (
		<div className="size-full relative overflow-hidden bg-background">
			<div ref={containerRef} className="absolute inset-0" />
			<PanControls viewportRef={viewportRef} />
			<ZoomSlider viewportRef={viewportRef} />
		</div>
	);
}
