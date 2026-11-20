# Track Speed & Length Editing — Requirements

## Context (grounded in current code)
- `Track` (`packages/shared/src/railway/track/track.ts`) holds `trackMainSpeed` (default **200 km/h**) and `trackMainLength` (default **100 m**). These are the "defaults".
- Tracks where `hasSecondaryPath(kind)` is true also carry `trackSecondarySpeed` / `trackSecondaryLength` (same 200/100 defaults).
- ⚠️ These fields are currently `readonly` — editing requires making them mutable (add setters; extend `mainSpeedLengthToString` / serialization accordingly).
- "Following the links through" = tracing a connected run of tracks via `linkMask` + `LINK_OFFSETS` (`packages/shared/src/railway/map/map-connectivity.ts`). That connected run is a **section**.
- Canonical stored units: **metres** and **km/h**. Imperial/mph are input/display aids only.

---

## F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested)

### F1.1 Length → metres (combined imperial input)
- Single field accepts mixed rail-style input, e.g. `1 mile 40 chains 5 yards`, summed to metres.
- Factors: 1 mile = 1609.344 m, 1 chain = 20.1168 m, 1 yard = 0.9144 m.

### F1.2 Speed: mph → km/h
- 1 mph = 1.609344 km/h.

### F1.3 Precision
- Store full precision; **display to 1 decimal place** (metres and km/h).

---

## F2 — Track colour legend
Colour each track by how its speed/length compare to defaults (200 km/h / 100 m):

| Colour | Speed | Length | Meaning |
|--------|-------|--------|---------|
| Black / white | default | default | untouched |
| Red | non-default | default | custom speed only |
| Yellow | default | non-default | custom length only |
| Blue | non-default | non-default | both customised |

- **F2.1** Visible legend/key graphic explaining the mapping and stating defaults (100 m, 200 km/h).
- **F2.2** Colour derived from one shared "differs-from-default" helper used by both renderer and editor.
- **F2.3** Secondary paths: a track is treated as non-default if **any** path (main OR secondary) differs from default.

---

## F3 — Track section editor
- **F3.1 Trigger:** clicking a track selects it and traces the connected run through its links to identify the whole **section**.
- **F3.2 Display:** show the section's current length and speed limit in stored units (m, km/h) with imperial/mph equivalents shown for reference.
- **F3.3 Edit:** enter new length and/or speed; imperial/mph entry via F1 converters, stored as metres/km/h.
- **F3.4 Scope:** edits apply to the **whole traced section** (every track in the connected run).
- **F3.5 Actions:**
  - **Apply/Save** — commit new values.
  - **Cancel** — discard edits, keep prior values.
  - **Restore to defaults** — reset the section to 200 km/h and 100 m.
- **F3.6** Track colours (F2) update immediately after Apply/Restore.
- **F3.7** For secondary-path tracks, the editor exposes both main and secondary speed/length.

---

## F4 — Standalone converter widgets
Always-available UI converters, independent of selection:
- (a) miles/chains/yards → metres (combined input)
- (b) mph → km/h
