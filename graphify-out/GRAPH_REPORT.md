# Graph Report - rail-op-sim  (2026-11-13)

## Corpus Check
- 233 files · ~303,214 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2491 nodes · 5993 edges · 277 communities (153 shown, 124 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 409 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `125d5865`
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
- enums.ts
- Map_
- src/index.ts
- PlacementController
- ActionForm.tsx
- track-data.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- documentActions.ts
- validate.ts
- Technology Evaluation
- components.json
- scripts
- Building For Production
- concept:signal-graphics
- routeTree.gen.ts
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- effect-journal.ts
- Rail Ops Sim — Updated Plan (Railway Builder Focus)
- compilerOptions
- import-railos.ts
- LinkHighlightLayer
- gridToWorld
- map-text-linking.ts
- map.ts
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- sim-bridge.ts
- app/tsconfig.json
- useTimetableStore
- railway/errors.ts
- Link state SVGs (set/unset variants)
- React-UI Rendering Separation
- SWITCH_LINKS
- railway/types.ts
- png-to-svg.mjs
- timetable.ts
- tooltip.tsx
- ui/input.tsx
- manifest.json
- shortcuts.ts
- operateLayers.ts
- track/index.ts
- errors.ts
- root tsconfig.json
- file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/routeTree.gen.ts
- package.json — root monorepo config
- parapet26.svg
- parapet7.svg
- CURVED_LINKS
- shared/tsconfig.json
- connectivity.ts
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
- useEditorStore
- timetable/__tests__/fixtures.ts
- serialization.ts
- Text
- NamedLocation in rail-op-sim — Implementation Plan (v2)
- TimetableEditor.tsx
- Toolbar.tsx
- AddPalette.tsx
- railway/index.ts
- scripts
- createEngine
- engine.ts
- editor-store.ts
- authoring.ts
- EditHistory.ts
- compilerOptions
- check-documents.ts
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- PlacementController.ts
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- routes.ts
- useEditorHotkeys.ts
- sim/__tests__/fixtures.ts
- buildMap
- trains.ts
- map-serialization.ts
- ElementLayer.ts
- @phosphor-icons/react
- log.ts
- Track Speed & Length Editing — Requirements
- debugLogger.ts
- shortcutGates.ts
- createDirectionLayer
- Lines
- radix-ui
- @rail-op-sim/shared
- react
- @tailwindcss/vite
- @tanstack/react-router-ssr-query
- tailwindcss
- @tanstack/react-devtools
- operateLayers.test.ts
- @tanstack/router-plugin
- tw-animate-css
- zustand
- .onPointerMove
- NamedElement
- TrackLayer
- SectionEditPanel
- convert-railos.sh
- timetable-store-map.test.ts
- createLinkHighlightLayer
- ResizeObserverStub
- useTheme

## God Nodes (most connected - your core abstractions)
1. `Map_` - 147 edges
2. `Track` - 98 edges
3. `PlacementController` - 69 edges
4. `Text` - 51 edges
5. `useEditorStore` - 48 edges
6. `debugLog()` - 46 edges
7. `Implementation Milestones` - 35 edges
8. `ViewportController` - 32 edges
9. `parseSimTime()` - 31 edges
10. `createEngine()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `platform()` --calls--> `trackAtCell()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `name()` --calls--> `trackAtCell()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `direct()` --calls--> `setPreferredDirectionsAlongPath()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `direct()` --calls--> `trackAtCell()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `railwayProblems()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts

## Import Cycles
- None detected.

## Communities (277 total, 124 thin omitted)

### Community 0 - "TextInputDialog.tsx"
Cohesion: 0.11
Nodes (30): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, CellField(), ChoiceField() (+22 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.07
Nodes (8): buildHoveredTrackInfo(), DanglingLink, PathNode, PreferredDirectionRemovalResult, PreferredDirectionResult, getTrackColorState(), Track, pathsOf()

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): babel-plugin-react-compiler, jsdom, devDependencies, babel-plugin-react-compiler, @biomejs/biome, jsdom, @rolldown/plugin-babel, @tailwindcss/typography (+27 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (29): class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, nitro, dependencies, class-variance-authority, clsx, @fontsource-variable/jetbrains-mono (+21 more)

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
Cohesion: 0.05
Nodes (35): PanControls(), PanControlsProps, SimCanvas(), ZoomSlider(), ZoomSliderProps, createGroundLayer(), redraw(), DEFAULTS (+27 more)

### Community 10 - "includes"
Cohesion: 0.06
Nodes (30): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+22 more)

### Community 11 - "enums.ts"
Cohesion: 0.14
Nodes (32): ALL_TRACK_SUBTYPES, ELEMENT_KEYS, GRAPHICS_DIR, TRACK_ENUMS, makeTrack(), BridgeUnderpassType, BufferType, CrossoverType (+24 more)

### Community 12 - "Map_"
Cohesion: 0.06
Nodes (6): record(), NamedLocation, coordKey(), Map_, MessageCallback, TextSelectionPrompt

### Community 13 - "src/index.ts"
Cohesion: 0.13
Nodes (18): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), ColorMap, escapeRegExp() (+10 more)

