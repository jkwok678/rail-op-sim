import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	allLines,
	castLines,
	commentKeys,
	compareBudget,
	compareCeilings,
	countEscapeHatches,
	countHatches,
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
} from "../rules.ts";

describe("file scope", () => {
	it("scans source files but not generated, vendored or shadcn ones", () => {
		assert.equal(isScanned("packages/app/src/lib/grid.ts"), true);
		assert.equal(isScanned("packages/shared/src/index.ts"), true);
		assert.equal(isScanned(".railway/railway.ts"), true);
		assert.equal(isScanned("packages/app/src/components/ui/button.tsx"), false);
		assert.equal(isScanned("packages/app/src/routeTree.gen.ts"), false);
		assert.equal(isScanned("scripts/guardrails/rules.ts"), false);
		assert.equal(isScanned("packages/app/graphify-out/x.js"), false);
		assert.equal(isScanned("packages/app/.output/server/index.mjs"), false);
		assert.equal(isScanned("README.md"), false);
	});

	it("checks comments in package source only, not tests or scripts", () => {
		assert.equal(isCommentChecked("packages/app/src/lib/grid.ts"), true);
		assert.equal(isCommentChecked("packages/shared/src/index.ts"), true);
		assert.equal(
			isCommentChecked("packages/app/src/lib/__tests__/grid.test.ts"),
			false,
		);
		assert.equal(
			isCommentChecked("packages/shared/src/engine/a.test.ts"),
			false,
		);
		assert.equal(isCommentChecked("packages/app/vite.config.ts"), false);
		assert.equal(isCommentChecked("scripts/merge-coverage.mjs"), false);
	});

	it("budgets test files apart from production code", () => {
		assert.equal(scopeOf("packages/app/src/lib/grid.ts"), "prod");
		assert.equal(scopeOf("packages/app/vite.config.ts"), "prod");
		assert.equal(
			scopeOf("packages/app/src/lib/__tests__/grid.test.ts"),
			"test",
		);
		assert.equal(scopeOf("packages/shared/src/a.spec.ts"), "test");
	});
});

describe("type assertions", () => {
	it("counts plain casts and angle-bracket assertions, one line each", () => {
		const src = [
			"const a = b as Player;",
			"const c = <Room>d;",
			"const e = (f as Record<string, number>).g as number;",
			"const h = {",
			"  i: 1,",
			"} as Options;",
		].join("\n");
		assert.deepEqual(castLines("a.ts", src), [1, 2, 3, 3, 6]);
	});

	it("skips sound and separately budgeted assertions", () => {
		const src = [
			"const a = [1, 2] as const;",
			"const b = c as unknown;",
			"const d = e as any;",
			"const f = g as never;",
			"const h = i as unknown as Player;",
			"const j = { k: 1 } satisfies Options;",
			"// cast it as Player",
			'const l = "x as Player";',
		].join("\n");
		assert.deepEqual(castLines("a.tsx", src), []);
	});

	it("ignores JavaScript and survives unparsable files", () => {
		assert.deepEqual(castLines("a.js", "const a = b;"), []);
		assert.ok(Array.isArray(castLines("a.ts", "const = = as as Player")));
	});

	it("budgets plain casts next to the named hatches", () => {
		const counts = countEscapeHatches(
			"a.ts",
			"const a = b as any;\nconst c = d as Player;",
		);
		assert.equal(counts["as any"], 1);
		assert.equal(counts["type assertion"], 1);
	});

	it("flags a cast on an added line only when the file gains one", () => {
		const prior = "const a = b as Player;\n";
		const next = "const a = b as Player;\nconst c = d as Room;\n";
		assert.deepEqual(newCasts("a.ts", next, new Set([2]), prior), [
			"a.ts:2  new type assertion: const c = d as Room;",
		]);
		assert.deepEqual(newCasts("a.ts", next, new Set([1]), prior), []);
		assert.deepEqual(
			newCasts("a.ts", "  const a =\n    b as Player;\n", new Set([2]), prior),
			[],
		);
	});

	it("does not flag a cast that moved to a new line", () => {
		const prior = "const a = b as Player;\nconst c = d as Room;\n";
		const next = "const c = d as Room;\nconst a = b as Player;\n";
		assert.deepEqual(newCasts("a.ts", next, new Set([1, 2]), prior), []);
	});

	it("flags every cast in a new file", () => {
		assert.deepEqual(newCasts("a.ts", "const a = b as Player;", new Set([1])), [
			"a.ts:1  new type assertion: const a = b as Player;",
		]);
	});
});

