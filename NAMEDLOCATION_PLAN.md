# NamedLocation in rail-op-sim — Implementation Plan (v2)

> Goal: a user can place a NamedLocation (done), then use a **dedicated "Name"
> tool** to give it a text label; naming a NamedLocation also labels any
> **adjacent NamedLocations** with the **same text**.
>
> **Audit headline:** the shared data model is almost entirely ported already —
> including the adjacency-spread logic the naming tool needs. The remaining work
> is (a) one prerequisite coordinate fix and (b) the UI for a Name tool. Free-text
> placement is left untouched; naming flows only through the new tool.

---

## 0. Phasing (per your framing)

- **Phase 1 — place a NamedLocation, unlinked.** ✅ Already done. `PlacementController`
  `createAddNamedLocation` (`:252`), renders the blue "unset" sprite
  (`ElementLayer.ts:173`), palette entry (`AddPalette.tsx:49`).
- **Phase 2 — a "Name" tool.** ❌ To build. When active, clicking a NamedLocation
  opens a dialog to enter text; the text links to that NamedLocation **and floods
  to adjacent NamedLocations**, all sharing one `Text`. Set / change / delete.
- **Phase 0 (prerequisite) — coordinate-unit fix.** ⚠️ Must land before the spread
  works. See §2.

---

## 1. Key finding: the adjacency spread is already implemented

You don't need to write the "spread to adjacent NamedLocations" logic — it exists
in `packages/shared/src/railway/map/map-text-linking.ts`:

- `linkLocalText(map, x, y, text)` (`:67`) sets the text on the NamedLocation at
  `(x, y)` (`:94`), then — because the cell is a NamedLocation, not a
  track/concourse — runs the **neighbor branch** (`:113–123`), calling
  `tryLinkNamedLocationNeighbor` on each of the 4 cardinal cells.
- `tryLinkNamedLocationNeighbor` (`:50`) recurses into `linkLocalText` for any
  **unnamed** NamedLocation neighbor (`:58`), so the same `Text` object floods
  across the entire connected group. Recursion terminates because each cell is
  marked named (`setText`) before its neighbors are visited, so the flood never
  walks back into an already-named cell.

Net effect, once invoked at a NamedLocation cell: that cell and every
edge-connected unnamed NamedLocation end up referencing **one shared `Text`**.
That is exactly "adjacent ones are set to the same text."

The model entry point to trigger this is `map.createAddLinkText(x, y, text, ok,
font)` (`map.ts:347`), which creates the `Text` then calls `linkLocalText`.

**But there is a catch — see §2.** And note the current tests only cover a
single-cell link (`map-text-linking.test.ts:70`, NamedLocation at `(0,0)`); the
multi-cell spread is **untested**, which is consistent with it being latent/broken
due to the coordinate mismatch.

---

## 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX

The neighbor math and the app's stored coordinates disagree on what "adjacent"
means:

- **Model neighbor math** uses `grid = map.getImageSize()` and looks at
  `locationX ± dx*grid`. `imageSize` defaults to **16** (`map.ts:56`) — a holdover
  from RailwayBuilder's 16-pixel cells. Used by `linkLocalText` (`map-text-linking.ts:101/115`),
  `collectNeighbourTexts` (`:159`), and `map-connectivity.ts:41`.
- **App stored coordinates** are **integer grid indices**. Placement passes
  `cell.gx/cell.gy` from `worldToGrid` = `Math.round(wx / CELL_SIZE)`
  (`grid.ts:27`), so adjacent cells differ by **1**. `setImageSize` is never
  called by the app.

So a NamedLocation stored at `(3, 5)` makes `linkLocalText` probe `(19, 5)`,
`(-13, 5)`, … — all empty. The spread finds no neighbors and silently no-ops.

### Recommended fix (minimal, localized)

Call **`map.setImageSize(1)`** when the app constructs/initializes its `Map_`
(wherever the editor instantiates the map for `PlacementController`). With
`imageSize === 1`, neighbor offsets become `±1`, matching integer-grid storage,
and the existing spread logic works unchanged.

### Validation required (because it's shared)

`getImageSize()` also drives `map-connectivity.ts` neighbor offsets. Changing it
to 1 will change connectivity's notion of adjacency too. Before/after the change:

- Run `pnpm -r test` — check `map-connectivity.test.ts`, `map.test.ts`
  (`setImageSize(32)` test at `:78` just asserts the setter; not a blocker).
- Manually verify track auto-connection / linked-track behavior still works in
  the dev app, since it was presumably also relying on (or dormant under) the old
  value.

> If connectivity turns out to *depend* on a different spacing, the fallback is to
> store elements at `gx*imageSize` coords instead — larger blast radius, so prefer
> `setImageSize(1)` unless validation forces otherwise.

---

## 3. Phase 2: the "Name" tool

