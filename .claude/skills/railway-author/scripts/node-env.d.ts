/**
 * The slice of Node these scripts use, declared by hand.
 *
 * `@types/node` is a devDependency of `packages/app`, not of the workspace
 * root, so it does not resolve from `.claude/`. Declaring the four functions
 * the authoring scripts actually call keeps them type-checked without adding a
 * dependency to the repo for the sake of a tool.
 */

declare module "node:fs" {
	export function readFileSync(path: string, encoding: "utf8"): string;
	export function writeFileSync(path: string, data: string): void;
	export function mkdirSync(
		path: string,
		options?: { recursive?: boolean },
	): void;
	export function existsSync(path: string): boolean;
}

declare module "node:path" {
	export function dirname(path: string): string;
	export function resolve(...parts: string[]): string;
}

declare const console: {
	log(...args: unknown[]): void;
	error(...args: unknown[]): void;
	warn(...args: unknown[]): void;
	debug(...args: unknown[]): void;
};

/** A global in Node and the browser, but not in `lib.es2022`. */
declare function structuredClone<T>(value: T): T;

declare const process: {
	argv: string[];
	exitCode: number;
	cwd(): string;
	env: Record<string, string | undefined>;
};
