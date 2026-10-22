# Graph Report - rail-op-sim  (2026-10-22)

## Corpus Check
- 174 files · ~152,392 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1961 nodes · 4385 edges · 253 communities (131 shown, 122 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 377 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `46cd04f6`
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
- AddPalette.tsx
- PlacementController
- map-serialization.ts
- track-data.ts
- SimCanvas.tsx
- dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics
- textureCache.ts
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
- TimetableEditor.tsx
- timetable-store.ts
- useEditorStore
- .addTrack
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
- EditHistory.ts
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
- mapFile.ts
- parseSimTime
- createDirectionLayer
- Text
- SectionEditPanel
- timetable/types.ts
- effect-journal.test.ts
- LinkHighlightLayer
- serialization.ts
- scripts
- ModeSwitcher.tsx
- timetable-store-map.test.ts
- PlacementController.ts
- authoring.ts
- recordField
- compilerOptions
- Parapet
- The railway document
- The timetable document
- fixtures.ts
- Every issue the validator reports
- node-env.d.ts
- Authoring railways and timetables
- StatusBar.tsx
- createTrackColorLayer
- run.sh
- app/package.json
- merge-coverage.mjs
- babel-plugin-react-compiler
- jsdom
- @biomejs/biome
- @tailwindcss/typography
- @testing-library/react
- @types/react
- typescript
- vite
- @vitejs/plugin-react
- vitest
- @vitest/coverage-v8

## God Nodes (most connected - your core abstractions)
1. `Map_` - 137 edges
2. `Track` - 96 edges
3. `PlacementController` - 65 edges
4. `useEditorStore` - 49 edges
5. `Text` - 48 edges
6. `debugLog()` - 46 edges
7. `Implementation Milestones` - 35 edges
8. `ViewportController` - 31 edges
9. `cn()` - 28 edges
10. `parseSimTime()` - 26 edges

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

## Communities (253 total, 122 thin omitted)

### Community 0 - "TextInputDialog.tsx"
Cohesion: 0.16
Nodes (18): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, Button(), buttonVariants (+10 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 3 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, @rolldown/plugin-babel, @tanstack/devtools-vite, @tanstack/router-cli, @testing-library/dom, @types/node, @types/react-dom, @rolldown/plugin-babel (+5 more)

### Community 5 - "dependencies"
Cohesion: 0.04
Nodes (49): class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, nitro, dependencies, class-variance-authority, clsx, @fontsource-variable/jetbrains-mono (+41 more)

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
Nodes (22): PanControls(), PanControlsProps, SimCanvas(), ZoomSlider(), ZoomSliderProps, PAN_BUTTON_STEP, PAN_KEY_SPEED, ViewportController (+14 more)

### Community 10 - "includes"
Cohesion: 0.07
Nodes (29): source, assist, actions, files, ignoreUnknown, includes, formatter, enabled (+21 more)

### Community 11 - "enums.ts"
Cohesion: 0.26
Nodes (20): ALL_TRACK_SUBTYPES, ELEMENT_KEYS, GRAPHICS_DIR, TRACK_ENUMS, BridgeUnderpassType, BufferType, CrossoverType, CurvedType (+12 more)

### Community 12 - "Map_"
Cohesion: 0.06
Nodes (3): NamedLocation, coordKey(), Map_

### Community 13 - "AddPalette.tsx"
Cohesion: 0.10
Nodes (24): ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE (+16 more)

### Community 14 - "PlacementController"
Cohesion: 0.12
Nodes (6): RefreshFlags, PlacementController, debugLog(), worldToGrid(), clearPreferredDirectionsAlongPath(), findPathBetween()

### Community 15 - "map-serialization.ts"
Cohesion: 0.12
Nodes (20): sample, Concourse, NamedElement, ParapetType, ConnectivityReport, deserializeMap(), SERIALIZED_MAP_VERSION, SerializedMap (+12 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (29): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+21 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "textureCache.ts"
Cohesion: 0.19
Nodes (10): buildThemeColorMap(), ColorMap, escapeRegExp(), normalizeCssColor(), normalizedCache, rgbToHex(), SOURCE_FILLS, canvasCache (+2 more)

### Community 20 - "validate.ts"
Cohesion: 0.18
Nodes (26): ServiceDetail(), summariseService(), isRailwayComplete(), linkIndexForOffset(), getLocationNames(), formatSimTime(), actionTime(), createsTrain() (+18 more)

### Community 21 - "Technology Evaluation"
Cohesion: 0.20
Nodes (10): 1. Rendering Engine — **PixiJS v8** ✅ Decided, 2. Meta-Framework — **TanStack Start** (already scaffolded), 3. State Management (UI) — **Zustand**, 4. Worker Communication — **Raw postMessage**, 5. Schema Validation — **Valibot**, 6. IndexedDB Wrapper — **Dexie.js**, 7. Table Component — **@tanstack/react-table**, 8. CSS & UI Components — **Tailwind v4 + shadcn/ui** (already configured) (+2 more)

### Community 22 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 23 - "scripts"
Cohesion: 0.07
Nodes (26): fallow, devDependencies, @biomejs/biome, fallow, pngjs, typescript, @biomejs/biome, typescript (+18 more)

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

### Community 30 - "TimetableEditor.tsx"
Cohesion: 0.13
Nodes (21): actionKindLabel(), describeAction(), CellField(), ChoiceField(), NumberField(), TextField(), TimeField(), ActionRow() (+13 more)

### Community 31 - "timetable-store.ts"
Cohesion: 0.16
Nodes (21): ActionFormProps, seed(), timetable(), Header(), codes(), store(), twoServices(), fillCell() (+13 more)

### Community 32 - "useEditorStore"
Cohesion: 0.20
Nodes (8): AddPalette(), SAVE_FORMATS, SettingsMenu(), BASE, TextInputDialog(), TrackInfoTooltip(), HoveredTrackInfo, useEditorStore

### Community 33 - ".addTrack"
Cohesion: 0.14
Nodes (3): record(), revalidatePreferredDirections(), mapDebug()

### Community 34 - "ActionForm.tsx"
Cohesion: 0.28
Nodes (12): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+4 more)

### Community 35 - "gestureOverlay.ts"
Cohesion: 0.09
Nodes (30): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), EndpointOutlines, GESTURE_END_COLOR, GESTURE_INVALID_COLOR (+22 more)

### Community 36 - "map.ts"
Cohesion: 0.17
Nodes (18): Platform, LinkedTrackPair, LinkedTrackReport, MAP_DEBUG, addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform() (+10 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.13
Nodes (26): checkAllTracksConnected(), collectPreferredDirectionIssues(), collectUndirectedTracks(), collectUnnamedElements(), DanglingLink, elementNeedsName(), endpointOtherLink(), expectedEntryOnNeighbor() (+18 more)

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

### Community 44 - "EditHistory.ts"
Cohesion: 0.18
Nodes (4): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "SimLayout.tsx"
Cohesion: 0.15
Nodes (15): ModeSwitcher(), SaveLoadControls(), SimLayout(), completeRailway, Harness(), useEditorHotkeys(), loadDocument(), saveDocument() (+7 more)

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
Cohesion: 0.16
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
Nodes (16): ModeTip(), ShortcutsDialog(), Tip(), useMounted(), useShortcutDisplay(), useShortcutKeys(), isPlatformDependent(), Shortcut (+8 more)

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 59 - "railway/index.ts"
Cohesion: 0.12
Nodes (37): COLOR_LEGEND, makeTrack(), buildHoveredTrackInfo(), ALL_KINDS, SignalAspect, DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH (+29 more)

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
Cohesion: 0.12
Nodes (7): createElementLayer(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry, TextureCache

### Community 214 - "mapFile.ts"
Cohesion: 0.11
Nodes (30): decodeDocument(), DocumentFileFormat, downloadDocument(), encodeDocument(), inferDocumentFormat(), LoadedDocument, pickAndReadDocument(), loadMap() (+22 more)

### Community 215 - "parseSimTime"
Cohesion: 0.14
Nodes (20): SERIALIZED_TIMETABLE_VERSION, timetable(), TRAIN, twoServiceTimetable(), roundTrip(), finishRemainHere, oneService(), startAt() (+12 more)

### Community 216 - "createDirectionLayer"
Cohesion: 0.43
Nodes (5): createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 217 - "Text"
Cohesion: 0.10
Nodes (4): createTextLayer(), removeAll(), TextLayer, Text

### Community 218 - "SectionEditPanel"
Cohesion: 0.67
Nodes (5): SectionEditPanel(), formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 219 - "timetable/types.ts"
Cohesion: 0.08
Nodes (29): ActionForm(), ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, ActionKindOption, ActionSeed, createAction(), DESCRIBERS, SEEDS (+21 more)

### Community 220 - "effect-journal.test.ts"
Cohesion: 0.22
Nodes (12): beginRecording(), EffectEntry, endRecording(), isRecording(), redoEntries(), ReplayTarget, undoEntries(), withoutRecording() (+4 more)

### Community 221 - "LinkHighlightLayer"
Cohesion: 0.18
Nodes (3): Coord, DirectionLayer, LinkHighlightLayer

### Community 222 - "serialization.ts"
Cohesion: 0.21
Nodes (16): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+8 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "ModeSwitcher.tsx"
Cohesion: 0.11
Nodes (13): MODES, complete, ResizeObserverStub, ResizeObserverStub, HISTORY_ACTIONS, Toolbar(), TOOLS, Kbd() (+5 more)

### Community 225 - "timetable-store-map.test.ts"
Cohesion: 0.48
Nodes (6): buildRailway(), buildTwoServices(), codes(), name(), store(), createDefaultTrainSpec()

### Community 226 - "PlacementController.ts"
Cohesion: 0.12
Nodes (14): DEFAULT_OPTIONS, ELEMENT_LABELS, PlacementControllerOptions, platformSubtypeToSide(), themeKey(), usePixiApp(), Subsystem, CELL_SIZE (+6 more)

### Community 227 - "authoring.ts"
Cohesion: 0.10
Nodes (43): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), c() (+35 more)

### Community 228 - "recordField"
Cohesion: 0.10
Nodes (3): recordField(), Element, TestElement

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 231 - "The railway document"
Cohesion: 0.18
Nodes (10): Completeness, Coordinates, Link indices, Names, Other traversal rules, Platforms, Subtype → links, Switches (+2 more)

### Community 232 - "The timetable document"
Cohesion: 0.18
Nodes (10): Actions, Against the railway, Finish — one per service, last, Intermediate — any number, Links between services, Service, Start — one per service, first, The timetable document (+2 more)

### Community 233 - "fixtures.ts"
Cohesion: 0.25
Nodes (10): getExitCells(), getStartableCells(), locationToCell(), CELL, completeRailwayFixture(), FONT, nameTrack(), nameTracks() (+2 more)

### Community 234 - "Every issue the validator reports"
Cohesion: 0.22
Nodes (8): A service's identity, A service's shape, Against the railway, Every issue the validator reports, Links between services, The railway's own problems, Times, Whole timetable

### Community 236 - "Authoring railways and timetables"
Cohesion: 0.33
Nodes (5): Authoring railways and timetables, Notes, Reference, The rules that break documents, Workflow

### Community 237 - "StatusBar.tsx"
Cohesion: 0.16
Nodes (11): StatusBar(), THEME_SWITCH, applyTheme(), getInitial(), useTheme(), ConnectivityPill, describeConnectivity(), FaultCount (+3 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

## Knowledge Gaps
- **422 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+417 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **122 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `Track`, `enums.ts`, `map-serialization.ts`, `validate.ts`, `timetable-store.ts`, `.addTrack`, `gestureOverlay.ts`, `map.ts`, `map-connectivity.ts`, `railway/index.ts`, `ElementLayer.ts`, `parseSimTime`, `Text`, `effect-journal.test.ts`, `LinkHighlightLayer`, `timetable-store-map.test.ts`, `PlacementController.ts`, `authoring.ts`, `recordField`, `Parapet`, `fixtures.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `.addTrack`, `PlacementController.ts`, `authoring.ts`, `ElementLayer.ts`, `map.ts`, `map-connectivity.ts`, `recordField`, `fixtures.ts`, `enums.ts`, `Map_`, `map-serialization.ts`, `railway/index.ts`, `LinkHighlightLayer`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `Text` connect `Text` to `timetable-store-map.test.ts`, `PlacementController.ts`, `authoring.ts`, `recordField`, `map.ts`, `Parapet`, `.addTrack`, `fixtures.ts`, `enums.ts`, `Map_`, `PlacementController`, `map-serialization.ts`, `railway/index.ts`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _422 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.07312925170068027 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `Implementation Milestones` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._