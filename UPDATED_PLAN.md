# Rail Ops Sim — Updated Plan (Railway Builder Focus)

> **Status**: This document supersedes `PLAN.md`. It reflects the actual state of the codebase as of June 2026 and narrows scope to **building the railway editor only** — track rendering, interactive building tools, selection/properties, and save/load. Simulation engine work is deferred.

---

## 1. Current State

### 1.1 What Exists

**M1: PixiJS on Screen — COMPLETE** ✅

| File | Purpose |
|------|---------|
| `packages/app/src/engine/PixiApp.ts` | PixiJS v8 `Application` factory, antialiasing, auto-density |
| `packages/app/src/engine/GroundLayer.ts` | Dynamic graph-paper grid, redraws on zoom/pan, theme-aware |
| `packages/app/src/engine/ViewportController.ts` | Pan (middle-mouse or Space+LMB), zoom (scroll, 0.05x–20x), `fitToView()` |
| `packages/app/src/hooks/usePixiApp.ts` | React hook: SSR-safe dynamic imports, scene graph (`stage → world → ground`), ResizeObserver, theme MutationObserver |
| `packages/app/src/components/sim/SimCanvas.tsx` | Thin wrapper div hosting PixiJS canvas |
| `packages/app/src/components/sim/SimLayout.tsx` | Full-screen `[1fr_auto]` grid: canvas + status bar |
| `packages/app/src/routes/index.tsx` | Home route loading `SimLayout` |
| `packages/app/src/routes/__root.tsx` | Root layout shell |

6 shadcn/ui components installed: button, dialog, input, select, separator, tooltip. Phosphor icons + JetBrains Mono font configured.

**Shared Data Model — COMPLETE** ✅

`packages/shared/src/railway/` contains a full RailwayBuilder port — a **grid-based** model with 11 track kinds and 60+ subtypes:

| Module | Purpose |
|--------|---------|
| `element.ts` | Element hierarchy: `Element` → `NamedElement` → `Track`, `NamedLocation`, `Concourse`, `Parapet`. Plus `Text` (editable labels). |
| `enums.ts` | `StraightType` (4), `DirectedType` (8), `CurvedType` (12), `LinkedType` (8), `ExitType` (8), `BufferType` (8), `SignalType` (8), `BridgeUnderpassType` (4), `SwitchType` (32), `CrossoverType` (6), `FlyoverType` (12), `ParapetType` (28), `Platform` |
| `track/track-data.ts` | `TrackData` discriminated union (11 variants), `KIND_META` (behavioral flags per kind), link tables for all subtypes (9-slot grid) |
| `track/track.ts` | Unified `Track` class: link bitmask, speed/length, platform accessors, level crossing, signal aspect, linked track pairing, CSV-safe serialization |
| `map/map.ts` | `Map_` class — central data structure with spatial index (`Map<string, Element>`), kind-based `Track[]` arrays, CRUD for all types |
| `map/map-connectivity.ts` | Link-mask-based connectivity validation |
| `map/map-platform.ts` | `addPlatform()`, `addLevelCrossing()` |
| `map/map-text-linking.ts` | Text-to-element linking with neighbor propagation |
| `types.ts` | `FontInfo`, `Point`, callbacks |
| `errors.ts` | `RailwayError`, `ElementAlreadyExistsError`, `ElementNotFoundError`, etc. |

8 test files with comprehensive coverage.

### 1.2 Data Model: Grid-Based, Not Graph-Based

The original `PLAN.md` assumed a vertex/edge graph model (`TrackGraph { vertices, edges }`). What's actually implemented is a **grid-based tile model**:

- Tracks are placed at integer grid coordinates `(x, y)`
- Connectivity is via **link masks** — a 9-bit bitmask where each bit represents a connection to one of 8 neighboring cells
- Link offsets (indices 0–8, index 4 unused):
  ```
  0: top-left    1: top       2: top-right
  3: left        4: (unused)  5: right
  6: bottom-left 7: bottom    8: bottom-right
  ```