Faithful analog of RailwayBuilder's `Mode::SETCHANGENAMEDELEMENT` +
`clickSetChangeDeleteNamedElement` + the name/edit toolbar button — expressed in
rail-op-sim's store-driven architecture.

### 3a. Store — new tool + pending target

`packages/app/src/store/editor-store.ts`

- Extend `Tool` (`:6`): `"select" | "add" | "delete" | "name"`.
- Add a pending-name target, mirroring `pendingTextLocation` (`:50`):
  ```ts
  pendingNameTarget: { gx: number; gy: number } | null;
  setPendingNameTarget: (loc: { gx: number; gy: number } | null) => void;
  ```
- In `setTool`, leaving any tool clears `pendingNameTarget` (like the add-palette
  reset at `:75`).

### 3b. Click dispatch

`packages/app/src/engine/PlacementController.ts` — `onPointerUp` tool switch
(`:200`/`:232`):

```ts
if (tool === "name") {
  const cell = this.screenToGrid(e.clientX, e.clientY);
  if (!cell) return;
  const nl = this.map.getNamedLocationAt(cell.gx, cell.gy); // map.ts:476
  if (nl) {
    useEditorStore.getState().setPendingNameTarget({ gx: cell.gx, gy: cell.gy });
  }
  return;
}
```

- Targeting `getNamedLocationAt` keeps the tool focused on NamedLocations (your
  spec). It generalizes to `getNamedElementAt` (`map.ts:188`) later if you want
  the one tool to also rename Concourses / platform-tracks.
- Update `refreshCursor` (`~:364`) so `tool === "name"` shows a text/pointer
  cursor.

### 3c. Dialog — set / change / delete

Add `packages/app/src/components/sim/NameElementDialog.tsx` (clone the structure
of `TextInputDialog.tsx`). It opens when `pendingNameTarget !== null`.

On open, pre-fill from the current label:
```ts
const nl = map.getNamedLocationAt(target.gx, target.gy);
const initial = nl?.getText()?.getReadableText() ?? "";
```

On confirm, branch on whether it's already named (this is the set/change/delete
fork; all model methods already exist):

```ts
const nl = map.getNamedLocationAt(target.gx, target.gy);
if (!nl) return;
const trimmed = content.trim();

if (nl.getNamed()) {
  // change (non-empty) or delete (empty) the SHARED text → updates/clears the
  // whole connected group at once. map-text-linking.ts:233
  map.changeDeleteText(trimmed, trimmed !== "", nl.getText()!);
} else if (trimmed !== "") {
  // first naming: create text at this cell and flood to adjacent NamedLocations
  map.createAddLinkText(target.gx, target.gy, trimmed, true, {
    family: "JetBrains Mono",
    pointSize: 12,
  }); // map.ts:347 → linkLocalText spread (needs Phase 0)
}
elementLayer.sync(map);     // re-render set/unset sprites + the new text
```

Semantics that follow for free from the model:

- **Shared label.** The group shares one `Text`. Renaming via `changeDeleteText`
  edits that one object → every linked NamedLocation updates. Deleting (empty
  input) calls `deleteTextFromAllElements` (`:129`) → unlinks the whole group and
  removes the on-canvas text.
- **Group grows on later placement.** If the user adds a *new* NamedLocation next
  to a named one afterward, `createAddNamedLocation → linkNewElementToText`
  (`map.ts:294`, `map-text-linking.ts:191`) makes the newcomer inherit the
  neighbor's text. So the shared-label group expands automatically. (Also needs
  Phase 0, since `collectNeighbourTexts` uses `imageSize`.)
- **Cancel/Escape** clears `pendingNameTarget`, no change.

### 3d. Toolbar button

`packages/app/src/components/sim/Toolbar.tsx` — add a "Name" button beside
select/add/delete calling `setTool("name")` (a tag/text lucide icon;
RailwayBuilder used `setChangeNamedLocation.png`). Mount `NameElementDialog`
alongside `TextInputDialog` (`AddPalette.tsx:284`, or in `SimLayout`/`SimCanvas`),
opening on `pendingNameTarget !== null`.

### 3e. Render check

