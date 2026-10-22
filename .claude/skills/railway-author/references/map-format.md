# The railway document

Source of truth: `packages/shared/src/railway/map/map-serialization.ts`,
`track/track-data.ts`, `map/map-connectivity.ts`,
`timetable/locations.ts`.

## Coordinates

A **cell** is `{ gx, gy }`. The map stores element coordinates, which are cells
scaled by `imageSize` (`cellToLocation`). Documents written for the app use
`imageSize: 1`, so the two coincide; `Map_` itself defaults to 16, which is why
the shared tests use that — a forgotten conversion shows up as a failure there.

**+Y is up.** The renderer flips it (`packages/app/src/lib/grid.ts`), the model
does not.

## Link indices

Every track exposes a mask of links 0–8, and two cells are joined only when
each exposes the reciprocal (`link` ↔ `8 - link`).

```
 0  1  2      top-left     top        top-right      (gy + 1)
 3  4  5      left       (unused)     right          (gy)
 6  7  8      bottom-left  bottom     bottom-right   (gy - 1)
```

`LINK_OFFSETS[link]` gives `[dx, dy]`; link 4 is unused.

## Subtype → links

| Kind | Subtype | Links |
| --- | --- | --- |
| `straight` | `STRAIGHTH` | 3, 5 |
| | `STRAIGHTV` | 1, 7 |
| | `STRAIGHTLEFTUP` | 0, 8 |
| | `STRAIGHTRIGHTUP` | 2, 6 |
| `directed` | `DIRECTEDLEFT` / `DIRECTEDRIGHT` | 3, 5 |
| | `DIRECTEDUP` / `DIRECTEDDOWN` | 1, 7 |
| | `DIRECTEDLEFTUP` / `DIRECTEDRIGHTDOWN` | 0, 8 |
| | `DIRECTEDRIGHTUP` / `DIRECTEDLEFTDOWN` | 2, 6 |
| `curved` | `TIGHTCURVE1` … `4` | 5,7 · 3,7 · 1,5 · 1,3 |
| | `CURVE1` … `8` | 5,6 · 3,8 · 0,5 · 2,3 · 1,8 · 1,6 · 2,7 · 0,7 |
| `exit` | `EXITLEFT` / `RIGHT` / `UP` / `DOWN` | 5 · 3 · 7 · 1 |
| | `EXITLEFTUP` / `RIGHTUP` / `LEFTDOWN` / `RIGHTDOWN` | 8 · 6 · 2 · 0 |
| `buffer` | same pattern as `exit` | `BUFFERLEFT` → 5, `BUFFERUP` → 7, … |
| `signal` | `SIGNALLEFT` / `RIGHT` | 3, 5 |
| | `SIGNALUP` / `DOWN` | 1, 7 |
| | `SIGNALLEFTUP` / `RIGHTDOWN` | 0, 8 |
| | `SIGNALRIGHTUP` / `LEFTDOWN` | 2, 6 |
| `bridgeUnderpass` | `BRIDGE1` / `UNDERPASS1` | 3, 5 |
| | `BRIDGE2` / `UNDERPASS2` | 1, 7 |
| `linked` | `LINKLEFT` → 5, `LINKRIGHT` → 3, `LINKUP` → 7, `LINKDOWN` → 1, `LINKLEFTUP` → 8, `LINKRIGHTUP` → 6, `LINKLEFTDOWN` → 2, `LINKRIGHTDOWN` → 0 | one link each |
| `crossover` | `CROSSOVER1` … `6` | 1,3,5,7 · 0,2,6,8 · 0,1,7,8 · 1,2,6,7 · 0,3,5,8 · 2,3,5,6 |
| `flyover` | `FLYOVER1` … `12` | as `crossover`, two per geometry |
| `switch` | see below | three links |

**The direction in the name is the side the track continues on.** `EXITLEFT`
is an exit on the left-hand edge whose rail points right (link 5); `BUFFERUP`
stops a train going up and links downward (link 7).

### Switches

`SWITCHTIGHT*` and `SWITCHSPLIT*` route only along their two real rails —
their link mask alone would admit a third pairing that the art does not have.

| Subtype | Links | Through | Diverging |
| --- | --- | --- | --- |
| `SWITCHTIGHT1` | 1,3,5 | 3↔5 | 1↔3 (left→up) |
| `SWITCHTIGHT2` | 1,3,5 | 3↔5 | 1↔5 (right→up) |
| `SWITCHTIGHT3` | 3,5,7 | 3↔5 | 3↔7 (left→down) |
| `SWITCHTIGHT4` | 3,5,7 | 3↔5 | 5↔7 (right→down) |
| `SWITCHTIGHT5` | 1,3,7 | 1↔7 | 3↔7 (left→down) |
| `SWITCHTIGHT6` | 1,5,7 | 1↔7 | 5↔7 (right→down) |
| `SWITCHTIGHT7` | 1,3,7 | 1↔7 | 1↔3 (left→up) |
| `SWITCHTIGHT8` | 1,5,7 | 1↔7 | 1↔5 (right→up) |

