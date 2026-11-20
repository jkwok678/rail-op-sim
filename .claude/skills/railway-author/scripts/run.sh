#!/usr/bin/env bash
#
# Run one authoring script.
#
#   scripts/run.sh <entry.ts> [args...]
#
# The repo has no TypeScript runner of its own — vitest only runs tests, and
# Node's type stripping cannot handle the model's enums — so this uses jiti,
# which pnpm has already installed under packages/shared. Relative paths in
# the arguments keep working, because this runs in the directory you called it
# from rather than in the package jiti happens to live in.
#
# Type checking is a separate, optional step:
#   pnpm exec tsc -p .claude/skills/railway-author/tsconfig.json

set -euo pipefail

if [ $# -lt 1 ]; then
	echo "usage: run.sh <entry.ts> [args...]" >&2
	exit 2
fi

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../.." && pwd)"
JITI="$REPO_ROOT/packages/shared/node_modules/.bin/jiti"
if [ ! -x "$JITI" ]; then
	# Newer pnpm no longer links jiti's bin into the package; use the store copy.
	CLI="$(find "$REPO_ROOT/node_modules/.pnpm" -maxdepth 5 -path '*/jiti/lib/jiti-cli.mjs' 2>/dev/null | sort | tail -1)"
	if [ -n "$CLI" ]; then
		JITI="$(mktemp -t jiti)"
		printf '#!/bin/sh\nexec node "%s" "$@"\n' "$CLI" >"$JITI"
		chmod +x "$JITI"
	fi
fi

if [ ! -x "$JITI" ]; then
	echo "run.sh: no jiti at $JITI — run 'pnpm install', or run the script with any TypeScript runner you have." >&2
	exit 2
fi

ENTRY_DIR="$(cd "$(dirname "$1")" && pwd)"
ENTRY="$ENTRY_DIR/$(basename "$1")"
shift

if [ ! -f "$ENTRY" ]; then
	echo "run.sh: no such script: $ENTRY" >&2
	exit 2
fi

exec "$JITI" "$ENTRY" "$@"
