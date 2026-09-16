import { Check, GearSix } from "@phosphor-icons/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Button } from "#/components/ui/button";
import { KbdGroup } from "#/components/ui/kbd";
import { Separator } from "#/components/ui/separator";
import type { MapFileFormat } from "#/lib/mapFile";
import { shortcutKeys } from "#/lib/shortcuts";
import { useEditorStore } from "#/store/editor-store";

const SAVE_FORMATS: { format: MapFileFormat; label: string }[] = [
	{ format: "json", label: "JSON" },
	{ format: "yaml", label: "YAML" },
];

/**
 * Small settings popover anchored to a gear button in the footer. Holds
 * toggles ("Show track info", "Show grid") and the save encoding; more
 * settings can be added as rows.
 */
export function SettingsMenu() {
	const showTrackInfo = useEditorStore((s) => s.showTrackInfo);
	const toggleShowTrackInfo = useEditorStore((s) => s.toggleShowTrackInfo);
	const showGrid = useEditorStore((s) => s.showGrid);
	const toggleShowGrid = useEditorStore((s) => s.toggleShowGrid);
	const saveFormat = useEditorStore((s) => s.saveFormat);
	const setSaveFormat = useEditorStore((s) => s.setSaveFormat);

	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>
				<Button variant="ghost" size="icon-xs" aria-label="Settings">
					<GearSix />
				</Button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					// Same reason as the dialogs: Escape should close the popover and
					// stop there, not fall through to the editor's Escape cascade.
					onEscapeKeyDown={(e) => e.stopPropagation()}
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
						<span className="inline-flex items-center gap-1.5">
							Show track info
							<KbdGroup keys={shortcutKeys("toggleTrackInfo")} />
						</span>
						<span className="flex size-4 items-center justify-center border border-border [&_svg]:size-3">
							{showTrackInfo ? <Check weight="bold" /> : null}
						</span>
					</button>
					<button
						type="button"
						role="menuitemcheckbox"
						aria-checked={showGrid}
						onClick={toggleShowGrid}
						className="flex w-full items-center justify-between gap-2 px-2 py-1.5 hover:bg-muted hover:text-foreground"
					>
						<span className="inline-flex items-center gap-1.5">
							Show grid
							<KbdGroup keys={shortcutKeys("toggleGrid")} />
						</span>
						<span className="flex size-4 items-center justify-center border border-border [&_svg]:size-3">
							{showGrid ? <Check weight="bold" /> : null}
						</span>
					</button>
					<Separator className="my-1" />
					<div className="flex w-full items-center justify-between gap-2 px-2 py-1.5">
						<span id="save-format-label">Save format</span>
						<fieldset
							className="m-0 flex items-center gap-1 border-0 p-0"
							aria-labelledby="save-format-label"
						>
							{SAVE_FORMATS.map(({ format, label }) => (
								<button
									key={format}
									type="button"
									role="menuitemradio"
									aria-checked={saveFormat === format}
									onClick={() => setSaveFormat(format)}
									className={`px-1.5 py-0.5 ${
										saveFormat === format
											? "bg-muted text-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{label}
								</button>
							))}
						</fieldset>
					</div>
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
