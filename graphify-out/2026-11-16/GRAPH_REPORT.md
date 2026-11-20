# Graph Report - rail-op-sim  (2026-11-16)

## Corpus Check
- 267 files · ~353,479 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2741 nodes · 6906 edges · 282 communities (153 shown, 129 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 419 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c19ccd07`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
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
- timetable-store.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- documentActions.ts
- validate.ts
- Technology Evaluation
- components.json
- scripts
- Rail Op Sim
- concept:signal-graphics
- TimetableEditor.tsx
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- log.ts
- Rail Ops Sim — Updated Plan (Railway Builder Focus)
- compilerOptions
- import-railos.ts
- LinkHighlightLayer
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
- operateActions.ts
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
- SectionEditPanel.tsx
- serialization.ts
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
- useEditorHotkeys.ts
- editor-store.ts
- operateArt.ts
- @phosphor-icons/react
- NamedLocation in rail-op-sim — Implementation Plan (v2)
- timetable/types.ts
- useEditorStore
- OperatePanel.tsx
- effect-journal.test.ts
- scripts
- parseSimTime
- engine.ts
- time.ts
- authoring.ts
- callingOn.ts
- compilerOptions
- operate-store.ts
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- NamedLocation
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- routes.ts
- record
- sim/__tests__/fixtures.ts
- operateLayers.test.ts
- trains.ts
- ErrorBoundary.tsx
- StatusBar.tsx
- Cell
- Element
- Track Speed & Length Editing — Requirements
- routeTree.gen.ts
- @rail-op-sim/shared
- performanceSummary.ts
- radix-ui
- sim-bridge.ts
- react
- @tailwindcss/vite
- @tanstack/react-router-ssr-query
- tailwindcss
- @tanstack/react-devtools
- @tanstack/router-plugin
- tw-animate-css
- zustand
- GroundLayer.ts
- Parapet
- PlacementController.ts
- RouteFallbacks.tsx
- convert-railos.sh
- EndpointOutlines
- ResizeObserverStub
- ResizeObserverStub
- Concourse
- Text
- TrainContextMenu.tsx
- createDirectionLayer
- TrackLayer.ts
- createTrackColorLayer

## God Nodes (most connected - your core abstractions)
1. `Map_` - 148 edges
2. `Track` - 98 edges
3. `PlacementController` - 70 edges
4. `useEditorStore` - 58 edges
5. `Text` - 51 edges
6. `debugLog()` - 48 edges
7. `createEngine()` - 37 edges
8. `parseSimTime()` - 35 edges
9. `Implementation Milestones` - 35 edges
10. `useModeStore` - 33 edges

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
- 3-file cycle: `packages/shared/src/sim/callingOn.ts -> packages/shared/src/sim/timetable.ts -> packages/shared/src/sim/trains.ts -> packages/shared/src/sim/callingOn.ts`
- 3-file cycle: `packages/shared/src/sim/callingOn.ts -> packages/shared/src/sim/timetable.ts -> packages/shared/src/sim/routes.ts -> packages/shared/src/sim/callingOn.ts`

## Communities (282 total, 129 thin omitted)

### Community 0 - "cn"
Cohesion: 0.11
Nodes (30): CanvasCrash(), getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, Button() (+22 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.06
Nodes (7): applyFigures(), buildHoveredTrackInfo(), recordField(), revalidatePreferredDirections(), getTrackColorState(), Track, pathsOf()

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
Nodes (22): PanControls(), PanControlsProps, ZoomSlider(), ZoomSliderProps, PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportController, ViewportControllerOptions (+14 more)

### Community 10 - "includes"
Cohesion: 0.06
Nodes (30): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+22 more)

### Community 11 - "AddPalette.tsx"
Cohesion: 0.09
Nodes (44): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE (+36 more)

### Community 12 - "Map_"
Cohesion: 0.07
Nodes (3): Map_, MessageCallback, TextSelectionPrompt

### Community 13 - "textureCache.ts"
Cohesion: 0.11
Nodes (22): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), ColorMap, escapeRegExp() (+14 more)

### Community 14 - "PlacementController"
Cohesion: 0.06
Nodes (11): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, RefreshFlags, PlacementController, platformSubtypeToSide(), worldToGrid() (+3 more)

### Community 15 - "ActionForm.tsx"
Cohesion: 0.17
Nodes (21): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+13 more)

### Community 16 - "timetable-store.ts"
Cohesion: 0.12
Nodes (19): seed(), completeRailway, Harness(), problems, reset(), buildRailway(), buildTwoServices(), codes() (+11 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "documentActions.ts"
Cohesion: 0.08
Nodes (52): SaveLoadControls(), applyRailwayPick(), isTimetableText(), loadDocument(), loadRailwayOrTimetable(), loadTimetableDocument(), RailwayOrTimetable, saveDocument() (+44 more)

### Community 20 - "validate.ts"
Cohesion: 0.22
Nodes (22): formatSimTime(), isFinishAction(), isStartAction(), checkOrder(), checkStartPosition(), checkStop(), IssueList, pairUp() (+14 more)

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

### Community 26 - "TimetableEditor.tsx"
Cohesion: 0.21
Nodes (13): actionKindLabel(), createAction(), describeAction(), ActionRow(), AddActionButton(), Header(), ServiceDetail(), ServiceList() (+5 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution, noEmit (+9 more)

### Community 28 - "Map_ (railway map data structure)"
Cohesion: 0.10
Nodes (27): Map_ (railway map data structure), map-connectivity.test.ts — tests for checkAllTracksConnected, map-platform.test.ts — tests for addPlatform and addLevelCrossing, map-text-linking.test.ts — tests for linkLocalText, deleteTextFromAllElements, changeDeleteText, map.test.ts — comprehensive tests for Map_ class, map/map-connectivity.ts, map/map-platform.ts, map/map-text-linking.ts (+19 more)

### Community 29 - "railway/enums.ts"
Cohesion: 0.14
Nodes (14): BridgeUnderpassType (4 variants), BufferType (8 variants), CrossoverType (6 variants), CurvedType (12 variants), DirectedType (8 variants), ExitType (8 variants), FlyoverType (12 variants), LinkedType (8 variants) (+6 more)

### Community 30 - "log.ts"
Cohesion: 0.23
Nodes (6): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind

### Community 31 - "Rail Ops Sim — Updated Plan (Railway Builder Focus)"
Cohesion: 0.09
Nodes (21): 1.1 What Exists, 1.2 Data Model: Grid-Based, Not Graph-Based, 1. Current State, 2. Scope: Railway Builder Only, 3. Editor Milestones, 4. Files to Create (Summary), 5. Dependencies to Add, 6. Rendering Detail: How Each Track Kind Draws (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.06
Nodes (46): ActiveElement, buildMap(), cellFromId(), cellOf(), COMMANDS, errors, InactiveElement, issues (+38 more)

### Community 34 - "LinkHighlightLayer"
Cohesion: 0.13
Nodes (5): PlacementControllerOptions, Coord, DirectionLayer, LinkHighlightLayer, TrackColorLayer

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.10
Nodes (31): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), GESTURE_END_COLOR, GESTURE_INVALID_COLOR, GESTURE_OUTLINE_INSET (+23 more)

### Community 36 - "map.ts"
Cohesion: 0.23
Nodes (15): Platform, addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), changeDeleteText(), collectNeighbourTexts(), deleteTextFromAllElements() (+7 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.09
Nodes (34): checkAllTracksConnected(), clearPreferredDirectionsAlongPath(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), ConnectivityReport, DanglingLink, elementNeedsName() (+26 more)

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
Cohesion: 0.22
Nodes (31): clearCallingOnSignal(), becomeNewService(), canRestoreTimetable(), changeDirection(), fail(), findTrain(), FollowOnCandidate, frontLocation() (+23 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "operateActions.ts"
Cohesion: 0.14
Nodes (18): RouteControls(), BecomeNewServiceDialog(), RemoveTrainDialog(), SetReminderDialog(), SkipActionsDialog(), applyOperateIntent(), chooseRouteKind(), runOrPause() (+10 more)

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
Cohesion: 0.09
Nodes (60): actionLocation(), availableFollowOnService(), ACTION_WORDS, actionDue(), actionsOf(), awaitJoin(), becomeService(), Command (+52 more)

### Community 54 - "tooltip.tsx"
Cohesion: 0.40
Nodes (5): tooltip.tsx, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger

### Community 55 - "ui/input.tsx"
Cohesion: 0.50
Nodes (4): ui/input.tsx, routes/index.tsx (app), Input component, @rail-op-sim/app package

### Community 56 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 57 - "SectionEditPanel.tsx"
Cohesion: 0.09
Nodes (30): MODES, ModeTip(), COLOR_LEGEND, SectionEditPanel(), SAVE_FORMATS, SettingsMenu(), ShortcutsDialog(), HISTORY_ACTIONS (+22 more)

### Community 58 - "serialization.ts"
Cohesion: 0.19
Nodes (18): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+10 more)

### Community 59 - "railway/index.ts"
Cohesion: 0.05
Nodes (77): makeTrack(), SerializedTrack, ALL_KINDS, SignalAspect, SignalAspectValue, DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH (+69 more)

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

### Community 214 - "useEditorHotkeys.ts"
Cohesion: 0.23
Nodes (12): jumpToNextIssue(), moveSelectedAction(), run, runEscape(), stepSelectedService(), resolveEscape(), services, IssuePlace (+4 more)

### Community 215 - "editor-store.ts"
Cohesion: 0.09
Nodes (21): BASE, BASE, TrackInfoTooltip(), TIMETABLE_ROW_CLASS, TrainInfoTooltip(), EscapeAction, EscapeContext, MapFileFormat (+13 more)

### Community 216 - "operateArt.ts"
Cohesion: 0.22
Nodes (18): cellKey(), crossingArt(), crossingsChanging(), FILLET_BY_RAIL, FILLET_LINKS, openCrossingTile(), OPERATE_ART_FILES, operateArt() (+10 more)

### Community 218 - "NamedLocation in rail-op-sim — Implementation Plan (v2)"
Cohesion: 0.11
Nodes (17): 0. Phasing (per your framing), 1. Key finding: the adjacency spread is already implemented, 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX, 3. Phase 2: the "Name" tool, 3a. Store — new tool + pending target, 3b. Click dispatch, 3c. Dialog — set / change / delete, 3d. Toolbar button (+9 more)

### Community 219 - "timetable/types.ts"
Cohesion: 0.08
Nodes (32): ActionForm(), ActionFormProps, ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, ActionKindOption, ActionSeed, DESCRIBERS, SEEDS (+24 more)

### Community 220 - "useEditorStore"
Cohesion: 0.13
Nodes (24): AddPalette(), MODE_LABEL, ModeGateNotice(), ModeSwitcher(), PaletteCrash(), ToolbarCrash(), SimCanvas(), SimLayout() (+16 more)

### Community 221 - "OperatePanel.tsx"
Cohesion: 0.22
Nodes (14): ClockControls(), LEVEL_CLASS, NO_TRAINS, ROUTE_KINDS, showTrain(), TrainList(), useErrored(), OperateClock() (+6 more)

### Community 222 - "effect-journal.test.ts"
Cohesion: 0.22
Nodes (12): beginRecording(), EffectEntry, endRecording(), isRecording(), redoEntries(), ReplayTarget, undoEntries(), withoutRecording() (+4 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "parseSimTime"
Cohesion: 0.13
Nodes (23): timetable(), twoServices(), twoServices(), CELL, completeRailwayFixture(), FONT, nameTrack(), nameTracks() (+15 more)

### Community 225 - "engine.ts"
Cohesion: 0.08
Nodes (48): OperateState, CallingOnMatch, afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS, stepSpeed() (+40 more)

### Community 226 - "time.ts"
Cohesion: 0.39
Nodes (6): dayOffset(), formatDuration(), formatWallClock(), InvalidTimeError, SECONDS_PER_DAY, tryParseSimTime()

### Community 227 - "authoring.ts"
Cohesion: 0.09
Nodes (49): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), c() (+41 more)

### Community 228 - "callingOn.ts"
Cohesion: 0.15
Nodes (36): ALLOWED_FACING_ACTIONS, callingOnCheck(), callOn(), canAcceptBlockingTrain(), isFacingOtherTrain(), refreshCallingOnFlags(), routeConflicts(), segKey() (+28 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "operate-store.ts"
Cohesion: 0.14
Nodes (14): OperatePanel(), PerformanceLog(), SessionError(), sent, view(), sent, TrainDialogs(), initial (+6 more)

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

### Community 238 - "operateGeometry.ts"
Cohesion: 0.13
Nodes (24): CELL_SIZE, ROUTE_COLORS, RouteLayer, TrainLayer, atDistance(), cumulative(), dist(), edgePoint() (+16 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.15
Nodes (32): buildGraph(), cellKey(), endsAtBuffers(), groupCrossings(), isFacingSignal(), leavesMap(), LevelCrossing, roadNeighbour() (+24 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.12
Nodes (31): setPreferredDirectionsAlongPath(), approachMap(), Engine, guarded(), addTrain(), CELL, engineFor(), frontCell() (+23 more)

### Community 245 - "operateLayers.test.ts"
Cohesion: 0.24
Nodes (9): drawn(), headcodes(), layer(), lowered, seg(), setLevelCrossingArt, setOverrides, train() (+1 more)

### Community 246 - "trains.ts"
Cohesion: 0.17
Nodes (21): CALL_ON_MAX_SPEED_MS, pathOf(), withLies(), Ahead, approaching(), dropRear(), effectiveMaxSpeed(), front() (+13 more)

### Community 247 - "ErrorBoundary.tsx"
Cohesion: 0.20
Nodes (4): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, PanelCrash()

### Community 249 - "StatusBar.tsx"
Cohesion: 0.16
Nodes (11): StatusBar(), THEME_SWITCH, applyTheme(), getInitial(), useTheme(), ConnectivityPill, describeConnectivity(), FaultCount (+3 more)

### Community 250 - "Cell"
Cohesion: 0.27
Nodes (9): OperateClick, OperateInputState, OperateIntent, resolveOperateClick(), sameCell(), at, idle, start (+1 more)

### Community 252 - "Track Speed & Length Editing — Requirements"
Cohesion: 0.20
Nodes (9): Context (grounded in current code), F1.1 Length → metres (combined imperial input), F1.2 Speed: mph → km/h, F1.3 Precision, F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested), F2 — Track colour legend, F3 — Track section editor, F4 — Standalone converter widgets (+1 more)

### Community 253 - "routeTree.gen.ts"
Cohesion: 0.14
Nodes (19): RouteError(), RouteNotFound(), RoutePending(), getRouter(), Register, @tanstack/react-router, Route, Route (+11 more)

### Community 255 - "performanceSummary.ts"
Cohesion: 0.31
Nodes (8): PerformanceSummary(), EventSummaryRow, formatMinutes(), formatPunctuality(), IncidentRow, IncidentSeverity, PerformanceSummary, summariseCounters()

### Community 258 - "sim-bridge.ts"
Cohesion: 0.07
Nodes (31): HostClock, startEngineHost(), setUp(), trip, fakeClock(), setUp(), emptyTimetable, lineMap() (+23 more)

### Community 268 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 270 - "PlacementController.ts"
Cohesion: 0.11
Nodes (15): GuardableTicker, guardTicker(), DEFAULT_OPTIONS, ELEMENT_LABELS, CanvasStatus, themeKey(), usePixiApp(), allEnabled (+7 more)

### Community 271 - "RouteFallbacks.tsx"
Cohesion: 0.36
Nodes (3): CanvasState(), CanvasStateProps, Spinner()

### Community 280 - "Text"
Cohesion: 0.10
Nodes (4): createTextLayer(), removeAll(), TextLayer, Text

### Community 284 - "TrainContextMenu.tsx"
Cohesion: 0.29
Nodes (6): sent, clampMenuPosition(), TrainContextMenu(), TrainMenuItem, TrainMenuItemId, trainMenuItems()

### Community 288 - "createDirectionLayer"
Cohesion: 0.43
Nodes (5): createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 289 - "TrackLayer.ts"
Cohesion: 0.09
Nodes (10): createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, createTrackLayer(), Entry (+2 more)

## Knowledge Gaps
- **577 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+572 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **129 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `sim-bridge.ts`, `Track`, `.addTrack`, `AddPalette.tsx`, `Parapet`, `PlacementController.ts`, `timetable-store.ts`, `validate.ts`, `Concourse`, `Text`, `import-railos.ts`, `LinkHighlightLayer`, `gestureOverlay.ts`, `TrackLayer.ts`, `map.ts`, `map-connectivity.ts`, `railway/index.ts`, `effect-journal.test.ts`, `parseSimTime`, `engine.ts`, `authoring.ts`, `NamedLocation`, `routes.ts`, `record`, `sim/__tests__/fixtures.ts`, `Element`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `cn`, `TrackLayer.ts`, `LinkHighlightLayer`, `ViewportController`, `AddPalette.tsx`, `PlacementController.ts`, `documentActions.ts`, `useEditorHotkeys.ts`, `Text`, `SectionEditPanel.tsx`, `TimetableEditor.tsx`, `useEditorStore`, `OperatePanel.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `useEditorStore` connect `useEditorStore` to `cn`, `ViewportController`, `AddPalette.tsx`, `PlacementController.ts`, `timetable-store.ts`, `documentActions.ts`, `useEditorHotkeys.ts`, `editor-store.ts`, `StatusBar.tsx`, `TimetableEditor.tsx`, `SectionEditPanel.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _577 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.113107822410148 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.06393442622950819 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._