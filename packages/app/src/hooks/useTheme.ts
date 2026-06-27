import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";

function getInitial(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	// Match the inline script in __root.tsx: localStorage first, then system preference
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "dark" || stored === "light") return stored;
	} catch {
		// localStorage unavailable (private browsing, iframe)
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(theme: "light" | "dark"): void {
	const root = document.documentElement;
	if (theme === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
	try {
		localStorage.setItem(STORAGE_KEY, theme);
	} catch {
		// localStorage unavailable (e.g. private browsing, storage full, sandboxed iframe)
	}
}

export function useTheme() {
	const [theme, setTheme] = useState<"light" | "dark">(getInitial);

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const toggle = useCallback(() => {
		setTheme((prev) => (prev === "light" ? "dark" : "light"));
	}, []);

	return { theme, toggle } as const;
}