describe("escape-hatch budget", () => {
	it("counts every hatch, several per line", () => {
		const counts = countHatches(
			"const a = b as any as any;\nconst c = d as unknown as E;\nconst f = g as never;\n// biome-ignore lint: x\n// @ts-expect-error\n// fallow-ignore-next-line x\n// @ts-ignore\n// @ts-nocheck\n/* v8 ignore next */\n/* c8 ignore start */\n/* Istanbul  ignore else */",
		);
		assert.deepEqual(counts, {
			"as any": 2,
			"as unknown as": 1,
			"as never": 1,
			"@ts-ignore": 1,
			"@ts-expect-error": 1,
			"@ts-nocheck": 1,
			"biome-ignore": 1,
			"fallow-ignore": 1,
			"v8 ignore": 1,
			"c8 ignore": 1,
			"istanbul ignore": 1,
		});
	});

	it("does not count lookalikes", () => {
		const counts = countHatches(
			"const has anyone = 1; const x = y as unknown; type T = Bias neverEnding;",
		);
		assert.equal(counts["as any"], 0);
		assert.equal(counts["as unknown as"], 0);
		assert.equal(counts["as never"], 0);
	});

	it("sums counts across files", () => {
		assert.deepEqual(
			sumCounts({ "as any": 1 }, { "as any": 2, "biome-ignore": 1 }),
			{
				"as any": 3,
				"biome-ignore": 1,
			},
		);
	});

	it("fails when a count grows past the baseline", () => {
		const [error] = compareBudget({ "as any": 5 }, { "as any": 4 }, "prod");
		assert.match(error ?? "", /prod `as any`: 5 in the repo, budget is 4/);
	});

	it("fails when a count falls, so the lower budget is locked in", () => {
		const [error] = compareBudget({ "as any": 3 }, { "as any": 4 }, "test");
		assert.match(error ?? "", /--update-baseline/);
	});

	it("passes when counts match, and treats a missing budget as zero", () => {
		assert.deepEqual(
			compareBudget(
				{ "as any": 4, "fallow-ignore": 0 },
				{ "as any": 4 },
				"prod",
			),
			[],
		);
		assert.equal(compareBudget({ "fallow-ignore": 1 }, {}, "prod").length, 1);
	});
});

