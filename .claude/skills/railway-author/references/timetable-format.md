# The timetable document

Source of truth: `packages/shared/src/railway/timetable/types.ts`, `time.ts`,
`serialization.ts`.

The on-disk shape *is* the `Timetable` type — there is no separate save
format:

```jsonc
{
  "version": 1,
  "title": "Ashfield–Barton",   // optional
  "startTime": 18000,           // 05:00, in seconds
  "services": [ /* … */ ]
}
```

`parseTimetable` is strict: an action whose `kind` this build does not know is
a parse error, not something dropped quietly.

## Time

A `SimTime` is **whole seconds since 00:00 on the first day**, not wrapped.
An overnight sleeper departs at 85800 (23:50) and arrives at 109200 (30:20,
i.e. 06:20 the next morning), and `arrive > depart` stays a plain comparison.

- `parseSimTime("06:10")` / `at("06:10")` — also accepts `HH:MM:SS` and hours
  past 23, so `"25:10"` is the next day's 01:10.
- `formatSimTime` prints it back the same way (`25:10`); `formatWallClock`
  wraps to a station clock's face.

Times within a service must not go backwards, and no service that creates a
train may start before the timetable's `startTime`.

## Service

```jsonc
{
  "ref": "1A01",                // ≤ 8 chars; the last four are the headcode
  "description": "Ashfield to Barton",
  "train": { /* TrainSpec — only when the start action creates a train */ },
  "actions": [ /* start, …intermediates…, finish */ ],
  "repeat": { "intervalMinutes": 30, "headcodeIncrement": 2, "count": 3 }
}
```

- `ref` is unique in the timetable. Up to 8 characters: the last four are the
  headcode the train carries, anything before it disambiguates two workings
  that share one.
- `train` is **required when, and only when**, the first action creates a train
  (`startNew`, `startNewShuttle`). A follow-on service inherits the train and
  must not carry a spec.
- `repeat` re-runs the service on an interval; the engine expands it at run
  time. The ref must end in two digits for its repeats to be numbered, the
  interval must be at least a minute, the count at least one, and the increment
  a non-negative whole number.

### TrainSpec

```jsonc
{
  "startSpeedKmh": 0,        // ≥ 0, and not above maxSpeedKmh
  "maxSpeedKmh": 120,        // > 0
  "massTonnes": 200,         // > 0
  "brakeForceTonnes": 100,   // > 0
  "powerKw": 2000,           // > 0
  "signallerSpeedKmh": 40    // optional, > 0
}
```

`createDefaultTrainSpec()` in the shared package is the editor's default:
0 / 120 / 200 / 100 / 2000.

## Actions

Exactly one start first, exactly one finish last, intermediates between, in
non-decreasing time order. Any action may carry `"warning": true` (RailOS's
`[W]`), which announces it to the signaller rather than stopping.

### Start — one per service, first

| kind | Fields | Meaning |
| --- | --- | --- |
| `startNew` | `time`, `rear`, `front`, `signallerControl?` | A new train appears, rear and front on two joined cells (the pair is which way it faces). Needs a `train`. |
| `startNewService` | `time`, `fromRef` | Takes over the train a finished service left. |
| `startFromSplit` | `time`, `fromRef` | This service is the portion another split off. |
| `startNewShuttle` | `time`, `rear`, `front`, `otherRef` | Creates a train at rest (`startSpeedKmh: 0`) that shuttles back and forth with `otherRef`. Needs a `train` and `repeat`. |
| `startShuttle` | `time`, `fromRef`, `otherRef` | Starts a repeating shuttle taking over from feeder `fromRef` (`finishToShuttle`) and alternating with `otherRef`. Needs a `repeat`. |
| `startFromShuttle` | `time`, `fromRef` | Non-repeating tail service taking the train from finished shuttle `fromRef` (`finishShuttleNewService`). |

### Intermediate — any number

| kind | Fields | Meaning |
| --- | --- | --- |
| `stop` | `location`, `arrive?`, `depart?`, `minDwellSeconds?` | Call at a station. At least one time. **A single time is a departure when the stop is the service's first location, an arrival anywhere else.** `depart` may not precede `arrive`. |
| `pass` | `time`, `location` | Run through without stopping. |
| `changeDirection` | `time` | Reverse, typically in a platform. |
| `frontSplit` / `rearSplit` | `time`, `newRef` | Detach a portion, which becomes `newRef`. |
| `joinedBy` | `time`, `otherRef` | Wait here for `otherRef` to couple on. |
| `changeDescription` | `time`, `description` | Rename the working. |
| `changeMaxSpeed` | `time`, `maxSpeedKmh` | New line-speed cap for this train. |

### Finish — one per service, last

| kind | Fields | Meaning |
| --- | --- | --- |
| `finishNewService` | `time`, `nextRef` | Hand the train to `nextRef`. |
| `finishJoin` | `time`, `otherRef` | Couple onto `otherRef`, which is waiting with a `joinedBy`. |
| `finishRemainHere` | — | Stay put under signaller control. The only action with no time. |
| `finishToShuttle` | `time`, `nextRef` | Non-repeating feeder handing its train over to repeating shuttle `nextRef` (`startShuttle`). |
| `finishExit` | `time`, `exits` | Leave the map. `exits` is a non-empty list of cells, each an `exit` track; any one will do, so a diverted train still finishes. |
| `finishShuttleRemainHere` | `time`, `otherRef` | End a shuttle leg back into `otherRef`, or terminate under signaller control after the final repeat. |
| `finishShuttleNewService` | `time`, `nextRef`, `otherRef` | End a shuttle leg back into `otherRef`, or hand over to non-repeating tail `nextRef` (`startFromShuttle`) after the final repeat. |

## Links between services

Non-shuttle links match from both ends, exactly once, at the **same time**,
while shuttle links pair the repeating legs, feeder, and tail:

| One service | The other |
| --- | --- |
| `finishNewService` → `nextRef` | `startNewService` ← `fromRef` |
| `frontSplit` / `rearSplit` → `newRef` | `startFromSplit` ← `fromRef` |
| `joinedBy` → `otherRef` | `finishJoin` ← `otherRef` |
| `startNewShuttle` / `startShuttle` → `otherRef` | `finishShuttleRemainHere` / `finishShuttleNewService` ← `otherRef` |
| `finishToShuttle` → `nextRef` | `startShuttle` ← `fromRef` |
| `finishShuttleNewService` → `nextRef` | `startFromShuttle` ← `fromRef` |

Each side must name the other, the named service must exist, and no service
may name itself. A one-sided link is `unmatched-reference`; two services
answering the same one is `ambiguous-reference`; disagreeing clocks is
`reference-time-mismatch`.

## Against the railway

Checked only when a map is supplied (`validateTimetable(tt, map)`):

- every `stop` / `pass` location must be a label on the railway
  (`getLocationNames`) — trimmed, exact, case-sensitive;
- a `startNew` or `startNewShuttle` pair must be two different cells, both
  track, adjacent *and* joined by reciprocal links, with the front not on an
  exit and neither on a level crossing;
- every `finishExit` cell must be an `exit` track.

`getStartableCells(map)` and `getExitCells(map)` list the legal cells for the
first and last of those.
