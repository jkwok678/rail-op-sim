import { ErrorBoundary } from "#/components/ErrorBoundary";
import { usePixiApp } from "#/hooks/usePixiApp";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { CanvasState } from "./CanvasState";
import { PanControls } from "./PanControls";
import { ZoomSlider } from "./ZoomSlider";

/**
 * Thin wrapper that owns the PixiJS canvas lifecycle via usePixiApp.
 * Renders a full-size div that the hook fills with the canvas element, and
 * the loading, failed and empty-railway states over it.
 *
 * The overlay controls sit in boundaries of their own: this component's
 * unmount destroys the placement controller, which owns the railway, so a bug
 * in a control must never be able to unmount it.
 */
export function SimCanvas() {
	const { containerRef, viewportRef, status, error } = usePixiApp();
	const mode = useModeStore((s) => s.mode);
	const trackCount = useEditorStore((s) => s.trackStatus?.total ?? 0);

	return (
		<div className="size-full relative overflow-hidden bg-background">
			<div ref={containerRef} className="absolute inset-0" />
			<ErrorBoundary name="Pan controls" fallback={() => null}>
				<PanControls viewportRef={viewportRef} />
			</ErrorBoundary>
			<ErrorBoundary name="Zoom slider" fallback={() => null}>
				<ZoomSlider viewportRef={viewportRef} />
			</ErrorBoundary>
			{status === "loading" ? <CanvasState variant="loading" /> : null}
			{status === "error" ? (
				<CanvasState variant="error" message={error} />
			) : null}
			{status === "ready" && mode === "railway" && trackCount === 0 ? (
				<CanvasState variant="empty" />
			) : null}
		</div>
	);
}
