import type * as React from "react";

import { cn } from "#/lib/utils.ts";

/**
 * A single key cap. Carries `data-slot="kbd"`, which the tooltip styles already
 * target, so it sits correctly inside a TooltipContent as well as standalone.
 *
 * Colours come from `currentColor`, so one cap reads correctly on the dark
 * tooltip and on a light panel without either side knowing about the other.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				"inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center px-1",
				"font-sans text-[10px] font-semibold leading-none tabular-nums",
				"border border-current/20 bg-current/10 text-current/90",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * A shortcut's keys, one cap each — "⌘ S" becomes two caps rather than one wide
 * badge. Renders nothing for an empty list, which is how a platform-dependent
 * key stays out of the server-rendered pass.
 */
function KbdGroup({
	keys,
	className,
	...props
}: React.ComponentProps<"span"> & { keys: string[] }) {
	if (keys.length === 0) return null;
	return (
		<span
			className={cn("inline-flex shrink-0 items-center gap-0.5", className)}
			{...props}
		>
			{/* The cap text is a safe React key: a combo can't repeat a cap, since
			    "Ctrl+Ctrl" is not a hotkey. */}
			{keys.map((key) => (
				<Kbd key={key}>{key}</Kbd>
			))}
		</span>
	);
}

export { Kbd, KbdGroup };
