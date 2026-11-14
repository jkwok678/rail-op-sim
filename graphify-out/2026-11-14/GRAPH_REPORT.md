# Graph Report - rail-op-sim  (2026-11-14)

## Corpus Check
- 238 files · ~319,807 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2523 nodes · 6083 edges · 273 communities (149 shown, 124 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 409 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6cd0266d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TimetableEditor.tsx
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
- sim-bridge.ts
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- formatSimTime
- Rail Ops Sim — Updated Plan (Railway Builder Focus)
- compilerOptions
- import-railos.ts
- PlacementController.ts
- gridToWorld
- map.ts
- map-connectivity.ts
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- operateActions.ts
- app/tsconfig.json
- useEditorHotkeys.ts
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
- graph.ts
- railway/index.ts
- errors.ts
- root tsconfig.json
- file:/Users/jonathankwok/projects/rail-op-sim/packages/app/src/routeTree.gen.ts
- package.json — root monorepo config
- parapet26.svg
- parapet7.svg
- CURVED_LINKS
- shared/tsconfig.json
- import-railos-graphics.mjs
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
- mode-store.ts
- SectionEditPanel
- serialization.ts
- SimView
- NamedLocation in rail-op-sim — Implementation Plan (v2)
- actionKinds.ts
- editor-store.ts
- recordField
- StatusBar.tsx
- scripts
- timetable/__tests__/fixtures.ts
- engine.ts
- ResizeObserverStub
- authoring.ts
- operate-store.ts
- compilerOptions
- timetableActions.ts
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- effect-journal.test.ts
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- routes.ts
- OperatePanel.tsx
- sim/__tests__/fixtures.ts
- trains.ts
- ElementLayer.ts
- @phosphor-icons/react
- log.ts
- Track Speed & Length Editing — Requirements
- routeTree.gen.ts
- trainInfo.ts
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
- GroundLayer.ts
- NamedElement
- TrackLayer.ts
- convert-railos.sh
- timetable-store.ts
- timetable-store-map.test.ts
- createTrackColorLayer
- revalidatePreferredDirections
- Text

## God Nodes (most connected - your core abstractions)
1. `Map_` - 147 edges
2. `Track` - 98 edges
3. `PlacementController` - 70 edges
4. `useEditorStore` - 51 edges
5. `Text` - 51 edges
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
- `at()` --calls--> `parseSimTime()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/time.ts
- `loadRailway()` --calls--> `deserializeMap()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-serialization.ts

## Import Cycles
- None detected.

## Communities (273 total, 124 thin omitted)

### Community 0 - "TimetableEditor.tsx"
Cohesion: 0.10
Nodes (34): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, SAVE_FORMATS, FONT_FAMILIES, TextInputDialogProps, NumberField() (+26 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.08
Nodes (4): getTrackColorState(), Track, locationOf(), pathsOf()

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
Nodes (30): ALL_LABELS, ASPECT_OPTIONS, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE, SUBTYPE_VALUES (+22 more)

### Community 12 - "Map_"
Cohesion: 0.06
Nodes (6): record(), NamedLocation, LinkedTrackPair, LinkedTrackReport, coordKey(), Map_

### Community 13 - "src/index.ts"
Cohesion: 0.09
Nodes (27): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), DEFAULT_OPTIONS, themeKey(), usePixiApp() (+19 more)

### Community 14 - "PlacementController"
Cohesion: 0.11
Nodes (6): RefreshFlags, PlacementController, debugLog(), NameableKind, clearPreferredDirectionsAlongPath(), findPathBetween()

### Community 15 - "ActionForm.tsx"
Cohesion: 0.23
Nodes (14): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+6 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (31): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+23 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "documentActions.ts"
Cohesion: 0.12
Nodes (33): SaveLoadControls(), isTimetableText(), loadDocument(), loadRailwayOrTimetable(), saveDocument(), decodeDocument(), DocumentFileFormat, downloadDocument() (+25 more)

### Community 20 - "validate.ts"
Cohesion: 0.13
Nodes (32): ServiceDetail(), isRailwayComplete(), SimTime, ActionBase, actionTime(), createsTrain(), FinishAction, IntermediateAction (+24 more)

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

### Community 26 - "sim-bridge.ts"
Cohesion: 0.07
Nodes (31): useOperateSession(), HostClock, startEngineHost(), fakeClock(), setUp(), emptyTimetable, lineMap(), scope (+23 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution, noEmit (+9 more)

### Community 28 - "Map_ (railway map data structure)"
Cohesion: 0.10
Nodes (27): Map_ (railway map data structure), map-connectivity.test.ts — tests for checkAllTracksConnected, map-platform.test.ts — tests for addPlatform and addLevelCrossing, map-text-linking.test.ts — tests for linkLocalText, deleteTextFromAllElements, changeDeleteText, map.test.ts — comprehensive tests for Map_ class, map/map-connectivity.ts, map/map-platform.ts, map/map-text-linking.ts (+19 more)

### Community 29 - "railway/enums.ts"
Cohesion: 0.14
Nodes (14): BridgeUnderpassType (4 variants), BufferType (8 variants), CrossoverType (6 variants), CurvedType (12 variants), DirectedType (8 variants), ExitType (8 variants), FlyoverType (12 variants), LinkedType (8 variants) (+6 more)

### Community 30 - "formatSimTime"
Cohesion: 0.22
Nodes (12): timed(), TimeField(), ServiceList(), summariseService(), dayOffset(), formatDuration(), formatSimTime(), formatWallClock() (+4 more)

### Community 31 - "Rail Ops Sim — Updated Plan (Railway Builder Focus)"
Cohesion: 0.09
Nodes (21): 1.1 What Exists, 1.2 Data Model: Grid-Based, Not Graph-Based, 1. Current State, 2. Scope: Railway Builder Only, 3. Editor Milestones, 4. Files to Create (Summary), 5. Dependencies to Add, 6. Rendering Detail: How Each Track Kind Draws (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.06
Nodes (45): ActiveElement, buildMap(), cellFromId(), cellOf(), COMMANDS, errors, InactiveElement, issues (+37 more)

### Community 34 - "PlacementController.ts"
Cohesion: 0.08
Nodes (13): ELEMENT_LABELS, PlacementControllerOptions, platformSubtypeToSide(), worldToGrid(), Coord, DirectionLayer, LinkHighlightLayer, createTextLayer() (+5 more)

### Community 35 - "gridToWorld"
Cohesion: 0.08
Nodes (36): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), EndpointOutlines, GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+28 more)

### Community 36 - "map.ts"
Cohesion: 0.10
Nodes (26): Parapet, ParapetType, addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), deserializeMap(), SERIALIZED_MAP_VERSION (+18 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.10
Nodes (29): checkAllTracksConnected(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), DanglingLink, elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+21 more)

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

