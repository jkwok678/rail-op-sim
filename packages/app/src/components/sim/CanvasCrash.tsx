import { Button } from "#/components/ui/button";

/**
 * The canvas's own crash fallback. Says plainly that retrying starts over: the
 * railway lives in the canvas's controller, and that is what just went down.
 */
export function CanvasCrash({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<div className="flex size-full items-center justify-center bg-background p-4">
			<div
				role="alert"
				className="flex max-w-sm flex-col gap-2 rounded-xl border border-destructive/30 bg-background p-4 text-xs shadow-sm"
			>
				<p className="text-sm font-medium text-destructive">
					The canvas stopped working
				</p>
				<p className="break-words text-muted-foreground">{error.message}</p>
				<p className="text-muted-foreground">
					Trying again starts with an empty canvas — any railway edits you have
					not saved are lost.
				</p>
				<Button size="sm" className="self-start" onClick={reset}>
					Try again
				</Button>
			</div>
		</div>
	);
}
