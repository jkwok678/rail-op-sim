import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { KbdGroup } from "#/components/ui/kbd";
import {
	isPlatformDependent,
	SHORTCUT_GROUPS,
	shortcutKeys,
	shortcutsInGroup,
} from "#/lib/shortcuts";
import { useEditorStore } from "#/store/editor-store";

/**
 * The `?` reference overlay. Rendered straight from the `SHORTCUTS` registry, so
 * it lists exactly what is bound — there is no second list to keep in step.
 */
export function ShortcutsDialog() {
	const showShortcuts = useEditorStore((s) => s.showShortcuts);
	const setShortcuts = useEditorStore((s) => s.setShortcuts);

	// Mod renders as ⌘ or Ctrl depending on the platform, which the server can't
	// know; hold those badges back until mounted rather than mismatch on hydration.
	// The dialog only ever renders after an interaction anyway — this is belt and
	// braces, and costs nothing.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<Dialog open={showShortcuts} onOpenChange={setShortcuts}>
			<DialogContent
				className="sm:max-w-lg"
				// Radix dismisses on Escape from a capture-phase listener; without
				// this the global Escape would also run and cancel whatever tool
				// gesture is sitting underneath the overlay.
				onEscapeKeyDown={(e) => e.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle>Keyboard shortcuts</DialogTitle>
					<DialogDescription>
						Hold Space or use the arrow keys to pan; scroll to zoom.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
					{SHORTCUT_GROUPS.map((group) => (
						<section key={group}>
							<h3 className="mb-1 font-medium text-muted-foreground text-[10px] uppercase tracking-wide">
								{group}
							</h3>
							<dl className="space-y-1">
								{shortcutsInGroup(group).map((shortcut) => (
									<div
										key={shortcut.id}
										className="flex items-baseline justify-between gap-3"
									>
										{/* A dotted leader ties each label to its keys, so the
										    eye doesn't have to cross a gap of empty space in a
										    two-column list. */}
										<dt className="shrink text-muted-foreground">
											{shortcut.label}
										</dt>
										<span
											aria-hidden
											className="min-w-3 flex-1 translate-y-[-0.2em] border-border border-b border-dotted"
										/>
										<dd className="shrink-0">
											<KbdGroup
												keys={
													isPlatformDependent(shortcut.id) && !mounted
														? []
														: shortcutKeys(shortcut.id)
												}
											/>
										</dd>
									</div>
								))}
							</dl>
						</section>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}