describe("ceilings", () => {
	const own = (counts: Record<string, number>) => effectiveCeilings(counts);

	it("fails only when a count grows past its ceiling", () => {
		assert.deepEqual(
			compareCeilings({ useEffect: 11 }, own({ useEffect: 10 })).errors,
			[
				"useEffect: 11 in the repo, ceiling is 10. Derive the value during render, handle it in the event that causes it, or subscribe through the store instead of adding an effect.",
			],
		);
	});

	it("passes with a note that a drop locks in on merge", () => {
		const { errors, notes } = compareCeilings(
			{ "unmarked comments": 9 },
			own({ "unmarked comments": 10 }),
		);
		assert.deepEqual(errors, []);
		assert.match(notes[0] ?? "", /held to 9 automatically/);
	});

	it("caps a ceiling at what the merge base already has", () => {
		const ceilings = effectiveCeilings(
			{ useEffect: 88, timers: 65 },
			{
				baseline: { useEffect: 88, timers: 65 },
				actual: { useEffect: 83, timers: 70 },
			},
		);
		assert.deepEqual(ceilings.useEffect, {
			max: 83,
			baseline: 88,
			fromBase: true,
		});
		assert.deepEqual(ceilings.timers, {
			max: 65,
			baseline: 65,
			fromBase: false,
		});
		const [error] = compareCeilings(
			{ useEffect: 85 },
			ceilings,
			"origin/master",
		).errors;
		assert.match(
			error ?? "",
			/^useEffect: 85 in the repo, ceiling is 83 \(origin\/master is already down to 83; baseline.json still says 88\)\./,
		);
	});

	it("lets a PR raise a ceiling only by raising baseline.json", () => {
		const base = { baseline: { useEffect: 88 }, actual: { useEffect: 83 } };
		assert.deepEqual(effectiveCeilings({ useEffect: 90 }, base).useEffect, {
			max: 90,
			baseline: 90,
			fromBase: false,
		});
		assert.equal(effectiveCeilings({ useEffect: 80 }, base).useEffect?.max, 80);
	});

	it("treats a ceiling new in this PR as a deliberate one", () => {
		const ceilings = effectiveCeilings(
			{ timers: 5 },
			{ baseline: {}, actual: { timers: 2 } },
		);
		assert.equal(ceilings.timers?.max, 5);
	});

	it("caps a count the baseline does not list at the base count", () => {
		const ceilings = effectiveCeilings(
			{},
			{ baseline: {}, actual: { timers: 0 } },
		);
		assert.equal(ceilings.timers?.max, 0);
	});

	it("counts useEffect calls in production app code only", () => {
		const src =
			"useEffect(() => {}, []);\nReact.useEffect(f);\nuseEffectEvent(g);";
		assert.equal(countUseEffects("packages/app/src/hooks/a.ts", src), 2);
		assert.equal(
			countUseEffects("packages/app/src/hooks/__tests__/a.test.ts", src),
			0,
		);
		assert.equal(countUseEffects("packages/shared/src/a.ts", src), 0);
	});

	it("counts useLayoutEffect calls in production app code only", () => {
		const src =
			"useLayoutEffect(() => {}, []);\nReact.useLayoutEffect(f);\nuseEffect(g);";
		assert.equal(countUseLayoutEffects("packages/app/src/hooks/a.ts", src), 2);
		assert.equal(
			countUseLayoutEffects("packages/app/src/hooks/__tests__/a.test.ts", src),
			0,
		);
		assert.equal(countUseLayoutEffects("packages/shared/src/a.ts", src), 0);
	});

	it("counts raw timers in production app code, except the shared timer module", () => {
		const src =
			"setTimeout(f, 1);\nwindow.setInterval(g, 2);\nrequestAnimationFrame(h);\nclearTimeout(t);";
		assert.equal(countTimers("packages/app/src/components/a.tsx", src), 3);
		assert.equal(countTimers("packages/app/src/lib/timers.ts", src), 0);
		assert.equal(
			countTimers("packages/app/src/hooks/__tests__/a.test.ts", src),
			0,
		);
		assert.equal(countTimers("packages/shared/src/a.ts", src), 0);
	});

	it("points a timer ceiling breach at the shared timer module", () => {
		const { errors } = compareCeilings({ timers: 2 }, own({ timers: 1 }));
		assert.match(errors[0] ?? "", /lib\/timers\.ts/);
	});

	it("treats a missing ceiling as zero", () => {
		assert.equal(compareCeilings({ timers: 1 }, {}).errors.length, 1);
	});
});

