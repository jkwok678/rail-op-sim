import { useEffect, useState } from "react";
import {
	isPlatformDependent,
	type ShortcutId,
	shortcutDisplay,
	shortcutKeys,
} from "#/lib/shortcuts";

/**
 * True once the component has mounted in the browser.
 *
 * The library detects the platform from `navigator`, which is absent on the
 * server and falls back to "linux" — so a Mod-bearing key would render "Ctrl+S"
 * server-side and "⌘ S" after hydration, which React flags as a mismatch. Those
 * keys are held back until this flips.
 */
function useMounted(): boolean {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return mounted;
}

/**
 * A shortcut's keys as separate caps, for {@link KbdGroup}. Empty while a
 * platform-dependent key is still server-rendered, which renders no badge.
 */
export function useShortcutKeys(id: ShortcutId): string[] {
	const mounted = useMounted();
	if (isPlatformDependent(id) && !mounted) return [];
	return shortcutKeys(id);
}

/**
 * A shortcut as one string, for places that can only take text — a `title`
 * attribute, say. Returns "" while held back, which callers treat as "no hint".
 */
export function useShortcutDisplay(id: ShortcutId): string {
	const mounted = useMounted();
	if (isPlatformDependent(id) && !mounted) return "";
	return shortcutDisplay(id);
}