### Community 44 - "operateActions.ts"
Cohesion: 0.27
Nodes (11): applyOperateIntent(), changeSpeed(), runOrPause(), setAllAutoRoutes(), toggleRouteCancel(), answer, at, sent (+3 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "useEditorHotkeys.ts"
Cohesion: 0.21
Nodes (13): jumpToNextIssue(), moveSelectedAction(), run, runEscape(), stepSelectedService(), resolveEscape(), toggleLog(), services (+5 more)

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
Nodes (37): actionLocation(), cellKey(), ACTION_WORDS, actionsOf(), becomeService(), Command, departFromStop(), describeAction() (+29 more)

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
Cohesion: 0.08
Nodes (29): MODES, ModeTip(), ShortcutsDialog(), ResizeObserverStub, HISTORY_ACTIONS, Tip(), Toolbar(), TOOLS (+21 more)

### Community 58 - "graph.ts"
Cohesion: 0.36
Nodes (10): endsAtBuffers(), isFacingSignal(), leavesMap(), RailGraph, arrival(), isJunction(), behind(), computeAspects() (+2 more)

### Community 59 - "railway/index.ts"
Cohesion: 0.10
Nodes (44): CATEGORIES, COLOR_LEGEND, makeTrack(), buildHoveredTrackInfo(), ALL_KINDS, SignalAspect, SignalAspectValue, DEFAULT_MAIN_LENGTH (+36 more)

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

### Community 68 - "import-railos-graphics.mjs"
Cohesion: 0.20
Nodes (6): LEVEL_CROSSINGS, mapping, missing, POINTS, ROOT, SIGNAL_DIRS

### Community 214 - "mode-store.ts"
Cohesion: 0.17
Nodes (18): ModeSwitcher(), SimLayout(), complete, completeRailway, Harness(), problems, reset(), useEditorHotkeys() (+10 more)

### Community 215 - "SectionEditPanel"
Cohesion: 0.67
Nodes (5): SectionEditPanel(), formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 216 - "serialization.ts"
Cohesion: 0.16
Nodes (20): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+12 more)

