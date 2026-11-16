import { Button } from "#/components/ui/button";
import { Spinner } from "#/components/ui/spinner";

/**
 * What sits over the canvas when there is nothing to draw yet:
 *
 * - `loading` — PixiJS is still starting.
 * - `error` — it could not start; the canvas will not appear without a reload.
 * - `empty` — the canvas is up but the railway has no track. Passive: it must
 *   not catch the first click, which is the user placing their first piece.
 *
 * Plain props only, so it can be shown and tested without PixiJS.
 */
export type CanvasStateProps =
	| { variant: "loading" }
	| { variant: "error"; message: string | null }
	| { variant: "empty" };

export function CanvasState(props: CanvasStateProps) {
	switch (props.variant) {
		case "loading":
			return (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
					<Spinner label="Loading the canvas" className="size-6" />
					<p>Loading the canvas…</p>
				</div>
			);
		case "error":
			return (
				<div className="absolute inset-0 flex items-center justify-center p-4">
					<div
						role="alert"
						className="flex max-w-sm flex-col gap-2 rounded-xl border border-destructive/30 bg-background/95 p-4 text-xs shadow-sm"
					>
						<p className="text-sm font-medium text-destructive">
							The canvas could not start
						</p>
						{props.message ? (
							<p className="break-words text-muted-foreground">
								{props.message}
							</p>
						) : null}
						<p className="text-muted-foreground">
							WebGL may be unavailable in this browser, or turned off.
						</p>
						<Button
							size="sm"
							className="self-start"
							onClick={() => window.location.reload()}
						>
							Reload
						</Button>
					</div>
				</div>
			);
		case "empty":
			return (
				<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
					<p className="text-sm font-medium text-foreground/70">
						Start your railway
					</p>
					<p className="max-w-xs text-xs text-muted-foreground">
						Pick a track piece from the Add palette, then click the grid to
						place it — or load a saved railway with the folder button below.
					</p>
				</div>
			);
	}
}
