import { usePixiApp } from "#/hooks/usePixiApp";

/**
 * Thin wrapper that owns the PixiJS canvas lifecycle via usePixiApp.
 * Renders a full-size div that the hook fills with the canvas element.
 */
export function SimCanvas() {
	const { containerRef } = usePixiApp();

	return (
		<div ref={containerRef} className="size-full relative overflow-hidden bg-background" />
	);
}