### Community 217 - "SimView"
Cohesion: 0.29
Nodes (4): RouteLayer, SignalStateLayer, TrainLayer, SimView

### Community 218 - "NamedLocation in rail-op-sim — Implementation Plan (v2)"
Cohesion: 0.11
Nodes (17): 0. Phasing (per your framing), 1. Key finding: the adjacency spread is already implemented, 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX, 3. Phase 2: the "Name" tool, 3a. Store — new tool + pending target, 3b. Click dispatch, 3c. Dialog — set / change / delete, 3d. Toolbar button (+9 more)

### Community 219 - "actionKinds.ts"
Cohesion: 0.13
Nodes (20): ActionForm(), ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, ActionSeed, createAction(), describeAction() (+12 more)

### Community 220 - "editor-store.ts"
Cohesion: 0.10
Nodes (21): AddPalette(), SettingsMenu(), BASE, BASE, TextInputDialog(), TimetableEditor(), TrackInfoTooltip(), TIMETABLE_ROW_CLASS (+13 more)

### Community 221 - "recordField"
Cohesion: 0.13
Nodes (4): applyFigures(), recordField(), Element, TestElement

### Community 222 - "StatusBar.tsx"
Cohesion: 0.17
Nodes (10): StatusBar(), THEME_SWITCH, applyTheme(), getInitial(), useTheme(), ConnectivityPill, describeConnectivity(), FaultCount (+2 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "timetable/__tests__/fixtures.ts"
Cohesion: 0.14
Nodes (20): twoServices(), CELL, completeRailwayFixture(), FONT, nameTrack(), nameTracks(), railwayFixture(), timetable() (+12 more)

### Community 225 - "engine.ts"
Cohesion: 0.12
Nodes (30): afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS, emptyCounters(), Engine, initialState() (+22 more)

### Community 227 - "authoring.ts"
Cohesion: 0.09
Nodes (48): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), c() (+40 more)