- The grid uses a math coordinate system (+Y = up). Rendering flips Y so +Y = up on screen.

This is the model we'll use for the editor. When simulation work begins later, a graph can be derived from the grid connectivity — but that's out of scope for now.

---

## 2. Scope: Railway Builder Only

We're building the track editor. The goal: a user can place track tiles on a grid, see them rendered as a railway network, select and edit properties, and save/load sessions.

**In scope:**
- Track rendering on the PixiJS canvas (all 11 kinds, 60+ subtypes)
- Interactive building tools (tool palette, click-to-place, delete)
- Selection and property editing (right-side panel)
- Save/load to IndexedDB

**Out of scope (deferred):**
- Simulation engine (Web Worker, sim loop, train physics)
- Signalling and interlocking
- Timetables
- Failures and TSRs
- Graph derivation layer
- Undo/redo, copy/paste, labels, recording, performance optimization, production polish

---

## 3. Editor Milestones

Four milestones, each delivering a visible, testable increment.

---

### E1: Track Rendering

**Deliverable**: All track kinds render on the canvas at their grid positions. The user sees a complete railway network on screen.

This is the largest chunk of work — 11 track kinds × multiple subtypes each, all needing distinct geometry. But the foundation is solid: `Map_` holds the data, `usePixiApp` manages the PixiJS lifecycle, the viewport pans and zooms, and the ground layer draws the grid.

**Files to create:**

- [ ] `packages/app/src/lib/grid.ts` — Grid coordinate helpers:
  - `CELL_SIZE` constant (64px default — pixel distance between adjacent grid cells)
  - `gridToWorld(gx, gy)` → pixel coords (flips Y: grid +Y = screen up)
  - `worldToGrid(wx, wy)` → nearest grid coords
  - `linkDirection(linkIndex)` → pixel offset from cell center to edge for a given link
  - `LINK_OFFSETS` table (matching the shared package)

- [ ] `packages/app/src/renderer/sprites/TrackSprite.ts` — Renders one tile:
  - Takes a `Track` and creates a `Container` with `Graphics` children
  - Renders rail lines and sleeper ties for each active path
  - Theme-aware colors (CSS variable getters, same pattern as `GroundLayer`)
  - Platform indicators, signal aspect dots, buffer stop symbols, direction arrows
  - **Rendering strategies per kind**:

| Kind | Links | Paths | Rendering |
|------|-------|-------|-----------|
| `straight` | 2 (opposite) | 1 | Straight line between opposite edges |
| `directed` | 2 (opposite) | 1 | Like straight + direction arrow |
| `curved` | 2 (adjacent or diagonal) | 1 | Quadratic Bezier from one edge to the other |
| `linked` | 1 | 1 | Short stub from center to that edge |
| `exit` | 1 | 1 | Stub to edge + exit marker |
| `buffer` | 1 | 1 | Stub to edge + buffer stop symbol |
| `signal` | 2 (opposite) | 1 | Like straight + signal post icon + aspect dot |
| `bridgeUnderpass` | 2 (opposite) | 1 | Like straight + bridge/underpass marking |
| `switch` | 3 | 2 | Main path (straight through one pair) + diverging path (curves to third link) |
| `crossover` | 4 | 2 | Two independent crossing paths |
| `flyover` | 4 | 2 | Two paths at different elevations (lower drawn dimmed) |

- [ ] `packages/app/src/renderer/layers/TrackLayer.ts` — Container for all track sprites:
  - `sync(map: Map_)`: walks the map, creates/updates/destroys sprites
  - Maintains a `Map<string, Container>` keyed by coordinate for O(1) sprite lookup
  - Added as a child of the `world` container in the PixiJS scene graph

