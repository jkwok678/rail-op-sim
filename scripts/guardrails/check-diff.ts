/**
 * why: rules an agent should not break fail here with a fix-it message,
 * instead of living as prose in CLAUDE.md. The checks:
 *
 * 1. Escape-hatch budget: repo-wide counts of each escape hatch, kept apart for
 *    production and test files, may not move away from `baseline.json`. Raising
 *    a count is a reviewable baseline edit; a lower count must be written back
 *    (`--update-baseline`) so the ratchet holds. Plain type assertions
 *    (`x as T`, `<T>x`; not `as const`) are found on the AST and budgeted as
 *    `type assertion` next to the named hatches.
 * 1b. Ceilings: repo-wide counts of things being phased out (comments without
 *    `why:`, and `useEffect`/`useLayoutEffect` and raw timers in production
 *    app code) fail only when they grow. With `--base` the ceiling is also
 *    capped at the count measured on the merge base (in a temporary worktree,
 *    cached per commit), so a drop that merged holds for every later PR without
 *    a baseline.json edit and parallel branches do not fight over the file.
 *    Raising a value in baseline.json lifts the cap.
 * 2. No new escape hatches or type assertions on added lines (catches swapping
 *    one for another). `--allow-escape-hatches` (the `allow-escape-hatch` PR
 *    label) waives it.
 * 3. Comment near-ban: an added comment in packages/{app,shared}/src must start
 *    with `why:` or be a tool directive.
 *
 * Usage: node scripts/guardrails/check-diff.ts [--base <ref>] [--allow-escape-hatches] [--update-baseline]
 * Without --base only the repo-wide checks (1, 1b) run (pushes to master).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	type AddedLines,
	allLines,
	type Baseline,
	type BaseMeasure,
	type Budget,
	type Counts,
	commentKeys,
	compareBudget,
	compareCeilings,
	countEscapeHatches,
	countTimers,
	countUseEffects,
	countUseLayoutEffects,
	effectiveCeilings,
	isCommentChecked,
	isScanned,
	newCasts,
	newHatches,
	parseAddedLines,
	scopeOf,
	sumCounts,
	unmarkedComments,
} from "./rules.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASELINE_FILE = "scripts/guardrails/baseline.json";

/** why: the same measurement runs on this checkout and on a temporary worktree of the merge base. */
type Repo = {
	root: string;
	git: (...args: string[]) => string;
	read: (file: string) => string;
	isFile: (file: string) => boolean;
};

function repoAt(root: string): Repo {
	return {
		root,
		git: (...args) =>
			execFileSync("git", args, {
				cwd: root,
				encoding: "utf8",
				maxBuffer: 64 << 20,
				stdio: ["ignore", "pipe", "pipe"],
			}),
		read: (file) => readFileSync(join(root, file), "utf8"),
		isFile: (file) =>
			existsSync(join(root, file)) && statSync(join(root, file)).isFile(),
	};
}

const HERE = repoAt(ROOT);
const { git, read, isFile } = HERE;

function scannedFiles(repo: Repo, ...lsArgs: string[]): string[] {
	return repo
		.git("ls-files", ...lsArgs)
		.split("\n")
		.filter((f) => f && isScanned(f) && repo.isFile(f));
}

function measureHatches(repo: Repo, files: string[]): Budget {
	return files.reduce<Budget>(
		(totals, file) => {
			const scope = scopeOf(file);
			totals[scope] = sumCounts(
				totals[scope],
				countEscapeHatches(file, repo.read(file)),
			);
			return totals;
		},
		{ prod: {}, test: {} },
	);
}

function measureCeilings(repo: Repo, files: string[]): Counts {
	const total = (count: (file: string, text: string) => number) =>
		files.reduce((n, file) => n + count(file, repo.read(file)), 0);
	return {
		"unmarked comments": total((file, text) =>
			isCommentChecked(file)
				? unmarkedComments(file, text, allLines(text)).length
				: 0,
		),
		useEffect: total(countUseEffects),
		useLayoutEffect: total(countUseLayoutEffects),
		timers: total(countTimers),
	};
}

function measure(): Baseline {
	const files = scannedFiles(
		HERE,
		"--cached",
		"--others",
		"--exclude-standard",
	);
	return {
		...measureHatches(HERE, files),
		ceilings: measureCeilings(HERE, files),
	};
}

/** why: a change to the measuring code must not reuse counts taken with an older version of it. */
function measureCacheFile(rev: string): string {
	const code = createHash("sha256")
		.update(read("scripts/guardrails/rules.ts"))
		.update(read("scripts/guardrails/check-diff.ts"))
		.digest("hex")
		.slice(0, 12);
	return join(ROOT, "node_modules/.cache/guardrails", `${rev}-${code}.json`);
}

function measureInWorktree(rev: string): Counts {
	const dir = mkdtempSync(join(tmpdir(), "guardrails-base-"));
	try {
		git("worktree", "add", "--detach", "--quiet", dir, rev);
		const base = repoAt(dir);
		return measureCeilings(base, scannedFiles(base, "--cached"));
	} finally {
		rmSync(dir, { recursive: true, force: true });
		git("worktree", "prune");
	}
}

