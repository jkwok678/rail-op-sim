#!/usr/bin/env node

/**
 * Merges each package's Istanbul `coverage-final.json` into one file at
 * `coverage/coverage-final.json`, for tools that take a single report (the
 * Fallow audit in CI reads it to score complexity against real coverage).
 *
 * Usage:
 *   pnpm -r run coverage && node scripts/merge-coverage.mjs
 *
 * The packages cover disjoint files, so merging is a plain union of keys.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PACKAGES = ["packages/app", "packages/shared"];
const OUTPUT_DIR = "coverage";

const merged = {};
for (const pkg of PACKAGES) {
  const file = join(pkg, "coverage", "coverage-final.json");
  if (!existsSync(file)) {
    console.error(`merge-coverage: missing ${file} — run the package's coverage script first`);
    process.exit(1);
  }
  Object.assign(merged, JSON.parse(readFileSync(file, "utf8")));
}

mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, "coverage-final.json"), JSON.stringify(merged));
console.log(`merge-coverage: ${Object.keys(merged).length} files → ${OUTPUT_DIR}/coverage-final.json`);