- [ ] Update `packages/app/src/hooks/usePixiApp.ts`:
  - Add `TrackLayer` to the scene graph (between `world` and `ground`)
  - Expose the layer or a sync function so the React layer can push updates

- [ ] Hardcode a test layout in the index route: build a small network via `Map_` API (oval loop with straights + curves, a siding with switches, a station with platforms, some signals) and sync it to the TrackLayer

**Implementation order** (most common → least common):
1. Straight H/V, tight curves (90°) — these make up 80% of most layouts
2. Wide curves (135°), diagonal straights
3. Switches (basic left/right turnouts first, then splits, then complex)
4. Directed, buffer, exit, signal
5. Crossovers, flyovers, linked, bridge/underpass

**Verification**: A hardcoded test layout appears on screen. All 11 track kinds are visible. Pan and zoom work. Theme toggle updates track colors.

---

### E2: Building Tools

**Deliverable**: Click to place track tiles. Select a kind and subtype from a palette, click the grid to place.

**Files to create:**

- [ ] `packages/app/src/store/ui-store.ts` (Zustand):
  ```typescript
  interface UIStore {
    activeTool: 'select' | 'track' | 'delete';
    // Track placement state
    selectedTrackKind: TrackKind | null;
    selectedTrackSubtype: string | null;
    // Selection state
    selectedElementCoords: string | null; // "x,y" key
    // Viewport
    showGrid: boolean;
    gridSize: number;
    // Actions
    setTool: (tool) => void;
    selectTrackKind: (kind) => void;
    selectTrackSubtype: (subtype) => void;
    selectElement: (coordKey) => void;
    deselectAll: () => void;
  }
  ```

- [ ] `packages/app/src/components/sim/ToolPalette.tsx`:
  - Left sidebar with tool buttons (select, track, delete)
  - When track tool active: sub-palette with track kind buttons
  - On selecting a kind: subtype selector grid (e.g., 4 straight subtypes shown as mini icons)
  - Active tool and selection visually highlighted

- [ ] Track placement behavior:
  - Select track kind + subtype → cursor shows ghost tile at mouse position
  - Click empty grid cell → `map.addTrack(data, gx, gy)` → sync layer
  - Click occupied cell → error toast (ElementAlreadyExistsError)
  - Ghost tile snaps to nearest grid cell

- [ ] Delete behavior:
  - Delete tool active → click tile to remove
  - Linked track pairs auto-disconnect
  - Warn if removing would orphan connected tiles

- [ ] Update `SimLayout.tsx` to include the `ToolPalette` in a left sidebar slot
- [ ] Wire canvas click events through to the active tool (need to extend `ViewportController` or add a separate click handler that accounts for viewport transform)

**Verification**: Select straight horizontal from the palette, click several cells to build a line. Switch to a tight curve, connect the ends into an oval. Switch to delete tool, remove a tile.

---

### E3: Selection & Property Editing

**Deliverable**: Click to select elements, see and edit their properties in a right-side panel.

**Files to create:**

- [ ] `packages/app/src/renderer/layers/SelectionLayer.ts`:
  - Hover highlight on elements during select mode (semi-transparent glow)
  - Selected element highlight (brighter outline/glow)
  - Click to select, click empty to deselect
  - Coordinate with the tool system: only active in 'select' mode

- [ ] `packages/app/src/components/sim/PropertiesPanel.tsx`:
  - Right sidebar, contextual based on selected element type
  - **Track selected** (read-only unless noted):
    - Kind and subtype (read-only labels)
    - Main speed (editable number input, default 200)
    - Main length (editable number input, default 100)
    - Secondary speed/length (editable, only shown if `hasSecondaryPath`)
    - Platform 1 / Platform 2 (checkboxes, only for platform-capable kinds)
    - Level crossing (checkbox, straight only)
    - Aspect (number, signal only)
    - Linked track info (linked only, shows paired track location)
  - Edits update the `Map_` and trigger a render sync

