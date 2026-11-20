---
name: railway-author
description: Author railway maps and timetables for rail-op-sim — build a track layout, name its stations, set preferred directions, and write services that the editor will load without complaint. Use when asked to create, generate, extend or fix a railway, a map, a track layout, a timetable, services, a headcode or a train working, or a railway.json / timetable.json / .yaml document, and when a hand-made document is rejected as incomplete or invalid.
---

# Authoring railways and timetables

Two documents drive this simulator: a **railway** (`SerializedMap` — track,
platforms, labels, preferred directions) and a **timetable** (services, each an
ordered list of actions). Both save as JSON or YAML from the editor and load
back through `deserializeMap` / `parseTimetable`.

**Generate them with a script that calls the real model. Do not hand-write the
JSON.** A `SerializedMap` carries link masks, preferred-direction pairs and
label indices that must agree with each other; a hand-written one loads and
then sits in the editor saying "the railway is not complete", with no clue
which of forty cells is wrong. A generator calls `addTrack`,
`setPreferredDirectionsAlongPath` and `serializeMap`, so the model computes all
of that, and `writeDocuments` refuses to save anything the validator rejects.

## Workflow

1. **Settle the layout in cells first.** Sketch it as a grid — `gy` rows, `gx`
   columns, **+Y is up** — and decide where the exits, stations and junctions
   go before writing any code. Ask the user for anything load-bearing you would
   otherwise invent: how many stations, single or double track, where trains
   enter and leave, roughly what service pattern.
2. **Copy `examples/branch-line.ts`** to `work/<name>.ts` (gitignored —
   `mkdir -p .claude/skills/railway-author/work` first) or wherever the user
   wants the generator kept, and edit it. It already has the shape: track,
   platforms, names, directions, services, `writeDocuments`.
3. **Run it:**
   ```bash
   .claude/skills/railway-author/scripts/run.sh <generator.ts> <railway.json> <timetable.json>
   ```
   It prints the railway's problems, the timetable's issues, and writes nothing
   until both are clean.
4. **Fix what it reports, and rerun.** The messages name the cell or the
   service and action index. `references/validation.md` has every issue code
   with its cause and its fix.
5. **Check an existing pair of documents** (including ones the user saved from
   the editor) with:
   ```bash
   .claude/skills/railway-author/scripts/run.sh \
     .claude/skills/railway-author/scripts/check-documents.ts railway.json timetable.json
   ```
   JSON or YAML; either argument alone is fine; without a railway only the timetable's
   structural half is checked. Exits non-zero when something is wrong.
6. **Import a RailOS railway and timetable** (`.rly` + `.ttb`) as YAML with
   `scripts/import-railos.ts <in.rly> <in.ttb> <railway.yaml> <timetable.yaml>`,
   run through `run.sh` like any generator. It reports anything it could not
   translate, then the railway's problems and the timetable's issues. The
   conversion itself is `convertRailosRailway` / `convertRailosTimetable` in
   `packages/shared/src/railway/railos/`, which the app's footer "Import from
   RailOS" dialog also uses — fix converter bugs there, not in the script.
7. **Type-check the generator** if it is going to be kept:
   `pnpm exec tsc -p .claude/skills/railway-author/tsconfig.json`.

Keep the generator script. It is the readable source of a layout that is
otherwise a thousand lines of JSON, and the next change is an edit and a rerun
rather than a hand-patch.

## The rules that break documents

- **Cells, not coordinates.** Every helper takes `{ gx, gy }`. The map stores
  `gx * imageSize`, and the app's documents use `imageSize: 1` — `newRailway()`
  sets that. `Map_` on its own defaults to 16.
- **+Y is up.** Link 1 (`top`) is `gy + 1`. A bay platform drawn above the main
  line is a *higher* `gy`.
- **Adjacent is not joined.** Two cells join only when each exposes the
  reciprocal link (`link` and `8 - link`). An H straight beside a V straight is
  not connected to it, and the railway will not be complete.
- **Every track needs a preferred direction**, and a line worked both ways
  needs both. Route with `direct` / `directBothWays` between the *ends* of a
  line (an exit, a buffer), not between arbitrary middles.
- **A switch only routes along its two real rails.** `SWITCHTIGHT1` diverges
  left-to-up, `SWITCHTIGHT2` right-to-up, and so on — picking the wrong variant
  means `direct` reports no path. The table is in `references/map-format.md`.
- **Platforms need a label, and the label is the location a timetable books
  to.** Several cells sharing one `name(...)` call are one station; a service
  booked there may use any of them. Bridges, underpasses, named locations and
  concourses also need names, but no train can be booked to them.
- **A platform side must suit the track's orientation** — UP/DOWN on
  horizontal track, LEFT/RIGHT on vertical. The map ignores a mismatch; the
  `platform` helper turns that silence into an error.
- **A service is exactly one start action, then intermediates, then exactly one
  finish action**, in time order. A start that creates a train (`startNew`,
  `startNewShuttle`) needs a `train` spec; one that takes over an existing
  train must not have one.
- **Links between services are matched from both ends.** `finishNewService` →
  `startNewService`, `frontSplit`/`rearSplit` → `startFromSplit`, `joinedBy` →
  `finishJoin`, and shuttle links (`finishToShuttle` → `startShuttle`,
  shuttle start `otherRef` ↔ shuttle finish `otherRef`,
  `finishShuttleNewService` → `startFromShuttle`), each naming the other.

## Reference

- `references/map-format.md` — coordinates, link indices, every subtype's
  links, switch and one-way traversal rules, platforms, naming, what makes a
  railway complete.
- `references/timetable-format.md` — the timetable and service shapes, times,
  every action kind and its fields, how services hand trains to each other.
- `references/validation.md` — every issue code, what causes it, how to fix it.
- `scripts/authoring.ts` — the helpers; read it when you need a shape it does
  not cover, and add to it rather than working around it.

## Notes

- `run.sh` uses `jiti` from `packages/shared/node_modules` because the repo has
  no TypeScript runner of its own. If it is missing, `pnpm install`.
- Documents are written as JSON. The editor reads YAML too, and saves back in
  whichever encoding it loaded, so JSON is the safe default to hand over.
- After changing code under `packages/`, the project asks for
  `graphify update .`; generating documents does not touch the model, so that
  is only needed when the authoring scripts themselves change.
