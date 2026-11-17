# Graph Report - rail-op-sim  (2026-11-16)

## Corpus Check
- 267 files · ~353,878 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2743 nodes · 6909 edges · 285 communities (156 shown, 129 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 419 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c19ccd07`
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
- enums.ts
- Map_
- textureCache.ts
- PlacementController
- ActionForm.tsx
- timetable-store-map.test.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- documentActions.ts
- validate.ts
- Technology Evaluation
- components.json
- scripts
- Rail Op Sim
- concept:signal-graphics
- railway/index.ts
- compilerOptions
- Map_ (railway map data structure)
- railway/enums.ts
- PlacementController.ts
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
- OperatePanel.tsx
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
- useEditorHotkeys.ts
- serialization.ts
- track-data.ts
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
- AddPalette.tsx
- editor-store.ts
- operateArt.ts
- @phosphor-icons/react
- NamedLocation in rail-op-sim — Implementation Plan (v2)
- timetable/types.ts
- SimLayout.tsx
- src/index.ts
- effect-journal.test.ts
- scripts
- parseSimTime
- engine.ts
- time.ts
- authoring.ts
- graph.ts
- compilerOptions
- operate-store.ts
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- debugLog
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- routes.ts
- map-serialization.ts
- sim/__tests__/fixtures.ts
- operateLayers.test.ts
- trains.ts
- SimCanvas.tsx
- StatusBar.tsx
- operateInput.ts
- recordField
- Track Speed & Length Editing — Requirements
- routeTree.gen.ts
- @rail-op-sim/shared
- performanceSummary.ts
- radix-ui
- transport/types.ts
- react
- @tailwindcss/vite
- @tanstack/react-router-ssr-query
- tailwindcss
- @tanstack/react-devtools
- NamedLocation
- @tanstack/router-plugin
- tw-animate-css
- zustand
- GroundLayer.ts
- sim-bridge.ts
- usePixiApp.ts
- check-documents.ts
- convert-railos.sh
- EditHistory.ts
- ResizeObserverStub
- locations.test.ts
- Toolbar.tsx
- Parapet
- buildMap
- Text
- MessagePort
- round1
- Lines
- ElementLayer.ts

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
- `place()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `direct()` --calls--> `setPreferredDirectionsAlongPath()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `direct()` --calls--> `trackAtCell()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `railwayProblems()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `reportRailway()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts

## Import Cycles
- 3-file cycle: `packages/shared/src/sim/callingOn.ts -> packages/shared/src/sim/timetable.ts -> packages/shared/src/sim/routes.ts -> packages/shared/src/sim/callingOn.ts`
- 3-file cycle: `packages/shared/src/sim/callingOn.ts -> packages/shared/src/sim/timetable.ts -> packages/shared/src/sim/trains.ts -> packages/shared/src/sim/callingOn.ts`

## Communities (285 total, 129 thin omitted)

### Community 0 - "TimetableEditor.tsx"
Cohesion: 0.08
Nodes (36): PanelCrash(), KIND_TITLES, NameElementDialogProps, COLOR_LEGEND, SAVE_FORMATS, FONT_FAMILIES, TextInputDialogProps, NumberField() (+28 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.06
Nodes (8): buildHoveredTrackInfo(), DanglingLink, PathNode, PreferredDirectionRemovalResult, PreferredDirectionResult, Track, locationOf(), pathsOf()

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
Nodes (21): PanControls(), PanControlsProps, ZoomSliderProps, PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportController, ViewportControllerOptions, ViewportState (+13 more)

### Community 10 - "includes"
Cohesion: 0.06
Nodes (30): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+22 more)

### Community 11 - "enums.ts"
Cohesion: 0.21
Nodes (23): ALL_TRACK_SUBTYPES, ELEMENT_KEYS, GRAPHICS_DIR, TRACK_ENUMS, makeTrack(), BridgeUnderpassType, BufferType, CrossoverType (+15 more)

### Community 12 - "Map_"
Cohesion: 0.06
Nodes (4): coordKey(), Map_, MessageCallback, TextSelectionPrompt

### Community 13 - "textureCache.ts"
Cohesion: 0.13
Nodes (16): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), recolorSvg(), ASPECT_SVG_MAP (+8 more)

### Community 15 - "ActionForm.tsx"
Cohesion: 0.19
Nodes (22): ActionFormProps, exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer (+14 more)

### Community 16 - "timetable-store-map.test.ts"
Cohesion: 0.48
Nodes (6): buildRailway(), buildTwoServices(), codes(), name(), store(), createDefaultTrainSpec()

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "documentActions.ts"
Cohesion: 0.08
Nodes (52): applyRailwayPick(), isTimetableText(), loadDocument(), loadRailwayOrTimetable(), loadTimetableDocument(), RailwayOrTimetable, saveDocument(), decodeDocument() (+44 more)

