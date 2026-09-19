# Graph Report - rail-op-sim  (2026-09-19)

## Corpus Check
- 123 files · ~116,601 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1574 nodes · 3251 edges · 228 communities (115 shown, 113 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 435 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `11f5e160`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TextInputDialog.tsx
- track-data.ts
- Track
- devDependencies
- ViewportController.ts
- dependencies
- Implementation Milestones
- Rail Ops Sim — Architecture & Implementation Plan
- graphics
- ZoomSlider.tsx
- includes
- enums.ts
- Map_
- textureCache.ts
- PlacementController
- map-serialization.ts
- track-data.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- PlacementController.ts
- map-connectivity.ts
- Technology Evaluation
- components.json
- scripts
- Building For Production
- concept:signal-graphics
- routeTree.gen.ts
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- .addTrack
- TextLayer
- ElementLayer.ts
- ViewportController
- gestureOverlay.ts
- .getTrackAt
- map.ts
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- NamedLocation
- app/tsconfig.json
- useEditorStore
- railway/errors.ts
- Link state SVGs (set/unset variants)
- React-UI Rendering Separation
- SWITCH_LINKS
- railway/types.ts
- png-to-svg.mjs
- editor-store.ts
- tooltip.tsx
- ui/input.tsx
- manifest.json
- shortcuts.ts
- GroundLayer.ts
- railway/index.ts
- errors.ts
- root tsconfig.json
- file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/routeTree.gen.ts
- package.json — root monorepo config
- parapet26.svg
- parapet7.svg
- CURVED_LINKS
- shared/tsconfig.json
- createDirectionLayer
- CLAUDE.md
- parapet1.svg
- parapet10.svg
- parapet12.svg
- parapet14.svg
- parapet17.svg
- parapet2.svg
- parapet21.svg
- parapet22.svg
- parapet3.svg
- .cta.json
- biome.json
- components.json
- bridgeSet1.svg
- bridgeSet2.svg
- bridgeUnset1.svg
- bridgeUnset2.svg
- bufferDown.svg
- bufferLeft.svg
- bufferLeftDown.svg
- bufferLeftUp.svg
- bufferRight.svg
- bufferRightDown.svg
- bufferRightUp.svg
- bufferUp.svg
- concourseSet.svg
- concourseUnset.svg
- SimLayout.tsx
- GroundLayer.ts
- PixiApp.ts
- __root.tsx
- BridgeUnderpassType
- BufferType
- Button
- CrossoverType
- CurvedType
- DirectedType
- ElementAlreadyExistsError
- ElementNotFoundError
- ExitType
- FlyoverType
- GroundLayer
- GroundLayerOptions
- LinkedTrackError
- LinkedType
- ParapetType
- Platform
- RailwayError
- RootDocument
- Route
- SignalType
- SimCanvas
- SimLayout
- StraightType
- SwitchType
- TooltipProvider
- TrackNotConnectedError
- ViewportController
- ViewportState
- ZeroTrackError
- buttonVariants
- createGroundLayer
- createPixiApp
- underpassSet1.svg
- underpassSet2.svg
- underpassUnset1.svg
- underpassUnset2.svg
- tsr.config.json
- Button
- DialogPrimitive
- XIcon
- cn
- FontInfo
- ParapetType
- rail-op-sim/packages/shared/src/railway/__tests__/enums.test.ts
- rail-op-sim/packages/shared/src/railway/enums.ts
- rail-op-sim/packages/shared/src/railway/__tests__/errors.test.ts
- rail-op-sim/packages/shared/src/railway/errors.ts
- file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/components/ui/select.tsx
- file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/components/ui/separator.tsx
- file:/Users/jonathankwok/projects/rail-op-sim/scripts/png-to-svg.mjs
- namedLocationSet.svg — solid blue 16x16 icon (#0066ff)
- namedLocationUnset.svg — patterned blue 16x16 icon (#0066ff dot pattern)
- parapet19.svg
- parapet20.svg
- parapet28.svg
- parapet4.svg
- manifest.json
- rail-op-sim/packages/app/src/components/ui/dialog.tsx
- 2-Aspect Railway Signal (Green-Red)
- 3-Aspect Railway Signal (Green-Yellow-Red)
- 4-Aspect Railway Signal (Yellow-Green-Yellow-Red)
- Shunting Signal (Red)
- niceSpacing
- pnpm Monorepo Workspace Configuration
- Level crossing icon SVG
- Map_ constructor(options?)
- usePixiApp
- useTheme
- vite.config.ts
- button.tsx
- 34 Milestone Implementation Plan
- useEditorHotkeys.ts
- TrackLayer
- EndpointOutlines
- Text
- SectionEditPanel
- Element
- createTrackColorLayer
- LinkHighlightLayer
- AddPalette.tsx
- element.ts
- Toolbar.tsx
- NamedElement
- buildSampleMap

## God Nodes (most connected - your core abstractions)
1. `Map_` - 127 edges
2. `Track` - 94 edges
3. `PlacementController` - 61 edges
4. `Text` - 44 edges
5. `debugLog()` - 38 edges
6. `useEditorStore` - 35 edges
7. `Implementation Milestones` - 35 edges
8. `ViewportController` - 31 edges
9. `cn()` - 28 edges
10. `recordField()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Knowledge Graph Project Rules` --references--> `Rail Ops Sim`  [INFERRED]
  CLAUDE.md → PLAN.md
- `PanControlsProps` --references--> `ViewportController`  [EXTRACTED]
  packages/app/src/components/sim/PanControls.tsx → packages/app/src/engine/ViewportController.ts
- `LoadedMapFile` --references--> `SerializedMap`  [EXTRACTED]
  packages/app/src/lib/mapFile.ts → packages/shared/src/railway/map/map-serialization.ts
- `CATEGORIES` --calls--> `kindToShortLabel()`  [EXTRACTED]
  packages/app/src/components/sim/AddPalette.tsx → packages/shared/src/railway/track/track-labels.ts
- `NameElementDialog()` --calls--> `useEditorStore`  [EXTRACTED]
  packages/app/src/components/sim/NameElementDialog.tsx → packages/app/src/store/editor-store.ts

## Import Cycles
- None detected.

## Communities (228 total, 113 thin omitted)

### Community 0 - "TextInputDialog.tsx"
Cohesion: 0.11
Nodes (31): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, Button(), buttonVariants (+23 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.08
Nodes (4): LinkedTrackPair, PathNode, getTrackColorState(), Track

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (46): babel-plugin-react-compiler, jsdom, devDependencies, babel-plugin-react-compiler, @biomejs/biome, jsdom, @rolldown/plugin-babel, @tailwindcss/typography (+38 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (47): class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, dependencies, class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, @phosphor-icons/react (+39 more)

### Community 6 - "Implementation Milestones"
Cohesion: 0.06
Nodes (35): Implementation Milestones, Milestone 10: Train Placement & Rendering, Milestone 11: Train Control, Milestone 12: Block Occupancy, Milestone 13: Signal Placement & Data Model, Milestone 14: Signal Rendering, Milestone 15: Signal Aspect Propagation, Milestone 16: Train Responds to Signals (+27 more)

### Community 7 - "Rail Ops Sim — Architecture & Implementation Plan"
Cohesion: 0.17
Nodes (11): Architecture Overview, Context, Data Model (Core Types), Key Dependencies to Add, Layer Z-Order, Multiplayer Mode (future — engine code unchanged), Project Structure, Rail Ops Sim — Architecture & Implementation Plan (+3 more)

### Community 8 - "graphics"
Cohesion: 0.13
Nodes (28): graphics, switch1.svg, switch10.svg, switch11.svg, switch12.svg, switch13.svg, switch14.svg, switch15.svg (+20 more)

### Community 9 - "ZoomSlider.tsx"
Cohesion: 0.15
Nodes (18): PanControls(), PanControlsProps, SimCanvas(), ZoomSlider(), PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportControllerOptions, ViewportState (+10 more)

### Community 10 - "includes"
Cohesion: 0.07
Nodes (29): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+21 more)

### Community 11 - "enums.ts"
Cohesion: 0.28
Nodes (19): ALL_TRACK_SUBTYPES, ELEMENT_KEYS, GRAPHICS_DIR, TRACK_ENUMS, BridgeUnderpassType, BufferType, CrossoverType, CurvedType (+11 more)

### Community 13 - "textureCache.ts"
Cohesion: 0.11
Nodes (24): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), buildThemeColorMap(), ColorMap (+16 more)

### Community 14 - "PlacementController"
Cohesion: 0.07
Nodes (17): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, RefreshFlags, PlacementController, platformSubtypeToSide(), debugLog() (+9 more)

### Community 15 - "map-serialization.ts"
Cohesion: 0.20
Nodes (13): sample, deserializeMap(), SERIALIZED_MAP_VERSION, SerializedMap, SerializedNamedElement, SerializedParapet, SerializedText, SerializedTrack (+5 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (30): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+22 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "PlacementController.ts"
Cohesion: 0.21
Nodes (11): DEFAULT_OPTIONS, ELEMENT_LABELS, themeKey(), usePixiApp(), Subsystem, CELL_SIZE, worldToGrid(), createTrackLayer() (+3 more)

### Community 20 - "map-connectivity.ts"
Cohesion: 0.14
Nodes (26): checkAllTracksConnected(), clearPreferredDirectionsAlongPath(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+18 more)

### Community 21 - "Technology Evaluation"
Cohesion: 0.20
Nodes (10): 1. Rendering Engine — **PixiJS v8** ✅ Decided, 2. Meta-Framework — **TanStack Start** (already scaffolded), 3. State Management (UI) — **Zustand**, 4. Worker Communication — **Raw postMessage**, 5. Schema Validation — **Valibot**, 6. IndexedDB Wrapper — **Dexie.js**, 7. Table Component — **@tanstack/react-table**, 8. CSS & UI Components — **Tailwind v4 + shadcn/ui** (already configured) (+2 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "scripts"
Cohesion: 0.08
Nodes (24): fallow, devDependencies, @biomejs/biome, fallow, pngjs, typescript, @biomejs/biome, typescript (+16 more)

### Community 24 - "Building For Production"
Cohesion: 0.12
Nodes (16): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Demo files, Getting Started, Learn More (+8 more)

### Community 25 - "concept:signal-graphics"
Cohesion: 0.13
Nodes (15): concept:railway-graphics, concept:signal-graphics, concept:track-graphics, file:packages/app/public/graphics/signalDown.svg, file:packages/app/public/graphics/signalLeft.svg, file:packages/app/public/graphics/signalLeftDown.svg, file:packages/app/public/graphics/signalLeftUp.svg, file:packages/app/public/graphics/signalRight.svg (+7 more)

### Community 26 - "routeTree.gen.ts"
Cohesion: 0.13
Nodes (17): TooltipProvider(), getRouter(), Register, @tanstack/react-router, Route, Route, FileRoutesByFullPath, FileRoutesById (+9 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): DOM, DOM.Iterable, ES2022, compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution (+9 more)

### Community 28 - "Map_ (railway map data structure)"
Cohesion: 0.10
Nodes (27): Map_ (railway map data structure), map-connectivity.test.ts — tests for checkAllTracksConnected, map-platform.test.ts — tests for addPlatform and addLevelCrossing, map-text-linking.test.ts — tests for linkLocalText, deleteTextFromAllElements, changeDeleteText, map.test.ts — comprehensive tests for Map_ class, map/map-connectivity.ts, map/map-platform.ts, map/map-text-linking.ts (+19 more)

### Community 29 - "railway/enums.ts"
Cohesion: 0.14
Nodes (14): BridgeUnderpassType (4 variants), BufferType (8 variants), CrossoverType (6 variants), CurvedType (12 variants), DirectedType (8 variants), ExitType (8 variants), FlyoverType (12 variants), LinkedType (8 variants) (+6 more)

### Community 30 - ".addTrack"
Cohesion: 0.20
Nodes (3): record(), mapDebug(), addStraightH()

### Community 31 - "TextLayer"
Cohesion: 0.25
Nodes (3): createTextLayer(), removeAll(), TextLayer

### Community 32 - "ElementLayer.ts"
Cohesion: 0.12
Nodes (7): createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

### Community 34 - "ViewportController"
Cohesion: 0.13
Nodes (3): ZoomSliderProps, ViewportController, UsePixiAppReturn

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.10
Nodes (29): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), GESTURE_END_COLOR, GESTURE_INVALID_COLOR, GESTURE_OUTLINE_INSET (+21 more)

### Community 36 - ".getTrackAt"
Cohesion: 0.24
Nodes (8): changeDeleteText(), collectNeighbourTexts(), deleteTextFromAllElements(), linkLocalText(), linkNewElementToText(), NEIGHBOR_OFFSETS, tryLinkNamedLocationNeighbor(), tryLinkTrackOrConcourseOrBridge()

### Community 37 - "map.ts"
Cohesion: 0.35
Nodes (8): Platform, MAP_DEBUG, addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), FONT, testFont

### Community 38 - "shared/package.json"
Cohesion: 0.13
Nodes (14): devDependencies, typescript, vitest, typescript, vitest, main, name, private (+6 more)

### Community 40 - "Multiplayer Readiness (Built In From Day 1)"
Cohesion: 0.40
Nodes (5): Key Architectural Decisions, Multiplayer Readiness (Built In From Day 1), What changes for multiplayer (later, not now), What "multiplayer-ready" means here, What we do now to enable this

### Community 41 - "rail-op-sim/packages/shared/src/railway/element.ts"
Cohesion: 0.22
Nodes (14): Concourse (red block), Element (abstract base), NamedElement (abstract), NamedLocation (blue block), Parapet (decorative structure), Text (editable canvas text), shared/src/index.ts, rail-op-sim/packages/shared/src/railway/__tests__/element.test.ts (+6 more)

### Community 42 - "Element"
Cohesion: 0.25
Nodes (8): TestElement, TestNamedElement, Concourse, Element, NamedElement, NamedLocation, Parapet, Text

### Community 43 - "Transport Protocol (Engine ↔ Host)"
Cohesion: 0.67
Nodes (3): Adapter Implementations, How the engine boots (host-agnostic), Transport Protocol (Engine ↔ Host)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "useEditorStore"
Cohesion: 0.18
Nodes (12): AddPalette(), SAVE_FORMATS, SettingsMenu(), SimLayout(), BASE, TextInputDialog(), TrackInfoTooltip(), applyTheme() (+4 more)

### Community 47 - "railway/errors.ts"
Cohesion: 0.52
Nodes (7): ElementAlreadyExistsError, ElementNotFoundError, LinkedTrackError, RailwayError (base error), TrackNotConnectedError, ZeroTrackError, railway/errors.ts

### Community 48 - "Link state SVGs (set/unset variants)"
Cohesion: 0.22
Nodes (9): Link state SVGs (set/unset variants), Link down set SVG, Link left-down set SVG, Link left set SVG, Link left unset SVG, Link right set SVG, Link right unset SVG, Link up set SVG (+1 more)

### Community 49 - "React-UI Rendering Separation"
Cohesion: 0.40
Nodes (5): Multiplayer-Ready Architecture, PixiJS v8 Rendering Engine, React-UI Rendering Separation, Pure TypeScript Simulation Engine, Transport Adapter Pattern

### Community 50 - "SWITCH_LINKS"
Cohesion: 0.22
Nodes (9): switchTight1.svg, switchTight2.svg, switchTight3.svg, switchTight4.svg, switchTight5.svg, switchTight6.svg, switchTight7.svg, switchTight8.svg (+1 more)

### Community 51 - "railway/types.ts"
Cohesion: 0.53
Nodes (6): types.ts, railway/types.ts, FontInfo interface, MessageCallback callback, Point interface, TextSelectionPrompt callback

### Community 52 - "png-to-svg.mjs"
Cohesion: 0.53
Nodes (5): encodeRow(), mergeRuns(), pngFiles, pngToSvg(), rgbToHex()

### Community 53 - "editor-store.ts"
Cohesion: 0.15
Nodes (13): DEFAULT_ZOOM, EscapeAction, EscapeContext, MapFileFormat, base, AddKind, DirectionMode, EditorState (+5 more)

### Community 54 - "tooltip.tsx"
Cohesion: 0.40
Nodes (5): tooltip.tsx, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger

### Community 55 - "ui/input.tsx"
Cohesion: 0.50
Nodes (4): ui/input.tsx, routes/index.tsx (app), Input component, @rail-op-sim/app package

### Community 56 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 57 - "shortcuts.ts"
Cohesion: 0.19
Nodes (16): SaveLoadControls(), ShortcutsDialog(), Tip(), useMounted(), useShortcutDisplay(), useShortcutKeys(), isPlatformDependent(), Shortcut (+8 more)

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 59 - "railway/index.ts"
Cohesion: 0.11
Nodes (35): CATEGORIES, COLOR_LEGEND, buildHoveredTrackInfo(), DanglingLink, LINK_OFFSETS, LinkedTrackReport, PathOptions, PreferredDirectionIssueReason (+27 more)

### Community 60 - "errors.ts"
Cohesion: 0.26
Nodes (6): ElementAlreadyExistsError, ElementNotFoundError, LinkedTrackError, RailwayError, TrackNotConnectedError, ZeroTrackError

### Community 61 - "root tsconfig.json"
Cohesion: 0.67
Nodes (3): app/tsconfig.json, shared/tsconfig.json, root tsconfig.json

### Community 62 - "file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/routeTree.gen.ts"
Cohesion: 0.67
Nodes (3): file:/Users/jonathankwok/projects/rail-op-sim/.vscode/settings.json, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/routeTree.gen.ts, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/router.tsx

### Community 63 - "package.json — root monorepo config"
Cohesion: 1.00
Nodes (3): package.json — root monorepo config, app/package.json — Rail Ops Sim app package, shared/package.json — shared library package

### Community 64 - "parapet26.svg"
Cohesion: 0.67
Nodes (3): parapet25.svg, parapet26.svg, parapet27.svg

### Community 65 - "parapet7.svg"
Cohesion: 0.67
Nodes (3): parapet7.svg, parapet8.svg, parapet9.svg

### Community 66 - "CURVED_LINKS"
Cohesion: 0.40
Nodes (5): tightCurve1.svg, tightCurve2.svg, tightCurve3.svg, tightCurve4.svg, CURVED_LINKS

### Community 67 - "shared/tsconfig.json"
Cohesion: 0.40
Nodes (4): extends, include, src/**/*, ../../tsconfig.json

### Community 68 - "createDirectionLayer"
Cohesion: 0.43
Nodes (5): createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 214 - "useEditorHotkeys.ts"
Cohesion: 0.15
Nodes (16): Harness(), useEditorHotkeys(), resolveEscape(), loadMap(), saveMap(), assertSerializedMap(), downloadMap(), encodeMap() (+8 more)

### Community 218 - "SectionEditPanel"
Cohesion: 0.67
Nodes (5): SectionEditPanel(), formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 221 - "LinkHighlightLayer"
Cohesion: 0.13
Nodes (5): PlacementControllerOptions, Coord, DirectionLayer, LinkHighlightLayer, TrackColorLayer

### Community 222 - "AddPalette.tsx"
Cohesion: 0.12
Nodes (17): ALL_LABELS, ASPECT_OPTIONS, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE, SUBTYPE_VALUES (+9 more)

### Community 223 - "element.ts"
Cohesion: 0.23
Nodes (6): Parapet, ParapetType, testFont, FontInfo, MessageCallback, TextSelectionPrompt

### Community 224 - "Toolbar.tsx"
Cohesion: 0.20
Nodes (7): ResizeObserverStub, HISTORY_ACTIONS, Toolbar(), TOOLS, Tooltip(), TooltipContent(), TooltipTrigger()

### Community 225 - "NamedElement"
Cohesion: 0.18
Nodes (4): Concourse, NamedElement, ConnectivityReport, TestNamedElement

## Knowledge Gaps
- **340 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+335 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **113 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `Track`, `enums.ts`, `map-serialization.ts`, `PlacementController.ts`, `map-connectivity.ts`, `.addTrack`, `TextLayer`, `ElementLayer.ts`, `.locationToString`, `gestureOverlay.ts`, `.getTrackAt`, `map.ts`, `NamedLocation`, `railway/index.ts`, `TrackLayer`, `Text`, `Element`, `LinkHighlightLayer`, `AddPalette.tsx`, `element.ts`, `NamedElement`, `.afterTrackTopologyChange`, `buildSampleMap`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TextInputDialog.tsx`, `Toolbar.tsx`, `ViewportController`, `ElementLayer.ts`, `map-serialization.ts`, `PlacementController.ts`, `useEditorHotkeys.ts`, `TrackLayer`, `Text`, `railway/index.ts`, `LinkHighlightLayer`, `TextLayer`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Text` connect `Text` to `.locationToString`, `.getTrackAt`, `map.ts`, `railway/index.ts`, `enums.ts`, `Map_`, `PlacementController`, `map-serialization.ts`, `PlacementController.ts`, `Element`, `TextLayer`, `.addTrack`, `element.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _340 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TextInputDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10520487264673312 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.07678075855689177 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._