# Graph Report - rail-op-sim  (2026-11-20)

## Corpus Check
- 286 files · ~362,959 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2910 nodes · 7468 edges · 279 communities (158 shown, 121 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 427 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `daac48d5`
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
- textureCache.ts
- railway/index.ts
- ActionForm.tsx
- callingOn.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- mapFile.ts
- validate.ts
- Technology Evaluation
- components.json
- scripts
- Rail Op Sim
- concept:signal-graphics
- validate.test.ts
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- track-data.ts
- Rail Ops Sim — Updated Plan (Railway Builder Focus)
- compilerOptions
- import-railos.ts
- routes.ts
- gestureOverlay.ts
- map.ts
- map-connectivity.ts
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- control.ts
- app/tsconfig.json
- ElementLayer.ts
- railway/errors.ts
- Link state SVGs (set/unset variants)
- React-UI Rendering Separation
- SWITCH_LINKS
- railway/types.ts
- png-to-svg.mjs
- sim/timetable.ts
- tooltip.tsx
- ui/input.tsx
- manifest.json
- shortcuts.ts
- serialization.ts
- railosImport.ts
- TrainView
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
- OperatePanel.tsx
- useEditorStore
- operateActions.ts
- effect-journal.test.ts
- NamedLocation in rail-op-sim — Implementation Plan (v2)
- StatusBar.tsx
- mode-store.ts
- timetableActions.ts
- timetable/__tests__/fixtures.ts
- scripts
- timetable/types.ts
- engine.ts
- createEmptyTimetable
- authoring.ts
- documentActions.ts
- compilerOptions
- Text
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- PlacementController
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- log.ts
- map-serialization.ts
- sim/__tests__/fixtures.ts
- time.ts
- trains.ts
- nitro
- railos/railway.ts
- Cell
- tailwind-merge
- Track Speed & Length Editing — Requirements
- routeTree.gen.ts
- errors.ts
- performanceSummary.ts
- radix-ui
- sim-bridge.ts
- react
- editor-store.ts
- @tanstack/react-router-ssr-query
- @rolldown/plugin-babel
- @tanstack/react-devtools
- shadcn
- @tanstack/react-router-devtools
- tw-animate-css
- @tanstack/react-start
- yaml
- sessionActions.ts
- usePixiApp.ts
- convert-railos.sh
- operate-store.ts
- SimCanvas.tsx
- TrainContextMenu.tsx
- NamedElement
- GroundLayer.ts
- src/index.ts
- PlacementController.ts

## God Nodes (most connected - your core abstractions)
1. `Map_` - 155 edges
2. `Track` - 99 edges
3. `PlacementController` - 77 edges
4. `useEditorStore` - 64 edges
5. `debugLog()` - 57 edges
6. `Text` - 51 edges
7. `parseSimTime()` - 41 edges
8. `useModeStore` - 39 edges
9. `createEngine()` - 37 edges
10. `useTimetableStore` - 36 edges

## Surprising Connections (you probably didn't know these)
- `place()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `pairPortals()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `platform()` --calls--> `trackAtCell()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `name()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `namedLocation()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts

## Import Cycles
- None detected.

## Communities (279 total, 121 thin omitted)

### Community 0 - "TimetableEditor.tsx"
Cohesion: 0.09
Nodes (36): CanvasCrash(), getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, ACTIONS, NewDocumentControl(), FONT_FAMILIES (+28 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.07
Nodes (7): DanglingLink, PathNode, PreferredDirectionRemovalResult, PreferredDirectionResult, getTrackColorState(), Track, pathsOf()

### Community 3 - "devDependencies"
Cohesion: 0.06
Nodes (35): babel-plugin-react-compiler, fake-indexeddb, jsdom, devDependencies, babel-plugin-react-compiler, @biomejs/biome, fake-indexeddb, jsdom (+27 more)

### Community 5 - "dependencies"
Cohesion: 0.06
Nodes (31): class-variance-authority, clsx, dexie, @fontsource-variable/jetbrains-mono, dependencies, class-variance-authority, clsx, dexie (+23 more)

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
Nodes (22): PanControls(), PanControlsProps, ZoomSlider(), ZoomSliderProps, PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportController, ViewportControllerOptions (+14 more)

### Community 10 - "includes"
Cohesion: 0.06
Nodes (30): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+22 more)

### Community 11 - "AddPalette.tsx"
Cohesion: 0.12
Nodes (36): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE (+28 more)

### Community 12 - "Map_"
Cohesion: 0.05
Nodes (6): record(), NamedLocation, coordKey(), Map_, MessageCallback, TextSelectionPrompt

### Community 13 - "textureCache.ts"
Cohesion: 0.15
Nodes (15): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), recolorSvg(), loadRawSvg() (+7 more)

### Community 14 - "railway/index.ts"
Cohesion: 0.10
Nodes (44): COLOR_LEGEND, SectionEditPanel(), makeTrack(), buildHoveredTrackInfo(), ALL_KINDS, SignalAspect, SignalAspectValue, DEFAULT_MAIN_LENGTH (+36 more)

### Community 15 - "ActionForm.tsx"
Cohesion: 0.22
Nodes (18): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+10 more)

### Community 16 - "callingOn.ts"
Cohesion: 0.19
Nodes (19): ALLOWED_FACING_ACTIONS, CALL_ON_MAX_SPEED_MS, callingOnCheck(), canAcceptBlockingTrain(), isEligibleForCallingOn(), isFacingOtherTrain(), isStepBlocked(), isTargetPlatformCell() (+11 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "mapFile.ts"
Cohesion: 0.14
Nodes (19): DocumentFileFormat, downloadDocument(), encodeDocument(), inferDocumentFormat(), LoadedDocument, PickedDocument, downloadMap(), encodeMap() (+11 more)

### Community 20 - "validate.ts"
Cohesion: 0.13
Nodes (40): createAction(), AddActionButton(), ServiceDetail(), ServiceList(), summariseService(), formatSimTime(), actionTime(), createsTrain() (+32 more)

### Community 21 - "Technology Evaluation"
Cohesion: 0.20
Nodes (10): 1. Rendering Engine — **PixiJS v8** ✅ Decided, 2. Meta-Framework — **TanStack Start** (already scaffolded), 3. State Management (UI) — **Zustand**, 4. Worker Communication — **Raw postMessage**, 5. Schema Validation — **Valibot**, 6. IndexedDB Wrapper — **Dexie.js**, 7. Table Component — **@tanstack/react-table**, 8. CSS & UI Components — **Tailwind v4 + shadcn/ui** (already configured) (+2 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "scripts"
Cohesion: 0.08
Nodes (24): fallow, devDependencies, @biomejs/biome, fallow, pngjs, railway, typescript, @biomejs/biome (+16 more)

### Community 24 - "Rail Op Sim"
Cohesion: 0.20
Nodes (9): Attribution, Available Scripts, Getting Started, Installation & Development, License, Prerequisites, Project Structure, Rail Op Sim (+1 more)

### Community 25 - "concept:signal-graphics"
Cohesion: 0.13
Nodes (15): concept:railway-graphics, concept:signal-graphics, concept:track-graphics, file:packages/app/public/graphics/signalDown.svg, file:packages/app/public/graphics/signalLeft.svg, file:packages/app/public/graphics/signalLeftDown.svg, file:packages/app/public/graphics/signalLeftUp.svg, file:packages/app/public/graphics/signalRight.svg (+7 more)

### Community 26 - "validate.test.ts"
Cohesion: 0.29
Nodes (9): timetable(), twoServiceTimetable(), oneService(), codes(), finishRemainHere, linkedShuttle(), oneService(), startNew (+1 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution, noEmit (+9 more)

### Community 28 - "Map_ (railway map data structure)"
Cohesion: 0.10
Nodes (27): Map_ (railway map data structure), map-connectivity.test.ts — tests for checkAllTracksConnected, map-platform.test.ts — tests for addPlatform and addLevelCrossing, map-text-linking.test.ts — tests for linkLocalText, deleteTextFromAllElements, changeDeleteText, map.test.ts — comprehensive tests for Map_ class, map/map-connectivity.ts, map/map-platform.ts, map/map-text-linking.ts (+19 more)

### Community 29 - "railway/enums.ts"
Cohesion: 0.14
Nodes (14): BridgeUnderpassType (4 variants), BufferType (8 variants), CrossoverType (6 variants), CurvedType (12 variants), DirectedType (8 variants), ExitType (8 variants), FlyoverType (12 variants), LinkedType (8 variants) (+6 more)

### Community 30 - "track-data.ts"
Cohesion: 0.06
Nodes (31): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+23 more)

### Community 31 - "Rail Ops Sim — Updated Plan (Railway Builder Focus)"
Cohesion: 0.09
Nodes (21): 1.1 What Exists, 1.2 Data Model: Grid-Based, Not Graph-Based, 1. Current State, 2. Scope: Railway Builder Only, 3. Editor Milestones, 4. Files to Create (Summary), 5. Dependencies to Add, 6. Rendering Detail: How Each Track Kind Draws (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.22
Nodes (8): errors, issues, problems, railway, [rlyPath, ttbPath, railwayOut, timetableOut], { timetable, warnings: timetableWarnings }, title, yamlOptions

### Community 34 - "routes.ts"
Cohesion: 0.14
Nodes (40): callOn(), changeTime(), crossingAt(), crossingChanging(), finishChanges(), lowerCrossingsOn(), workCrossings(), createEngine() (+32 more)

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.08
Nodes (36): CELL_SIZE, gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), EndpointOutlines, GESTURE_END_COLOR (+28 more)

### Community 36 - "map.ts"
Cohesion: 0.18
Nodes (17): Platform, LinkedTrackPair, LinkedTrackReport, addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), changeDeleteText() (+9 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.13
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

### Community 44 - "control.ts"
Cohesion: 0.21
Nodes (31): clearCallingOnSignal(), availableFollowOnService(), becomeNewService(), canRestoreTimetable(), changeDirection(), fail(), findTrain(), FollowOnCandidate (+23 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "ElementLayer.ts"
Cohesion: 0.10
Nodes (8): ColorMap, createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

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

### Community 53 - "sim/timetable.ts"
Cohesion: 0.08
Nodes (63): actionLocation(), ACTION_WORDS, actionDue(), actionsOf(), awaitJoin(), becomeService(), Command, countWalkReach() (+55 more)

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
Cohesion: 0.10
Nodes (26): MODES, ModeTip(), ShortcutsDialog(), ResizeObserverStub, HISTORY_ACTIONS, Tip(), Toolbar(), TOOLS (+18 more)

### Community 58 - "serialization.ts"
Cohesion: 0.18
Nodes (18): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+10 more)

### Community 59 - "railosImport.ts"
Cohesion: 0.14
Nodes (20): ConvertedSummary(), FORMATS, RailosImportControl(), State, converted, baseName(), convertRailosFiles(), decodeLatin1() (+12 more)

### Community 60 - "TrainView"
Cohesion: 0.21
Nodes (11): ClockControls(), TrainList(), OperateClock(), needsAttention(), runLabel(), speedLabel(), trainStatusLabel(), WAITING (+3 more)

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
Cohesion: 0.18
Nodes (15): appendRun(), collectRowRuns(), encode(), LEVEL_CROSSINGS, mapping, mergeColourRuns(), mergeGroupRuns(), missing (+7 more)

### Community 214 - "OperatePanel.tsx"
Cohesion: 0.24
Nodes (11): LEVEL_CLASS, NO_TRAINS, ROUTE_KINDS, RouteControls(), routeControlsHint(), SEVERITY_CLASS, showTrain(), useErrored() (+3 more)

### Community 215 - "useEditorStore"
Cohesion: 0.09
Nodes (19): PanelCrash(), AddPalette(), PaletteCrash(), ToolbarCrash(), SimCanvas(), SimLayout(), StatusBar(), BASE (+11 more)

### Community 216 - "operateActions.ts"
Cohesion: 0.16
Nodes (16): BecomeNewServiceDialog(), RemoveTrainDialog(), SetReminderDialog(), SkipActionsDialog(), applyOperateIntent(), changeSpeed(), runOrPause(), toggleCallOn() (+8 more)

### Community 217 - "effect-journal.test.ts"
Cohesion: 0.11
Nodes (16): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, beginRecording(), EffectEntry, endRecording(), isRecording() (+8 more)

### Community 218 - "NamedLocation in rail-op-sim — Implementation Plan (v2)"
Cohesion: 0.11
Nodes (17): 0. Phasing (per your framing), 1. Key finding: the adjacency spread is already implemented, 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX, 3. Phase 2: the "Name" tool, 3a. Store — new tool + pending target, 3b. Click dispatch, 3c. Dialog — set / change / delete, 3d. Toolbar button (+9 more)

### Community 219 - "StatusBar.tsx"
Cohesion: 0.11
Nodes (17): ActionButtonProps, actionLabels(), SaveLoadControls(), SAVE_FORMATS, SettingsMenu(), THEME_SWITCH, applyTheme(), getInitial() (+9 more)

### Community 220 - "mode-store.ts"
Cohesion: 0.10
Nodes (24): MODE_LABEL, ModeGateNotice(), ModeSwitcher(), complete, complete, ResizeObserverStub, Header(), completeRailway (+16 more)

### Community 221 - "timetableActions.ts"
Cohesion: 0.18
Nodes (15): loadTimetableDocument(), pickAndReadDocument(), pick, sample, applyLoadedTimetable(), describeLoadedIssues(), loadTimetable(), downloadTimetable() (+7 more)

### Community 222 - "timetable/__tests__/fixtures.ts"
Cohesion: 0.22
Nodes (11): getExitCells(), getStartableCells(), locationToCell(), CELL, completeRailwayFixture(), FONT, nameTrack(), nameTracks() (+3 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "timetable/types.ts"
Cohesion: 0.08
Nodes (40): ActionForm(), ActionFormProps, ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, ActionSeed, describeAction() (+32 more)

### Community 225 - "engine.ts"
Cohesion: 0.09
Nodes (43): CallingOnMatch, afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS, stepSpeed(), initialCrossings() (+35 more)

### Community 226 - "createEmptyTimetable"
Cohesion: 0.19
Nodes (10): seed(), timetable(), editTimetable(), clearTimetable(), newRailway(), record(), busyTimetable(), loadFromData (+2 more)

### Community 227 - "authoring.ts"
Cohesion: 0.10
Nodes (42): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), c() (+34 more)

### Community 228 - "documentActions.ts"
Cohesion: 0.28
Nodes (13): applyRailwayPick(), isTimetableText(), loadRailwayOrTimetable(), RailwayOrTimetable, saveDocument(), decodeDocument(), pickAndReadDocuments(), applyLoadedMap() (+5 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "Text"
Cohesion: 0.08
Nodes (5): recordField(), Element, Text, applyFigures(), TestElement

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

### Community 237 - "PlacementController"
Cohesion: 0.10
Nodes (6): RefreshFlags, PlacementController, debugLog(), worldToGrid(), findTrainAt(), NameableKind

### Community 238 - "operateGeometry.ts"
Cohesion: 0.06
Nodes (59): addSignalVariants(), cellKey(), collectCrossingArtFiles(), collectPointArtFiles(), collectSignalArtFiles(), crossingArt(), crossingsChanging(), FILLET_BY_RAIL (+51 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "log.ts"
Cohesion: 0.23
Nodes (6): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind

### Community 243 - "map-serialization.ts"
Cohesion: 0.30
Nodes (9): mapFileName(), sample, deserializeMap(), SERIALIZED_MAP_VERSION, SerializedMap, SerializedNamedElement, SerializedParapet, SerializedText (+1 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.08
Nodes (44): buildRailway(), buildTwoServices(), codes(), name(), store(), codes(), store(), twoServices() (+36 more)

### Community 245 - "time.ts"
Cohesion: 0.39
Nodes (6): dayOffset(), formatDuration(), formatWallClock(), InvalidTimeError, SECONDS_PER_DAY, tryParseSimTime()

### Community 246 - "trains.ts"
Cohesion: 0.10
Nodes (49): linkIndexForOffset(), stepDistanceAhead(), crossingOpen(), hitsRoadTraffic(), buildGraph(), cellKey(), groupCrossings(), isFacingSignal() (+41 more)

### Community 249 - "railos/railway.ts"
Cohesion: 0.05
Nodes (50): pairPortals(), platform(), COMPASS_OFFSETS, linkOf(), LINKS, linksOf(), pairKey(), Piece (+42 more)

### Community 250 - "Cell"
Cohesion: 0.24
Nodes (11): OperateClick, OperateInputState, OperateIntent, resolveOperateClick(), sameCell(), at, idle, start (+3 more)

### Community 252 - "Track Speed & Length Editing — Requirements"
Cohesion: 0.20
Nodes (9): Context (grounded in current code), F1.1 Length → metres (combined imperial input), F1.2 Speed: mph → km/h, F1.3 Precision, F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested), F2 — Track colour legend, F3 — Track section editor, F4 — Standalone converter widgets (+1 more)

### Community 253 - "routeTree.gen.ts"
Cohesion: 0.13
Nodes (19): RouteError(), RouteNotFound(), RoutePending(), getRouter(), Register, @tanstack/react-router, Route, Route (+11 more)

### Community 254 - "errors.ts"
Cohesion: 0.26
Nodes (6): ElementAlreadyExistsError, ElementNotFoundError, LinkedTrackError, RailwayError, TrackNotConnectedError, ZeroTrackError

### Community 255 - "performanceSummary.ts"
Cohesion: 0.29
Nodes (9): PerformanceSummary(), EventSummaryRow, formatMinutes(), formatPunctuality(), HeadlinePart, IncidentRow, IncidentSeverity, PerformanceSummary (+1 more)

### Community 258 - "sim-bridge.ts"
Cohesion: 0.07
Nodes (33): useOperateSession(), HostClock, startEngineHost(), setUp(), trip, fakeClock(), setUp(), emptyTimetable (+25 more)

### Community 260 - "editor-store.ts"
Cohesion: 0.10
Nodes (27): applyEscape, jumpToNextIssue(), moveSelectedAction(), run, runEscape(), stepSelectedService(), useTimetableGateState(), EscapeAction (+19 more)

### Community 269 - "sessionActions.ts"
Cohesion: 0.15
Nodes (26): Harness(), restore, save, AUTOSAVE_DEBOUNCE_MS, sameSnapshot(), snapshot(), useAutoSave(), AUTOSAVE_SESSION_ID (+18 more)

### Community 270 - "usePixiApp.ts"
Cohesion: 0.11
Nodes (18): GuardableTicker, guardTicker(), DEFAULT_OPTIONS, CanvasStatus, themeKey(), usePixiApp(), allEnabled, enabled (+10 more)

### Community 273 - "operate-store.ts"
Cohesion: 0.14
Nodes (14): OperatePanel(), PerformanceLog(), SessionError(), sent, view(), sent, TrainDialogs(), initial (+6 more)

### Community 274 - "SimCanvas.tsx"
Cohesion: 0.18
Nodes (5): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, CanvasState(), CanvasStateProps

### Community 275 - "TrainContextMenu.tsx"
Cohesion: 0.17
Nodes (15): byId(), isEnabled(), sent, BLOCKED_WAITS, clampMenuPosition(), controlMenuItems(), DIRECT_COMMANDS, dispatchTrainMenuItem() (+7 more)

### Community 277 - "NamedElement"
Cohesion: 0.12
Nodes (5): Concourse, NamedElement, Parapet, ConnectivityReport, TestNamedElement

### Community 278 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 287 - "src/index.ts"
Cohesion: 0.11
Nodes (7): createTrackColorLayer(), createTrackLayer(), Entry, entryKey(), makeTrackSprite(), TrackLayer, mapWithCustomTrack()

### Community 289 - "PlacementController.ts"
Cohesion: 0.09
Nodes (9): ELEMENT_LABELS, PlacementControllerOptions, platformSubtypeToSide(), Coord, DirectionLayer, LinkHighlightLayer, TextLayer, TrackColorLayer (+1 more)

## Knowledge Gaps
- **594 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+589 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **121 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `sim-bridge.ts`, `Track`, `AddPalette.tsx`, `sessionActions.ts`, `usePixiApp.ts`, `railway/index.ts`, `validate.ts`, `NamedElement`, `src/index.ts`, `PlacementController.ts`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `ElementLayer.ts`, `railosImport.ts`, `effect-journal.test.ts`, `timetable/__tests__/fixtures.ts`, `timetable/types.ts`, `engine.ts`, `createEmptyTimetable`, `authoring.ts`, `documentActions.ts`, `Text`, `map-serialization.ts`, `sim/__tests__/fixtures.ts`, `trains.ts`, `railos/railway.ts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TimetableEditor.tsx`, `PlacementController.ts`, `sim-bridge.ts`, `createEmptyTimetable`, `editor-store.ts`, `documentActions.ts`, `Text`, `ViewportController`, `sessionActions.ts`, `railway/index.ts`, `ElementLayer.ts`, `usePixiApp.ts`, `OperatePanel.tsx`, `shortcuts.ts`, `railosImport.ts`, `timetableActions.ts`, `src/index.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `ViewportController` connect `ViewportController` to `PlacementController.ts`, `PlacementController`, `usePixiApp.ts`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _594 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimetableEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09398496240601503 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.06901960784313725 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._