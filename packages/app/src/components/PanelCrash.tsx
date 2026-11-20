import { WarningCircle } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

/**
 * The compact fallback for a panel that crashed: what stopped, why in small
 * muted text, and a way to try again.
 *
 * Takes `className` (and `style`) so the call site puts it where the panel
 * was — a docked panel fills its dock slot, a floating one keeps its anchor —
 * which keeps the fallbacks from overlapping each other or the canvas.
 * `compact` is for slots too narrow for text: an icon and a retry button, with
 * the sentence kept for screen readers and the tooltip.
 */
export function PanelCrash({
	name,
	error,
	reset,
	className,
	style,
	compact = false,
}: {
	name: string;
	error: Error;
	reset: () => void;
	className?: string;
	style?: CSSProperties;
	compact?: boolean;
}) {
	return (
		<div
			role="alert"
			style={style}
			title={compact ? `${name} stopped working: ${error.message}` : undefined}
			className={cn(
				"flex flex-col gap-1.5 bg-background/95 p-3 text-xs",
				compact && "items-center gap-1 p-1",
				className,
			)}
		>
			{compact ? (
				<>
					<WarningCircle className="size-4 text-destructive" />
					<span className="sr-only">{name} stopped working</span>
				</>
			) : (
				<>
					<p className="font-medium text-destructive">{name} stopped working</p>
					<p className="break-words text-[10px] text-muted-foreground">
						{error.message}
					</p>
				</>
			)}
			<Button
				variant="outline"
				size="xs"
				className="self-start"
				onClick={reset}
			>
				{compact ? "Retry" : "Try again"}
			</Button>
		</div>
	);
}