- [ ] Update `SimLayout.tsx` to include the `PropertiesPanel` in a right sidebar slot
- [ ] Keyboard: Delete/Backspace removes selected element

**Verification**: Select a track tile, see its properties in the right panel. Change the speed, verify the value updates. Toggle a platform, verify it appears on the rendered track.

---

### E4: Save & Load

**Deliverable**: Save a session to IndexedDB, reload it later.

**Files to create:**

- [ ] `packages/app/src/lib/serialization.ts`:
  - `serializeMap(map: Map_): SerializedSession` — uses existing `tracksToSaveStrings()` format
  - `deserializeMap(data: SerializedSession): Map_` — parses save format back into a `Map_`
  - Serialized session includes: track data by kind, named locations, concourses, parapets, text labels, metadata (name, createdAt)

- [ ] IndexedDB integration (`lib/db.ts`):
  - Install `dexie` if not already present
  - Schema: `sessions` table (`id`, `name`, `description`, `createdAt`, `updatedAt`, `state` blob)
  - `saveSession()`, `loadSession()`, `listSessions()`, `deleteSession()`

- [ ] `packages/app/src/components/dialogs/SaveDialog.tsx`:
  - Name field (required), optional description
  - Shows overwrite warning if session already saved

- [ ] `packages/app/src/components/dialogs/LoadDialog.tsx`:
  - List of saved sessions with name, date, track count
  - Click to load, delete button per session

- [ ] `packages/app/src/hooks/useAutoSave.ts`:
  - Debounced save every 60s when changes exist
  - Subtle "Saved" indicator in status bar

- [ ] Keyboard: `Cmd+S` → save dialog, `Cmd+O` → load dialog

**Verification**: Build a layout, save it, reload the page, load the session — layout is identical. Auto-save triggers after editing. Delete a saved session.

---

## 4. Files to Create (Summary)

| File | Milestone | Purpose |
|------|-----------|---------|
| `packages/app/src/lib/grid.ts` | E1 | Grid coordinate helpers, link directions |
| `packages/app/src/renderer/sprites/TrackSprite.ts` | E1 | Render one track tile (all 11 kinds) |
| `packages/app/src/renderer/layers/TrackLayer.ts` | E1 | Manage all track sprites, sync with `Map_` |
| `packages/app/src/store/ui-store.ts` | E2 | Zustand store for tool/selection state |
| `packages/app/src/components/sim/ToolPalette.tsx` | E2 | Tool sidebar with kind/subtype selectors |
| `packages/app/src/renderer/layers/SelectionLayer.ts` | E3 | Selection/hover highlights |
| `packages/app/src/components/sim/PropertiesPanel.tsx` | E3 | Right sidebar for element properties |
| `packages/app/src/lib/serialization.ts` | E4 | `Map_` ↔ serialized format |
| `packages/app/src/lib/db.ts` | E4 | IndexedDB wrapper (Dexie) |
| `packages/app/src/components/dialogs/SaveDialog.tsx` | E4 | Save dialog |
| `packages/app/src/components/dialogs/LoadDialog.tsx` | E4 | Load dialog |
| `packages/app/src/hooks/useAutoSave.ts` | E4 | Periodic auto-save |

### Files to Modify

| File | Milestone | Change |
|------|-----------|--------|
| `packages/app/src/hooks/usePixiApp.ts` | E1 | Add TrackLayer to scene graph |
| `packages/app/src/components/sim/SimLayout.tsx` | E2, E3 | Add tool palette + properties panel sidebars |
| `packages/app/src/routes/index.tsx` | E1 | Wire up test layout or Map_ state |

---

## 5. Dependencies to Add

```bash
pnpm add zustand --filter @rail-op-sim/app   # UI state (already done above)
pnpm add dexie --filter @rail-op-sim/app     # IndexedDB wrapper (for E4)
```

PixiJS v8, React 19, Tailwind v4, shadcn/ui already installed. No other new dependencies needed for the editor phase.

