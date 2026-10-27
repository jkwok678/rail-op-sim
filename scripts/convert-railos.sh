#!/usr/bin/env bash
#
# Convert a RailOS project into rail-op-sim documents: one railway and one
# timetable.
#
#   scripts/convert-railos.sh <railos-dir> [out-dir]
#
# <railos-dir> is a RailOS checkout such as GB-Midland-Main-Line-South. The
# script expects exactly one .rly and one .ttb anywhere under it (the usual
# places are Railway/ and Program_Timetables/). It writes railway.yaml and
# timetable.yaml into [out-dir], which defaults to ./converted/<dirname>.
#
# The conversion itself is import-railos.ts. This wrapper only finds the two
# source files and chooses where the documents go, so you do not have to pass
# four paths or follow the authoring skill.

set -euo pipefail

if [ $# -lt 1 ] || [ $# -gt 2 ]; then
	echo "usage: convert-railos.sh <railos-dir> [out-dir]" >&2
	exit 2
fi

if [ ! -d "$1" ]; then
	echo "convert-railos.sh: not a directory: $1" >&2
	exit 2
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$(cd "$1" && pwd)"
NAME="$(basename "$SRC")"
OUT="${2:-"$ROOT/converted/$NAME"}"

# One matching file, or a message naming every candidate.
pick_one() {
	local ext="$1"
	local hits
	hits="$(find "$SRC" -type f -name "*.$ext" -not -path '*/.git/*' | sort)"
	if [ -z "$hits" ]; then
		echo "convert-railos.sh: no .$ext file under $SRC" >&2
		exit 2
	fi
	local count
	count="$(printf '%s\n' "$hits" | wc -l | tr -d ' ')"
	if [ "$count" -ne 1 ]; then
		echo "convert-railos.sh: expected one .$ext file under $SRC, found $count:" >&2
		printf '%s\n' "$hits" >&2
		exit 2
	fi
	printf '%s\n' "$hits"
}

RLY="$(pick_one rly)"
TTB="$(pick_one ttb)"
mkdir -p "$OUT"

echo "Railway:   $RLY"
echo "Timetable: $TTB"
echo "Output:    $OUT"
echo

exec "$ROOT/.claude/skills/railway-author/scripts/run.sh" \
	"$ROOT/.claude/skills/railway-author/scripts/import-railos.ts" \
	"$RLY" \
	"$TTB" \
	"$OUT/railway.yaml" \
	"$OUT/timetable.yaml"
