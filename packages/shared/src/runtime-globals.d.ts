/**
 * Globals that every runtime the engine can run in (browser main thread, Web
 * Worker, Node) provides, but that the ES2022 lib does not declare.
 *
 * packages/shared builds without the DOM lib so that PLAN.md's rule, "engine
 * modules never import from react, pixi.js, or any browser API", is checked by
 * the compiler. Only add a name here if it exists in workers and in Node too;
 * anything browser-only belongs in packages/app.
 */

declare function structuredClone<T>(
	value: T,
	options?: { transfer?: readonly unknown[] },
): T;

interface Console {
	debug(...data: unknown[]): void;
	error(...data: unknown[]): void;
	info(...data: unknown[]): void;
	log(...data: unknown[]): void;
	warn(...data: unknown[]): void;
}

declare var console: Console;
