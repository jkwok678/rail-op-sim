# Graph Report - rail-op-sim  (2026-09-16)

## Corpus Check
- 97 files · ~102,196 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1428 nodes · 2722 edges · 217 communities (106 shown, 111 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 422 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ca59609`
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
- ViewportController
- includes
- railway/index.ts
- Map_
- textureCache.ts
- PlacementController
- .serializeFieldGroups
- findPathBetween
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- PlacementController.ts
- Text
- Technology Evaluation
- components.json
- scripts
- Building For Production
- concept:signal-graphics
- routeTree.gen.ts
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- LinkHighlightLayer
- map-connectivity.ts
- TextureCache
- Parapet
- ZoomSlider.tsx
- gestureOverlay.ts
- map-text-linking.ts
- Element
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- packages/shared/src/railway/errors.ts
- app/tsconfig.json
- SimLayout.tsx
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
- Toolbar.tsx
- GroundLayer.ts
- createTrackColorLayer
- map.ts
- root tsconfig.json
- file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/routeTree.gen.ts
- package.json — root monorepo config
- parapet26.svg
- parapet7.svg
- CURVED_LINKS
- shared/tsconfig.json
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
- button.tsx
- map-serialization.ts
- FontInfo
- revalidatePreferredDirections

## God Nodes (most connected - your core abstractions)
1. `Map_` - 121 edges
2. `Track` - 91 edges
3. `PlacementController` - 53 edges
4. `Text` - 44 edges
5. `debugLog()` - 35 edges
6. `Implementation Milestones` - 35 edges
7. `ViewportController` - 31 edges
8. `cn()` - 25 edges
9. `useEditorStore` - 23 edges
10. `FontInfo` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Knowledge Graph Project Rules` --references--> `Rail Ops Sim`  [INFERRED]
  CLAUDE.md → PLAN.md
- `PanControlsProps` --references--> `ViewportController`  [EXTRACTED]
  packages/app/src/components/sim/PanControls.tsx → packages/app/src/engine/ViewportController.ts
- `PathNode` --references--> `Track`  [EXTRACTED]
  packages/shared/src/railway/map/map-connectivity.ts → packages/shared/src/railway/track/track.ts
- `NameElementDialog()` --calls--> `useEditorStore`  [EXTRACTED]
  packages/app/src/components/sim/NameElementDialog.tsx → packages/app/src/store/editor-store.ts
- `SaveLoadControls()` --calls--> `debugLog()`  [EXTRACTED]
  packages/app/src/components/sim/SaveLoadControls.tsx → packages/app/src/lib/debugLogger.ts

## Import Cycles
- None detected.

## Communities (217 total, 111 thin omitted)

### Community 0 - "TextInputDialog.tsx"
Cohesion: 0.12
Nodes (26): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, Dialog(), DialogContent() (+18 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 3 - "devDependencies"
Cohesion: 0.04
Nodes (46): babel-plugin-react-compiler, jsdom, devDependencies, babel-plugin-react-compiler, @biomejs/biome, jsdom, @rolldown/plugin-babel, @tailwindcss/typography (+38 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (43): class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, dependencies, class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, @phosphor-icons/react (+35 more)

### Community 6 - "Implementation Milestones"
Cohesion: 0.06
Nodes (35): Implementation Milestones, Milestone 10: Train Placement & Rendering, Milestone 11: Train Control, Milestone 12: Block Occupancy, Milestone 13: Signal Placement & Data Model, Milestone 14: Signal Rendering, Milestone 15: Signal Aspect Propagation, Milestone 16: Train Responds to Signals (+27 more)

### Community 7 - "Rail Ops Sim — Architecture & Implementation Plan"
Cohesion: 0.17
Nodes (11): Architecture Overview, Context, Data Model (Core Types), Key Dependencies to Add, Layer Z-Order, Multiplayer Mode (future — engine code unchanged), Project Structure, Rail Ops Sim — Architecture & Implementation Plan (+3 more)

### Community 8 - "graphics"
Cohesion: 0.13
Nodes (28): graphics, switch1.svg, switch10.svg, switch11.svg, switch12.svg, switch13.svg, switch14.svg, switch15.svg (+20 more)

### Community 9 - "ViewportController"
Cohesion: 0.13
Nodes (3): ZoomSliderProps, ViewportController, UsePixiAppReturn

### Community 10 - "includes"
Cohesion: 0.07
Nodes (29): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+21 more)

### Community 11 - "railway/index.ts"
Cohesion: 0.05
Nodes (88): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE, SUBTYPE_VALUES (+80 more)

### Community 12 - "Map_"
Cohesion: 0.08
Nodes (4): coordKey(), Map_, MessageCallback, TextSelectionPrompt

### Community 13 - "textureCache.ts"
Cohesion: 0.11
Nodes (25): AspectPreview(), DOM_COLOR_MAP, sanitizeSvg(), DOM_COLOR_MAP, sanitizeSvg(), TrackPreview(), buildDomColorMap(), buildThemeColorMap() (+17 more)

### Community 14 - "PlacementController"
Cohesion: 0.13
Nodes (5): PlacementController, platformSubtypeToSide(), debugLog(), ElementKind, NameableKind

### Community 16 - "findPathBetween"
Cohesion: 0.18
Nodes (11): checkAllTracksConnected(), endpointOtherLink(), expectedEntryOnNeighbor(), findPathBetween(), getConnectivityReport(), neighborThroughLink(), portalMouthLink(), preferredDirectionIssue (+3 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "PlacementController.ts"
Cohesion: 0.20
Nodes (10): DEFAULT_OPTIONS, themeKey(), usePixiApp(), Subsystem, CELL_SIZE, worldToGrid(), PLATFORM_SIDE_MAP, PlatformSideMapping (+2 more)

### Community 20 - "Text"
Cohesion: 0.09
Nodes (5): createTextLayer(), removeAll(), TextLayer, Text, changeDeleteText()

### Community 21 - "Technology Evaluation"
Cohesion: 0.20
Nodes (10): 1. Rendering Engine — **PixiJS v8** ✅ Decided, 2. Meta-Framework — **TanStack Start** (already scaffolded), 3. State Management (UI) — **Zustand**, 4. Worker Communication — **Raw postMessage**, 5. Schema Validation — **Valibot**, 6. IndexedDB Wrapper — **Dexie.js**, 7. Table Component — **@tanstack/react-table**, 8. CSS & UI Components — **Tailwind v4 + shadcn/ui** (already configured) (+2 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "scripts"
Cohesion: 0.09
Nodes (22): fallow, devDependencies, @biomejs/biome, fallow, pngjs, typescript, @biomejs/biome, typescript (+14 more)

### Community 24 - "Building For Production"
Cohesion: 0.12
Nodes (16): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Demo files, Getting Started, Learn More (+8 more)

### Community 25 - "concept:signal-graphics"
Cohesion: 0.13
Nodes (15): concept:railway-graphics, concept:signal-graphics, concept:track-graphics, file:packages/app/public/graphics/signalDown.svg, file:packages/app/public/graphics/signalLeft.svg, file:packages/app/public/graphics/signalLeftDown.svg, file:packages/app/public/graphics/signalLeftUp.svg, file:packages/app/public/graphics/signalRight.svg (+7 more)

### Community 26 - "routeTree.gen.ts"
Cohesion: 0.12
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

### Community 30 - "LinkHighlightLayer"
Cohesion: 0.18
Nodes (3): Coord, DirectionLayer, LinkHighlightLayer

### Community 31 - "map-connectivity.ts"
Cohesion: 0.21
Nodes (16): clearPreferredDirectionsAlongPath(), ConnectivityReport, DanglingLink, findAllLinkedTracks(), findUnpairedLinkedTracks(), getLinkedTrackPairs(), getLinkedTrackReport(), LINK_OFFSETS (+8 more)

### Community 32 - "TextureCache"
Cohesion: 0.08
Nodes (9): PlacementControllerOptions, createElementLayer(), ElementLayer, makeElementSprite(), TrackColorLayer, createTrackLayer(), entryKey(), TrackLayer (+1 more)

### Community 34 - "ZoomSlider.tsx"
Cohesion: 0.19
Nodes (13): PanControls(), PanControlsProps, SimCanvas(), ZoomSlider(), PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportControllerOptions, ViewportState (+5 more)

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.07
Nodes (36): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), EndpointOutlines, GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+28 more)

### Community 36 - "map-text-linking.ts"
Cohesion: 0.17
Nodes (7): collectNeighbourTexts(), linkLocalText(), linkNewElementToText(), NEIGHBOR_OFFSETS, tryLinkNamedLocationNeighbor(), tryLinkTrackOrConcourseOrBridge(), buildSampleMap()

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

### Community 44 - "packages/shared/src/railway/errors.ts"
Cohesion: 0.26
Nodes (6): ElementAlreadyExistsError, ElementNotFoundError, LinkedTrackError, RailwayError, TrackNotConnectedError, ZeroTrackError

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "SimLayout.tsx"
Cohesion: 0.30
Nodes (10): AddPalette(), SettingsMenu(), SimLayout(), TextInputDialog(), Toolbar(), TrackInfoTooltip(), applyTheme(), getInitial() (+2 more)

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
Cohesion: 0.18
Nodes (9): DEFAULT_ZOOM, AddKind, DirectionMode, EditorState, HoveredTrackInfo, isTrackKind(), PendingText, TrackStatus (+1 more)

### Community 54 - "tooltip.tsx"
Cohesion: 0.40
Nodes (5): tooltip.tsx, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger

### Community 55 - "ui/input.tsx"
Cohesion: 0.50
Nodes (4): ui/input.tsx, routes/index.tsx (app), Input component, @rail-op-sim/app package

### Community 56 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 57 - "Toolbar.tsx"
Cohesion: 0.43
Nodes (5): TOOLS, Tooltip(), TooltipContent(), TooltipTrigger(), Tool

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 60 - "map.ts"
Cohesion: 0.18
Nodes (11): Platform, LinkedTrackPair, LinkedTrackReport, MAP_DEBUG, mapDebug(), addLevelCrossing(), addPlatform(), removeLevelCrossing() (+3 more)

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

### Community 214 - "button.tsx"
Cohesion: 0.31
Nodes (7): SaveLoadControls(), Button(), buttonVariants, assertSerializedMap(), downloadMap(), InvalidMapFileError, pickAndReadMapFile()

### Community 217 - "map-serialization.ts"
Cohesion: 0.17
Nodes (9): deserializeMap(), SERIALIZED_MAP_VERSION, SerializedMap, SerializedNamedElement, SerializedParapet, SerializedText, SerializedTrack, serializeMap() (+1 more)

### Community 219 - "FontInfo"
Cohesion: 0.15
Nodes (8): Concourse, NamedElement, NamedLocation, testFont, TestNamedElement, testFont, FontInfo, Point

## Knowledge Gaps
- **323 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+318 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **111 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `TextureCache`, `Parapet`, `Track`, `gestureOverlay.ts`, `map-text-linking.ts`, `Element`, `railway/index.ts`, `findPathBetween`, `PlacementController.ts`, `Text`, `revalidatePreferredDirections`, `map-serialization.ts`, `FontInfo`, `map.ts`, `LinkHighlightLayer`, `map-connectivity.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `map-text-linking.ts`, `railway/index.ts`, `Map_`, `.serializeFieldGroups`, `findPathBetween`, `PlacementController.ts`, `revalidatePreferredDirections`, `map-serialization.ts`, `FontInfo`, `map.ts`, `LinkHighlightLayer`, `map-connectivity.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ViewportController` connect `ViewportController` to `TextureCache`, `ZoomSlider.tsx`, `PlacementController.ts`, `PlacementController`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _323 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TextInputDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12063492063492064 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.07394957983193277 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._