describe("parseAddedLines", () => {
	const diff = [
		"diff --git a/src/a.ts b/src/a.ts",
		"--- a/src/a.ts",
		"+++ b/src/a.ts",
		"@@ -3,0 +4,2 @@ context",
		"+one",
		"+two",
		"@@ -10 +12 @@",
		"+three",
		"@@ -20,3 +23,0 @@",
		"diff --git a/src/gone.ts b/src/gone.ts",
		"--- a/src/gone.ts",
		"+++ /dev/null",
		"@@ -1,2 +0,0 @@",
	].join("\n");

	it("collects the added line numbers per file", () => {
		const added = parseAddedLines(diff);
		assert.deepEqual([...added.keys()], ["src/a.ts"]);
		assert.deepEqual([...(added.get("src/a.ts") ?? [])], [4, 5, 12]);
	});

	it("numbers every line of a new file", () => {
		assert.deepEqual([...allLines("a\nb\nc")], [1, 2, 3]);
	});
});

describe("newHatches", () => {
	it("reports hatches on added lines only", () => {
		const text = "const a = b as any;\nconst c = d as any;";
		assert.deepEqual(newHatches("x.ts", text, new Set([2])), [
			"x.ts:2  new `as any`: const c = d as any;",
		]);
	});

	it("ignores a hatch line the base file already had", () => {
		const prior = "\tconst c = d as any;";
		const text = "const a = b as any;\n  const c = d as any;";
		assert.deepEqual(newHatches("x.ts", text, new Set([1, 2]), prior), [
			"x.ts:1  new `as any`: const a = b as any;",
		]);
	});

	it("ignores a hatch that only joined a line the formatter unwrapped", () => {
		const prior =
			"const Profile = (ProfileRoute as unknown as { component: T })\n  .component;";
		const text =
			"const Profile = (ProfileRoute as unknown as { component: T }).component;";
		assert.deepEqual(newHatches("x.ts", text, new Set([1]), prior), []);
	});
});

describe("unmarkedComments", () => {
	const source = [
		"// plain comment",
		"// why: a reason",
		'/// <reference types="vite/client" />',
		"// biome-ignore lint/x: reason",
		'const url = "http://not-a-comment";',
		"export const J = () => <div>{/* jsx comment */}Don't {/* why: ok */}</div>;",
		"/**",
		" * jsdoc",
		" */",
		"/** why: a documented reason */",
		"const re = /\\/\\//; // trailing",
	].join("\n");

	it("flags added comments without why:, and nothing that only looks like one", () => {
		assert.deepEqual(unmarkedComments("a.tsx", source, allLines(source)), [
			"a.tsx:1  plain comment",
			"a.tsx:6  jsx comment",
			"a.tsx:7  jsdoc",
			"a.tsx:11  trailing",
		]);
	});

	it("ignores comments on lines the diff did not add", () => {
		assert.deepEqual(unmarkedComments("a.tsx", source, new Set([2, 5])), []);
	});

	it("flags a whole block comment when any of its lines was added", () => {
		assert.deepEqual(unmarkedComments("a.tsx", source, new Set([8])), [
			"a.tsx:7  jsdoc",
		]);
	});

	it("parses plain JavaScript too", () => {
		assert.deepEqual(
			unmarkedComments("a.js", "// hi\nconst a = 1;", new Set([1])),
			["a.js:1  hi"],
		);
	});

	it("ignores a comment the base file already had, including an indent change", () => {
		const prior = commentKeys(
			"a.tsx",
			"/*\n\t\tpooled in the upper half\n*/\nconst a = 1;",
		);
		const next = "/*\n    pooled in the upper half\n*/\nconst a = 1;";
		assert.deepEqual(
			unmarkedComments("a.tsx", next, allLines(next), prior),
			[],
		);
	});

	it("still flags a comment the base file did not have", () => {
		const prior = commentKeys("a.tsx", "// old reason\nconst a = 1;");
		const next = "// old reason\n// fresh note\nconst a = 1;";
		assert.deepEqual(unmarkedComments("a.tsx", next, new Set([2]), prior), [
			"a.tsx:2  fresh note",
		]);
	});
});
