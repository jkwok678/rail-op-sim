/**
 * Translate a RailOS railway (.rly) and timetable (.ttb) into rail-op-sim's
 * documents, written as YAML.
 *
 *   .claude/skills/railway-author/scripts/run.sh \
 *     .claude/skills/railway-author/scripts/import-railos.ts \
 *     <in.rly> <in.ttb> <out-railway.yaml> <out-timetable.yaml>
 *
 * The conversion lives in the shared package (`railway/railos`), where the
 * app's "Import RailOS" action uses the same code. This script only reads the
 * Latin-1 files, writes YAML and prints what the editor would say about the
 * result.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { stringify } from "../../../../packages/app/node_modules/yaml/dist/index.js";
import { serializeMap } from "../../../../packages/shared/src/railway/map/map-serialization";
import {
	convertRailosRailway,
	convertRailosTimetable,
} from "../../../../packages/shared/src/railway/railos";
import {
	hasErrors,
	validateTimetable,
} from "../../../../packages/shared/src/railway/timetable/validate";
import { issueText, railwayProblems } from "./authoring";

const [rlyPath, ttbPath, railwayOut, timetableOut] = process.argv.slice(2);
if (!rlyPath || !ttbPath || !railwayOut || !timetableOut) {
	console.error("usage: import-railos.ts <in.rly> <in.ttb> <out-railway.yaml> <out-timetable.yaml>");
	process.exitCode = 2;
	throw new Error("missing arguments");
}

const railway = convertRailosRailway(readFileSync(rlyPath, "latin1"));
const title = ttbPath.split("/").pop()?.replace(/\.ttb$/i, "");
const { timetable, warnings: timetableWarnings } = convertRailosTimetable(
	readFileSync(ttbPath, "latin1"),
	{ title },
);
const { map, counts } = railway;

const yamlOptions = { indent: 2, lineWidth: 0, aliasDuplicateObjects: false };
writeFileSync(railwayOut, stringify(serializeMap(map), yamlOptions));
writeFileSync(timetableOut, stringify(timetable, yamlOptions));

const problems = railwayProblems(map);
const issues = validateTimetable(timetable, map);
console.log(`Railway: ${counts.trackElements} track elements, ${counts.otherElements} others, ${counts.labels} labels.`);
console.log(`Timetable: ${timetable.services.length} services.`);
for (const w of [...railway.warnings, ...timetableWarnings]) console.log(`  warning: ${w}`);
console.log(problems.length ? `Railway has ${problems.length} problems:` : "Railway complete.");
for (const p of problems.slice(0, 40)) console.log(`  - ${p}`);
const errors = issues.filter((x) => x.severity === "error");
console.log(hasErrors(issues) ? `Timetable has ${errors.length} errors:` : `Timetable valid (${issues.length} warnings).`);
for (const x of errors.slice(0, 40)) console.log(`  - ${issueText(x)}`);
console.log(`Wrote ${railwayOut}\nWrote ${timetableOut}`);
