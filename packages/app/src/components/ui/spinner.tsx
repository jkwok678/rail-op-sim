import { CircleNotch } from "@phosphor-icons/react";

import { cn } from "#/lib/utils.ts";

/**
 * An indeterminate busy indicator. Announces itself as a status with a label
 * (default "Loading"), so a screen reader hears what is being waited for; the
 * glyph alone says nothing. Sizes through `className` like any phosphor icon.
 */
function Spinner({
	label = "Loading",
	className,
}: {
	label?: string;
	className?: string;
}) {
	return (
		<CircleNotch
			role="status"
			aria-label={label}
			className={cn("size-4 animate-spin text-muted-foreground", className)}
		/>
	);
}

export { Spinner };
