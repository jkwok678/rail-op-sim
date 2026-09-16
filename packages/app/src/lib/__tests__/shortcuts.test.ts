import { describe, expect, it } from "vitest";
import {
	isPlatformDependent,
	SHORTCUT_GROUPS,
	SHORTCUT_ORDER,
	SHORTCUTS,
	type ShortcutId,
	shortcutDisplay,
	shortcutKeys,
	shortcutsInGroup,
} from "#/lib/shortcuts";

/** A hotkey in the stable form used to compare two registrations. */
const canonical = (id: ShortcutId): string => {
	const { hotkey } = SHORTCUTS[id];
	return typeof hotkey === "string" ? hotkey : JSON.stringify(hotkey);
};

describe("shortcut registry", () => {
	// The real drift guard: two globally-bound shortcuts on the same key means one
	// of them silently never fires.
	it("binds no key twice globally", () => {
		const seen = new Map<string, ShortcutId>();
		for (const id of SHORTCUT_ORDER) {
			const key = canonical(id);
			expect(seen.has(key), `${id} and ${seen.get(key)} both bind ${key}`).toBe(
				false,
			);
			seen.set(key, id);
		}
	});

	it("registers every shortcut that isn't scoped elsewhere", () => {
		const global = (Object.keys(SHORTCUTS) as ShortcutId[]).filter(
			(id) => !SHORTCUTS[id].scoped,
		);
		expect([...SHORTCUT_ORDER].sort()).toEqual([...global].sort());
	});

	it("keeps each entry's id matching its key", () => {
		for (const [key, shortcut] of Object.entries(SHORTCUTS)) {
			expect(shortcut.id).toBe(key);
		}
	});

	it("lists every shortcut under exactly one overlay group", () => {
		const listed = SHORTCUT_GROUPS.flatMap(shortcutsInGroup).map((s) => s.id);
		expect([...listed].sort()).toEqual(
			[...(Object.keys(SHORTCUTS) as ShortcutId[])].sort(),
		);
	});
});

describe("shortcutDisplay", () => {
	it("resolves Mod per platform", () => {
		expect(shortcutDisplay("save", "mac")).toBe("⌘ S");
		expect(shortcutDisplay("save", "windows")).toBe("Ctrl+S");
	});

	// Bound as an object because "Shift+/" is not in the library's Hotkey union;
	// the badge must still read as the key the user presses.
	it("shows the help key as ?, not as a Shift combo", () => {
		expect(shortcutDisplay("help", "mac")).toBe("?");
		expect(shortcutDisplay("help", "windows")).toBe("?");
	});

	it("renders tool digits the same on every platform", () => {
		expect(shortcutDisplay("toolAdd", "mac")).toBe(
			shortcutDisplay("toolAdd", "windows"),
		);
	});
});

describe("isPlatformDependent", () => {
	it("flags exactly the Mod-bearing shortcuts", () => {
		expect(isPlatformDependent("save")).toBe(true);
		expect(isPlatformDependent("undo")).toBe(true);
		expect(isPlatformDependent("toolSelect")).toBe(false);
		expect(isPlatformDependent("help")).toBe(false);
	});

	// Anything flagged must actually differ, or it is held back from SSR for
	// nothing; anything not flagged must be identical, or it mismatches on
	// hydration.
	it("agrees with what the formatter actually does", () => {
		for (const id of Object.keys(SHORTCUTS) as ShortcutId[]) {
			const differs =
				shortcutDisplay(id, "mac") !== shortcutDisplay(id, "windows");
			expect(isPlatformDependent(id), `${id}`).toBe(differs);
		}
	});
});

describe("shortcutKeys", () => {
	it("splits a combo into one cap per key", () => {
		expect(shortcutKeys("save", "mac")).toEqual(["\u2318", "S"]);
		expect(shortcutKeys("save", "windows")).toEqual(["Ctrl", "S"]);
		expect(shortcutKeys("redo", "windows")).toEqual(["Ctrl", "Shift", "Z"]);
	});

	it("gives a single cap for a single key", () => {
		expect(shortcutKeys("toolAdd", "mac")).toEqual(["2"]);
		expect(shortcutKeys("help", "mac")).toEqual(["?"]);
	});

	// The separator is a sentinel precisely so a key that *is* punctuation can't
	// be mistaken for one.
	it("does not split a key that looks like a separator", () => {
		expect(shortcutKeys("zoomOut", "mac")).toEqual(["-"]);
		expect(shortcutKeys("zoomIn", "mac")).toEqual(["="]);
	});

	it("never yields an empty cap", () => {
		for (const id of Object.keys(SHORTCUTS) as ShortcutId[]) {
			for (const platform of ["mac", "windows"] as const) {
				const caps = shortcutKeys(id, platform);
				expect(caps.length, `${id}`).toBeGreaterThan(0);
				for (const cap of caps) expect(cap, `${id}`).not.toBe("");
			}
		}
	});

	// The caps are what the user reads; they must say the same thing the
	// single-string form does, or the overlay and a title attribute disagree.
	it("agrees with the single-string form", () => {
		for (const id of Object.keys(SHORTCUTS) as ShortcutId[]) {
			for (const platform of ["mac", "windows"] as const) {
				const joined = shortcutKeys(id, platform).join("");
				const display = shortcutDisplay(id, platform).replace(/[+ ]/g, "");
				expect(joined, `${id} on ${platform}`).toBe(display);
			}
		}
	});
});