/** why: the merge base is a fixed commit, so its counts are measured once and reused by every later run. */
function cachedBaseCounts(rev: string): Counts {
	const cache = measureCacheFile(rev);
	if (existsSync(cache)) return JSON.parse(readFileSync(cache, "utf8"));
	const actual = measureInWorktree(rev);
	mkdirSync(dirname(cache), { recursive: true });
	writeFileSync(cache, JSON.stringify(actual));
	return actual;
}

function measureBase(rev: string): BaseMeasure {
	const prior: Partial<Baseline> = JSON.parse(
		fileAt(rev, BASELINE_FILE) || "{}",
	);
	return { baseline: prior.ceilings ?? {}, actual: cachedBaseCounts(rev) };
}

function writeBaseline(actual: Baseline) {
	writeFileSync(
		join(ROOT, BASELINE_FILE),
		`${JSON.stringify(actual, null, "\t")}\n`,
	);
	console.log(`Wrote ${BASELINE_FILE}:`, actual);
}

function fileAt(rev: string, file: string): string {
	try {
		return git("show", `${rev}:${file}`);
	} catch {
		return "";
	}
}

/** why: diffs the working tree against the merge base, so it also sees uncommitted work locally. */
function addedSince(base: string): { added: AddedLines; mergeBase: string } {
	const mergeBase = git("merge-base", base, "HEAD").trim();
	const tracked = parseAddedLines(
		git("diff", "-U0", "--no-color", "--diff-filter=d", mergeBase),
	);
	const untracked = scannedFiles(HERE, "--others", "--exclude-standard").map(
		(file) => [file, allLines(read(file))] as const,
	);
	const added = new Map(
		[...tracked, ...untracked].filter(
			([file]) => isScanned(file) && isFile(file),
		),
	);
	return { added, mergeBase };
}

function each(
	added: AddedLines,
	check: (file: string, lines: Set<number>) => string[],
) {
	return [...added].flatMap(([file, lines]) => check(file, lines));
}

type Section = {
	title: string;
	errors: string[];
	notes?: string[];
	fix: string;
};

function repoSections(update: boolean, base?: string): Section[] {
	const actual = measure();
	if (update) writeBaseline(actual);
	const baseline: Baseline = update ? actual : JSON.parse(read(BASELINE_FILE));
	const atBase = base
		? measureBase(git("merge-base", base, "HEAD").trim())
		: undefined;
	const ceilings = compareCeilings(
		actual.ceilings,
		effectiveCeilings(baseline.ceilings, atBase),
		base,
	);
	return [
		{
			title: `Escape-hatch budget (${BASELINE_FILE})`,
			errors: [
				...compareBudget(actual.prod, baseline.prod, "prod"),
				...compareBudget(actual.test, baseline.test, "test"),
			],
			fix: "Raising a budget is a reviewable change to baseline.json; justify it in the PR.",
		},
		{
			title: `Ceilings (${BASELINE_FILE})`,
			errors: ceilings.errors,
			notes: ceilings.notes,
			fix: "Ceilings only go down. Remove what you added instead of raising the ceiling in baseline.json.",
		},
	];
}

function diffSections(base: string, allowHatches: boolean): Section[] {
	const { added, mergeBase } = addedSince(base);
	const out: Section[] = [];
	if (!allowHatches)
		out.push(
			{
				title: "New escape hatches",
				errors: each(added, (file, lines) =>
					newHatches(file, read(file), lines, fileAt(mergeBase, file)),
				),
				fix: "Fix the type or lint finding instead. If one is truly unavoidable, add the `allow-escape-hatch` PR label and raise baseline.json in the same PR.",
			},
			{
				title: "New type assertions",
				errors: each(added, (file, lines) =>
					newCasts(file, read(file), lines, fileAt(mergeBase, file)),
				),
				fix: "Narrow instead of asserting: a type guard, a schema parse where data enters (worker messages, JSON.parse, storage), a generic, or `satisfies` to check a literal. If one is truly unavoidable, add the `allow-escape-hatch` PR label and raise baseline.json in the same PR.",
			},
		);
	out.push({
		title: "Comments without `why:`",
		errors: each(added, (file, lines) =>
			isCommentChecked(file)
				? unmarkedComments(
						file,
						read(file),
						lines,
						commentKeys(file, fileAt(mergeBase, file)),
					)
				: [],
		),
		fix: "Delete the comment, or make the code say it: a better name, a type, a test. Keep a comment only for a non-obvious reason and start it with `why:` (`// why: …`, `/** why: … */`, `{/* why: … */}`).",
	});
	return out;
}

function report({ title, errors, notes = [], fix }: Section): boolean {
	if (errors.length === 0) {
		console.log(`✓ ${title}`);
		for (const n of notes) console.log(`  ${n}`);
		return true;
	}
	console.log(`\n✗ ${title} (${errors.length})`);
	for (const e of errors) console.log(`  ${e}`);
	console.log(`  → ${fix}\n`);
	return false;
}

const argv = process.argv.slice(2);
const baseAt = argv.indexOf("--base");
const base = baseAt === -1 ? undefined : argv[baseAt + 1];
const results = [
	...repoSections(argv.includes("--update-baseline"), base),
	...(base ? diffSections(base, argv.includes("--allow-escape-hatches")) : []),
].map(report);
process.exit(results.every(Boolean) ? 0 : 1);