`SWITCHSPLIT1`…`8` are a stem plus two branches, and the branch-to-branch pair
is not a rail: stems/branches are 3:{2,8}, 5:{0,6}, 3:{2,7}, 5:{1,6}, 3:{1,8},
5:{0,7}, 7:{0,2}, 1:{6,8}.

`SWITCH1`…`16` use the plain geometric rule: any pair of their links that some
straight or curve also joins.

### Other traversal rules

- `crossover` and `flyover` carry two paths that cross without connecting —
  only the opposite link (`8 - entry`) is reachable.
- `directed` track is one-way, and preferred directions respect it:
  `DIRECTEDRIGHT` is 3→5, `DIRECTEDLEFT` 5→3, `DIRECTEDUP` 7→1,
  `DIRECTEDDOWN` 1→7, `DIRECTEDLEFTUP` 8→0, `DIRECTEDRIGHTDOWN` 0→8,
  `DIRECTEDRIGHTUP` 6→2, `DIRECTEDLEFTDOWN` 2→6.
- No track routes a U-turn (`entry === exit`).

## Platforms

`platform1` / `platform2` are the two sides, and which `Platform` value sets
which depends on the orientation:

| Track | `Platform.UP` | `DOWN` | `LEFT` | `RIGHT` |
| --- | --- | --- | --- | --- |
| Horizontal (`STRAIGHTH`, `DIRECTEDLEFT/RIGHT`, `BUFFERLEFT/RIGHT`, …) | platform1 | platform2 | — | — |
| Vertical (`STRAIGHTV`, `DIRECTEDUP/DOWN`, `BUFFERUP/DOWN`, …) | — | — | platform1 | platform2 |

A mismatch is **ignored silently** by `map.addPlatform`; the `platform` helper
checks and throws. A cell with a level crossing, or one linked to a named
location, refuses platforms. `curved`, `crossover` and `flyover` have no
platforms at all.

## Names

A `Text` lives in the map's own list, and elements reference it — several
elements may share one object, which is how a station spans cells.
`serializeMap` preserves the sharing by index.

- **Must be named** for the railway to be complete: platforms, bridges and
  underpasses, named locations, concourses.
- **Counts as a timetable location** (`getLocationNames`): the label on a
  platform, on a track linked to a named location, and on named locations
  themselves. Concourse and bridge labels do *not* — nothing calls there.

## Completeness

`isRailwayComplete` is what the editor gates the timetable on. It needs all of:

1. at least one track;
2. no dangling links — every active link joins a neighbour that links back;
3. every portal (`linked`) paired;
4. nothing nameable left unnamed;
5. every track carrying at least one preferred-direction pair;
6. no broken preferred direction — one pointing into empty space, into a cell
   with no reciprocal link, through a missing switch rail, or into a neighbour
   that does not receive the route.

`railwayProblems(map)` in `scripts/authoring.ts` reports all six in cells.

## The serialized shape

```jsonc
{
  "version": 1,
  "imageSize": 1,
  "tracks": [
    {
      "data": { "kind": "straight", "subtype": "STRAIGHTH",
                "platform1": true, "platform2": false, "levelCrossing": false },
      "x": 2, "y": 0,
      "mainSpeed": 200, "mainLength": 100,      // km/h, metres
      "secondarySpeed": -1, "secondaryLength": -1,  // -1 when the kind has no second path
      "preferredDirections": [{ "entry": 3, "exit": 5 }],
      "textIndex": 0,                            // index into "texts"
      "linkedTo": [8, 2]                         // portals only
    }
  ],
  "namedLocations": [{ "x": 4, "y": 2, "textIndex": 1 }],
  "concourses": [],
  "parapets": [{ "type": "PARAPET1", "x": 0, "y": 3 }],
  "texts": [{ "x": 2, "y": 0, "readableText": "Ashfield",
              "font": { "family": "sans-serif", "pointSize": 12 } }]
}
```

Defaults the `Track` constructor seeds (`DEFAULT_MAIN_SPEED` and friends in
`track/track-color.ts`): 200 km/h and 100 m on both paths, with the secondary
pair written as `-1` for kinds that have no second path. Serialization always
writes the full quad, so a save round-trips exactly whatever the defaults are.