### Community 20 - "validate.ts"
Cohesion: 0.15
Nodes (31): seed(), AddActionButton(), ServiceDetail(), ServiceList(), summariseService(), formatSimTime(), actionTime(), createsTrain() (+23 more)

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

### Community 26 - "railway/index.ts"
Cohesion: 0.16
Nodes (27): Entry, DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH, DEFAULT_SECONDARY_SPEED, getTrackColorState(), TRACK_COLOR_ALPHA, TRACK_COLOR_BOTH (+19 more)

### Community 27 - "compilerOptions"
Cohesion: 0.11
Nodes (17): DOM, DOM.Iterable, compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution, noEmit (+9 more)

### Community 28 - "Map_ (railway map data structure)"
Cohesion: 0.10
Nodes (27): Map_ (railway map data structure), map-connectivity.test.ts — tests for checkAllTracksConnected, map-platform.test.ts — tests for addPlatform and addLevelCrossing, map-text-linking.test.ts — tests for linkLocalText, deleteTextFromAllElements, changeDeleteText, map.test.ts — comprehensive tests for Map_ class, map/map-connectivity.ts, map/map-platform.ts, map/map-text-linking.ts (+19 more)

### Community 29 - "railway/enums.ts"
Cohesion: 0.14
Nodes (14): BridgeUnderpassType (4 variants), BufferType (8 variants), CrossoverType (6 variants), CurvedType (12 variants), DirectedType (8 variants), ExitType (8 variants), FlyoverType (12 variants), LinkedType (8 variants) (+6 more)

### Community 30 - "PlacementController.ts"
Cohesion: 0.09
Nodes (9): ELEMENT_LABELS, PlacementControllerOptions, platformSubtypeToSide(), DirectionLayer, ElementLayer, TrackColorLayer, TrackLayer, ElementKind (+1 more)

### Community 31 - "Rail Ops Sim — Updated Plan (Railway Builder Focus)"
Cohesion: 0.09
Nodes (21): 1.1 What Exists, 1.2 Data Model: Grid-Based, Not Graph-Based, 1. Current State, 2. Scope: Railway Builder Only, 3. Editor Milestones, 4. Files to Create (Summary), 5. Dependencies to Add, 6. Rendering Detail: How Each Track Kind Draws (+13 more)

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.07
Nodes (37): ActiveElement, cellFromId(), COMMANDS, errors, InactiveElement, issues, linkOf(), LINKS (+29 more)

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.07
Nodes (39): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), EndpointOutlines, GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+31 more)

### Community 36 - "map.ts"
Cohesion: 0.18
Nodes (17): Platform, LinkedTrackPair, LinkedTrackReport, addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), changeDeleteText() (+9 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.13
Nodes (29): checkAllTracksConnected(), clearPreferredDirectionsAlongPath(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+21 more)

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

### Community 46 - "OperatePanel.tsx"
Cohesion: 0.13
Nodes (25): ClockControls(), LEVEL_CLASS, NO_TRAINS, ROUTE_KINDS, RouteControls(), SEVERITY_CLASS, useErrored(), BecomeNewServiceDialog() (+17 more)

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
Nodes (58): actionLocation(), ACTION_WORDS, actionDue(), actionsOf(), awaitJoin(), becomeService(), Command, couple() (+50 more)

### Community 54 - "tooltip.tsx"
Cohesion: 0.40
Nodes (5): tooltip.tsx, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger

### Community 55 - "ui/input.tsx"
Cohesion: 0.50
Nodes (4): ui/input.tsx, routes/index.tsx (app), Input component, @rail-op-sim/app package

### Community 56 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 57 - "useEditorHotkeys.ts"
Cohesion: 0.09
Nodes (31): ModeTip(), SectionEditPanel(), ShortcutsDialog(), Tip(), jumpToNextIssue(), moveSelectedAction(), run, stepSelectedService() (+23 more)

### Community 58 - "serialization.ts"
Cohesion: 0.17
Nodes (18): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+10 more)

### Community 59 - "track-data.ts"
Cohesion: 0.06
Nodes (32): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+24 more)

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

### Community 214 - "AddPalette.tsx"
Cohesion: 0.14
Nodes (20): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE (+12 more)

### Community 215 - "editor-store.ts"
Cohesion: 0.08
Nodes (27): AddPalette(), getElementAt(), NameElementDialog(), PaletteCrash(), ToolbarCrash(), SaveLoadControls(), SettingsMenu(), BASE (+19 more)

### Community 216 - "operateArt.ts"
Cohesion: 0.22
Nodes (18): cellKey(), crossingArt(), crossingsChanging(), FILLET_BY_RAIL, FILLET_LINKS, openCrossingTile(), OPERATE_ART_FILES, operateArt() (+10 more)

