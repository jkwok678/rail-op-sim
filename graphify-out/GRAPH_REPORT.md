# Graph Report - rail-op-sim  (2026-11-13)

## Corpus Check
- 233 files · ~301,906 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2484 nodes · 5957 edges · 279 communities (151 shown, 128 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 409 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c58c7774`
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
- AddPalette.tsx
- Map_
- textureCache.ts
- PlacementController
- ActionForm.tsx
- track-data.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- serialization.ts
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
- effect-journal.test.ts
- Rail Ops Sim — Updated Plan (Railway Builder Focus)
- compilerOptions
- import-railos.ts
- PlacementController.ts
- gestureOverlay.ts
- map.ts
- map-connectivity.ts
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- sim-bridge.ts
- app/tsconfig.json
- timetable-store.ts
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
- editor-store.ts
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
- parseSimTime
- TimetableEditor.tsx
- Text
- NamedLocation in rail-op-sim — Implementation Plan (v2)
- timetable/types.ts
- ResizeObserverStub
- graph.ts
- scripts
- EditHistory.ts
- engine.ts
- authoring.ts
- mode-store.ts
- compilerOptions
- Element
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- usePixiApp.ts
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- routes.ts
- src/index.ts
- sim/__tests__/fixtures.ts
- useEditorHotkeys.ts
- trains.ts
- locations.test.ts
- ElementLayer.ts
- @phosphor-icons/react
- log.ts
- Track Speed & Length Editing — Requirements
- check-documents.ts
- coordKey
- Cell
- createDirectionLayer
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
- buildMap
- Parapet
- formatSimTime
- Lines
- convert-railos.sh
- timetable-store-map.test.ts
- round1
- useTheme
- createTrackColorLayer

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
- `direct()` --calls--> `setPreferredDirectionsAlongPath()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `railwayProblems()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `reportRailway()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `reportRailway()` --calls--> `getLocationNames()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `at()` --calls--> `parseSimTime()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/time.ts

## Import Cycles
- None detected.

## Communities (279 total, 128 thin omitted)

### Community 0 - "TextInputDialog.tsx"
Cohesion: 0.13
Nodes (25): KIND_TITLES, NameElementDialogProps, COLOR_LEGEND, FONT_FAMILIES, TextInputDialogProps, Button(), buttonVariants, Dialog() (+17 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.05
Nodes (14): applyFigures(), recordField(), ConnectivityReport, DanglingLink, LinkedTrackPair, LinkedTrackReport, PathNode, PreferredDirectionRemovalResult (+6 more)

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
Cohesion: 0.07
Nodes (23): PanControls(), PanControlsProps, SimCanvas(), ZoomSlider(), ZoomSliderProps, PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportController (+15 more)

### Community 10 - "includes"
Cohesion: 0.06
Nodes (30): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+22 more)

### Community 11 - "AddPalette.tsx"
Cohesion: 0.15
Nodes (31): ALL_LABELS, ASPECT_OPTIONS, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE, SUBTYPE_VALUES (+23 more)

### Community 13 - "textureCache.ts"
Cohesion: 0.12
Nodes (18): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), recolorSvg(), SOURCE_FILLS (+10 more)

### Community 14 - "PlacementController"
Cohesion: 0.14
Nodes (3): PlacementController, debugLog(), isTrackKind()

### Community 15 - "ActionForm.tsx"
Cohesion: 0.28
Nodes (12): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+4 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (31): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+23 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "serialization.ts"
Cohesion: 0.07
Nodes (44): decodeDocument(), DocumentFileFormat, downloadDocument(), encodeDocument(), inferDocumentFormat(), LoadedDocument, pickAndReadDocument(), assertSerializedMap() (+36 more)

### Community 20 - "validate.ts"
Cohesion: 0.21
Nodes (22): seed(), ServiceDetail(), createsTrain(), isFinishAction(), isShuttleAction(), isStartAction(), checkOrder(), checkStartPosition() (+14 more)

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

### Community 30 - "effect-journal.test.ts"
Cohesion: 0.21
Nodes (13): beginRecording(), EffectEntry, endRecording(), isRecording(), redoEntries(), ReplayTarget, undoEntries(), withoutRecording() (+5 more)

### Community 31 - "Rail Ops Sim — Updated Plan (Railway Builder Focus)"
Cohesion: 0.09
Nodes (21): 1.1 What Exists, 1.2 Data Model: Grid-Based, Not Graph-Based, 1. Current State, 2. Scope: Railway Builder Only, 3. Editor Milestones, 4. Files to Create (Summary), 5. Dependencies to Add, 6. Rendering Detail: How Each Track Kind Draws (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.08
Nodes (32): ActiveElement, cellFromId(), COMMANDS, errors, InactiveElement, issues, LINKS, map (+24 more)

### Community 34 - "PlacementController.ts"
Cohesion: 0.09
Nodes (10): ELEMENT_LABELS, PlacementControllerOptions, platformSubtypeToSide(), worldToGrid(), Coord, DirectionLayer, ElementLayer, LinkHighlightLayer (+2 more)

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.09
Nodes (31): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), EndpointOutlines, GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+23 more)

