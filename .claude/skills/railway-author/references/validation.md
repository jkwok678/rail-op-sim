# Every issue the validator reports

`validateTimetable(tt, map?)` returns `TimetableIssue[]`, each with a stable
`code`, a `severity`, and the service and action index it belongs to. Errors
stop a timetable running; warnings do not. `railwayProblems(map)` in
`scripts/authoring.ts` covers the map side, which has no codes — the editor
reports it as one "railway is not complete".

Source: `packages/shared/src/railway/timetable/validate.ts`.

## Whole timetable

| Code | Severity | Cause | Fix |
| --- | --- | --- | --- |
| `unsupported-version` | error | `version` is not 1 | Write `version: 1`. |
| `invalid-start-time` | error | `startTime` is not a finite time ≥ 0 | Use `at("05:00")`. |
| `no-services` | warning | The timetable is empty | Add services, or accept it. |
| `duplicate-ref` | error | Two services share a `ref` | Refs are unique; add a prefix to one. |

## A service's identity

| Code | Severity | Cause | Fix |
| --- | --- | --- | --- |
| `empty-ref` | error | No headcode | Give it one, e.g. `1A01`. |
| `ref-too-long` | error | Over 8 characters | Trim to ≤ 8; the last four are the headcode. |
| `missing-train` | error | A start that creates a train, with no `train` | Add a `TrainSpec`. |
| `unused-train` | warning | A `train` on a service that takes over an existing one | Drop the spec. |
| `train-spec` | error | A spec value out of range | Mass, brake force, power and max speed must be above zero; start speed ≥ 0 and not above max; any signaller speed above zero. |
| `repeat-interval` | error | Interval under a minute | At least 1. |
| `repeat-count` | error | Count under 1 | At least 1 further run. |
| `repeat-increment` | error | Negative or fractional increment | A whole number ≥ 0. |
| `repeat-headcode` | error | Ref does not end in two digits | Number the working so repeats can be incremented (`1A01`, not `1A0A`). |

## A service's shape

| Code | Severity | Cause | Fix |
| --- | --- | --- | --- |
| `no-actions` | error | Empty `actions` | A service needs at least a start and a finish. |
| `no-start` | error | First action is not a start kind | Put a start kind (`startNew`, `startNewService`, `startFromSplit`, or a shuttle start) first. |
| `no-finish` | error | Last action is not a finish kind | End with a finish kind. |
| `start-not-first` | error | A start kind appears later | Only one start, at index 0. |
| `action-after-finish` | error | Actions after the finish | Move them before it, or split the working into two services. |
| `shuttle-needs-repeat` | error | A shuttle service has no `repeat` (or `count < 1`) | Add a `repeat` with `count ≥ 1` on every repeating shuttle service. |
| `shuttle-no-repeat` | error | `finishToShuttle` feeder or `startFromShuttle` tail carries a `repeat` | Drop `repeat` from non-repeating feeder/tail services. |
| `shuttle-start-speed` | error | `startNewShuttle` with `startSpeedKmh !== 0` | Set `startSpeedKmh: 0`. |

## Times

| Code | Severity | Cause | Fix |
| --- | --- | --- | --- |
| `invalid-time` | error | A time is not finite or is negative | Use `at("HH:MM")`. |
| `stop-without-time` | error | A `stop` with neither `arrive` nor `depart` | Give it at least one. |
| `depart-before-arrive` | error | `depart < arrive` at one stop | Fix the order, or carry the arrival past midnight (times do not wrap). |
| `invalid-dwell` | error | Negative `minDwellSeconds` | Zero or more. |
| `time-goes-backwards` | error | An action booked before the one before it | Reorder the actions, or correct the clock. Remember a lone time at the first location is a *departure*, anywhere else an *arrival*. |
| `start-before-timetable` | error | A train created before `startTime` | Move the service later, or the timetable's start earlier. |

## Links between services

| Code | Severity | Cause | Fix |
| --- | --- | --- | --- |
| `unknown-service-ref` | error | Names a service that is not in the timetable | Add it, or correct the ref. |
| `self-reference` | error | A service names itself | Name the other working. |
| `unmatched-reference` | error | One end of a link has no answer | Add the matching action: `finishNewService` ↔ `startNewService`, `frontSplit`/`rearSplit` ↔ `startFromSplit`, `joinedBy` ↔ `finishJoin`, `finishToShuttle` ↔ `startShuttle`, shuttle start `otherRef` ↔ shuttle finish `otherRef`, `finishShuttleNewService` ↔ `startFromShuttle`. |
| `ambiguous-reference` | error | Two actions answer the same link | Leave exactly one. |
| `reference-time-mismatch` | error | The two ends are booked at different times | Make them equal. |
| `shuttle-repeat-mismatch` | error | Alternating shuttle services disagree on `intervalMinutes`, `headcodeIncrement`, or `count` | Make both shuttle services share the exact same `repeat`. |
| `shuttle-time` | error | Shuttle leg finish, feeder handover, or tail takeover time disagrees with the shuttle repeat interval | Align the leg duration with `intervalMinutes`, feeder/shuttle times, and tail time with `finish + count * interval`. |
| `shuttle-integrity` | error | Following `finishNewService` from a shuttle start does not return to `otherRef` | Complete the loop so the chain finishes with `finishShuttleRemainHere` or `finishShuttleNewService` naming the shuttle start. |

## Against the railway

These need a map. Without one, `validateTimetable` runs the structural half
only.

| Code | Severity | Cause | Fix |
| --- | --- | --- | --- |
| `railway-incomplete` | warning | The map is not complete | Fix the railway first — these checks may be judging a half-built map. |
| `unknown-location` | error | No label of that name on the railway | Match a label exactly (`getLocationNames`), or name the platform on the map. |
| `start-not-track` | error | Rear or front cell is empty | Move the train onto track. |
| `start-same-cell` | error | Rear and front are the same cell | They are two cells; the pair is the facing. |
| `start-not-adjacent` | error | The two cells are not neighbours | Use cells one step apart, including diagonals. |
| `start-not-joined` | error | Neighbours whose links do not meet | The cells must expose reciprocal links (`link` and `8 - link`) — an H straight does not join a V straight. |
| `start-on-exit` | error | Front is on an exit | A train nose-out of an exit would leave at once; face it inward. |
| `start-on-level-crossing` | error | Either cell has a level crossing | Stand the train clear of it. |
| `no-exit` | error | `finishExit` with an empty `exits` | List at least one exit cell. |
| `exit-not-track` | error | No track at an exit cell | Use a cell from `getExitCells(map)`. |
| `exit-not-exit` | error | That cell is track, but not an `exit` | Same fix. |

## The railway's own problems

Not codes — `getConnectivityReport(map)` and the `railwayProblems` helper
report them as prose against a cell:

| Problem | Fix |
| --- | --- |
| `nothing joins back at link N → (x, y)` | Place the missing neighbour, or change one subtype so the two links are reciprocal. |
| `portal with no partner` | Place the other `linked` mouth and pair them. |
| `needs a name` | Label the platform, bridge, underpass, named location or concourse. |
| `no preferred direction` | Include the cell in a `direct()` route; run both ways for a bidirectional line. |
| `preferred direction E→X is broken` | The route points into empty space, into a cell with no reciprocal link, through a rail the switch does not have, or into a neighbour that does not receive it. Re-route after the track is final. |
