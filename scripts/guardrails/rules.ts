import { parse } from "@babel/parser";

export type Counts = Record<string, number>;
/** why: diff positions are 1-based line numbers, as git and editors print them. */
export type AddedLines = Map<string, Set<number>>;

const HATCHES: Record<string, RegExp> = {
	"as any": /\bas any\b/g,
	"as unknown as": /\bas unknown as\b/g,
	"as never": /\bas never\b/g,
	"@ts-ignore": /@ts-ignore\b/g,
	"@ts-expect-error": /@ts-expect-error\b/g,
	"@ts-nocheck": /@ts-nocheck\b/g,
	"biome-ignore": /biome-ignore\b/g,
	"fallow-ignore": /fallow-ignore\b/g,
	"v8 ignore": /\bv8\s+ignore\b/gi,
	"c8 ignore": /\bc8\s+ignore\b/gi,
	"istanbul ignore": /\bistanbul\s+ignore\b/gi,
};

const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const NEVER_SCANNED = [
	/^packages\/app\/src\/components\/ui\//,
	/routeTree\.gen\.ts$/,
	/^scripts\/guardrails\//,
	/(^|\/)node_modules\//,
	/^(graphify-out|\.claude|coverage)\//,
	/(^|\/)graphify-out\//,
	/(^|\/)(dist|\.output)\//,
];
const COMMENT_SCOPE = /^packages\/(app|shared)\/src\//;
const TEST_FILE = [/(^|\/)__tests__\//, /\.(test|spec)\.[cm]?[jt]sx?$/];
const ALLOWED_COMMENT =
	/^(why:|biome-ignore|fallow-ignore|@ts-expect-error|@ts-ignore|@ts-nocheck|@vitest-environment|[#@]__PURE__|v8 ignore|c8 ignore|istanbul ignore|\/\s*<reference\b)/i;

const APP_SOURCE = /^packages\/app\/src\//;
const USE_EFFECT = /\buseEffect\(/g;
const USE_LAYOUT_EFFECT = /\buseLayoutEffect\(/g;

/** why: effects are being phased out of app code, so production app code may not gain any. */
export function countUseEffects(file: string, text: string): number {
	if (!APP_SOURCE.test(file) || isTestFile(file)) return 0;
	return text.match(USE_EFFECT)?.length ?? 0;
}

/** why: closes the loophole of dodging the useEffect ceiling by swapping to useLayoutEffect. */
export function countUseLayoutEffects(file: string, text: string): number {
	if (!APP_SOURCE.test(file) || isTestFile(file)) return 0;
	return text.match(USE_LAYOUT_EFFECT)?.length ?? 0;
}

const TIMER = /\b(setTimeout|setInterval|requestAnimationFrame)\(/g;
const TIMER_HOME = "packages/app/src/lib/timers.ts";

/** why: raw timers hand back ids every caller must clear by hand, so they are capped and steered to lib/timers.ts. */
export function countTimers(file: string, text: string): number {
	if (!APP_SOURCE.test(file) || isTestFile(file) || file === TIMER_HOME)
		return 0;
	return text.match(TIMER)?.length ?? 0;
}

const CEILING_HINTS: Record<string, string> = {
	timers:
		"Use `after`/`every` from packages/app/src/lib/timers.ts (or extend it) instead of a raw setTimeout/setInterval/requestAnimationFrame; each returns its cancel.",
	useEffect:
		"Derive the value during render, handle it in the event that causes it, or subscribe through the store instead of adding an effect.",
	useLayoutEffect:
		"Same as useEffect: find a way that does not need an effect.",
	"unmarked comments":
		"Start new comments with `why:`; touching an old comment means marking or deleting it.",
};

export function isScanned(file: string): boolean {
	return SOURCE_EXT.test(file) && !NEVER_SCANNED.some((re) => re.test(file));
}

export function isCommentChecked(file: string): boolean {
	return isScanned(file) && COMMENT_SCOPE.test(file) && !isTestFile(file);
}

function isTestFile(file: string): boolean {
	return TEST_FILE.some((re) => re.test(file));
}

export type Scope = "prod" | "test";
export type Budget = Record<Scope, Counts>;
export type Baseline = Budget & { ceilings: Counts };

export function scopeOf(file: string): Scope {
	return isTestFile(file) ? "test" : "prod";
}

export function countHatches(text: string): Counts {
	return Object.fromEntries(
		Object.entries(HATCHES).map(([name, re]) => [
			name,
			text.match(re)?.length ?? 0,
		]),
	);
}

export function sumCounts(totals: Counts, add: Counts): Counts {
	const out = { ...totals };
	for (const [name, n] of Object.entries(add)) out[name] = (out[name] ?? 0) + n;
	return out;
}

export function compareBudget(
	actual: Counts,
	baseline: Counts,
	scope: Scope,
): string[] {
	return Object.entries(actual).flatMap(([name, n]) => {
		const allowed = baseline[name] ?? 0;
		if (n > allowed)
			return [
				`${scope} \`${name}\`: ${n} in the repo, budget is ${allowed}. Remove the new one and fix the type or lint finding properly.`,
			];
		if (n < allowed)
			return [
				`${scope} \`${name}\`: ${n} in the repo, budget is ${allowed}. Nice. Lock it in with \`pnpm guardrails --update-baseline\` and commit baseline.json.`,
			];
		return [];
	});
}

export type Ceiling = { max: number; baseline: number; fromBase: boolean };
export type BaseMeasure = { baseline: Counts; actual: Counts };

/**
 * why: a drop that reached the base branch holds for every later PR without anyone
 * editing baseline.json, so parallel branches never fight over it. Only raising a
 * value in this PR's own baseline.json (a reviewable change) lifts the ceiling.
 */
export function effectiveCeilings(
	baseline: Counts = {},
	base?: BaseMeasure,
): Record<string, Ceiling> {
	const names = new Set([
		...Object.keys(baseline),
		...Object.keys(base?.actual ?? {}),
	]);
	return Object.fromEntries(
		[...names].map((name) => {
			const own = baseline[name] ?? 0;
			const raised = base !== undefined && own > (base.baseline[name] ?? 0);
			const atBase = base?.actual[name];
			const fromBase = !raised && atBase !== undefined && atBase < own;
			return [name, { max: fromBase ? atBase : own, baseline: own, fromBase }];
		}),
	);
}

function ceilingError(
	name: string,
	n: number,
	c: Ceiling,
	baseLabel: string,
): string {
	const source = c.fromBase
		? ` (${baseLabel} is already down to ${c.max}; baseline.json still says ${c.baseline})`
		: "";
	return [
		`${name}: ${n} in the repo, ceiling is ${c.max}${source}.`,
		CEILING_HINTS[name],
	]
		.filter(Boolean)
		.join(" ");
}

export function compareCeilings(
	actual: Counts,
	ceilings: Record<string, Ceiling> = {},
	baseLabel = "the base branch",
): { errors: string[]; notes: string[] } {
	const entries = Object.entries(actual).map(
		([name, n]) =>
			[
				name,
				n,
				ceilings[name] ?? { max: 0, baseline: 0, fromBase: false },
			] as const,
	);
	return {
		errors: entries
			.filter(([, n, c]) => n > c.max)
			.map(([name, n, c]) => ceilingError(name, n, c, baseLabel)),
		notes: entries
			.filter(([, n, c]) => n < c.max)
			.map(
				([name, n, c]) =>
					`${name}: ${n} in the repo, ceiling is ${c.max}. Once this merges, later PRs are held to ${n} automatically.`,
			),
	};
}

function hunkLines(header: string): number[] {
	const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(header);
	if (!m) return [];
	const start = Number(m[1]);
	const len = m[2] === undefined ? 1 : Number(m[2]);
	return Array.from({ length: len }, (_, i) => start + i);
}

/** why: a deleted file's header is `+++ /dev/null`; its hunks add nothing. */
function linesFor(added: AddedLines, header: string): Set<number> | undefined {
	if (!header.startsWith("+++ b/")) return undefined;
	const file = header.slice(6);
	const lines = added.get(file) ?? new Set<number>();
	added.set(file, lines);
	return lines;
}

export function parseAddedLines(diff: string): AddedLines {
	const added: AddedLines = new Map();
	let current: Set<number> | undefined;
	for (const line of diff.split("\n")) {
		if (line.startsWith("+++ ")) current = linesFor(added, line);
		else if (line.startsWith("@@"))
			for (const n of hunkLines(line)) current?.add(n);
	}
	return added;
}

export function allLines(text: string): Set<number> {
	return new Set(
		Array.from({ length: text.split("\n").length }, (_, i) => i + 1),
	);
}

/** why: indent and wrap changes should not count as a new escape hatch. */
function hatchLineKey(line: string): string {
	return line.replace(/\s+/g, " ").trim();
}

function hatchLineKeys(text: string): Set<string> {
	return new Set(
		text
			.split("\n")
			.flatMap((line) =>
				Object.values(countHatches(line)).some((n) => n > 0)
					? [hatchLineKey(line)]
					: [],
			),
	);
}

export function newHatches(
	file: string,
	text: string,
	lines: Set<number>,
	priorText = "",
): string[] {
	const priorLines = hatchLineKeys(priorText);
	const priorCounts = countHatches(priorText);
	const nextCounts = countHatches(text);
	const source = text.split("\n");
	return [...lines].flatMap((n) => {
		const line = source[n - 1] ?? "";
		if (priorLines.has(hatchLineKey(line))) return [];
		return Object.entries(countHatches(line))
			.filter(
				([name, hits]) =>
					hits > 0 && (nextCounts[name] ?? 0) > (priorCounts[name] ?? 0),
			)
			.map(([name]) => `${file}:${n}  new \`${name}\`: ${line.trim()}`);
	});
}

function commentBody(type: string, value: string): string {
	const body = type === "CommentBlock" ? value.replace(/^\*+/, "") : value;
	return body.replace(/^[\s*]+/, "");
}

/** why: a reformat changes indent and wrapping, not the words, so those still count as the same comment. */
function commentKey(body: string): string {
	return body.replace(/\s+/g, " ").trim();
}

const TS_FILE = /\.[cm]?tsx?$/;
/** why: in a `.ts` file `<T>x` is a type assertion, which the JSX plugin would misread as a tag. */
const TS_WITHOUT_JSX = /\.[cm]?ts$/;

function parserPlugins(file: string): ("typescript" | "flow" | "jsx")[] {
	if (TS_WITHOUT_JSX.test(file)) return ["typescript"];
	return [TS_FILE.test(file) ? "typescript" : "flow", "jsx"];
}

function parseSource(file: string, source: string) {
	return parse(source, {
		sourceType: "unambiguous",
		errorRecovery: true,
		plugins: parserPlugins(file),
	});
}

function parsedComments(file: string, source: string) {
	return parseSource(file, source).comments ?? [];
}

type AstNode = {
	type: string;
	loc?: { start: { line: number } } | null;
	[key: string]: unknown;
};

const AST_META = new Set([
	"loc",
	"start",
	"end",
	"range",
	"extra",
	"comments",
	"leadingComments",
	"trailingComments",
	"innerComments",
]);

function isAstNode(node: unknown): node is AstNode {
	return typeof node === "object" && node !== null && "type" in node;
}

function visit(node: unknown, onNode: (node: AstNode) => void): void {
	if (Array.isArray(node)) {
		for (const child of node) visit(child, onNode);
		return;
	}
	if (!isAstNode(node)) return;
	onNode(node);
	for (const [key, child] of Object.entries(node))
		if (!AST_META.has(key)) visit(child, onNode);
}

const CAST_NODES = new Set(["TSAsExpression", "TSTypeAssertion"]);
const NOT_A_CAST = new Set([
	"TSAnyKeyword",
	"TSNeverKeyword",
	"TSUnknownKeyword",
]);

function child(node: AstNode, key: string): AstNode {
	const value = node[key];
	if (!isAstNode(value))
		throw new Error(`${node.type}.${key} is not an AST node`);
	return value;
}

/**
 * why: `as const` and widening to `unknown` are sound, and `as any`/`as never` are
 * budgeted by name. The outer half of `x as unknown as T` is already counted as
 * the `as unknown as` hatch, so it is not counted twice.
 */
function isPlainCast(node: AstNode): boolean {
	if (!CAST_NODES.has(node.type)) return false;
	const type = child(node, "typeAnnotation");
	if (NOT_A_CAST.has(type.type)) return false;
	if (
		type.type === "TSTypeReference" &&
		child(type, "typeName").name === "const"
	)
		return false;
	const inner = child(node, "expression");
	return !(
		CAST_NODES.has(inner.type) &&
		child(inner, "typeAnnotation").type === "TSUnknownKeyword"
	);
}

/** why: a regex cannot tell a cast from `as` in prose or strings, so casts are found on the AST, at the line where the asserted type starts. */
export function castLines(file: string, source: string): number[] {
	if (!TS_FILE.test(file)) return [];
	const lines: number[] = [];
	try {
		visit(parseSource(file, source).program, (node) => {
			if (isPlainCast(node))
				lines.push(child(node, "typeAnnotation").loc?.start.line ?? 0);
		});
	} catch {
		return [];
	}
	return lines;
}

/** why: `x as SomeType` is what an agent reaches for once `as any` is blocked, so plain casts share the escape-hatch budget. */
export function countEscapeHatches(file: string, text: string): Counts {
	return {
		...countHatches(text),
		"type assertion": castLines(file, text).length,
	};
}

export function newCasts(
	file: string,
	text: string,
	lines: Set<number>,
	priorText = "",
): string[] {
	const prior = castLines(file, priorText);
	const next = castLines(file, text);
	if (next.length <= prior.length) return [];
	const priorSource = priorText.split("\n");
	const priorKeys = new Set(
		prior.map((n) => hatchLineKey(priorSource[n - 1] ?? "")),
	);
	const source = text.split("\n");
	return [...new Set(next)]
		.filter(
			(n) => lines.has(n) && !priorKeys.has(hatchLineKey(source[n - 1] ?? "")),
		)
		.map(
			(n) =>
				`${file}:${n}  new type assertion: ${(source[n - 1] ?? "").trim()}`,
		);
}

export function commentKeys(file: string, source: string): Set<string> {
	try {
		return new Set(
			parsedComments(file, source).map((c) =>
				commentKey(commentBody(c.type, c.value)),
			),
		);
	} catch {
		return new Set();
	}
}

function touches(lines: Set<number>, start: number, end: number): boolean {
	for (let l = start; l <= end; l++) if (lines.has(l)) return true;
	return false;
}

export function unmarkedComments(
	file: string,
	source: string,
	lines: Set<number>,
	prior: Set<string> = new Set(),
): string[] {
	return parsedComments(file, source).flatMap((c) => {
		const body = commentBody(c.type, c.value);
		if (!c.loc || ALLOWED_COMMENT.test(body) || prior.has(commentKey(body)))
			return [];
		if (!touches(lines, c.loc.start.line, c.loc.end.line)) return [];
		const firstLine = body.split("\n")[0] ?? "";
		return [`${file}:${c.loc.start.line}  ${firstLine.trim().slice(0, 70)}`];
	});
}
