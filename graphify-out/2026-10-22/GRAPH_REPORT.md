# Graph Report - rail-op-sim  (2026-09-19)

## Corpus Check
- 140 files · ~136,980 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1724 nodes · 3865 edges · 229 communities (119 shown, 110 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 458 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `889e8da9`
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
- AddPalette.tsx
- PlacementController
- map-serialization.ts
- track-data.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- PlacementController.ts
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
- fixtures.ts
- TextLayer
- ElementLayer.ts
- element.ts
- ViewportController
- gestureOverlay.ts
- map.ts
- map-connectivity.ts
- shared/package.json
- Knowledge Graph Project Rules
- Multiplayer Readiness (Built In From Day 1)
- rail-op-sim/packages/shared/src/railway/element.ts
- Element
- Transport Protocol (Engine ↔ Host)
- timetable-store.ts
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
- mapFile.ts
- validate-map.test.ts
- EndpointOutlines
- Text
- SectionEditPanel
- timetable/types.ts
- createTrackColorLayer
- LinkHighlightLayer
- serialization.ts
- TimetableEditor.tsx
- Toolbar.tsx
- parseSimTime
- recordField
- NamedElement
- createDefaultTrainSpec

## God Nodes (most connected - your core abstractions)
1. `Map_` - 135 edges
2. `Track` - 93 edges
3. `PlacementController` - 63 edges
4. `Text` - 47 edges
5. `debugLog()` - 43 edges
6. `useEditorStore` - 39 edges
7. `Implementation Milestones` - 35 edges
8. `ViewportController` - 31 edges
9. `cn()` - 28 edges
10. `recordField()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Knowledge Graph Project Rules` --references--> `Rail Ops Sim`  [INFERRED]
  CLAUDE.md → PLAN.md
- `PanControlsProps` --references--> `ViewportController`  [EXTRACTED]
  packages/app/src/components/sim/PanControls.tsx → packages/app/src/engine/ViewportController.ts
- `Tip()` --calls--> `useShortcutKeys()`  [EXTRACTED]
  packages/app/src/components/sim/Toolbar.tsx → packages/app/src/hooks/useShortcutDisplay.ts
- `ActionKindOption` --references--> `Action`  [EXTRACTED]
  packages/app/src/components/sim/timetable/actionKinds.ts → packages/shared/src/railway/timetable/types.ts
- `twoServices()` --calls--> `parseSimTime()`  [EXTRACTED]
  packages/app/src/store/__tests__/timetable-store.test.ts → packages/shared/src/railway/timetable/time.ts

## Import Cycles
- None detected.

## Communities (229 total, 110 thin omitted)

### Community 0 - "TextInputDialog.tsx"
Cohesion: 0.12
Nodes (25): KIND_TITLES, NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter() (+17 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

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
Cohesion: 0.24
Nodes (22): ALL_TRACK_SUBTYPES, ELEMENT_KEYS, GRAPHICS_DIR, TRACK_ENUMS, BridgeUnderpassType, BufferType, CrossoverType, CurvedType (+14 more)

### Community 12 - "Map_"
Cohesion: 0.06
Nodes (9): record(), NamedLocation, checkAllTracksConnected(), coordKey(), Map_, buildSampleMap(), TrackKind, MessageCallback (+1 more)

### Community 13 - "AddPalette.tsx"
Cohesion: 0.08
Nodes (33): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE, SUBTYPE_VALUES (+25 more)

### Community 14 - "PlacementController"
Cohesion: 0.07
Nodes (17): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState, RefreshFlags, PlacementController, platformSubtypeToSide(), debugLog() (+9 more)

### Community 15 - "map-serialization.ts"
Cohesion: 0.20
Nodes (11): revalidatePreferredDirections(), deserializeMap(), SerializedMap, SerializedNamedElement, SerializedParapet, SerializedText, serializeMap(), buildRun() (+3 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (29): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+21 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "PlacementController.ts"
Cohesion: 0.14
Nodes (10): DEFAULT_OPTIONS, ELEMENT_LABELS, themeKey(), usePixiApp(), Subsystem, createTrackLayer(), Entry, entryKey() (+2 more)

### Community 20 - "validate.ts"
Cohesion: 0.18
Nodes (23): ServiceDetail(), ServiceList(), summariseService(), isRailwayComplete(), linkIndexForOffset(), getLocationNames(), trackAtCell(), actionTime() (+15 more)

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

### Community 30 - "fixtures.ts"
Cohesion: 0.20
Nodes (14): buildRailway(), name(), Platform, setPreferredDirectionsAlongPath(), mapDebug(), addStraightH(), addBuffer(), addVerticalNeighbour() (+6 more)

### Community 31 - "TextLayer"
Cohesion: 0.25
Nodes (3): createTextLayer(), removeAll(), TextLayer

### Community 32 - "ElementLayer.ts"
Cohesion: 0.12
Nodes (7): createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

### Community 33 - "element.ts"
Cohesion: 0.10
Nodes (6): Concourse, Element, Parapet, ParapetType, TestElement, testFont

### Community 34 - "ViewportController"
Cohesion: 0.13
Nodes (3): ZoomSliderProps, ViewportController, UsePixiAppReturn

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.11
Nodes (30): CELL_SIZE, gridToWorld(), worldToGrid(), CellOutlineOptions, createEndpointOutlines(), dashedLine(), GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+22 more)

### Community 36 - "map.ts"
Cohesion: 0.14
Nodes (18): findAllLinkedTracks(), findUnpairedLinkedTracks(), getLinkedTrackPairs(), getLinkedTrackReport(), MAP_DEBUG, addLevelCrossing(), addPlatform(), removeLevelCrossing() (+10 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.10
Nodes (26): clearPreferredDirectionsAlongPath(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), DanglingLink, elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+18 more)

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

### Community 44 - "timetable-store.ts"
Cohesion: 0.20
Nodes (16): Header(), codes(), store(), twoServices(), fillCell(), nextServiceRef(), TimetableState, useTimetableStore (+8 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "useEditorStore"
Cohesion: 0.16
Nodes (14): AddPalette(), getElementAt(), NameElementDialog(), SaveLoadControls(), SAVE_FORMATS, SettingsMenu(), SimLayout(), TextInputDialog() (+6 more)

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
Cohesion: 0.13
Nodes (19): DEFAULT_ZOOM, Harness(), useEditorHotkeys(), EscapeAction, EscapeContext, resolveEscape(), loadMap(), saveMap() (+11 more)

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
Cohesion: 0.22
Nodes (14): ShortcutsDialog(), useMounted(), useShortcutDisplay(), useShortcutKeys(), isPlatformDependent(), Shortcut, SHORTCUT_GROUPS, SHORTCUT_ORDER (+6 more)

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 59 - "railway/index.ts"
Cohesion: 0.13
Nodes (30): COLOR_LEGEND, SerializedTrack, cellToLocation(), getExitCells(), getStartableCells(), locationToCell(), SignalAspect, SignalAspectValue (+22 more)

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

### Community 214 - "mapFile.ts"
Cohesion: 0.12
Nodes (30): decodeDocument(), DOCUMENT_FILE_ACCEPT, DocumentFileFormat, downloadDocument(), encodeDocument(), inferDocumentFormat(), LoadedDocument, pickAndReadDocument() (+22 more)

### Community 215 - "validate-map.test.ts"
Cohesion: 0.16
Nodes (14): SERIALIZED_TIMETABLE_VERSION, timetable(), TRAIN, twoServiceTimetable(), roundTrip(), finishRemainHere, oneService(), startAt() (+6 more)

### Community 218 - "SectionEditPanel"
Cohesion: 0.67
Nodes (5): SectionEditPanel(), formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 219 - "timetable/types.ts"
Cohesion: 0.13
Nodes (14): ActionBase, actionLocation(), FINISH_KINDS, FinishAction, INTERMEDIATE_KINDS, IntermediateAction, isIntermediateAction(), MAX_SERVICE_REF_LENGTH (+6 more)

### Community 221 - "LinkHighlightLayer"
Cohesion: 0.13
Nodes (5): PlacementControllerOptions, Coord, DirectionLayer, LinkHighlightLayer, TrackColorLayer

### Community 222 - "serialization.ts"
Cohesion: 0.38
Nodes (13): asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime(), KNOWN_KINDS, parseAction() (+5 more)

### Community 223 - "TimetableEditor.tsx"
Cohesion: 0.14
Nodes (22): ActionForm(), ActionFormProps, ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, createAction(), describeAction() (+14 more)

### Community 224 - "Toolbar.tsx"
Cohesion: 0.29
Nodes (8): TimetableControls(), HISTORY_ACTIONS, Tip(), Toolbar(), TOOLS, Tooltip(), TooltipContent(), TooltipTrigger()

### Community 225 - "parseSimTime"
Cohesion: 0.36
Nodes (8): dayOffset(), formatDuration(), formatSimTime(), formatWallClock(), InvalidTimeError, parseSimTime(), SECONDS_PER_DAY, tryParseSimTime()

### Community 227 - "NamedElement"
Cohesion: 0.33
Nodes (3): NamedElement, ConnectivityReport, TestNamedElement

### Community 228 - "createDefaultTrainSpec"
Cohesion: 0.50
Nodes (4): buildTwoServices(), codes(), store(), createDefaultTrainSpec()

## Knowledge Gaps
- **346 isolated node(s):** `$schema`, `enabled`, `clientKind`, `useIgnoreFile`, `ignoreUnknown` (+341 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **110 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `ElementLayer.ts`, `element.ts`, `Track`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `enums.ts`, `timetable-store.ts`, `map-serialization.ts`, `PlacementController.ts`, `validate.ts`, `mapFile.ts`, `validate-map.test.ts`, `Text`, `railway/index.ts`, `LinkHighlightLayer`, `fixtures.ts`, `TextLayer`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `ElementLayer.ts`, `recordField`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `NamedElement`, `enums.ts`, `Map_`, `map-serialization.ts`, `railway/index.ts`, `LinkHighlightLayer`, `fixtures.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TextInputDialog.tsx`, `Toolbar.tsx`, `ViewportController`, `ElementLayer.ts`, `map-serialization.ts`, `PlacementController.ts`, `editor-store.ts`, `mapFile.ts`, `Text`, `railway/index.ts`, `TextLayer`, `LinkHighlightLayer`, `TimetableEditor.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `$schema`, `enabled`, `clientKind` to the rest of the system?**
  _346 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TextInputDialog.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12063492063492064 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.07535460992907801 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._