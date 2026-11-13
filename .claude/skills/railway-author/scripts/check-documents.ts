/**
 * Check a saved railway and/or timetable the way the editor would.
 *
 *   run.sh .claude/skills/railway-author/scripts/check-documents.ts \
 *     [railway.json|yaml] [timetable.json|yaml]
 *
 * Exits non-zero when the railway is incomplete or the timetable has errors,
 * so it can gate a generated document before anyone loads it.
 */

import {
	loadRailway,
	loadTimetable,
	railwayProblems,
	readDocument,
	reportRailway,
	reportTimetable,
} from "./authoring";
import { hasErrors } from "../../../../packages/shared/src/railway/timetable/validate";
import { validateTimetable } from "../../../../packages/shared/src/railway/timetable/validate";
import type { Map_ } from "../../../../packages/shared/src/railway/map/map";

const paths = process.argv.slice(2);
if (paths.length === 0) {
	console.error(
		"usage: check-documents.ts [railway] [timetable] — JSON or YAML, either or both, in any order",
	);
	process.exitCode = 2;
}

let map: Map_ | null = null;
let timetablePath: string | null = null;
let failed = false;

// Either document may come first; a map has tracks, a timetable has services.
for (const path of paths) {
	if (isTimetablePath(path)) timetablePath = path;
	else map = loadRailway(path);
}

if (map) {
	reportRailway(map);
	if (railwayProblems(map).length > 0) failed = true;
}

if (timetablePath) {
	const tt = loadTimetable(timetablePath);
	const issues = validateTimetable(tt, map);
	console.log(
		`Timetable "${tt.title ?? timetablePath}": ${tt.services.length} services${
			map ? "" : " (structure only — no railway given)"
		}`,
	);
	reportTimetable(issues);
	if (hasErrors(issues)) failed = true;
}

if (failed) process.exitCode = 1;

/** A timetable document has `services`; a map has `tracks`. */
function isTimetablePath(path: string): boolean {
	const parsed = readDocument(path) as Record<string, unknown>;
	return Array.isArray(parsed.services);
}
