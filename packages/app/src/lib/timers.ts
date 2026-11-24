/**
 * why: the one place app code starts a timeout or interval. Each helper hands
 * back its own cancel, so an effect can return it directly and no caller
 * juggles timer ids; `pnpm guardrails` keeps raw timer calls out of every
 * other file. Add `requestAnimationFrame` helpers here when something needs one.
 */
export type Cancel = () => void;

export function after(ms: number, run: () => void): Cancel {
	const id = setTimeout(run, ms);
	return () => clearTimeout(id);
}

export function every(ms: number, run: () => void): Cancel {
	const id = setInterval(run, ms);
	return () => clearInterval(id);
}