### Community 14 - "PlacementController"
Cohesion: 0.14
Nodes (3): PlacementController, debugLog(), isTrackKind()

### Community 15 - "ActionForm.tsx"
Cohesion: 0.28
Nodes (12): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+4 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (32): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+24 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "documentActions.ts"
Cohesion: 0.11
Nodes (39): isTimetableText(), loadDocument(), loadRailwayOrTimetable(), loadTimetableDocument(), saveDocument(), decodeDocument(), DocumentFileFormat, downloadDocument() (+31 more)

### Community 20 - "validate.ts"
Cohesion: 0.23
Nodes (22): ServiceDetail(), summariseService(), trackAtCell(), formatSimTime(), actionTime(), createsTrain(), isStartAction(), checkOrder() (+14 more)

### Community 21 - "Technology Evaluation"
Cohesion: 0.20
Nodes (10): 1. Rendering Engine — **PixiJS v8** ✅ Decided, 2. Meta-Framework — **TanStack Start** (already scaffolded), 3. State Management (UI) — **Zustand**, 4. Worker Communication — **Raw postMessage**, 5. Schema Validation — **Valibot**, 6. IndexedDB Wrapper — **Dexie.js**, 7. Table Component — **@tanstack/react-table**, 8. CSS & UI Components — **Tailwind v4 + shadcn/ui** (already configured) (+2 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "scripts"
Cohesion: 0.07
Nodes (28): fallow, devDependencies, @biomejs/biome, fallow, pngjs, railway, typescript, @biomejs/biome (+20 more)

### Community 24 - "Building For Production"
Cohesion: 0.12
Nodes (16): Adding A Route, Adding Links, API Routes, Building For Production, Data Fetching, Demo files, Getting Started, Learn More (+8 more)

### Community 25 - "concept:signal-graphics"
Cohesion: 0.13
Nodes (15): concept:railway-graphics, concept:signal-graphics, concept:track-graphics, file:packages/app/public/graphics/signalDown.svg, file:packages/app/public/graphics/signalLeft.svg, file:packages/app/public/graphics/signalLeftDown.svg, file:packages/app/public/graphics/signalLeftUp.svg, file:packages/app/public/graphics/signalRight.svg (+7 more)

### Community 26 - "routeTree.gen.ts"
Cohesion: 0.15
Nodes (16): getRouter(), Register, @tanstack/react-router, Route, Route, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath (+8 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution, noEmit (+9 more)

### Community 28 - "Map_ (railway map data structure)"
Cohesion: 0.10
Nodes (27): Map_ (railway map data structure), map-connectivity.test.ts — tests for checkAllTracksConnected, map-platform.test.ts — tests for addPlatform and addLevelCrossing, map-text-linking.test.ts — tests for linkLocalText, deleteTextFromAllElements, changeDeleteText, map.test.ts — comprehensive tests for Map_ class, map/map-connectivity.ts, map/map-platform.ts, map/map-text-linking.ts (+19 more)

### Community 29 - "railway/enums.ts"
Cohesion: 0.14
Nodes (14): BridgeUnderpassType (4 variants), BufferType (8 variants), CrossoverType (6 variants), CurvedType (12 variants), DirectedType (8 variants), ExitType (8 variants), FlyoverType (12 variants), LinkedType (8 variants) (+6 more)

### Community 30 - "effect-journal.ts"
Cohesion: 0.26
Nodes (9): beginRecording(), EffectEntry, endRecording(), isRecording(), redoEntries(), ReplayTarget, undoEntries(), withoutRecording() (+1 more)

### Community 31 - "Rail Ops Sim — Updated Plan (Railway Builder Focus)"
Cohesion: 0.09
Nodes (21): 1.1 What Exists, 1.2 Data Model: Grid-Based, Not Graph-Based, 1. Current State, 2. Scope: Railway Builder Only, 3. Editor Milestones, 4. Files to Create (Summary), 5. Dependencies to Add, 6. Rendering Detail: How Each Track Kind Draws (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.07
Nodes (37): ActiveElement, cellFromId(), COMMANDS, errors, InactiveElement, issues, linkOf(), LINKS (+29 more)

### Community 35 - "gridToWorld"
Cohesion: 0.12
Nodes (26): CELL_SIZE, gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+18 more)

### Community 36 - "map-text-linking.ts"
Cohesion: 0.39
Nodes (8): changeDeleteText(), collectNeighbourTexts(), deleteTextFromAllElements(), linkLocalText(), linkNewElementToText(), NEIGHBOR_OFFSETS, tryLinkNamedLocationNeighbor(), tryLinkTrackOrConcourseOrBridge()

### Community 37 - "map.ts"
Cohesion: 0.12
Nodes (31): checkAllTracksConnected(), clearPreferredDirectionsAlongPath(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+23 more)

### Community 38 - "shared/package.json"
Cohesion: 0.11
Nodes (17): devDependencies, typescript, vitest, @vitest/coverage-v8, typescript, vitest, @vitest/coverage-v8, main (+9 more)

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

### Community 44 - "sim-bridge.ts"
Cohesion: 0.09
Nodes (25): HostClock, startEngineHost(), fakeClock(), setUp(), emptyTimetable, lineMap(), scope, SimBridge (+17 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "useTimetableStore"
Cohesion: 0.14
Nodes (14): seed(), timetable(), Header(), ServiceList(), TimetableEditor(), codes(), store(), twoServices() (+6 more)

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

### Community 53 - "timetable.ts"
Cohesion: 0.13
Nodes (35): actionLocation(), cellKey(), ACTION_WORDS, actionsOf(), becomeService(), Command, departFromStop(), describeAction() (+27 more)

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
Cohesion: 0.18
Nodes (17): ModeTip(), ShortcutsDialog(), Tip(), useMounted(), useShortcutDisplay(), useShortcutKeys(), isPlatformDependent(), PLATFORM_MODIFIERS (+9 more)

### Community 58 - "operateLayers.ts"
Cohesion: 0.17
Nodes (10): createRouteLayer(), ROUTE_COLORS, RouteLayer, createSignalStateLayer(), LAMP_COLORS, SignalStateLayer, createTrainLayer(), Lamp (+2 more)

### Community 59 - "track/index.ts"
Cohesion: 0.15
Nodes (21): COLOR_LEGEND, Entry, DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH, DEFAULT_SECONDARY_SPEED, TRACK_COLOR_ALPHA, TRACK_COLOR_BOTH (+13 more)

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

### Community 68 - "connectivity.ts"
Cohesion: 0.32
Nodes (5): ConnectivityPill, describeConnectivity(), FaultCount, FAULTS, plural()

### Community 214 - "useEditorStore"
Cohesion: 0.11
Nodes (25): ModeSwitcher(), SaveLoadControls(), SimLayout(), StatusBar(), THEME_SWITCH, complete, TrackInfoTooltip(), completeRailway (+17 more)

### Community 215 - "timetable/__tests__/fixtures.ts"
Cohesion: 0.12
Nodes (25): CELL, completeRailwayFixture(), FONT, nameTrack(), nameTracks(), railwayFixture(), timetable(), TRAIN (+17 more)

### Community 216 - "serialization.ts"
Cohesion: 0.16
Nodes (19): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+11 more)

### Community 217 - "Text"
Cohesion: 0.11
Nodes (3): applyFigures(), recordField(), Text

### Community 218 - "NamedLocation in rail-op-sim — Implementation Plan (v2)"
Cohesion: 0.11
Nodes (17): 0. Phasing (per your framing), 1. Key finding: the adjacency spread is already implemented, 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX, 3. Phase 2: the "Name" tool, 3a. Store — new tool + pending target, 3b. Click dispatch, 3c. Dialog — set / change / delete, 3d. Toolbar button (+9 more)

### Community 219 - "TimetableEditor.tsx"
Cohesion: 0.11
Nodes (29): ActionForm(), ActionFormProps, ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, ActionSeed, createAction() (+21 more)

### Community 220 - "Toolbar.tsx"
Cohesion: 0.15
Nodes (11): MODES, ResizeObserverStub, HISTORY_ACTIONS, Toolbar(), TOOLS, Kbd(), KbdGroup(), Tooltip() (+3 more)

### Community 221 - "AddPalette.tsx"
Cohesion: 0.13
Nodes (20): AddPalette(), ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES (+12 more)

### Community 222 - "railway/index.ts"
Cohesion: 0.17
Nodes (21): getExitCells(), getLocationNames(), getStartableCells(), locationToCell(), SimTime, ActionBase, ActionOf, FINISH_KINDS (+13 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "createEngine"
Cohesion: 0.32
Nodes (17): createEngine(), fail(), nodeAt(), occKeyOf(), routeKeys(), trainKeys(), blockedReason(), cancelRoute() (+9 more)

### Community 225 - "engine.ts"
Cohesion: 0.10
Nodes (39): initial, NumberedLogLine, OperateState, SessionStatus, Rail, afterPause(), afterRun(), isSpeed() (+31 more)

### Community 226 - "editor-store.ts"
Cohesion: 0.18
Nodes (8): SAVE_FORMATS, SettingsMenu(), BASE, MapFileFormat, DirectionMode, EditorState, HoveredTrackInfo, NameableKind

### Community 227 - "authoring.ts"
Cohesion: 0.14
Nodes (29): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), cellText() (+21 more)

### Community 228 - "EditHistory.ts"
Cohesion: 0.16
Nodes (5): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, RefreshFlags

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "check-documents.ts"
Cohesion: 0.20
Nodes (14): c(), issueText(), loadRailway(), loadTimetable(), railwayProblems(), readDocument(), reportRailway(), reportTimetable() (+6 more)

### Community 231 - "The railway document"
Cohesion: 0.18
Nodes (10): Completeness, Coordinates, Link indices, Names, Other traversal rules, Platforms, Subtype → links, Switches (+2 more)

### Community 232 - "The timetable document"
Cohesion: 0.18
Nodes (10): Actions, Against the railway, Finish — one per service, last, Intermediate — any number, Links between services, Service, Start — one per service, first, The timetable document (+2 more)

### Community 233 - "Railway configuration"
Cohesion: 0.50
Nodes (3): Common commands, Notes, Railway configuration

### Community 234 - "Every issue the validator reports"
Cohesion: 0.22
Nodes (8): A service's identity, A service's shape, Against the railway, Every issue the validator reports, Links between services, The railway's own problems, Times, Whole timetable

### Community 236 - "Authoring railways and timetables"
Cohesion: 0.33
Nodes (5): Authoring railways and timetables, Notes, Reference, The rules that break documents, Workflow

### Community 237 - "PlacementController.ts"
Cohesion: 0.11
Nodes (8): ELEMENT_LABELS, PlacementControllerOptions, platformSubtypeToSide(), DirectionLayer, ElementLayer, TextLayer, TrackColorLayer, ElementKind

### Community 238 - "operateGeometry.ts"
Cohesion: 0.18
Nodes (20): TrainLayer, atDistance(), cumulative(), dist(), edgePoint(), isOrthogonal(), isQuarterTurn(), joinedPaths() (+12 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.16
Nodes (28): endsAtBuffers(), isFacingSignal(), leavesMap(), stepFrom(), pathsFrom(), sameSeg(), arrival(), beyondRoute() (+20 more)

### Community 243 - "useEditorHotkeys.ts"
Cohesion: 0.06
Nodes (56): ClockControls(), LEVEL_CLASS, NO_TRAINS, OperatePanel(), PerformanceLog(), ROUTE_KINDS, RouteControls(), showTrain() (+48 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.13
Nodes (26): addTrain(), CELL, engineFor(), frontCell(), line(), linkedLine(), nameCells(), passingLoop() (+18 more)

### Community 245 - "buildMap"
Cohesion: 0.18
Nodes (11): buildMap(), cellOf(), nameEverything(), pieceOf(), placeInactive(), trackDataFor(), where(), signalFacingExit() (+3 more)

### Community 246 - "trains.ts"
Cohesion: 0.20
Nodes (23): pathOf(), segLength(), followSeg(), liesAgainst(), nextSeg(), advanceFront(), Ahead, approaching() (+15 more)

### Community 247 - "map-serialization.ts"
Cohesion: 0.16
Nodes (17): sample, ParapetType, deserializeMap(), SERIALIZED_MAP_VERSION, SerializedMap, SerializedNamedElement, SerializedParapet, SerializedText (+9 more)

### Community 249 - "ElementLayer.ts"
Cohesion: 0.12
Nodes (9): canvasCache, svgToCanvas(), createElementLayer(), makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, createTextureCache() (+1 more)

### Community 251 - "log.ts"
Cohesion: 0.22
Nodes (7): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind, LogLevel

### Community 252 - "Track Speed & Length Editing — Requirements"
Cohesion: 0.20
Nodes (9): Context (grounded in current code), F1.1 Length → metres (combined imperial input), F1.2 Speed: mph → km/h, F1.3 Precision, F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested), F2 — Track colour legend, F3 — Track section editor, F4 — Standalone converter widgets (+1 more)

### Community 253 - "debugLogger.ts"
Cohesion: 0.18
Nodes (8): TextInputDialog(), allEnabled, enabled, Subsystem, normalizeCssColor(), rgbToHex(), createTextLayer(), removeAll()

### Community 254 - "shortcutGates.ts"
Cohesion: 0.48
Nodes (4): liveShortcuts(), ShortcutGateState, Tool, AppMode

### Community 255 - "createDirectionLayer"
Cohesion: 0.20
Nodes (6): EndpointOutlines, createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 264 - "operateLayers.test.ts"
Cohesion: 0.52
Nodes (6): drawn(), headcodes(), layer(), seg(), train(), view()

### Community 269 - "NamedElement"
Cohesion: 0.07
Nodes (7): Concourse, Element, NamedElement, Parapet, ConnectivityReport, TestElement, TestNamedElement

### Community 270 - "TrackLayer"
Cohesion: 0.20
Nodes (4): createTrackLayer(), entryKey(), makeTrackSprite(), TrackLayer

### Community 271 - "SectionEditPanel"
Cohesion: 0.67
Nodes (5): SectionEditPanel(), formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 273 - "timetable-store-map.test.ts"
Cohesion: 0.48
Nodes (6): buildRailway(), buildTwoServices(), codes(), name(), store(), createDefaultTrainSpec()

### Community 274 - "createLinkHighlightLayer"
Cohesion: 0.38
Nodes (5): createLinkHighlightLayer(), clearSectionHighlight(), clearSectionSprites(), highlightSection(), setSectionPreview()

### Community 276 - "useTheme"
Cohesion: 0.83
Nodes (3): applyTheme(), getInitial(), useTheme()

## Knowledge Gaps
- **537 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+532 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **124 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `Track`, `ViewportController`, `enums.ts`, `NamedElement`, `TrackLayer`, `timetable-store-map.test.ts`, `validate.ts`, `import-railos.ts`, `LinkHighlightLayer`, `gridToWorld`, `map-text-linking.ts`, `map.ts`, `sim-bridge.ts`, `useTimetableStore`, `track/index.ts`, `timetable/__tests__/fixtures.ts`, `Text`, `TimetableEditor.tsx`, `railway/index.ts`, `engine.ts`, `authoring.ts`, `check-documents.ts`, `PlacementController.ts`, `sim/__tests__/fixtures.ts`, `map-serialization.ts`, `ElementLayer.ts`, `debugLogger.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `import-railos.ts`, `LinkHighlightLayer`, `authoring.ts`, `gridToWorld`, `map.ts`, `Text`, `engine.ts`, `enums.ts`, `Map_`, `NamedElement`, `buildMap`, `map-serialization.ts`, `ElementLayer.ts`, `track/index.ts`, `railway/index.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TextInputDialog.tsx`, `LinkHighlightLayer`, `Text`, `ViewportController`, `.onPointerMove`, `PlacementController.ts`, `TimetableEditor.tsx`, `TrackLayer`, `useEditorHotkeys.ts`, `documentActions.ts`, `useEditorStore`, `map-serialization.ts`, `ElementLayer.ts`, `track/index.ts`, `Toolbar.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _537 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TextInputDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11184939091915837 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.07215686274509804 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._