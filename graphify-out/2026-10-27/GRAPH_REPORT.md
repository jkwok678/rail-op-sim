# Graph Report - rail-op-sim  (2026-10-26)

## Corpus Check
- 226 files · ~179,829 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2357 nodes · 5682 edges · 269 communities (143 shown, 126 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 396 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a304f14`
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
- PlacementController
- map-serialization.ts
- track-data.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- mapFile.ts
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
- .serializeFieldGroups
- TrackLayer
- compilerOptions
- SimView
- ActionForm.tsx
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
- SectionEditPanel.tsx
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
- ElementLayer.ts
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
- gridToWorld
- timetable/__tests__/fixtures.ts
- createDirectionLayer
- Text
- useEditorStore
- timetable/types.ts
- ResizeObserverStub
- LinkHighlightLayer
- serialization.ts
- scripts
- NamedLocation
- engine.ts
- PlacementController.ts
- authoring.ts
- Element
- compilerOptions
- NamedElement
- The railway document
- The timetable document
- Railway configuration
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- editor-store.ts
- operateGeometry.ts
- run.sh
- app/package.json
- merge-coverage.mjs
- routes.ts
- src/index.ts
- sim/__tests__/fixtures.ts
- TrackLayer.ts
- trains.ts
- time.ts
- graph.ts
- Cell
- log.ts
- locations.test.ts
- round1
- timetable-store-map.test.ts
- EndpointOutlines
- ResizeObserverStub
- radix-ui
- @rail-op-sim/shared
- react
- shadcn
- tailwind-merge
- tailwindcss
- @tanstack/react-devtools
- @tanstack/react-hotkeys
- @tanstack/router-plugin
- tw-animate-css
- zustand
- createTrackColorLayer

## God Nodes (most connected - your core abstractions)
1. `Map_` - 145 edges
2. `Track` - 97 edges
3. `PlacementController` - 69 edges
4. `Text` - 50 edges
5. `debugLog()` - 49 edges
6. `useEditorStore` - 48 edges
7. `Implementation Milestones` - 35 edges
8. `ViewportController` - 32 edges
9. `parseSimTime()` - 31 edges
10. `createEngine()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `pairPortals()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `direct()` --calls--> `setPreferredDirectionsAlongPath()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `railwayProblems()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `reportRailway()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `reportRailway()` --calls--> `getLocationNames()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts

## Import Cycles
- None detected.

## Communities (269 total, 126 thin omitted)

### Community 0 - "TimetableEditor.tsx"
Cohesion: 0.09
Nodes (35): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, CellField(), ChoiceField() (+27 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.06
Nodes (8): DanglingLink, LinkedTrackPair, LinkedTrackReport, PathNode, PreferredDirectionRemovalResult, PreferredDirectionResult, Track, locationOf()

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
Nodes (21): PanControls(), PanControlsProps, ZoomSlider(), ZoomSliderProps, PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportController, ViewportControllerOptions (+13 more)

### Community 10 - "includes"
Cohesion: 0.06
Nodes (30): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+22 more)

### Community 11 - "AddPalette.tsx"
Cohesion: 0.14
Nodes (33): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE (+25 more)

### Community 12 - "Map_"
Cohesion: 0.07
Nodes (4): record(), Map_, MessageCallback, TextSelectionPrompt

### Community 13 - "textureCache.ts"
Cohesion: 0.10
Nodes (24): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), buildThemeColorMap(), ColorMap (+16 more)

### Community 14 - "PlacementController"
Cohesion: 0.12
Nodes (4): RefreshFlags, PlacementController, debugLog(), worldToGrid()

### Community 15 - "map-serialization.ts"
Cohesion: 0.14
Nodes (12): Parapet, ParapetType, SERIALIZED_MAP_VERSION, SerializedNamedElement, SerializedParapet, SerializedText, SerializedTrack, TestElement (+4 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (32): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+24 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "mapFile.ts"
Cohesion: 0.06
Nodes (42): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, decodeDocument(), DocumentFileFormat, downloadDocument(), encodeDocument() (+34 more)

### Community 20 - "validate.ts"
Cohesion: 0.21
Nodes (24): ServiceDetail(), summariseService(), formatSimTime(), actionTime(), createsTrain(), isFinishAction(), isShuttleAction(), isStartAction() (+16 more)

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

### Community 30 - ".serializeFieldGroups"
Cohesion: 0.53
Nodes (3): buildHoveredTrackInfo(), getTrackColorState(), pathsOf()

### Community 31 - "TrackLayer"
Cohesion: 0.10
Nodes (6): PlacementControllerOptions, createTextLayer(), removeAll(), TextLayer, TrackColorLayer, TrackLayer

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "SimView"
Cohesion: 0.13
Nodes (10): createRouteLayer(), ROUTE_COLORS, RouteLayer, createSignalStateLayer(), SignalStateLayer, createTrainLayer(), TrainLayer, Point (+2 more)

### Community 34 - "ActionForm.tsx"
Cohesion: 0.18
Nodes (19): ActionFormProps, exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer (+11 more)

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.16
Nodes (17): CellOutlineOptions, createEndpointOutlines(), dashedLine(), GESTURE_END_COLOR, GESTURE_INVALID_COLOR, GESTURE_OUTLINE_INSET, GESTURE_OUTLINE_WIDTH, GESTURE_PREVIEW_COLOR (+9 more)

### Community 36 - "map.ts"
Cohesion: 0.19
Nodes (17): Platform, MAP_DEBUG, mapDebug(), addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), changeDeleteText() (+9 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.13
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
Nodes (26): HostClock, startEngineHost(), fakeClock(), setUp(), emptyTimetable, lineMap(), scope, SimBridge (+18 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "useEditorHotkeys.ts"
Cohesion: 0.09
Nodes (30): ModeSwitcher(), complete, Header(), completeRailway, Harness(), problems, jumpToNextIssue(), moveSelectedAction() (+22 more)

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
Cohesion: 0.12
Nodes (39): actionLocation(), createEngine(), fail(), ACTION_WORDS, actionsOf(), becomeService(), Command, departFromStop() (+31 more)

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
Nodes (31): MODES, ModeTip(), COLOR_LEGEND, SAVE_FORMATS, SettingsMenu(), ShortcutsDialog(), HISTORY_ACTIONS, Tip() (+23 more)

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 59 - "railway/index.ts"
Cohesion: 0.14
Nodes (34): ALL_KINDS, SignalAspectValue, DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH, DEFAULT_SECONDARY_SPEED, TRACK_COLOR_ALPHA, TRACK_COLOR_BOTH (+26 more)

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

### Community 68 - "ElementLayer.ts"
Cohesion: 0.16
Nodes (6): createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry

### Community 214 - "gridToWorld"
Cohesion: 0.24
Nodes (11): gridToWorld(), queueCellRect(), strokeCellOutline(), createLinkHighlightLayer(), clearSectionHighlight(), clearSectionSprites(), highlightSection(), setLinkPreview() (+3 more)

### Community 215 - "timetable/__tests__/fixtures.ts"
Cohesion: 0.09
Nodes (31): seed(), timetable(), reset(), twoServices(), sample, codes(), store(), twoServices() (+23 more)

### Community 216 - "createDirectionLayer"
Cohesion: 0.43
Nodes (5): createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 218 - "useEditorStore"
Cohesion: 0.09
Nodes (27): AddPalette(), SaveLoadControls(), SectionEditPanel(), SimLayout(), StatusBar(), THEME_SWITCH, BASE, TextInputDialog() (+19 more)

### Community 219 - "timetable/types.ts"
Cohesion: 0.08
Nodes (30): ActionForm(), ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, createAction(), describeAction(), DESCRIBERS (+22 more)

### Community 221 - "LinkHighlightLayer"
Cohesion: 0.18
Nodes (3): Coord, DirectionLayer, LinkHighlightLayer

### Community 222 - "serialization.ts"
Cohesion: 0.19
Nodes (18): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+10 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 225 - "engine.ts"
Cohesion: 0.11
Nodes (27): afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS, stepSpeed(), emptyCounters(), Engine (+19 more)

### Community 226 - "PlacementController.ts"
Cohesion: 0.21
Nodes (8): SimCanvas(), DEFAULT_OPTIONS, ELEMENT_LABELS, platformSubtypeToSide(), themeKey(), usePixiApp(), UsePixiAppReturn, Subsystem

### Community 227 - "authoring.ts"
Cohesion: 0.09
Nodes (44): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), c() (+36 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "NamedElement"
Cohesion: 0.14
Nodes (3): Concourse, NamedElement, ConnectivityReport

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

### Community 237 - "editor-store.ts"
Cohesion: 0.11
Nodes (19): runEscape(), ConnectivityPill, describeConnectivity(), FaultCount, FAULTS, plural(), EscapeAction, EscapeContext (+11 more)

### Community 238 - "operateGeometry.ts"
Cohesion: 0.21
Nodes (14): CELL_SIZE, GESTURE_PREVIEW_ERASE_COLOR, LAMP_COLORS, edgePoint(), joinedPoints(), Lamp, lerp(), pointAlong() (+6 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.17
Nodes (31): nodeAt(), occKeyOf(), Seg, pathsFrom(), routeKeys(), sameSeg(), trainKeys(), arrival() (+23 more)

### Community 243 - "src/index.ts"
Cohesion: 0.09
Nodes (39): ClockControls(), LEVEL_CLASS, NO_TRAINS, OperatePanel(), PerformanceLog(), ROUTE_KINDS, RouteControls(), showTrain() (+31 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.15
Nodes (22): TrainSpec, addTrain(), CELL, engineFor(), frontCell(), line(), nameCells(), passingLoop() (+14 more)

### Community 245 - "TrackLayer.ts"
Cohesion: 0.24
Nodes (4): createTrackLayer(), Entry, entryKey(), TextureCache

### Community 246 - "trains.ts"
Cohesion: 0.24
Nodes (20): pathOf(), segLength(), followSeg(), liesAgainst(), nextSeg(), advanceFront(), approaching(), dropRear() (+12 more)

### Community 247 - "time.ts"
Cohesion: 0.43
Nodes (5): dayOffset(), formatDuration(), formatWallClock(), InvalidTimeError, SECONDS_PER_DAY

### Community 249 - "graph.ts"
Cohesion: 0.30
Nodes (12): buildGraph(), cellKey(), endsAtBuffers(), isFacingSignal(), leavesMap(), Step, stepFrom(), beyondRoute() (+4 more)

### Community 250 - "Cell"
Cohesion: 0.27
Nodes (10): OperateClick, OperateInputState, resolveOperateClick(), sameCell(), at, idle, start, OperateState (+2 more)

### Community 251 - "log.ts"
Cohesion: 0.20
Nodes (9): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind, Counters, LogLevel (+1 more)

### Community 252 - "locations.test.ts"
Cohesion: 0.73
Nodes (4): getExitCells(), getLocationNames(), getStartableCells(), locationToCell()

### Community 253 - "round1"
Cohesion: 0.80
Nodes (4): formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 254 - "timetable-store-map.test.ts"
Cohesion: 0.48
Nodes (6): buildRailway(), buildTwoServices(), codes(), name(), store(), createDefaultTrainSpec()

## Knowledge Gaps
- **477 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+472 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **126 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `Track`, `AddPalette.tsx`, `map-serialization.ts`, `mapFile.ts`, `validate.ts`, `TrackLayer`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `sim-bridge.ts`, `useEditorHotkeys.ts`, `railway/index.ts`, `ElementLayer.ts`, `timetable/__tests__/fixtures.ts`, `Text`, `LinkHighlightLayer`, `NamedLocation`, `engine.ts`, `PlacementController.ts`, `authoring.ts`, `Element`, `NamedElement`, `operateGeometry.ts`, `sim/__tests__/fixtures.ts`, `TrackLayer.ts`, `graph.ts`, `locations.test.ts`, `timetable-store-map.test.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `NamedLocation`, `authoring.ts`, `ElementLayer.ts`, `map.ts`, `map-connectivity.ts`, `NamedElement`, `graph.ts`, `AddPalette.tsx`, `Map_`, `operateGeometry.ts`, `map-serialization.ts`, `Text`, `railway/index.ts`, `locations.test.ts`, `LinkHighlightLayer`, `.serializeFieldGroups`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `ViewportController` connect `ViewportController` to `PlacementController.ts`, `PlacementController`, `TrackLayer`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _477 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimetableEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09131205673758866 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.055152394775036286 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._