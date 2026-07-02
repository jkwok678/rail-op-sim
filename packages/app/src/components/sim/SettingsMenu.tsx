import { Check, GearSix } from "@phosphor-icons/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Button } from "#/components/ui/button";
import { useEditorStore } from "#/store/editor-store";

/**
 * Small settings popover anchored to a gear button in the footer. Currently
 * holds a single toggle ("Show track info"); more settings can be added as rows.
 */
export function SettingsMenu() {
	const showTrackInfo = useEditorStore((s) => s.showTrackInfo);
	const toggleShowTrackInfo = useEditorStore((s) => s.toggleShowTrackInfo);

	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>
				<Button variant="ghost" size="icon-xs" aria-label="Settings">
					<GearSix />
				</Button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					side="top"
					align="end"
					sideOffset={4}
					className="z-50 w-52 origin-(--radix-popover-content-transform-origin) rounded-none bg-popover p-1 text-xs text-popover-foreground ring-1 ring-foreground/10 shadow-md duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
				>
					<button
						type="button"
						role="menuitemcheckbox"
						aria-checked={showTrackInfo}
						onClick={toggleShowTrackInfo}
						className="flex w-full items-center justify-between gap-2 px-2 py-1.5 hover:bg-muted hover:text-foreground"
					>
						<span>Show track info</span>
						<span className="flex size-4 items-center justify-center border border-border [&_svg]:size-3">
							{showTrackInfo ? <Check weight="bold" /> : null}
						</span>
					</button>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