---

## 6. Rendering Detail: How Each Track Kind Draws

### Cell geometry
Each track occupies one grid cell (`CELL_SIZE × CELL_SIZE` px). The sprite container is centered at the cell's world coordinates. All drawing is relative to the cell center (0, 0).

### Link → pixel edge mapping
For link index `i` with grid offset `(gdx, gdy)` from `LINK_OFFSETS`:
- Pixel direction from center: `dx = gdx * HALF_CELL`, `dy = -gdy * HALF_CELL` (Y flipped)
- The cell edge in that direction is at `(dx, dy)` from center

### Rail rendering
Each path is drawn as two parallel lines (rails) offset perpendicular to the path direction by a gauge constant (~3px each side). Sleeper ties are short perpendicular lines at regular intervals along the path.

### Kind-specific details

**Straight (4 subtypes):** One path between the two active links. Rails, sleepers.

**Directed (8 subtypes):** Same as straight, plus a small arrow head at one end indicating direction.

**Curved (12 subtypes):** One path between the two active links. Tight curves (90°, 4 subtypes) use a quadratic Bezier with control point offset outward from the corner. Wide curves (135°, 8 subtypes) use a shallower Bezier.

**Linked (8 subtypes):** Short rail segment from cell center to the active link edge. Visual marker (small circle or link icon) at the edge.

**Exit (8 subtypes):** Like linked but with an exit marker (small perpendicular bar) at the edge.

**Buffer (8 subtypes):** Like linked but with a buffer stop symbol (thick perpendicular bar with crossing lines) at the edge.

**Signal (8 subtypes):** Straight rail between the two links, plus a signal post (thin line perpendicular to track near one edge) with a colored dot for the aspect (red/yellow/green, default red).

**BridgeUnderpass (4 subtypes):** Straight rail between links, plus a bridge deck marking (two parallel lines on each side of the track) or underpass marking (dashed lines).

**Switch (32 subtypes):** Three active links. One pair forms the "main" path (straight or nearly straight through). The third link is the "diverging" path. Two paths rendered: main path as a straight line, diverging path as a curve that branches off. The point where they diverge is slightly offset toward the diverging direction.

**Crossover (6 subtypes):** Four active links. Two independent paths that cross each other. Each is a straight line between opposite link pairs. At the crossing point, one path is drawn slightly above the other (no physical connection).

**Flyover (12 subtypes):** Four active links. Two independent paths at different elevations. The lower path is drawn normally. The upper path is drawn with a bridge symbol and elevation indicator. No physical connection at crossing.

### Platform indicators
For platform-capable kinds (`straight`, `directed`, `buffer`, `signal`, `bridgeUnderpass`, `switch`), colored rectangles are drawn alongside the appropriate side of the track based on `platform1` and `platform2` flags.

### Theme support
All colors read from CSS custom properties (same pattern as `GroundLayer`):
- Rail color: `--sea-ink` (dark in light mode, light in dark mode)
- Sleeper/ballast color: derived from rail color with reduced opacity
- Platform color: `--lagoon` with alpha
- Signal aspect colors: literal red/yellow/green (contrast needed)

---

## 7. Verification Plan

**After E1:** A hardcoded test layout (oval loop, siding with switches, station with platforms, signals) renders on screen. All 11 track kinds are visible. Pan and zoom work. Theme toggle updates track colors.

**After E2:** Select straight horizontal from palette, click to build a line. Switch to curves, close the oval. Switch to switches, add a siding. Delete tool removes tiles. Ghost preview follows the cursor.

**After E3:** Click a track to select it. Properties panel shows kind, subtype, speed, length. Edit speed → track updates. Toggle platform → platform indicator appears/disappears on the canvas.

**After E4:** Build a layout. Save it. Reload the page. Open load dialog. Load the session. Layout is identical. Auto-save triggers after edits.