### Community 36 - "map.ts"
Cohesion: 0.09
Nodes (32): record(), Concourse, NamedElement, NamedLocation, ParapetType, Platform, addLevelCrossing(), addPlatform() (+24 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.15
Nodes (27): checkAllTracksConnected(), clearPreferredDirectionsAlongPath(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+19 more)

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
Nodes (26): HostClock, startEngineHost(), fakeClock(), setUp(), emptyTimetable, lineMap(), scope, SimBridge (+18 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "timetable-store.ts"
Cohesion: 0.21
Nodes (15): ActionFormProps, codes(), store(), twoServices(), fillCell(), nextServiceRef(), PendingCellPick, TimetableState (+7 more)

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
Nodes (36): ACTION_WORDS, actionsOf(), becomeService(), Command, departFromStop(), dispatch(), dispatchDue(), expandRuns() (+28 more)

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
Cohesion: 0.09
Nodes (28): MODES, ModeTip(), SAVE_FORMATS, SettingsMenu(), HISTORY_ACTIONS, Tip(), Toolbar(), TOOLS (+20 more)

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 59 - "railway/index.ts"
Cohesion: 0.12
Nodes (38): CATEGORIES, buildHoveredTrackInfo(), SerializedTrack, ALL_KINDS, SignalAspectValue, DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH (+30 more)

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

### Community 68 - "editor-store.ts"
Cohesion: 0.10
Nodes (20): runEscape(), ConnectivityPill, describeConnectivity(), FaultCount, FAULTS, plural(), EscapeAction, EscapeContext (+12 more)

### Community 214 - "useEditorStore"
Cohesion: 0.12
Nodes (16): AddPalette(), getElementAt(), NameElementDialog(), SectionEditPanel(), ShortcutsDialog(), SimLayout(), StatusBar(), BASE (+8 more)

### Community 215 - "parseSimTime"
Cohesion: 0.14
Nodes (19): timetable(), twoServices(), SERIALIZED_TIMETABLE_VERSION, CELL, completeRailwayFixture(), railwayFixture(), timetable(), TRAIN (+11 more)

### Community 216 - "TimetableEditor.tsx"
Cohesion: 0.10
Nodes (25): ACTION_KIND_GROUPS, actionKindLabel(), ActionKindOption, ActionSeed, createAction(), describeAction(), DESCRIBERS, SEEDS (+17 more)

### Community 218 - "NamedLocation in rail-op-sim — Implementation Plan (v2)"
Cohesion: 0.11
Nodes (17): 0. Phasing (per your framing), 1. Key finding: the adjacency spread is already implemented, 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX, 3. Phase 2: the "Name" tool, 3a. Store — new tool + pending target, 3b. Click dispatch, 3c. Dialog — set / change / delete, 3d. Toolbar button (+9 more)

### Community 219 - "timetable/types.ts"
Cohesion: 0.10
Nodes (19): ActionForm(), ACTION_KIND_OPTIONS, ALL_KINDS, t, ALL_KINDS, t, ActionBase, actionLocation() (+11 more)

### Community 222 - "graph.ts"
Cohesion: 0.23
Nodes (17): Rail, buildGraph(), cellKey(), endsAtBuffers(), GraphNode, isFacingSignal(), leavesMap(), resolveStep() (+9 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "EditHistory.ts"
Cohesion: 0.16
Nodes (5): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, RefreshFlags

### Community 225 - "engine.ts"
Cohesion: 0.14
Nodes (29): afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS, emptyCounters(), Engine, EngineOptions (+21 more)

### Community 227 - "authoring.ts"
Cohesion: 0.14
Nodes (30): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), cellText() (+22 more)

### Community 228 - "mode-store.ts"
Cohesion: 0.15
Nodes (23): ModeSwitcher(), SaveLoadControls(), complete, loadDocument(), loadTimetableDocument(), saveDocument(), loadMap(), saveMap() (+15 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

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

### Community 237 - "usePixiApp.ts"
Cohesion: 0.09
Nodes (18): DEFAULT_OPTIONS, themeKey(), usePixiApp(), allEnabled, enabled, Subsystem, buildThemeColorMap(), escapeRegExp() (+10 more)

### Community 238 - "operateGeometry.ts"
Cohesion: 0.10
Nodes (29): CELL_SIZE, createRouteLayer(), ROUTE_COLORS, RouteLayer, createSignalStateLayer(), LAMP_COLORS, SignalStateLayer, createTrainLayer() (+21 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.17
Nodes (33): createEngine(), fail(), nodeAt(), occKeyOf(), pathsFrom(), routeKeys(), sameSeg(), trainKeys() (+25 more)

### Community 243 - "src/index.ts"
Cohesion: 0.10
Nodes (35): ClockControls(), LEVEL_CLASS, NO_TRAINS, OperatePanel(), PerformanceLog(), ROUTE_KINDS, RouteControls(), showTrain() (+27 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.14
Nodes (25): setPreferredDirectionsAlongPath(), addTrain(), CELL, engineFor(), frontCell(), line(), linkedLine(), nameCells() (+17 more)

### Community 245 - "useEditorHotkeys.ts"
Cohesion: 0.15
Nodes (16): completeRailway, Harness(), problems, reset(), jumpToNextIssue(), moveSelectedAction(), run, stepSelectedService() (+8 more)

### Community 246 - "trains.ts"
Cohesion: 0.20
Nodes (23): pathOf(), segLength(), followSeg(), liesAgainst(), nextSeg(), advanceFront(), Ahead, approaching() (+15 more)

### Community 247 - "locations.test.ts"
Cohesion: 0.50
Nodes (6): getExitCells(), getLocationNames(), getStartableCells(), locationToCell(), nameTrack(), nameTracks()

### Community 249 - "ElementLayer.ts"
Cohesion: 0.14
Nodes (7): ColorMap, createElementLayer(), makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

### Community 251 - "log.ts"
Cohesion: 0.23
Nodes (6): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind

### Community 252 - "Track Speed & Length Editing — Requirements"
Cohesion: 0.20
Nodes (9): Context (grounded in current code), F1.1 Length → metres (combined imperial input), F1.2 Speed: mph → km/h, F1.3 Precision, F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested), F2 — Track colour legend, F3 — Track section editor, F4 — Standalone converter widgets (+1 more)

### Community 253 - "check-documents.ts"
Cohesion: 0.20
Nodes (14): c(), issueText(), loadRailway(), loadTimetable(), railwayProblems(), readDocument(), reportRailway(), reportTimetable() (+6 more)

### Community 255 - "Cell"
Cohesion: 0.24
Nodes (11): OperateClick, OperateInputState, OperateIntent, resolveOperateClick(), sameCell(), at, idle, start (+3 more)

### Community 256 - "createDirectionLayer"
Cohesion: 0.43
Nodes (5): createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 264 - "operateLayers.test.ts"
Cohesion: 0.52
Nodes (6): drawn(), headcodes(), layer(), seg(), train(), view()

### Community 268 - "buildMap"
Cohesion: 0.27
Nodes (12): buildMap(), cellOf(), linkOf(), linksOf(), nameEverything(), pairKey(), pieceOf(), placeInactive() (+4 more)

### Community 270 - "formatSimTime"
Cohesion: 0.42
Nodes (6): dayOffset(), formatDuration(), formatSimTime(), formatWallClock(), InvalidTimeError, SECONDS_PER_DAY

### Community 273 - "timetable-store-map.test.ts"
Cohesion: 0.48
Nodes (6): buildRailway(), buildTwoServices(), codes(), name(), store(), createDefaultTrainSpec()

### Community 275 - "round1"
Cohesion: 0.80
Nodes (4): formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 276 - "useTheme"
Cohesion: 0.83
Nodes (3): applyTheme(), getInitial(), useTheme()

## Knowledge Gaps
- **539 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+534 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **128 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `Track`, `AddPalette.tsx`, `Parapet`, `timetable-store-map.test.ts`, `.deleteElement`, `serialization.ts`, `validate.ts`, `.toSaveString`, `effect-journal.test.ts`, `import-railos.ts`, `PlacementController.ts`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `sim-bridge.ts`, `timetable-store.ts`, `railway/index.ts`, `parseSimTime`, `Text`, `.addNamedLocation`, `graph.ts`, `engine.ts`, `authoring.ts`, `Element`, `usePixiApp.ts`, `sim/__tests__/fixtures.ts`, `locations.test.ts`, `ElementLayer.ts`, `check-documents.ts`, `coordKey`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `import-railos.ts`, `PlacementController.ts`, `authoring.ts`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `AddPalette.tsx`, `Map_`, `buildMap`, `locations.test.ts`, `ElementLayer.ts`, `railway/index.ts`, `.addNamedLocation`, `graph.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TextInputDialog.tsx`, `PlacementController.ts`, `.onPointerMove`, `Text`, `ElementLayer.ts`, `mode-store.ts`, `ViewportController`, `sim-bridge.ts`, `usePixiApp.ts`, `src/index.ts`, `useEditorHotkeys.ts`, `useEditorStore`, `TimetableEditor.tsx`, `shortcuts.ts`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _539 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TextInputDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12550607287449392 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.0525879917184265 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._