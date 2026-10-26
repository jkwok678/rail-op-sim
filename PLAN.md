# Rail Ops Sim — Architecture & Implementation Plan

## Context

Building a web-based spiritual successor to [RailOS](https://github.com/AlbertBall/railway-dot-exe) — a railway operations simulator where users build track networks and operate trains with full signalling, timetables, routes, and failure simulation. Target: **full feature parity**, **single-player first**, **full simulation depth**.

The existing project is a fresh TanStack Start scaffold (React 19, Vite 8, Tailwind v4, shadcn/ui configured). No business logic exists yet.

---

## Technology Evaluation

Each major dependency was evaluated against alternatives. Here's the reasoning for every choice.

### 1. Rendering Engine — **PixiJS v8** ✅ Decided

This is the most consequential decision. The renderer handles both the **editor** (building track, selecting elements) and the **simulation** (trains moving, signals updating).

| Criterion | PixiJS v8 | Konva.js + react-konva | Raw Canvas 2D |
|-----------|-----------|------------------------|----------------|
| **Rendering backend** | WebGL/WebGPU (GPU) | Canvas 2D (CPU) | Canvas 2D (CPU) |
| **Performance ceiling** | 50k+ sprites at 60fps | ~2-5k shapes at 60fps | Depends on implementation |
| **Editor interactivity** | Manual (spatial hash, custom hit tests, custom drag) | **Built-in** (hit testing, dragging, transforms, event bubbling) | Manual (everything) |
| **React integration** | Imperative via `useRef`/`useEffect` | **Declarative** (`<Line>`, `<Circle>`, `<Group>`) | Imperative |
| **Animation model** | Game loop (mutate `sprite.x`) | Tweens + manual position updates | Manual |
| **Bundle size** | ~450KB | ~170KB | 0KB |
| **Learning curve** | Medium (game dev patterns) | Low (React-like declarative) | Low entry, high effort |

**Verdict: PixiJS v8.** WebGL/WebGPU rendering guarantees performance at any network scale — RailOS users build large networks with hundreds of trains, and GPU rendering means we never hit a CPU ceiling. The editor interactions (click to select, drag to move vertices, hit testing) require manual implementation on top of PixiJS (spatial hashing, custom event handlers), but this is a one-time cost concentrated in Milestones 3–5. The engine is decoupled from the renderer via the transport layer — if we ever wanted to swap to Konva or another renderer, it wouldn't touch simulation logic.

### 2. Meta-Framework — **TanStack Start** (already scaffolded)

| Criterion | TanStack Start | Next.js 16 |
|-----------|---------------|------------|
| **Rendering model** | SPA with SSR on first load | Server-first (SSR/SSG/ISR/RSC) |
| **Type safety** | **End-to-end** (routes, loaders, server functions) | Partial, manual assertions |
| **Bundler** | Vite + Nitro | Turbopack |
| **Deployment lock-in** | None (Vercel, Netlify, Cloudflare, Docker, Node) | Soft lock-in to Vercel |
| **Caching** | TanStack Query (explicit, predictable) | Multiple layers (powerful but complex) |
| **Maturity** | v1 stable (Nov 2025), smaller ecosystem | Battle-tested at scale |

**Verdict: TanStack Start is the right fit.** A railway simulator is an interactive SPA — not a content-heavy, SEO-critical site. TanStack Start's "SSR on first load, then SPA" model is ideal. The end-to-end type safety across routes and server functions is a genuine productivity advantage. And there's zero vendor lock-in if we add a multiplayer server later.

### 3. State Management (UI) — **Zustand**

| Criterion | Zustand | Jotai | React Context |
|-----------|---------|-------|---------------|
| **Bundle size** | ~1KB | ~3KB | 0KB |
| **Provider needed** | No | Optional | Yes |
| **Re-render control** | Selector-based subscriptions | Atom-level subscriptions | Re-renders entire tree |
| **Works outside React** | Yes | No | No |
| **Middleware** | Persist, devtools, immer | Basic | None |
| **Learning curve** | Very low | Low | None |

**Verdict: Zustand.** For UI-only state (active tool, selected element, open panels, settings), Zustand is the pragmatic choice. Tiny, no provider, selector-based to avoid re-renders. Works outside React — useful for the sim bridge that needs to write state without triggering renders. Jotai is overkill here; we don't have complex derived state in the UI layer.

Note: Simulation state (train positions, signal aspects, block occupancy) does NOT go through Zustand or React at all — it flows directly from the Worker to PixiJS via the transport layer. React only manages UI chrome.

### 4. Worker Communication — **Raw postMessage**

| Criterion | Raw postMessage | Comlink |
|-----------|----------------|---------|
| **Overhead** | Zero (just structured clone) | Proxy layer + async wrapper per call |
| **Type safety** | Manual (shared type definitions) | `Comlink.Remote<T>` (best-effort) |
| **High-frequency updates** | Natural (batched messages) | Anti-pattern (every call is async RPC) |
| **Transferable support** | Native | Manual via `Comlink.transfer()` |
| **Bundle size** | 0KB | ~1.1KB |

**Verdict: Raw postMessage.** Our worker sends state updates at 20–60Hz. Comlink makes every property access an async RPC call — terrible for high-frequency streaming. With raw postMessage, we define a typed message protocol once (in `transport/types.ts`), validate with Valibot on both ends, and get zero-overhead communication. The boilerplate is minimal and contained in two files.

### 5. Schema Validation — **Valibot**

| Criterion | Valibot | Zod v4 | TypeBox |
|-----------|---------|--------|---------|
| **Bundle size (gzipped)** | **~2KB** | ~15–47KB | ~8KB |
| **Tree-shaking** | **Excellent** (modular by design) | Poor (v4 mini helps, ~5KB) | Poor (planned) |
| **TypeScript inference** | Good | Excellent | Good |
| **Ecosystem** | Growing | Mature (React Hook Form, tRPC) | JSON Schema focused |
| **Speed** | ~2x faster than Zod v4 | v3 fastest, v4 slower | Good |

**Verdict: Valibot.** It runs in the Web Worker where every KB counts. At ~2KB gzipped vs Zod's 15KB+, the difference is meaningful for worker startup time. Valibot's functional API (`v.object({...})`) is clean, and inference works well. The smaller ecosystem isn't a concern — we're using it for message validation between transport layers, not form libraries.

### 6. IndexedDB Wrapper — **Dexie.js**

Raw IndexedDB has a notoriously painful callback-based API. **Dexie.js** (~15KB) provides a clean Promise-based API with TypeScript support, transactions, versioning, and indexing. It's the de facto standard for IndexedDB in 2025. Alternative `idb` (~2KB) is lighter but less ergonomic. For session save/load with potentially large state blobs, Dexie's transaction support is valuable.

### 7. Table Component — **@tanstack/react-table**

Already a transitive dependency (TanStack ecosystem). For the train list, timetable editor, and failure panel, we need sortable, filterable tables with type-safe column definitions. No alternative needed.

### 8. CSS & UI Components — **Tailwind v4 + shadcn/ui** (already configured)

The right stack for rapid UI development. Tailwind v4's CSS-first configuration eliminates the `tailwind.config.js` boilerplate. shadcn/ui provides copy-paste components that match the existing theme. No changes needed.

### 9. What We're NOT Using (and Why)

| Not Using | Why |
|-----------|-----|
| **Redux / Redux Toolkit** | Overkill — UI state is simple, sim state bypasses React entirely |
| **XState** | State machines for signalling would be elegant, but adds complexity. Plain TypeScript state machines in the engine are sufficient and more portable |
| **WebAssembly / WASM** | Not needed. The JS engine with TypedArrays will handle the simulation load fine. Add later if pathfinding becomes a bottleneck |
| **Rust (via WASM)** | Over-engineering at this stage. The engine in pure TypeScript is simpler to iterate on |
| **Phaser / Excalibur** | Full game engines — too opinionated, heavy physics systems we don't need |
| **Leaflet / OpenLayers** | GIS mapping libraries — wrong domain. We're not rendering geographic maps |
| **tRPC** | Excellent but adds dependency on a server. We're single-player first |
| **Prisma / Drizzle** | No database yet. IndexedDB for local storage, add when multiplayer server exists |

---

## Architecture Overview

### Single-Player Mode (what we build first)

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER                                   │
│                                                                   │
│  ┌──────────────────────┐     ┌───────────────────────────────┐  │
│  │   Web Worker          │     │        Main Thread            │  │
│  │  (Simulation Engine)  │     │                               │  │
│  │                       │     │  ┌─────────────────────────┐  │  │
│  │  Fixed-timestep loop  │◄────┼──┤ Input Capture            │  │  │
│  │  @ 60Hz               │     │  │ (mouse, keyboard, tools) │  │  │
│  │                       │     │  └─────────────────────────┘  │  │
│  │  - Train physics      │     │                               │  │
│  │  - Signalling (2/3/4) │────►│  ┌─────────────────────────┐  │  │
│  │  - Route/interlocking │     │  │ PixiJS v8 Renderer       │  │  │
│  │  - Timetable engine   │     │  │ - Track geometry layer   │  │  │
│  │  - Failures/TSRs      │     │  │ - Signal/switch layer    │  │  │
│  │  - Pathfinding         │     │  │ - Train sprite layer    │  │  │
│  └───────────────────────┘     │  │ - Label/UI overlay       │  │  │
│         │                      │  │ - Pan/zoom viewport      │  │  │
│         │ postMessage          │  └─────────────────────────┘  │  │
│         │                      │                               │  │
│         ▼                      │  ┌─────────────────────────┐  │  │
│  ┌──────────────────────┐     │  │ React App (DOM UI)       │  │  │
│  │   IndexedDB           │     │  │ - Tool palette           │  │  │
│  │   (save/load)         │     │  │ - Property panels        │  │  │
│  └──────────────────────┘     │  │ - Timetable editor       │  │  │
│                               │  │ - Train list / HUD       │  │  │
│                               │  │ - Settings / dialogs     │  │  │
│                               │  └─────────────────────────┘  │  │
└──────────────────────────────────────────────────────────────────┘
```

### Multiplayer Mode (future — engine code unchanged)

```
┌──────────────────────┐    WebSocket    ┌──────────────────────────┐
│   Node.js Server     │◄───────────────►│        Browser           │
│                      │                 │                          │
│  ┌────────────────┐  │                 │  ┌────────────────────┐  │
│  │ Same engine!   │  │                 │  │ PixiJS v8 Renderer │  │
│  │ (pure TS, no   │  │                 │  │ (same as SP mode)  │  │
│  │  browser APIs)  │  │                 │  └────────────────────┘  │
│  │                │  │                 │                          │
│  │ - Train physics│  │                 │  ┌────────────────────┐  │
│  │ - Signalling   │  │                 │  │ React App (DOM UI) │  │
│  │ - Interlocking │  │                 │  │ (same as SP mode)  │  │
│  │ - Timetables   │  │                 │  └────────────────────┘  │
│  │ - Failures     │  │                 │                          │
│  │ - Pathfinding  │  │                 │                          │
│  └────────────────┘  │                 │                          │
│                      │                 │                          │
│  ┌────────────────┐  │                 │                          │
│  │ Room mgmt      │  │                 │                          │
│  │ Auth           │  │                 │                          │
│  │ Persistence    │  │                 │                          │
│  └────────────────┘  │                 │                          │
└──────────────────────┘                 └──────────────────────────┘
```

The engine is the same code in both modes. Only the **transport adapter** changes:
- Single-player: `PostMessageTransport` (Worker `postMessage`)
- Multiplayer: `WebSocketTransport` (socket.io or Colyseus)

This works because the engine is **pure TypeScript with zero browser dependencies** — no DOM, no `window`, no canvas, no `localStorage`. It only imports other engine modules.

---

## Multiplayer Readiness (Built In From Day 1)

### What "multiplayer-ready" means here

The engine is designed so that adding multiplayer later requires:

1. **Write `WebSocketTransport`** (~50 lines) — implements the same `SimTransport` interface, sends messages over a socket
2. **Write `server-host.ts`** (~100 lines) — a Node.js process that creates engines per room, manages socket.io connections, handles auth and room lifecycle
3. **Add a server package** (`apps/server/`) — Express + socket.io or Colyseus

That's it. **Zero changes to engine code.** The core logic (TrainMovement, Signalling, Interlocking, TimetableEngine, Failures, Pathfinding, TrackGraph) stays untouched.

### What we do now to enable this

| Constraint | Why |
|------------|-----|
| Engine modules never import from `react`, `pixi.js`, or any browser API | Keeps the engine portable |
| Engine only communicates via `SimTransport` interface | Transport can be swapped without touching engine code |
| All IDs generated by the host, passed in via commands | Deterministic; server can own ID generation in MP mode |
| Simulation uses seeded RNG (PCG32), not `Math.random()` | Makes replays deterministic; allows server to validate client state |
| Command/event payloads are plain objects (no classes, no methods, no circular refs) | Safe to serialize over `postMessage` or `JSON.stringify` for WebSocket |
| State snapshots use TypedArrays for numeric data | Same format works for `postMessage` transferables and WebSocket binary frames |

### What changes for multiplayer (later, not now)

```
Single-player                          Multiplayer
─────────────────────────              ─────────────────────────
Engine in Web Worker                   Engine in Node.js process
PostMessageTransport                   WebSocketTransport
One engine instance                    One engine per room
Commands from local UI                 Commands from any client in the room
Render locally immediately             Server broadcasts state → all clients render
Save to IndexedDB                      Save to server DB (Postgres/SQLite)
```

The UI and renderer are already shared — they just consume `EngineToHost` messages regardless of whether those arrived via `postMessage` or WebSocket.

---

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | **PixiJS v8** (WebGL/WebGPU) | GPU-accelerated, handles 1000s of sprites at 60fps. Mounted imperatively via `useRef`/`useEffect` — React only owns the DOM UI shell |
| Simulation engine | **Pure TypeScript, runtime-agnostic** | Zero browser dependencies (no DOM, `window`, canvas, `localStorage`). Runs in Web Worker (SP) or Node.js (MP) — same code, different transport adapter. **This is the key decision that makes multiplayer a bolt-on, not a rewrite.** |
| Engine transport | **Transport adapter pattern** | `PostMessageTransport` for single-player, `WebSocketTransport` for multiplayer. Engine only knows about a `SimTransport` interface. |
| Simulation timing | **Fixed 60Hz timestep** with accumulator | Deterministic simulation independent of render frame rate. Essential for reproducible replays and future multiplayer consistency. |
| Render frame rate | **Display-native** (60/120/144/240Hz via `requestAnimationFrame`) | PixiJS renders at whatever the monitor supports. Train positions interpolated between sim ticks for smooth motion at any refresh rate. |
| State transfer | **TypedArrays via transport adapter** | Avoids JSON serialization overhead. Same message types flow over `postMessage` or WebSocket. |
| React integration | **React = UI only** | PixiJS mutates sprites directly; React only manages toolbars, panels, dialogs, HUD |
| State in React | **Signals / refs + rAF batching** | `useRef` for per-frame data, small signal atoms for UI-relevant subset, throttled to 10-20Hz |
| Persistence | **IndexedDB** (local) | Save/load sessions locally; add server-side persistence later with multiplayer |
| Language | **TypeScript** throughout | Type safety across transport boundary, PixiJS, and React |
| Styling | **Tailwind v4 + shadcn/ui** | Already configured; shadcn components for all UI chrome |

---

## Data Model (Core Types)

```typescript
// === Track Network ===

interface TrackGraph {
  vertices: Map<string, Vertex>;   // junctions, endpoints
  edges: Map<string, Edge>;        // track segments
}

interface Vertex {
  id: string;
  x: number; y: number;           // world coordinates
  type: 'plain' | 'points' | 'crossover' | 'slip' | 'buffer-stop';
}

interface Edge {
  id: string;
  from: string; to: string;       // vertex IDs
  length: number;                  // meters
  speedLimit: number;              // km/h
  electrification?: 'none' | 'dc-third-rail' | 'dc-fourth-rail' | '25kv-ac' | 'tube';
  gradient?: number;               // percentage
  curvature?: number;              // radius in meters
}

// === Signalling ===

interface Block {
  id: string;
  edgeIds: string[];              // contiguous track edges in this block
  protectingSignalId?: string;    // signal at block entrance
  occupied: boolean;
  reserved: boolean;              // locked for a route
}

interface Signal {
  id: string;
  vertexId: string;               // location on network
  direction: 'up' | 'down';       // which direction it faces
  aspects: number;                // 2, 3, or 4
  currentAspect: 'red' | 'yellow' | 'double-yellow' | 'green';
  type: 'main' | 'ground' | 'repeater';
  protectedBlockId: string;       // the block this signal controls entry to
}

// === Points / Switches ===

interface Points {
  id: string;
  vertexId: string;
  normalEdgeId: string;           // straight path
  reverseEdgeId: string;          // diverging path
  position: 'normal' | 'reverse';
  locked: boolean;                // locked by a route
  failureState?: 'stuck-normal' | 'stuck-reverse' | 'detection-failure';
}

// === Trains ===

interface Train {
  id: string;
  headcode: string;               // e.g. "1A23"
  type: 'express' | 'local' | 'freight' | 'empty-stock' | 'engineering';
  length: number;                 // meters
  maxSpeed: number;               // km/h
  acceleration: number;           // m/s²
  brakingForce: number;           // m/s² (deceleration)
  position: TrainPosition;
  speed: number;                  // current m/s
  route?: Route;                  // assigned route through network
  service?: Service;              // the working this train is running
  state: 'running' | 'stopped' | 'failed' | 'derailed';
  directionOfTravel: 'forward' | 'reverse';
}

interface TrainPosition {
  edgeId: string;
  offset: number;                 // meters from edge start
}

// === Routes ===

interface Route {
  id: string;
  entrySignalId: string;
  exitSignalId: string;
  path: RouteSegment[];           // ordered list of edges + point positions
  state: 'set' | 'cleared' | 'cancelled';
  setTime: number;                // sim time when route was set
}

interface RouteSegment {
  edgeId: string;
  pointId?: string;               // if this segment passes through points
  requiredPosition?: 'normal' | 'reverse';
}

// === Timetable ===
//
// Superseded by packages/shared/src/railway/timetable/types.ts, which is the
// implementation as of Milestone 20. The sketch below put the service *kind*
// on the entry ('new-service' | 'follow-on' | 'shuttle' | 'split' | 'join'),
// which cannot express a service that splits mid-journey, changes direction in
// a platform, or waits to be joined — all of which "full feature parity" and
// Milestone 23 require. The shipped model is RailOS's: a start time plus one
// Service per working, each an ordered Action[] of exactly one start, any
// number of intermediates, and exactly one finish. The milestones below are
// unchanged; only these types are.

interface Timetable {
  version: 1;
  title?: string;
  startTime: SimTime;              // seconds since 00:00 on day one, unwrapped
  services: Service[];             // repeatRule is per-service `Repeat`
}

interface Service {
  ref: ServiceRef;                 // <= 8 chars; last 4 are the headcode
  description?: string;
  train?: TrainSpec;               // only on a service that *creates* a train
  actions: Action[];
  repeat?: Repeat;                 // expanded by the engine, not stored
}

// Action is a discriminated union: startNew | startNewService | startFromSplit
// | stop | pass | changeDirection | frontSplit | rearSplit | joinedBy
// | changeDescription | changeMaxSpeed | finishNewService | finishJoin
// | finishExit | finishRemainHere (plus the shuttle variants, typed but not
// yet supported). See timetable/types.ts for the fields of each.

// === Failures & Disruptions ===

interface Failure {
  id: string;
  type: 'signal' | 'points' | 'train' | 'track-circuit' | 'speed-restriction';
  targetId: string;                // signal/points/train/edge ID
  startTime: number;
  duration?: number;               // undefined = until manually cleared
  severity: 'minor' | 'major' | 'critical';
  description: string;
}
```

---

## Project Structure

```
src/
├── components/
│   ├── ui/                        # shadcn/ui components (installed as needed)
│   ├── Header.tsx                 # (existing, adapt for rail sim branding)
│   ├── Footer.tsx                 # (existing, adapt)
│   ├── ThemeToggle.tsx            # (existing, keep)
│   ├── layout/
│   │   ├── SimLayout.tsx          # Main sim layout: toolbar + canvas + sidebars
│   │   ├── ToolPalette.tsx        # Left toolbar: track, signal, train, select tools
│   │   ├── PropertiesPanel.tsx    # Right panel: selected element properties
│   │   └── StatusBar.tsx          # Bottom bar: sim time, speed, messages
│   ├── panels/
│   │   ├── TrainListPanel.tsx     # List of active trains + state
│   │   ├── TimetableEditor.tsx    # Create/edit timetables
│   │   ├── RoutePanel.tsx         # Set/clear routes between signals
│   │   ├── FailurePanel.tsx       # Active failures + inject failures
│   │   └── Minimap.tsx            # Small overview of entire network
│   └── dialogs/
│       ├── SaveDialog.tsx
│       ├── LoadDialog.tsx
│       ├── NewSimDialog.tsx       # New session: blank or template
│       └── SettingsDialog.tsx
├── engine/                        # Simulation engine (pure TS, runtime-agnostic)
│   ├── SimState.ts                # Top-level simulation state container
│   ├── TrainMovement.ts           # Train physics: acceleration, braking, speed limits
│   ├── Signalling.ts              # Signal aspect propagation, block occupancy
│   ├── Interlocking.ts            # Route setting, point locking, conflict detection
│   ├── TimetableEngine.ts         # Timetable execution, dispatching trains
│   ├── Pathfinding.ts             # Graph-based route finding (A* with constraints)
│   ├── Failures.ts                # Random failure injection, failure effects
│   ├── TrackGraph.ts              # Graph operations: add/remove track, connectivity
│   └── messaging.ts               # Message type definitions + SimTransport interface
├── transport/                     # Transport adapters (engine ↔ host)
│   ├── types.ts                   # SimTransport interface + message schemas
│   ├── postmessage-transport.ts   # Web Worker postMessage adapter (single-player)
│   └── websocket-transport.ts     # WebSocket adapter (multiplayer — future)
├── host/                          # Host runtimes that wrap the engine
│   ├── worker-host.ts             # Web Worker entry: creates engine, PostMessageTransport
│   └── server-host.ts             # Node.js entry: creates engine, WebSocketTransport (future)
├── renderer/                      # PixiJS rendering layer
│   ├── PixiApp.ts                 # Initialize PixiJS Application + viewport
│   ├── layers/
│   │   ├── TrackLayer.ts          # Track geometry rendering (lines, curves, rails)
│   │   ├── GroundLayer.ts         # Background grid, terrain
│   │   ├── SignalLayer.ts         # Signal icons + aspect colors
│   │   ├── TrainLayer.ts          # Train sprites + animation
│   │   ├── LabelLayer.ts          # Station names, headcodes, speed limits
│   │   └── SelectionLayer.ts      # Selection highlights, drag handles
│   ├── viewport/
│   │   └── ViewportController.ts  # Pan (middle-mouse/drag), zoom (scroll), fit-to-view
│   └── sprites/
│       ├── TrackSprite.ts         # Track segment rendering (straight, curved, points)
│       ├── SignalSprite.ts        # Signal post + aspect indicator
│       └── TrainSprite.ts         # Train rectangle/icon with directional indicator
├── store/                         # React state (UI-only, thin projection)
│   ├── ui-store.ts                # Active tool, selected elements, open panels
│   ├── sim-bridge.ts              # Worker ↔ React communication bridge
│   └── settings.ts                # User preferences (localStorage-backed)
├── hooks/                         # React hooks
│   ├── useSimBridge.ts            # Hook: connect to worker, receive UI-relevant state
│   ├── usePixiApp.ts              # Hook: mount PixiJS, manage lifecycle
│   ├── useKeyboard.ts             # Keyboard shortcuts (tools, delete, undo)
│   └── useAutoSave.ts             # Periodic save to IndexedDB
├── lib/
│   ├── utils.ts                   # (existing cn())
│   ├── geometry.ts                # 2D vector math, line intersections, curves
│   ├── ids.ts                     # ID generation (nanoid or similar)
│   └── serialization.ts           # Sim state ↔ JSON for save/load
├── routes/
│   ├── __root.tsx                 # (existing, adapt layout)
│   ├── index.tsx                  # Landing page → launch into sim or load
│   └── sim.tsx                    # The main simulation route
├── styles.css                     # (existing, add rail-sim-specific tokens)
└── router.tsx                     # (existing)
```

---

## Implementation Milestones

Each milestone delivers a visible, testable increment. Milestones are ordered by dependency — each builds on the last.

---

### Milestone 1: PixiJS on Screen

**Deliverable**: A blank PixiJS canvas rendering inside the React app, with a grid background, that pans and zooms.

- [ ] Install `pixi.js` + shadcn components (button, tooltip, dialog, select, input, separator)
- [ ] Create `SimLayout` — full-screen layout with empty left/right panel slots, center canvas, bottom status bar
- [ ] Build `PixiApp.ts` — initialize PixiJS `Application`, mount via `useRef`/`useEffect` in `usePixiApp` hook
- [ ] Build `GroundLayer.ts` — draw a grid (like graph paper) that redraws on zoom/pan
- [ ] Build `ViewportController.ts` — pan (middle-mouse drag or space+drag), zoom (scroll wheel, centered on cursor), fit-to-view
- [ ] Wire viewport transforms into PixiJS container scale/position
- [ ] Ensure canvas resizes with the window

### Milestone 2: Track Graph — Data Model Only

**Deliverable**: Pure TypeScript track graph that can be unit-tested. No rendering yet.

- [ ] Implement `engine/TrackGraph.ts`:
  - `addVertex(x, y, type)` → `Vertex`
  - `addEdge(fromId, toId, props)` → `Edge` (joins vertices, auto-creates reverse-direction edge pair in the digraph)
  - `removeEdge(id)` — cleans up orphaned vertices
  - `getEdgesAt(vertexId)` — all edges connected to a vertex
  - `getConnections(edgeId)` — what this edge connects to at each end (for pathfinding)
  - `findVertexNear(x, y, threshold)` — hit-test for placement tools
- [ ] Implement `lib/geometry.ts` — `distance(a,b)`, `angle(a,b)`, `pointOnLine(a,b,t)`, `bezierPoint(p0,p1,p2,p3,t)`
- [ ] Implement `lib/ids.ts` — `newId()` using nanoid
- [ ] Unit tests for all TrackGraph operations

### Milestone 3: Track Rendering

**Deliverable**: Track segments visible on the canvas — straight lines, curves, and points.

- [ ] Build `TrackSprite.ts` — renders a single edge as:
  - Straight segment: line from `from` vertex to `to` vertex with rail-like styling (two parallel lines)
  - Curved segment: quadratic Bezier controlled by a midpoint handle
  - Points/switch: straight path + diverging curve with indicator of which way it's set
- [ ] Build `TrackLayer.ts` — container that holds all track sprites, syncs with TrackGraph
- [ ] Track styling: light/dark rail colors (follow theme), ballast background, sleeper ticks
- [ ] Render a hardcoded test layout: oval loop with one passing siding

### Milestone 4: Track Building Tools

**Deliverable**: Click to place vertices, drag between vertices to create edges. Build a track network interactively.

- [ ] Build `store/ui-store.ts` — active tool state (`'select' | 'track' | 'signal' | 'train' | 'delete'`)
- [ ] Build `ToolPalette.tsx` — left sidebar with tool buttons, shows active tool
- [ ] Track tool behavior:
  - Click empty space → place new vertex
  - Click existing vertex → start edge drag
  - Release on another vertex → create edge between them
  - Release on empty space → create a new vertex there and connect
  - Escape cancels in-progress edge
  - Shift+click on edge → split edge (insert vertex at click point)
- [ ] Vertex snap cursor: highlight when near a vertex during track tool
- [ ] Grid snapping (toggleable, default 10px grid)

### Milestone 5: Selection & Property Editing

**Deliverable**: Click to select track elements, see and edit their properties in a panel.

- [ ] Build `SelectionLayer.ts` — highlight selected vertices (circle) and edges (glow/color change)
- [ ] Click on vertex or edge in select mode → select it, deselect previous
- [ ] Shift+click → add to selection; click empty → deselect all
- [ ] Delete key → remove selected elements (with confirmation if edges would be orphaned)
- [ ] Build `PropertiesPanel.tsx` — right sidebar showing selected element's properties:
  - **Vertex**: name, type (plain/points/crossover/slip/buffer-stop)
  - **Edge**: length, speed limit, gradient, electrification, curvature
- [ ] Edits in properties panel update the TrackGraph and re-render immediately

### Milestone 6: Save & Load

**Deliverable**: Save a track network to IndexedDB, reload it later. Sessions persist across browser restarts.

- [ ] Implement `lib/serialization.ts`:
  - `serialize(graph: TrackGraph): SerializedTrackGraph`
  - `deserialize(data: SerializedTrackGraph): TrackGraph`
  - Validate with Zod schemas for safety
- [ ] Build save flow: `Cmd+S` → `SaveDialog` (name, optional description) → write to IndexedDB with timestamp
- [ ] Build load flow: landing page (`/`) shows list of saved sessions → click to load → navigate to `/sim`
- [ ] Build `useAutoSave.ts` — saves to IndexedDB every 60 seconds with debounce, shows "saved" indicator
- [ ] IndexedDB schema: `sessions` store keyed by ID, with name, description, createdAt, updatedAt, state blob

### Milestone 7: Transport Architecture & Worker Shell

**Deliverable**: Web Worker boots, connects to main thread via `SimTransport`, can send/receive typed messages. Lays the multiplayer-ready foundation.

- [ ] Implement `transport/types.ts` — `SimTransport` interface, all message type definitions, Zod schemas
- [ ] Implement `transport/postmessage-transport.ts` — wraps `self.postMessage` / `self.onmessage`
- [ ] Implement `host/worker-host.ts` — worker entry point, creates engine, connects transport
- [ ] Implement `host/sim-bridge.ts` (main thread side) — creates worker, sends/receives messages, provides state to React
- [ ] Implement `hooks/useSimBridge.ts` — React hook that manages worker lifecycle and exposes latest UI state
- [ ] Wire it up: clicking "new session" creates worker, sends `load_state` with empty state, worker echoes back
- [ ] Verify message round-trip works with all message types (via Zod validation on both ends)

### Milestone 8: Simulation Loop & State Container

**Deliverable**: Engine ticks at 60Hz, state container holds tracks/trains/signals/routes, state flows to renderer.

- [ ] Implement `engine/SimState.ts` — `Engine` class with:
  - State container (tracks, trains, signals, routes, blocks, failures)
  - `handleCommand(cmd: SimCommand)` — applies user commands
  - `tick(dt: number)` — advances simulation by dt (called by loop)
  - `getUIState(): UISimState` — thin projection for React/PixiJS
- [ ] Implement fixed-timestep loop in `worker-host.ts`:
  - 60Hz accumulator pattern with spiral-of-death protection (max 5 ticks per frame)
  - Pause/resume/speed control (0.5x, 1x, 2x, 4x, 16x)
- [ ] Send `state_update` to main thread each tick (unthrottled for now, optimize later)
- [ ] Build `StatusBar.tsx` — shows sim time (HH:MM:SS), sim speed, pause button, FPS counter

### Milestone 9: Train Physics

**Deliverable**: Trains accelerate, cruise, and brake according to physics. Pure engine code, testable in isolation.

- [ ] Implement `engine/TrainMovement.ts`:
  - Acceleration curve: max acceleration at low speed, tapers to zero at max speed
  - Braking curve: constant deceleration, plus emergency brake (higher rate)
  - Speed limit enforcement: never exceeds `min(edge.speedLimit, train.maxSpeed)`
  - Position integration: `position += speed * dt` along current edge
  - Edge transitions: when offset exceeds edge length, move to next connected edge
  - Train reversal: train stops, changes `directionOfTravel`, resumes
- [ ] Unit tests:
  - Train accelerates from 0 to max speed over expected time
  - Train brakes to stop at target distance
  - Train respects edge speed limit changes
  - Train transitions between connected edges correctly

### Milestone 10: Train Placement & Rendering

**Deliverable**: Place trains on tracks, see them rendered as colored rectangles with headcodes.

- [ ] Build `TrainSprite.ts` — renders a train as a rounded rectangle on the track:
  - Color-coded by type (express=red, local=blue, freight=green, empty-stock=gray, engineering=yellow)
  - Headcode label above the sprite
  - Directional arrow/triangle at the front
  - Occupies correct length proportional to track
- [ ] Build `TrainLayer.ts` — container for all train sprites, updated each frame from sim state
- [ ] Train placement tool:
  - Select train tool → click on a track edge → `PlaceTrainDialog` opens
  - Fields: headcode, type, length, max speed, direction
  - On confirm → sends `place_train` command to engine → train appears
- [ ] Interpolate train position between sim ticks in renderer for smooth 60fps motion
  - Engine sends position at tick N; renderer lerps between tick N and tick N+1

### Milestone 11: Train Control

**Deliverable**: Start/stop trains, see their speed and position in a panel.

- [ ] Build `TrainListPanel.tsx` — scrollable list of all active trains:
  - Each row: headcode, type badge, current speed, state (stopped/running/failed)
  - Click row → select train, camera centers on it
- [ ] Train control commands (sent to engine):
  - `start_train(id)` — train accelerates to line speed
  - `stop_train(id)` — train brakes to a stop
  - `set_train_speed(id, kmh)` — set target speed
  - `reverse_train(id)` — train stops, reverses direction
- [ ] HUD overlay on selected train: shows speed, next signal aspect, current edge speed limit
- [ ] Keyboard shortcuts: Space to start/stop selected train, R to reverse
  - NOTE: Space is already taken — `ViewportController` uses it held for grab-pan. Pick another key for start/stop (or re-home grab-pan) and add it to the `SHORTCUTS` registry rather than binding it directly.

### Milestone 12: Block Occupancy

**Deliverable**: Trains occupy blocks, blocks show occupancy state, trains won't enter occupied blocks.

- [ ] Implement block generation in engine:
  - On track graph change, auto-generate blocks: each edge is a block by default
  - Signals define block boundaries (later, in M13)
- [ ] Implement block occupancy:
  - Train position is `(edgeId, offset)` → block containing that edge is occupied
  - Train spans multiple blocks if longer than remaining edge length
  - `occupied` boolean per block, updated each tick
- [ ] Render block occupancy:
  - Occupied blocks: overlay semi-transparent red on the track
  - Reserved blocks (for routes, later): semi-transparent yellow
  - Free blocks: no overlay
- [ ] **First safety rule**: Train will not enter an occupied block — stops at block boundary
  - This is "basic block working" — the simplest form of safe operation

### Milestone 13: Signal Placement & Data Model

**Deliverable**: Place signals on the network, data model ready. Rendering comes next.

- [ ] Signal placement tool:
  - Select signal tool → click on a track edge near a vertex → `PlaceSignalDialog` opens
  - Fields: aspect count (2/3/4), type (main/ground/repeater), direction (up/down)
  - Engine validates placement (not too close to another signal, correct side of track)
- [ ] Signals in engine state: stored by ID, linked to their protected block
- [ ] Signals auto-create block boundaries: the vertex where a signal sits becomes a block boundary
  - Blocks are now defined as "track between two signals" (or signal and buffer stop)

### Milestone 14: Signal Rendering

**Deliverable**: Signals visible on the network with correct aspect colors.

- [ ] Build `SignalSprite.ts`:
  - Signal post rendering (thin line perpendicular to track)
  - Aspect lights (2-aspect: red/green; 3-aspect: red/yellow/green; 4-aspect: red/yellow/double-yellow/green)
  - Direction arrow showing which way the signal faces
  - Dim/bright state (bright = active/lit, dim = unlit)
- [ ] Build `SignalLayer.ts` — container for all signal sprites
- [ ] Signals placed alongside the track, offset slightly so they don't overlap the rails

### Milestone 15: Signal Aspect Propagation

**Deliverable**: Signals show correct aspects based on block occupancy ahead. The core of the signalling system.

- [ ] Implement `engine/Signalling.ts`:
  - On each tick, recalculate every signal's aspect:
    - **Red**: its protected block is occupied, OR no route is set through it
    - **Yellow**: next signal ahead is red, within braking distance
    - **Double-yellow** (4-aspect only): next signal is yellow
    - **Green**: at least 2 blocks ahead are clear
  - Signal sighting: a signal "looks ahead" down the track to find the next signal
  - Handle dead-ends: last signal before buffer stop shows red
- [ ] Aspect changes propagate instantly — if a block becomes occupied, its protecting signal goes red
- [ ] Unit tests:
  - Clear track → all signals green
  - Train in block → protecting signal red, previous signal yellow, previous-previous double-yellow (4-aspect)
  - Train clears block → signals step back to green progressively

### Milestone 16: Train Responds to Signals

**Deliverable**: Trains automatically brake for red and yellow signals. The railway operates itself.

- [ ] In `TrainMovement.ts`, after each position update:
  - Look ahead to find next signal on current path
  - **Red ahead**: calculate braking distance needed; if within it, apply brakes to stop before signal
  - **Yellow ahead**: speed limit = "be prepared to stop at next signal" (typically reduce to ~50% line speed)
  - **Double-yellow ahead**: speed limit = "next signal may be yellow" (typically reduce to ~75% line speed)
  - **Green**: proceed at line speed
  - **No signal ahead** (unrouted track): proceed with caution at reduced speed
- [ ] Train that passes a red signal (SPAD — Signal Passed At Danger) triggers a sim event
- [ ] Visual: approaching a red signal shows a braking indicator on the HUD

### Milestone 17: Interlocking & Route Setting (Engine)

**Deliverable**: Set routes between signals, points lock, routes clear progressively. Pure engine logic.

- [ ] Implement `engine/Interlocking.ts`:
  - `setRoute(entrySignalId, exitSignalId)`: 
    - Finds path through track graph from entry to exit signal
    - Checks path is clear (no conflicting routes, no occupied blocks opposite direction)
    - Locks all points in the path to required positions
    - Reserves all blocks in the path
    - Sets entry signal to proceed aspect (if track clear ahead)
  - `clearRoute(routeId)`: releases all locks and reservations
  - Route clearing behind train: as train passes each block, that block is released from the route
  - Conflict detection: two routes that share any block or point are conflicting → second request rejected
- [ ] Route state machine: `set` → (train enters) → `active` → (train exits) → `cleared`
- [ ] Point locking: locked points cannot be moved by any other command until route releases them

### Milestone 18: Pathfinding

**Deliverable**: Find valid paths between any two signals on the network.

- [ ] Implement `engine/Pathfinding.ts` — A* search on the rail graph:
  - State = `(vertexId, directionOfTravel)`
  - Edge cost = `edge.length` (prefer shorter paths)
  - Edge validity checks: wrong direction (unless bi-di), electrification mismatch, gauge restriction
  - Heuristic = straight-line distance from current vertex to target
- [ ] Path post-processing: the raw A* result is a list of edges → convert to `RouteSegment[]` with required point positions
- [ ] Handle "no path exists" — return structured error (dead end, wrong electrification, etc.)
- [ ] Unit tests: find path through junction, verify blocked path returns no result

### Milestone 19: Route Panel UI

**Deliverable**: Click-to-set-route interface, see active routes, clear routes.

- [ ] Build `RoutePanel.tsx`:
  - **Set route mode**: click entry signal on the canvas → it highlights → click exit signal → sends `set_route` command
  - **Active routes list**: each route shows entry→exit, state, set time
  - **Clear button** per route: sends `clear_route` command
  - **Cancel button** for routes not yet entered by a train
- [ ] Render `RouteOverlayLayer.ts` — set route path shown as a white/blue line along the track, with arrowheads
  - Inactive routes (set but no train yet): dashed line
  - Active routes (train in route): solid line, blocks trailing behind train fade out
- [ ] Visual feedback: conflicting route attempt shows red flash on overlapping segment

### Milestone 20: Timetable Editor

**Deliverable**: A UI to create and edit timetables. Save/load timetable files. No execution yet.

The entry-shaped types this milestone was sketched against are superseded — see
the note in the Data Model section. The list below is restated against the
action-list model; the deliverable is unchanged.

- [x] Build `TimetableEditor.tsx` — split-panel layout:
  - **Left**: list of services (headcode, origin→destination, first departure, issue count)
  - **Right**: detail editor for the selected service
  - Its own **timetable mode**, exclusive with railway mode (`store/mode-store.ts`):
    a segmented Railway | Timetable switcher (`R` / `T`). In timetable mode the
    map is a read-only backdrop — pan, zoom, hover, pick on map — and the editor
    is docked beside it; in railway mode the timetable is off screen. Save/load
    act on the current mode's document. `"operate"` joins the union at Milestone 21.
  - Docked rather than modal: "pick on map" needs the canvas clickable.
  - Entering timetable mode is gated on `trackStatus.complete` — a timetable books
    trains to named platforms and runs them along preferred directions.
- [x] Service editor fields:
  - Headcode, description, and a train spec shown only for a service that creates a train
  - Action list: add (kind picker), remove, reorder
  - Per-kind fields: times (`HH:MM`/`HH:MM:SS`), location and service-reference
    pickers, grid cells with pick-on-map
  - Service kind is an *action*, not a field: startNew / startNewService /
    startFromSplit, and the splits and joins along the way
- [x] Validation, live, as `validateTimetable(tt, map?)`:
  - Arrival before departure at each stop; times never decrease along a service
  - One start first, one finish last, nothing after it
  - Every cross-reference matched exactly once from both ends, with times agreeing
  - Locations exist on the railway; start positions are joined track; exits are exits
- [x] Import/export timetable as a JSON *or* YAML file, over the same helpers
      the map uses (`lib/documentFile.ts`)
- [ ] Timetable is saved as part of the session in IndexedDB
- [ ] Shuttle actions in the editor (typed in the model, reported as unsupported)
- [ ] `.ttb` import/export (`timetable/ttb.ts`, designed for, not built)

### Milestone 21: Timetable Engine — Basic Dispatch

**Deliverable**: A third app mode, **Operate**, where the signaller sets routes and trains run the timetable.

Restated, as M20 was, against what the codebase actually is: a grid of cells with links, not the vertex/edge graph sketched in M2–M19. The engine sits on that grid and fills the parts of M7–M8 and M12–M19 that operating needs. OPERATE-MODE.md (railway-dot-exe's behaviour) is the reference, not the spec.

- [x] Pure-TS engine in `packages/shared/src/sim/`, with no DOM:
  - `graph.ts`: an immutable rail graph built from the map once on entry;
  - `routes.ts`, `signalling.ts`, `trains.ts`, `timetable.ts`, `log.ts`;
  - `engine.ts`: `createEngine({ map, timetable })` → `handle(cmd)` / `advance(seconds)` / `view()` / `drainLog()`.
- [x] Fixed-step clock: `SIM_DT` = 0.1 s of timetable time. Speeds run ×¼ to ×16; the run state is PreStart → Running ⇄ Paused.
- [x] Hosted in a Web Worker behind the transport from this plan:
  - `transport/types.ts`, `postmessage-transport.ts`, and Valibot schemas for everything the engine accepts;
  - `host/engine-host.ts`: a wall-clock accumulator with the clock injected, publishing at 20 Hz;
  - `store/sim-bridge.ts` and `store/operate-store.ts` on the page side.
- [x] RailOS route setting: automatic-signals, preferred and unrestricted routes, found by BFS over directed cell segments.
  - A signal stands at the entry edge of its cell. A route starts on its entry signal and stops short of the next one, so routes never share a rail.
  - Routes set after a delay: 0.5 s, or 2.5 s when points move.
  - Preferred and unrestricted routes are released behind the train. Entering a route at the wrong end cancels it.
  - Cancelling takes the whole route, and is refused while a train is on it or approaching it.
- [x] Signal aspects are recomputed from routes and occupancy every step. Each signal is one step better than the next one ahead; buffers count as a red signal and an exit as clear.
- [x] Points have a lie: the main rail by default, set by routes, and thrown by hand when nothing holds them.
- [x] Trains are a 200 m body laid back from the front, measured in metres. Each step:
  - they look ahead for their movement authority: a red signal, buffers, the train ahead, points lying against them, or their stop point;
  - they brake on a curve at half their brake rate, and accelerate under power up to an adhesion cap;
  - they keep to speed limits ahead;
  - they enter from an exit or start standing on two cells, and leave by an exit.
- [x] Faults: a SPAD stops the train, and two trains on one rail crash.
- [x] Operate mode (`O`) is gated on a complete railway and a timetable with services and no errors.
  - The docked panel has the clock, run/pause, speed, route kind, cancel, the train list and the performance log.
  - The canvas shows route bands, signal lamps, point lies, and trains with headcodes.
  - Keys: `P` run/pause, `,` and `.` for speed, `A`/`S`/`U` for route kind, `C` cancel, `J` log.
- [ ] Interpolate train positions between published views (they currently step at 20 Hz)

### Milestone 22: Timetable Engine — Stops & Dwell

**Deliverable**: Trains stop at stations, wait for dwell time, and depart on schedule.

- [x] `startNew` services, and their repeats with headcode increments, come on at their time. A blocked entry is retried and reported once.
- [x] Stops at the far end of the run of cells carrying the location's name. Passes register when the front enters the location.
- [x] Departure is at the latest of the booked time, arrival plus the minimum dwell (default 30 s), and 30 s after the last action.
- [x] Also supported: `changeDirection`, `changeDescription`, `changeMaxSpeed`, `finishNewService`/`startNewService` (same train), `finishRemainHere` and `finishExit`.
- [x] Performance log in RailOS's wording. Lateness is truncated toward zero, and counters cover arrivals, passes, departures, exits, missed events, wrong exits, SPADs and crashes.
- [ ] Next, still from OPERATE-MODE.md:
  - signaller control of trains (§8);
  - route truncation and approach locking (§5.7–5.8);
  - continuation auto-signals (§5.10);
  - calling on (§5.13);
  - level crossings (§5.12);
  - splits and joins (§6.8);
  - random delays, failures and TSRs (§9);
  - the Actions Due panel (§11);
  - saved sessions (§14);
  - a train length in the timetable's `TrainSpec`.

### Milestone 23: Timetable Engine — Advanced Operations

**Deliverable**: Splits, joins, follow-ons, shuttles, and repeating services.

- [ ] **Follow-on services**:
  - Train arrives at destination, its ID gets a new headcode and new timetable entry
  - No new train created — existing train changes identity
  - Configurable turnaround time
- [ ] **Splits**:
  - Train arrives at split point
  - Front portion becomes train A (new headcode), rear portion becomes train B
  - Both depart independently on their own timetable entries
- [ ] **Joins**:
  - Train A and Train B arrive at join point
  - They couple together and depart as a single train under a new headcode
  - Validation: train types and lengths must be compatible
- [ ] **Shuttles**:
  - Train goes back and forth between two points N times
  - No explicit entries needed — define shuttle: endpoints, headcode, interval, count
- [ ] **Repeating services**:
  - Timetable has a `repeatRule` — daily, weekday, saturday, sunday
  - At end of period, timetable resets and re-dispatches

### Milestone 24: Train Graph Visualization

**Deliverable**: String-line diagram showing train movements over time, like a real railway traffic control display.

- [ ] Build string-line (train graph) panel:
  - X-axis = time (e.g., 06:00 to 22:00)
  - Y-axis = stations/locations along the line, ordered geographically
  - Each train = a diagonal line: steeper = faster, flat = stopped
  - Color-coded by train type
- [ ] Interactive: hover a line → see train details; click → select train
- [ ] Real-time update: current time cursor moves across the graph, trains draw their path as they move
- [ ] Useful for spotting conflicts: crossing lines at same location at same time = potential collision

### Milestone 25: Failures System

**Deliverable**: Random equipment failures disrupt operations. Player can also inject failures manually.

- [ ] Implement `engine/Failures.ts`:
  - **Failure types**:
    - Train: partial power (reduced max speed), complete failure (blocks line, needs rescue)
    - Signal: lamp failure (stuck at red/dark), detection failure (shows wrong aspect)
    - Points: stuck normal, stuck reverse, detection failure (position unknown)
    - Track circuit: false occupancy (shows occupied when free), failure to detect (shows free when occupied)
    - Temporary Speed Restriction (TSR): edge speed limit reduced for a duration
  - **Random injection**: configurable probability per sim-hour (global setting + per-type weights)
  - **Duration**: each failure has a random duration (or indefinite until manually cleared)
  - **Effects**: failures immediately affect the simulation (e.g., signal stuck red → trains stop)
- [ ] Build `FailurePanel.tsx`:
  - List of active failures with type icon, location, severity, time remaining
  - **Clear button**: simulates engineer fixing the fault
  - **Inject button**: manually create a failure at selected element
  - **Settings**: global failure rate slider, per-type enable/disable checkboxes
- [ ] Failure notifications in status bar when something breaks

### Milestone 26: Temporary Speed Restrictions

**Deliverable**: Set speed limits on track segments that expire after a duration.

- [ ] TSR placement tool:
  - Select track edge(s) → "Add Speed Restriction" → set speed (km/h) and duration
  - TSR renders as a yellow/black striped overlay on the affected track
  - Countdown timer shows remaining duration
- [ ] Trains respect TSRs: speed limited to the lower of edge speed limit and active TSR
- [ ] TSRs can be cleared early (like fixing a fault)
- [ ] Permanent speed restrictions (engineering works, line upgrades) with no expiry

### Milestone 27: Unrouted Operation

**Deliverable**: Trains can move without set routes — higher risk, more flexibility.

- [ ] Toggle per-train: "Require Route" vs "Allow Unrouted"
- [ ] Unrouted operation rules:
  - Train can enter any unoccupied block
  - At points, train follows current point position (may not be the intended path)
  - **Derailment risk**: small probability per point traversal if points aren't locked for this train
  - Trains proceed at reduced speed (e.g., 25 km/h) when unrouted
- [ ] "Call-on" operation: signalman can authorize a train to pass a red signal (e.g., into an occupied platform for coupling)
- [ ] Warning indicators when trains are running unrouted

### Milestone 28: Direction Management

**Deliverable**: Set preferred directions on track edges, bi-directional running control.

- [ ] Per-edge direction setting:
  - `preferred` (normal running direction), `reversible` (bi-di), `reversed` (opposite to normal)
  - Set individually, by track selection, or by area (lasso tool)
- [ ] Direction visualization: arrows along track showing preferred direction
- [ ] Trains prefer preferred-direction paths; can use reversible tracks if no preferred path exists
- [ ] "Wrong-line running": specific authorization for a train to run opposite to preferred direction

### Milestone 29: Undo/Redo

**Deliverable**: Full undo/redo for all editing operations.

- [ ] Implement command pattern:
  - Every state-mutating user action is wrapped in a `Command` with `execute()` and `undo()`
  - Command history stack with configurable depth (default 100)
- [ ] Track editing commands: `AddVertex`, `RemoveVertex`, `AddEdge`, `RemoveEdge`, `MoveVertex`, `EditEdgeProperties`
- [ ] Signal/points/train placement commands follow the same pattern
- [ ] `Cmd+Z` undo, `Cmd+Shift+Z` redo (or `Ctrl` on Windows/Linux)
- [ ] Undo/redo buttons in toolbar with history preview tooltips

### Milestone 30: Copy/Paste & Area Operations

**Deliverable**: Copy, cut, paste, mirror, flip, and rotate track areas.

- [ ] Area selection: drag-select (marquee) to select multiple elements
- [ ] Copy (`Cmd+C`): serialize selected elements with relative positions
- [ ] Cut (`Cmd+X`): copy + delete originals
- [ ] Paste (`Cmd+V`): paste at cursor position, generating new IDs
- [ ] Mirror: reflect selection horizontally or vertically
- [ ] Flip: reverse direction of selected edges (swap from/to)
- [ ] Rotate: rotate selection 90° clockwise/counterclockwise
- [ ] Clipboard stored in-memory (not system clipboard — handles rich simulation objects)

### Milestone 31: Labels & Text System

**Deliverable**: Place and style text labels on the network — station names, junction names, speed limits, etc.

- [ ] Build `LabelLayer.ts` — renders text sprites (PixiJS `Text`) above the track layer
- [ ] Label placement tool: click location → type text → label appears
- [ ] Label properties: font family, size, color, bold/italic, alignment
- [ ] Label types:
  - Station name (large, bold)
  - Junction/siding name (medium)
  - Speed limit sign (small, red circle background)
  - Gradient marker (small, triangle)
  - Free text (any size/style)
- [ ] Labels can be dragged to reposition
- [ ] Labels saved/loaded with the session

### Milestone 32: Session Recording & Replay

**Deliverable**: Record a session as a sequence of commands, replay it exactly.

- [ ] **Recording**: instead of recording frames, record every `SimCommand` + timestamp
  - This is deterministic because the simulation is deterministic (seeded RNG + fixed timestep)
  - Recording is tiny — just the user's actions, not the resulting state
- [ ] **Replay**: re-initialize engine with same seed, replay commands at recorded timestamps
  - Replay can run at any speed (1x, 10x, 100x)
  - Pause, rewind (restart replay from beginning), fast-forward
- [ ] Export recording as `.ros-replay` file (JSON, gzipped)
- [ ] Playback controls: play/pause, speed slider, scrubber bar, time display

### Milestone 33: Performance Optimization

**Deliverable**: Smooth 60fps with large networks (1000+ edges, 100+ trains).

- [ ] **Spatial hashing**: grid-based spatial index for hit-testing — O(1) instead of O(n)
- [ ] **Object pooling**: reuse sprite objects instead of creating/destroying
- [ ] **Culling**: don't render sprites outside the viewport (PixiJS does some of this, verify)
- [ ] **Throttled state updates**: only send state to renderer at 20Hz (not 60Hz), interpolate between
- [ ] **Dirty tracking**: only re-render changed signals, changed blocks (not the whole TrackLayer)
- [ ] **LOD at low zoom**: simplified rendering (single lines instead of detailed rails) when zoomed out
- [ ] **Batch track sprites**: use PixiJS `Graphics` batching or a single large geometry for static track
- [ ] Performance overlay: FPS, frame time, entity counts, visible entities

### Milestone 34: Production Polish

**Deliverable**: Ready to share with users.

- [ ] **Error boundaries** around the canvas, each panel, and the router — graceful degradation
- [ ] **Loading states**: skeleton screens while session loads, spinner during worker init
- [ ] **Empty states**: helpful prompts when no track built, no trains placed, no timetable loaded
- [x] **Keyboard shortcut reference**: `?` key shows overlay with all shortcuts — generated from the `SHORTCUTS` registry in `packages/app/src/lib/shortcuts.ts`, which every binding site, the toolbar badges and the overlay read from
- [ ] **Tutorial scenario**: pre-built simple network with step-by-step instructions (build track → place signal → place train → set route → run)
- [ ] **PWA**: service worker for offline use, installable (manifest.json already exists)
- [ ] **Favicon and app icons** (already have logo files)
- [ ] **Responsive layout**: panels collapse on small screens, canvas always fills remaining space
- [ ] **Light/dark canvas background**: follow the existing theme system for the canvas background color
- [ ] **Custom train graphics**: accept uploaded sprite sheets or colored rectangles as default

---

## Rendering Pipeline Detail

```
Each frame (requestAnimationFrame):
  1. Receive latest SimState from Worker (postMessage)
  2. Update TrackLayer:
     - Dirty rects only for changed blocks (occupancy coloring)
  3. Update SignalLayer:
     - Changed signal aspects (tint update, cheap)
  4. Update TrainLayer:
     - Interpolate train positions between sim ticks for smooth motion
     - Update headcode labels
  5. Update LabelLayer:
     - Station names, speed limit signs (mostly static)
  6. Update SelectionLayer:
     - Cursor-following highlights, drag previews
  7. Render to screen (PixiJS handles batching automatically)
```

### Layer Z-Order

```
GroundLayer         (z=0)  — grid, terrain, background
TrackLayer          (z=1)  — rail lines, ballast
  TrackOccupancy    (z=2)  — block occupancy overlay (semi-transparent)
SignalLayer         (z=3)  — signal posts + aspect lights
PointLayer          (z=4)  — point position indicators
TrainLayer          (z=5)  — train sprites
RouteOverlayLayer   (z=6)  — set route highlights
LabelLayer          (z=7)  — text labels
SelectionLayer      (z=8)  — selection markers, drag handles
UILayer             (z=9)  — tool cursors, measurement overlays
```

---

## Transport Protocol (Engine ↔ Host)

The engine communicates with the outside world through a single `SimTransport` interface. This is the **only** API surface the engine knows about — it never touches `postMessage`, WebSocket, or any I/O directly.

```typescript
// transport/types.ts

interface SimTransport {
  /** Send state updates + events to the host (renderer/UI) */
  send(message: EngineToHost): void;
  /** Register handler for commands from the host */
  onMessage(handler: (message: HostToEngine) => void): void;
}

// === Engine → Host ===
type EngineToHost =
  | { type: 'state_update'; state: UISimState }      // throttled, UI-relevant subset
  | { type: 'full_state'; state: SerializedSimState } // for save
  | { type: 'sim_event'; event: SimEvent };

type SimEvent =
  | { type: 'signal_passed_at_danger'; trainId: string; signalId: string }
  | { type: 'train_failure'; trainId: string; failure: Failure }
  | { type: 'collision'; trainId1: string; trainId2: string }
  | { type: 'derailment'; trainId: string; cause: string }
  | { type: 'timetable_departure'; serviceRef: ServiceRef; action: Action }
  | { type: 'route_conflict'; routeId: string; conflictingRouteId: string };

// === Host → Engine ===
type HostToEngine =
  | { type: 'sim_command'; cmd: SimCommand }
  | { type: 'load_state'; state: SerializedSimState }
  | { type: 'request_save' }
  | { type: 'set_speed'; speed: number }             // 1x, 2x, 0.5x, pause

type SimCommand =
  | { type: 'add_track'; edge: Edge; vertices: Vertex[] }
  | { type: 'remove_track'; edgeIds: string[] }
  | { type: 'place_signal'; signal: Signal }
  | { type: 'place_train'; train: Train }
  | { type: 'set_route'; entrySignalId: string; exitSignalId: string }
  | { type: 'clear_route'; routeId: string }
  | { type: 'set_points'; pointsId: string; position: 'normal' | 'reverse' }
  | { type: 'inject_failure'; failure: Failure }
  | { type: 'clear_failure'; failureId: string }
  | { type: 'load_timetable'; timetable: Timetable }
  // ... etc
```

### Adapter Implementations

```typescript
// transport/postmessage-transport.ts (single-player)
// Wraps `self.postMessage` / `self.onmessage` in the Worker

class PostMessageTransport implements SimTransport {
  send(message: EngineToHost): void {
    self.postMessage(message);
  }
  onMessage(handler: (msg: HostToEngine) => void): void {
    self.onmessage = (e: MessageEvent) => handler(e.data);
  }
}
```

```typescript
// transport/websocket-transport.ts (multiplayer — future)
// Wraps a Socket.IO / Colyseus connection

class WebSocketTransport implements SimTransport {
  constructor(private socket: Socket) {}
  send(message: EngineToHost): void {
    this.socket.emit('engine_msg', message);
  }
  onMessage(handler: (msg: HostToEngine) => void): void {
    this.socket.on('host_msg', handler);
  }
}
```

### How the engine boots (host-agnostic)

```typescript
// engine/SimState.ts
export function createEngine(transport: SimTransport): Engine {
  const engine = new Engine(transport);

  transport.onMessage((msg) => {
    switch (msg.type) {
      case 'sim_command': engine.handleCommand(msg.cmd); break;
      case 'load_state': engine.load(msg.state); break;
      case 'request_save': transport.send({ type: 'full_state', state: engine.save() }); break;
      case 'set_speed': engine.setSimSpeed(msg.speed); break;
    }
  });

  return engine;
}
```

```typescript
// host/worker-host.ts (single-player entry)
import { createEngine } from '../engine/SimState';
import { PostMessageTransport } from '../transport/postmessage-transport';

const engine = createEngine(new PostMessageTransport());
engine.start();
```

```typescript
// host/server-host.ts (multiplayer entry — future)
import { createEngine } from '../engine/SimState';
import { WebSocketTransport } from '../transport/websocket-transport';
import { Server } from 'socket.io';

const io = new Server(3000);
io.on('connection', (socket) => {
  const engine = createEngine(new WebSocketTransport(socket));
  engine.start();
  // In multiplayer, each room gets its own engine instance
});
```

This means the **entire engine** (`engine/*.ts`) stays identical between single-player and multiplayer. Only `host/` and `transport/` differ.

---

## Key Dependencies to Add

```bash
pnpm add pixi.js                   # Rendering engine (PixiJS v8)
pnpm add nanoid                     # ID generation
pnpm add valibot                   # Runtime validation (~2KB, tree-shakable)
pnpm add zustand                   # UI state management (~1KB)
pnpm add dexie                     # IndexedDB wrapper (Promise-based API)
pnpm dlx shadcn@latest add button tooltip dialog select input separator label dropdown-menu tabs sheet popover
```

`@tanstack/react-table` is already available as a transitive dependency from `@tanstack/react-router`.

---

## Verification Plan

**After M1–M6 (Track Editor Complete)**:
Build a simple oval track with a passing siding, place station labels, pan/zoom around. Save → reload → track is identical. Delete a section → undo brings it back.

**After M7–M8 (Engine Running)**:
Worker boots, engine ticks at 60Hz, status bar shows sim time advancing. Pause/resume/speed controls work.

**After M9–M11 (Trains Moving)**:
Place a train on the oval track, start it. Watch it accelerate, cruise at line speed, and loop continuously. Click stop — it brakes to a halt. Place two trains on the same oval, both running — they maintain separation.

**After M12–M16 (Signalling Working)**:
Place signals around the oval. With one train running, observe signals behind it going red → yellow → double-yellow → green as it clears each block. A second train automatically brakes for the red signal and stops safely.

**After M17–M19 (Interlocking Complete)**:
Build a junction where two lines diverge. Set a route from entry signal through the junction to exit signal. Verify points lock to the correct position and the route highlights. Attempt to set a conflicting route through the same junction — verify it's rejected. Run a train through — verify the route clears progressively behind it.

**After M20–M23 (Timetables Working)**:
Create a timetable with 5 trains: two expresses (non-stop), two locals (all stops), one freight. Run at 16x speed for a full sim-day. Verify all trains dispatch on time, stop at correct stations for correct durations, and complete their journeys. Verify a split service (train divides at intermediate station, both portions continue to different destinations).

**After M25–M28 (Operations Complete)**:
Inject a signal failure at a key junction. Verify protecting signal goes to red and trains brake accordingly. Inject a train failure — verify it blocks the line and following trains queue behind it. Set a TSR on a section, verify trains slow through it, verify it expires correctly. Enable unrouted operation on a train, verify it proceeds with caution through points.

**After M29–M34 (Polish Complete)**:
Build a complex network: 4-platform terminus with approach junctions, a double-track main line, two branch lines, and a freight yard. Run a full timetable of 20+ trains for 24 sim-hours. Verify zero collisions, all services completed within tolerance. Verify undo/redo throughout. Verify save/load preserves entire session. Verify replay reproduces the session exactly.