### Community 218 - "NamedLocation in rail-op-sim — Implementation Plan (v2)"
Cohesion: 0.11
Nodes (17): 0. Phasing (per your framing), 1. Key finding: the adjacency spread is already implemented, 2. Phase 0 (prerequisite): coordinate-unit mismatch — MUST FIX, 3. Phase 2: the "Name" tool, 3a. Store — new tool + pending target, 3b. Click dispatch, 3c. Dialog — set / change / delete, 3d. Toolbar button (+9 more)

### Community 219 - "timetable/types.ts"
Cohesion: 0.08
Nodes (30): ActionForm(), ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, createAction(), describeAction(), DESCRIBERS (+22 more)

### Community 220 - "SimLayout.tsx"
Cohesion: 0.11
Nodes (26): CanvasCrash(), MODE_LABEL, ModeGateNotice(), ModeSwitcher(), SimCanvas(), SimLayout(), complete, complete (+18 more)

### Community 221 - "src/index.ts"
Cohesion: 0.20
Nodes (12): showTrain(), TrainList(), OperateClock(), needsAttention(), runLabel(), speedLabel(), trainStatusLabel(), WAITING (+4 more)

### Community 222 - "effect-journal.test.ts"
Cohesion: 0.18
Nodes (14): beginRecording(), EffectEntry, endRecording(), isRecording(), redoEntries(), ReplayTarget, undoEntries(), withoutRecording() (+6 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "parseSimTime"
Cohesion: 0.10
Nodes (31): timetable(), twoServices(), codes(), store(), twoServices(), TimetableState, SERIALIZED_TIMETABLE_VERSION, CELL (+23 more)

### Community 225 - "engine.ts"
Cohesion: 0.07
Nodes (43): OperateInputState, OperateState, Cell, afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS (+35 more)

### Community 226 - "time.ts"
Cohesion: 0.39
Nodes (6): dayOffset(), formatDuration(), formatWallClock(), InvalidTimeError, SECONDS_PER_DAY, tryParseSimTime()

### Community 227 - "authoring.ts"
Cohesion: 0.16
Nodes (23): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), crossover() (+15 more)