### Community 228 - "operate-store.ts"
Cohesion: 0.18
Nodes (14): OperateClick, OperateInputState, OperateIntent, resolveOperateClick(), sameCell(), at, idle, start (+6 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "timetableActions.ts"
Cohesion: 0.29
Nodes (9): loadTimetableDocument(), mockLoadTimetable, pick, applyLoadedTimetable(), describeLoadedIssues(), loadTimetable(), LoadedTimetableFile, pickAndReadTimetableFile() (+1 more)

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

### Community 237 - "effect-journal.test.ts"
Cohesion: 0.11
Nodes (16): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, beginRecording(), EffectEntry, endRecording(), isRecording() (+8 more)

### Community 238 - "operateGeometry.ts"
Cohesion: 0.13
Nodes (28): CELL_SIZE, createRouteLayer(), ROUTE_COLORS, createSignalStateLayer(), LAMP_COLORS, createTrainLayer(), atDistance(), cumulative() (+20 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.15
Nodes (37): createEngine(), fail(), nodeAt(), occKeyOf(), stepFrom(), followSeg(), pathsFrom(), routeKeys() (+29 more)

### Community 243 - "OperatePanel.tsx"
Cohesion: 0.22
Nodes (12): LEVEL_CLASS, NO_TRAINS, OperatePanel(), PerformanceLog(), ROUTE_KINDS, RouteControls(), showTrain(), TrainList() (+4 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.12
Nodes (29): setPreferredDirectionsAlongPath(), addTrain(), CELL, engineFor(), frontCell(), line(), linkedLine(), nameCells() (+21 more)

### Community 246 - "trains.ts"
Cohesion: 0.24
Nodes (20): linkIndexForOffset(), pathOf(), segLength(), liesAgainst(), nextSeg(), advanceFront(), approaching(), dropRear() (+12 more)

### Community 249 - "ElementLayer.ts"
Cohesion: 0.12
Nodes (7): createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

### Community 251 - "log.ts"
Cohesion: 0.21
Nodes (7): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind, RunnerContext

### Community 252 - "Track Speed & Length Editing — Requirements"
Cohesion: 0.20
Nodes (9): Context (grounded in current code), F1.1 Length → metres (combined imperial input), F1.2 Speed: mph → km/h, F1.3 Precision, F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested), F2 — Track colour legend, F3 — Track section editor, F4 — Standalone converter widgets (+1 more)

### Community 253 - "routeTree.gen.ts"
Cohesion: 0.15
Nodes (16): getRouter(), Register, @tanstack/react-router, Route, Route, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath (+8 more)

### Community 254 - "trainInfo.ts"
Cohesion: 0.21
Nodes (10): ClockControls(), OperateClock(), runLabel(), speedLabel(), trainStatusLabel(), WAITING, buildHoveredTrainInfo(), BuildHoveredTrainInfoOptions (+2 more)

### Community 264 - "operateLayers.test.ts"
Cohesion: 0.52
Nodes (6): drawn(), headcodes(), layer(), seg(), train(), view()

### Community 268 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 269 - "NamedElement"
Cohesion: 0.15
Nodes (4): Concourse, NamedElement, ConnectivityReport, TestNamedElement

### Community 270 - "TrackLayer.ts"
Cohesion: 0.14
Nodes (7): allEnabled, enabled, Subsystem, createTrackLayer(), Entry, entryKey(), TrackLayer

### Community 275 - "timetable-store.ts"
Cohesion: 0.13
Nodes (18): ActionFormProps, seed(), timetable(), codes(), store(), twoServices(), fillCell(), nextServiceRef() (+10 more)

### Community 276 - "timetable-store-map.test.ts"
Cohesion: 0.48
Nodes (6): buildRailway(), buildTwoServices(), codes(), name(), store(), createDefaultTrainSpec()

## Knowledge Gaps
- **545 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+540 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **124 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `Track`, `AddPalette.tsx`, `src/index.ts`, `TrackLayer.ts`, `NamedElement`, `timetable-store.ts`, `documentActions.ts`, `timetable-store-map.test.ts`, `validate.ts`, `revalidatePreferredDirections`, `Text`, `sim-bridge.ts`, `import-railos.ts`, `PlacementController.ts`, `gridToWorld`, `map.ts`, `map-connectivity.ts`, `graph.ts`, `railway/index.ts`, `recordField`, `timetable/__tests__/fixtures.ts`, `engine.ts`, `authoring.ts`, `effect-journal.test.ts`, `sim/__tests__/fixtures.ts`, `ElementLayer.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TimetableEditor.tsx`, `PlacementController.ts`, `map.ts`, `ElementLayer.ts`, `timetableActions.ts`, `ViewportController`, `src/index.ts`, `TrackLayer.ts`, `useEditorHotkeys.ts`, `OperatePanel.tsx`, `documentActions.ts`, `Text`, `shortcuts.ts`, `sim-bridge.ts`, `railway/index.ts`, `trainInfo.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `import-railos.ts`, `PlacementController.ts`, `authoring.ts`, `gridToWorld`, `map.ts`, `map-connectivity.ts`, `AddPalette.tsx`, `Map_`, `NamedElement`, `PlacementController`, `revalidatePreferredDirections`, `ElementLayer.ts`, `graph.ts`, `railway/index.ts`, `recordField`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _545 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimetableEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10014513788098693 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.08115942028985507 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._