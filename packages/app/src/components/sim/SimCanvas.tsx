import { ErrorBoundary } from "#/components/ErrorBoundary";
import { usePixiApp } from "#/hooks/usePixiApp";
import { PanControls } from "./PanControls";
import { ZoomSlider } from "./ZoomSlider";

/**
 * Thin wrapper that owns the PixiJS canvas lifecycle via usePixiApp.
 * Renders a full-size div that the hook fills with the canvas element.
 *
 * The overlay controls sit in boundaries of their own: this component's
 * unmount destroys the placement controller, which owns the railway, so a bug
 * in a control must never be able to unmount it.
 */
export function SimCanvas() {
	const { containerRef, viewportRef } = usePixiApp();

	return (
		<div className="size-full relative overflow-hidden bg-background">
			<div ref={containerRef} className="absolute inset-0" />
			<ErrorBoundary name="Pan controls" fallback={() => null}>
				<PanControls viewportRef={viewportRef} />
			</ErrorBoundary>
			<ErrorBoundary name="Zoom slider" fallback={() => null}>
				<ZoomSlider viewportRef={viewportRef} />
			</ErrorBoundary>
		</div>
	);
}
