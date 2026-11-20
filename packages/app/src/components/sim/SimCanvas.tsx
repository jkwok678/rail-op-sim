import { ErrorBoundary } from "#/components/ErrorBoundary";
import { useAutoSave } from "#/hooks/useAutoSave";
import { usePixiApp } from "#/hooks/usePixiApp";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { CanvasState } from "./CanvasState";
import { PanControls } from "./PanControls";
import { ZoomSlider } from "./ZoomSlider";

function CanvasOverlayState({
	status,
	error,
	showEmpty,
}: {
	status: ReturnType<typeof usePixiApp>["status"];
	error: string | null;
	showEmpty: boolean;
}) {
	if (status === "loading") return <CanvasState variant="loading" />;
	if (status === "error")
		return <CanvasState variant="error" message={error} />;
	return showEmpty ? <CanvasState variant="empty" /> : null;
}

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
	useAutoSave(status === "ready");
	const railwayMode = useModeStore((s) => s.mode === "railway");
	const isEmpty = useEditorStore((s) => (s.trackStatus?.total ?? 0) === 0);

	return (
		<div className="size-full relative overflow-hidden bg-background">
			<div ref={containerRef} className="absolute inset-0" />
			<ErrorBoundary name="Pan controls" fallback={() => null}>
				<PanControls viewportRef={viewportRef} />
			</ErrorBoundary>
			<ErrorBoundary name="Zoom slider" fallback={() => null}>
				<ZoomSlider viewportRef={viewportRef} />
			</ErrorBoundary>
			<CanvasOverlayState
				status={status}
				error={error}
				showEmpty={railwayMode && isEmpty}
			/>
		</div>
	);
}