`ElementLayer.sync` already swaps the sprite by `nl.getNamed()` (`:177`) and draws
texts from `textList`. Verify a name-tool-created `Text` (stored at the
NamedLocation's integer grid coords) renders at the right pixel position via
`gridToWorld` — the free-text path uses fractional grid coords, so confirm both
conventions position correctly.

---

## 4. Tests & verification

- **New model test (the gap)** in `map-text-linking.test.ts`: place 3 NamedLocations
  in a row at `(0,0),(1,0),(2,0)`, `createAddLinkText` on the middle one, assert
  **all three** `getNamed()` and share the *same* `Text` instance
  (`===`) with the same readable text. This is the multi-cell spread that's
  currently uncovered — and it doubles as the regression test proving Phase 0
  fixed the coordinate mismatch. Add a delete test: empty input clears all three.
- **Phase 0 regression**: full `pnpm -r test` green, especially connectivity tests;
  manual track-connection smoke test in dev.
- **Manual UX**: Name tool → click unnamed NamedLocation → type → it + adjacent
  ones turn "set" and show the shared label; reopen → pre-filled → edit → all
  update; reopen → clear → all revert to "unset" and the text disappears.
- `pnpm check` (Biome) green; then `graphify update .` (per `CLAUDE.md`).

---

## 5. Suggested order

1. **Phase 0**: `setImageSize(1)` at map init + validation (unblocks the spread).
2. New model spread/delete test (red → green proves Phase 0).
3. Store: `"name"` tool + `pendingNameTarget`.
4. Click dispatch in `PlacementController`.
5. `NameElementDialog` confirm logic.
6. Toolbar button + dialog mount.
7. Manual QA + `graphify update .`.

---

## 6. Gap analysis — RailwayBuilder breakdown → rail-op-sim status

| # | RailwayBuilder area | rail-op-sim location | Status |
|---|---|---|---|
| 1 | `NamedLocation : NamedElement` (ctor, `toQString`, `toQStringForSave`) | `element.ts` — `NamedElement`, `NamedLocation` | ✅ Done |
| 2 | `ElementChosen::NAMEDLOCATION` | `editor-store.ts:9` `ElementKind`; `AddPalette.tsx:49` | ✅ Done |
| 3 | `Mode::SETCHANGENAMEDELEMENT` (naming mode) | none yet → **Phase 2** (`tool:"name"`) | ❌ → Phase 2 |
| 4 | Map model: list/add/remove/check/accessors/save-string, `getElementExcludingTrackAt`, `getNamedElementAt` | `map.ts` — `:66, :277, :291, :211, :472, :476, :482, :486, :182, :188`; remove via `deleteElement :417/:443` | ✅ Done |
| 5 | Text linking adjacency: `linkLocalText`, `linkNewElementToText`, `createAddLinkText` | `map-text-linking.ts:67/191`; `map.ts:347` — **spread logic present** | ✅ Logic done / ⚠️ blocked by Phase 0 coord fix |
| 6 | Delete text on element removal | `map.ts deleteElement :417/:443`; `deleteTextFromAllElements :129`; `changeDeleteText :233` | ✅ Done |
| 7 | Track back-link `linkedNamedLocation` (not on Concourse) | `track.ts:37/:98/:102/:106` | ✅ Done |
| 8 | Canvas render + click + name handler | render `ElementLayer.ts:173`; place `PlacementController.ts:252`; **name handler missing** | ⚠️ render+place ✅ → name Phase 2 |
| 9 | Toolbar place + name/edit buttons | place `AddPalette.tsx:49`; **name button missing** | ⚠️ → Phase 2 |
| 10 | Graphics set/unset | `svgMap.ts:105`; `public/graphics/namedLocation{Set,Unset}.svg` | ✅ Done |
| 11 | File save/load | per-list `toSaveString` only; no writer/parser | ❌ Out of scope (known gap) |
| 12 | Adjacency entry points wired | model wired (`createAddNamedLocation→linkNewElementToText`); naming via new tool, not free-text | ⚠️ → Phase 2 |
| 13 | Tests | shared tests reference NamedLocation but **no multi-cell spread / naming-flow test** | ⚠️ add in §4 |

---

## 7. Known gap (unchanged, out of scope): file save/load

No top-level map serializer and no parser/loader exist (only per-list
`toSaveString`: `namedLocationListToSaveString :486`, etc.). Nothing round-trips,
NamedLocation included. This is a whole-map feature spanning every element type;
tackle separately with a `serializeMap`/`parseMap` pair + `filesaverTest.ts`.

---

## 8. Risk / watch-list

- **Phase 0 blast radius.** `setImageSize(1)` also changes `map-connectivity`
  adjacency. Validate track connectivity before shipping; fall back to scaled
  storage only if forced.
- **Shared-text editing scope.** `changeDeleteText` edits the existing shared
  `Text`; it does not re-scan for new neighbors. New adjacent NamedLocations join
  the group only when *they* are placed (via `linkNewElementToText`). Confirm
  that's the desired semantics.
- **Multi-neighbor prompt.** `linkNewElementToText` can hit
  `map.getTextSelectionPrompt()` when a new element borders >1 differently-named
  group (`:207`); unset → chosen `""` → those texts get deleted (`:219`). Decide
  whether to register a prompt or accept the default.
- **Concourse parity.** Concourse intentionally has no `linkedNamedLocation`; leave
  it — the back-link is NamedLocation-specific by design.
- **Text render coords.** Name-tool text is stored at integer grid coords vs.
  fractional for free text; verify both render correctly in `ElementLayer`.