### Community 228 - "graph.ts"
Cohesion: 0.10
Nodes (46): ALLOWED_FACING_ACTIONS, CALL_ON_MAX_SPEED_MS, callingOnCheck(), CallingOnMatch, callOn(), canAcceptBlockingTrain(), isFacingOtherTrain(), refreshCallingOnFlags() (+38 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "operate-store.ts"
Cohesion: 0.10
Nodes (20): OperatePanel(), PerformanceLog(), SessionError(), sent, view(), sent, sent, clampMenuPosition() (+12 more)

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
Nodes (25): CELL_SIZE, worldToGrid(), ROUTE_COLORS, RouteLayer, TrainLayer, atDistance(), cumulative(), dist() (+17 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.15
Nodes (37): crossingChanging(), createEngine(), fail(), nodeAt(), stepFrom(), followSeg(), pathsFrom(), routeKeys() (+29 more)

### Community 243 - "map-serialization.ts"
Cohesion: 0.16
Nodes (12): NamedElement, ConnectivityReport, deserializeMap(), SERIALIZED_MAP_VERSION, SerializedNamedElement, SerializedParapet, SerializedText, SerializedTrack (+4 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.12
Nodes (31): setPreferredDirectionsAlongPath(), approachMap(), Engine, guarded(), addTrain(), CELL, engineFor(), frontCell() (+23 more)

### Community 245 - "operateLayers.test.ts"
Cohesion: 0.24
Nodes (9): drawn(), headcodes(), layer(), lowered, seg(), setLevelCrossingArt, setOverrides, train() (+1 more)

### Community 246 - "trains.ts"
Cohesion: 0.22
Nodes (21): hitsRoadTraffic(), segLength(), nextSeg(), advanceFront(), Ahead, approaching(), dropRear(), effectiveMaxSpeed() (+13 more)

### Community 247 - "SimCanvas.tsx"
Cohesion: 0.18
Nodes (6): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState, CanvasState(), CanvasStateProps, ZoomSlider()

### Community 249 - "StatusBar.tsx"
Cohesion: 0.16
Nodes (11): StatusBar(), THEME_SWITCH, applyTheme(), getInitial(), useTheme(), ConnectivityPill, describeConnectivity(), FaultCount (+3 more)

### Community 250 - "operateInput.ts"
Cohesion: 0.28
Nodes (7): OperateClick, OperateIntent, resolveOperateClick(), sameCell(), at, idle, start

### Community 251 - "recordField"
Cohesion: 0.12
Nodes (4): applyFigures(), recordField(), Element, TestElement

### Community 252 - "Track Speed & Length Editing — Requirements"
Cohesion: 0.20
Nodes (9): Context (grounded in current code), F1.1 Length → metres (combined imperial input), F1.2 Speed: mph → km/h, F1.3 Precision, F1 — Unit conversion utilities (in `packages/shared`, pure + unit-tested), F2 — Track colour legend, F3 — Track section editor, F4 — Standalone converter widgets (+1 more)

### Community 253 - "routeTree.gen.ts"
Cohesion: 0.14
Nodes (19): RouteError(), RouteNotFound(), RoutePending(), getRouter(), Register, @tanstack/react-router, Route, Route (+11 more)

### Community 255 - "performanceSummary.ts"
Cohesion: 0.29
Nodes (9): PerformanceSummary(), EventSummaryRow, formatMinutes(), formatPunctuality(), HeadlinePart, IncidentRow, IncidentSeverity, PerformanceSummary (+1 more)

### Community 258 - "transport/types.ts"
Cohesion: 0.11
Nodes (20): HostClock, startEngineHost(), setUp(), trip, fakeClock(), setUp(), emptyTimetable, lineMap() (+12 more)

### Community 268 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 269 - "sim-bridge.ts"
Cohesion: 0.18
Nodes (11): closeSimSession(), connect(), openSimSession(), restartSimSession(), SimBridge, startSimBridge(), unavailableTransport(), workerTransport() (+3 more)

### Community 270 - "usePixiApp.ts"
Cohesion: 0.09
Nodes (19): GuardableTicker, guardTicker(), DEFAULT_OPTIONS, CanvasStatus, themeKey(), usePixiApp(), allEnabled, enabled (+11 more)

### Community 271 - "check-documents.ts"
Cohesion: 0.19
Nodes (15): c(), issueText(), loadRailway(), loadTimetable(), railwayProblems(), readDocument(), reportRailway(), reportTimetable() (+7 more)

### Community 273 - "EditHistory.ts"
Cohesion: 0.16
Nodes (5): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, RefreshFlags

### Community 275 - "locations.test.ts"
Cohesion: 0.32
Nodes (11): cellText(), name(), namedLocation(), pairPortals(), platform(), cellToLocation(), getExitCells(), getLocationNames() (+3 more)

### Community 276 - "Toolbar.tsx"
Cohesion: 0.16
Nodes (9): MODES, ResizeObserverStub, HISTORY_ACTIONS, Toolbar(), TOOLS, Tooltip(), TooltipContent(), TooltipProvider() (+1 more)

### Community 278 - "buildMap"
Cohesion: 0.50
Nodes (7): buildMap(), cellOf(), nameEverything(), pieceOf(), placeInactive(), trackDataFor(), where()

### Community 282 - "round1"
Cohesion: 0.80
Nodes (4): formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 289 - "ElementLayer.ts"
Cohesion: 0.13
Nodes (7): ColorMap, createElementLayer(), makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

## Knowledge Gaps
- **578 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+573 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **129 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `transport/types.ts`, `Track`, `NamedLocation`, `enums.ts`, `usePixiApp.ts`, `check-documents.ts`, `timetable-store-map.test.ts`, `documentActions.ts`, `locations.test.ts`, `Parapet`, `validate.ts`, `Text`, `railway/index.ts`, `PlacementController.ts`, `import-railos.ts`, `LinkHighlightLayer`, `gestureOverlay.ts`, `ElementLayer.ts`, `map.ts`, `map-connectivity.ts`, `serialization.ts`, `SimLayout.tsx`, `effect-journal.test.ts`, `parseSimTime`, `engine.ts`, `authoring.ts`, `graph.ts`, `map-serialization.ts`, `sim/__tests__/fixtures.ts`, `recordField`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TimetableEditor.tsx`, `ElementLayer.ts`, `LinkHighlightLayer`, `ViewportController`, `debugLog`, `OperatePanel.tsx`, `usePixiApp.ts`, `documentActions.ts`, `Toolbar.tsx`, `.publishHistoryState`, `Text`, `useEditorHotkeys.ts`, `SimLayout.tsx`, `effect-journal.test.ts`, `PlacementController.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Text` connect `Text` to `NamedLocation`, `enums.ts`, `Map_`, `PlacementController`, `usePixiApp.ts`, `timetable-store-map.test.ts`, `locations.test.ts`, `Parapet`, `railway/index.ts`, `PlacementController.ts`, `import-railos.ts`, `map.ts`, `parseSimTime`, `authoring.ts`, `graph.ts`, `debugLog`, `map-serialization.ts`, `sim/__tests__/fixtures.ts`, `recordField`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _578 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimetableEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08283730158730158 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.06397306397306397 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._