## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Guardrails

`pnpm guardrails` (`scripts/guardrails/check-diff.ts`, run in CI) enforces these against `origin/master`:

- **Escape-hatch budget**: `as any`, `as unknown as`, `as never`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `biome-ignore`, `fallow-ignore`, coverage-ignore comments, and plain type assertions (`x as T` / `<T>x`; `as const` and `as unknown` are fine) are counted in `scripts/guardrails/baseline.json`, with production and test counted separately. A new one fails, on the line that adds it. Narrow instead: a type guard, a schema parse where data enters, a generic, or `satisfies`. When you remove one, run `pnpm guardrails --update-baseline` and commit the lower count. An unavoidable new one needs the `allow-escape-hatch` PR label and a raised baseline.
- **Comments**: a new comment in `packages/{app,shared}/src` must start with `why:` (`// why: …`, `/** why: … */`, `{/* why: … */}`) or be a tool directive. Say the "what" with names, types and tests. Editing an old comment counts as adding it.
- **Ceilings** (may only go down): comments without `why:`, and `useEffect`, `useLayoutEffect` and raw `setTimeout`/`setInterval`/`requestAnimationFrame` in production `packages/app/src`. Use `after`/`every` from `packages/app/src/lib/timers.ts` (each returns its cancel) instead of a raw timer. A drop is locked in for later PRs once it merges; only raising a value in `baseline.json` lifts a ceiling.
