# Graph Report - rail-op-sim  (2026-10-27)

## Corpus Check
- 228 files · ~183,872 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2410 nodes · 5821 edges · 273 communities (149 shown, 124 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 407 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `52b85148`
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
- createTrackData
- TextLayer
- compilerOptions
- import-railos.ts
- ActionForm.tsx
- gridToWorld
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
- AddPalette.tsx
- timetable/__tests__/fixtures.ts
- createDirectionLayer
- Text
- useEditorStore
- actionKinds.ts
- Toolbar.tsx
- LinkHighlightLayer
- serialization.ts
- scripts
- mode-store.ts
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
- OperatePanel.tsx
- sim/__tests__/fixtures.ts
- timetable-store.ts
- trains.ts
- effect-journal.test.ts
- graph.ts
- operate-store.ts
- log.ts
- locations.test.ts
- round1
- shortcutGates.ts
- EndpointOutlines
- check-documents.ts
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
- EditHistory.ts
- Lines
- useTheme
- convert-railos.sh

## God Nodes (most connected - your core abstractions)
1. `Map_` - 146 edges
2. `Track` - 98 edges
3. `PlacementController` - 69 edges
4. `Text` - 51 edges
5. `debugLog()` - 49 edges
6. `useEditorStore` - 48 edges
7. `Implementation Milestones` - 35 edges
8. `ViewportController` - 32 edges
9. `parseSimTime()` - 31 edges
10. `createEngine()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `place()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `pairPortals()` --calls--> `cellToLocation()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `direct()` --calls--> `setPreferredDirectionsAlongPath()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts
- `direct()` --calls--> `trackAtCell()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/timetable/locations.ts
- `railwayProblems()` --calls--> `getConnectivityReport()`  [EXTRACTED]
  .claude/skills/railway-author/scripts/authoring.ts → packages/shared/src/railway/map/map-connectivity.ts

## Import Cycles
- None detected.

## Communities (273 total, 124 thin omitted)

### Community 0 - "TimetableEditor.tsx"
Cohesion: 0.10
Nodes (33): getElementAt(), KIND_TITLES, NameElementDialog(), NameElementDialogProps, FONT_FAMILIES, TextInputDialogProps, NumberField(), TextField() (+25 more)

### Community 1 - "track-data.ts"
Cohesion: 0.16
Nodes (24): Track (unified track class), Link grid layout (0-8 indices), KIND_META, track.test.ts, track-data.ts, track.ts, track/track-data.ts, KIND_META (per-kind flags) (+16 more)

### Community 2 - "Track"
Cohesion: 0.06
Nodes (7): DanglingLink, LinkedTrackReport, PathNode, PreferredDirectionRemovalResult, PreferredDirectionResult, Track, locationOf()

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

### Community 11 - "enums.ts"
Cohesion: 0.24
Nodes (21): ALL_TRACK_SUBTYPES, ELEMENT_KEYS, GRAPHICS_DIR, TRACK_ENUMS, BridgeUnderpassType, BufferType, CrossoverType, CurvedType (+13 more)

### Community 12 - "Map_"
Cohesion: 0.06
Nodes (3): record(), coordKey(), Map_

### Community 13 - "textureCache.ts"
Cohesion: 0.10
Nodes (24): AspectPreview(), DOM_COLOR_MAP, InlineSvg(), DOM_COLOR_MAP, TrackPreview(), buildDomColorMap(), buildThemeColorMap(), ColorMap (+16 more)

### Community 14 - "PlacementController"
Cohesion: 0.11
Nodes (7): RefreshFlags, PlacementController, platformSubtypeToSide(), debugLog(), ElementKind, isTrackKind(), NameableKind

### Community 15 - "map-serialization.ts"
Cohesion: 0.24
Nodes (10): ParapetType, deserializeMap(), SERIALIZED_MAP_VERSION, SerializedMap, SerializedNamedElement, SerializedParapet, SerializedText, SerializedTrack (+2 more)

### Community 16 - "track-data.ts"
Cohesion: 0.06
Nodes (31): BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES, CROSSOVER_LINKS, CURVED_CODES (+23 more)

### Community 18 - "dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics"
Cohesion: 0.10
Nodes (20): dir:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformDownUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformLeftUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightSet.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformRightUnset.svg, file:/Users/jonathankwok/projects/rail-op-sim/packages/app/public/graphics/platformUpSet.svg (+12 more)

### Community 19 - "mapFile.ts"
Cohesion: 0.09
Nodes (36): reset(), decodeDocument(), DocumentFileFormat, downloadDocument(), encodeDocument(), inferDocumentFormat(), LoadedDocument, pickAndReadDocument() (+28 more)

### Community 20 - "validate.ts"
Cohesion: 0.12
Nodes (35): ServiceDetail(), ServiceList(), summariseService(), linkIndexForOffset(), formatSimTime(), ActionBase, actionTime(), createsTrain() (+27 more)

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

### Community 30 - "createTrackData"
Cohesion: 0.23
Nodes (8): CATEGORIES, makeTrack(), buildHoveredTrackInfo(), isValidSubtype(), subtypeToCode(), createTrackData(), kindToShortLabel(), pathsOf()

### Community 31 - "TextLayer"
Cohesion: 0.25
Nodes (3): createTextLayer(), removeAll(), TextLayer

### Community 32 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, module, moduleResolution, noEmit, noUnusedLocals, noUnusedParameters, skipLibCheck, strict (+4 more)

### Community 33 - "import-railos.ts"
Cohesion: 0.07
Nodes (44): pairPortals(), ActiveElement, buildMap(), cellFromId(), cellOf(), COMMANDS, errors, InactiveElement (+36 more)

### Community 34 - "ActionForm.tsx"
Cohesion: 0.23
Nodes (14): exitFields(), FieldKit, fromRefFields(), joinFields(), nextRefFields(), otherRefField(), Renderer, RENDERERS (+6 more)

### Community 35 - "gridToWorld"
Cohesion: 0.11
Nodes (30): gridToWorld(), CellOutlineOptions, createEndpointOutlines(), redraw(), dashedLine(), GESTURE_END_COLOR, GESTURE_INVALID_COLOR, GESTURE_OUTLINE_INSET (+22 more)

### Community 36 - "map.ts"
Cohesion: 0.12
Nodes (21): LinkedTrackPair, MAP_DEBUG, mapDebug(), addLevelCrossing(), addPlatform(), removeLevelCrossing(), removePlatform(), changeDeleteText() (+13 more)

### Community 37 - "map-connectivity.ts"
Cohesion: 0.12
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

### Community 44 - "sim-bridge.ts"
Cohesion: 0.09
Nodes (25): HostClock, startEngineHost(), fakeClock(), setUp(), emptyTimetable, lineMap(), scope, SimBridge (+17 more)

### Community 45 - "app/tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, jsx, paths, types, extends, include, ../../tsconfig.json, @rail-op-sim/shared (+4 more)

### Community 46 - "useEditorHotkeys.ts"
Cohesion: 0.17
Nodes (16): completeRailway, Harness(), problems, jumpToNextIssue(), moveSelectedAction(), run, runEscape(), stepSelectedService() (+8 more)

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
Nodes (36): actionLocation(), cellKey(), ACTION_WORDS, actionsOf(), becomeService(), Command, departFromStop(), describeAction() (+28 more)

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
Cohesion: 0.17
Nodes (16): COLOR_LEGEND, ShortcutsDialog(), KbdGroup(), useMounted(), useShortcutDisplay(), isPlatformDependent(), PLATFORM_MODIFIERS, Shortcut (+8 more)

### Community 58 - "GroundLayer.ts"
Cohesion: 0.32
Nodes (7): createGroundLayer(), redraw(), DEFAULTS, GroundLayer, GroundLayerOptions, niceSpacing(), resolve()

### Community 59 - "railway/index.ts"
Cohesion: 0.17
Nodes (25): DEFAULT_MAIN_LENGTH, DEFAULT_MAIN_SPEED, DEFAULT_SECONDARY_LENGTH, DEFAULT_SECONDARY_SPEED, getTrackColorState(), TRACK_COLOR_ALPHA, TRACK_COLOR_BOTH, TRACK_COLOR_LENGTH (+17 more)

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

### Community 214 - "AddPalette.tsx"
Cohesion: 0.15
Nodes (18): ALL_LABELS, ASPECT_OPTIONS, CATEGORY_KINDS, CATEGORY_LABELS, ELEMENT_LABELS, ELEMENT_TYPES, SENTINEL_SUBTYPE, SUBTYPE_VALUES (+10 more)

### Community 215 - "timetable/__tests__/fixtures.ts"
Cohesion: 0.09
Nodes (32): twoServices(), codes(), store(), twoServices(), createDefaultTrainSpec(), SERIALIZED_TIMETABLE_VERSION, CELL, completeRailwayFixture() (+24 more)

### Community 216 - "createDirectionLayer"
Cohesion: 0.43
Nodes (5): createDirectionLayer(), drawArrow(), drawLeg(), setRoutePreview(), sync()

### Community 217 - "Text"
Cohesion: 0.12
Nodes (3): applyFigures(), recordField(), Text

### Community 218 - "useEditorStore"
Cohesion: 0.14
Nodes (13): AddPalette(), SectionEditPanel(), SimLayout(), StatusBar(), BASE, TextInputDialog(), TimetableEditor(), TrackInfoTooltip() (+5 more)

### Community 219 - "actionKinds.ts"
Cohesion: 0.11
Nodes (21): ActionForm(), ACTION_KIND_GROUPS, ACTION_KIND_OPTIONS, actionKindLabel(), ActionKindOption, ActionSeed, createAction(), describeAction() (+13 more)

### Community 220 - "Toolbar.tsx"
Cohesion: 0.10
Nodes (15): MODES, ModeSwitcher(), ModeTip(), complete, ResizeObserverStub, ResizeObserverStub, HISTORY_ACTIONS, Tip() (+7 more)

### Community 221 - "LinkHighlightLayer"
Cohesion: 0.13
Nodes (5): PlacementControllerOptions, Coord, DirectionLayer, LinkHighlightLayer, TrackColorLayer

### Community 222 - "serialization.ts"
Cohesion: 0.21
Nodes (16): ACTION_READERS, ActionFields, asBoolean(), asCell(), asNumber(), asRecord(), asString(), asTime() (+8 more)

### Community 223 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, check, coverage, dev, format, generate-routes, lint (+3 more)

### Community 224 - "mode-store.ts"
Cohesion: 0.23
Nodes (13): SaveLoadControls(), THEME_SWITCH, loadDocument(), saveDocument(), loadMap(), saveMap(), blockedReason(), ModeState (+5 more)

### Community 225 - "engine.ts"
Cohesion: 0.11
Nodes (32): afterPause(), afterRun(), isSpeed(), SIM_DT, SPEEDS, emptyCounters(), Engine, EngineOptions (+24 more)

### Community 226 - "PlacementController.ts"
Cohesion: 0.15
Nodes (11): DEFAULT_OPTIONS, ELEMENT_LABELS, themeKey(), usePixiApp(), Subsystem, CELL_SIZE, worldToGrid(), createTrackLayer() (+3 more)

### Community 227 - "authoring.ts"
Cohesion: 0.16
Nodes (23): map, services, train, APP_IMAGE_SIZE, at(), bridgeUnderpass(), buffer(), crossover() (+15 more)

### Community 229 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, forceConsistentCasingInFileNames, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+7 more)

### Community 230 - "NamedElement"
Cohesion: 0.10
Nodes (6): Concourse, NamedElement, NamedLocation, Parapet, ConnectivityReport, TestNamedElement

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
Cohesion: 0.16
Nodes (11): SAVE_FORMATS, SettingsMenu(), ConnectivityPill, describeConnectivity(), FaultCount, FAULTS, plural(), MapFileFormat (+3 more)

### Community 238 - "operateGeometry.ts"
Cohesion: 0.11
Nodes (22): createRouteLayer(), ROUTE_COLORS, RouteLayer, createSignalStateLayer(), LAMP_COLORS, SignalStateLayer, createTrainLayer(), TrainLayer (+14 more)

### Community 240 - "app/package.json"
Cohesion: 0.40
Nodes (4): imports, name, private, type

### Community 242 - "routes.ts"
Cohesion: 0.21
Nodes (27): createEngine(), nodeAt(), occKeyOf(), pathsFrom(), routeKeys(), sameSeg(), trainKeys(), blockedReason() (+19 more)

### Community 243 - "OperatePanel.tsx"
Cohesion: 0.09
Nodes (36): ClockControls(), LEVEL_CLASS, NO_TRAINS, OperatePanel(), PerformanceLog(), ROUTE_KINDS, RouteControls(), showTrain() (+28 more)

### Community 244 - "sim/__tests__/fixtures.ts"
Cohesion: 0.13
Nodes (24): setPreferredDirectionsAlongPath(), addTrain(), CELL, engineFor(), frontCell(), line(), nameCells(), passingLoop() (+16 more)

### Community 245 - "timetable-store.ts"
Cohesion: 0.19
Nodes (16): ActionFormProps, seed(), timetable(), fillCell(), nextServiceRef(), PendingCellPick, TimetableState, SimTime (+8 more)

### Community 246 - "trains.ts"
Cohesion: 0.24
Nodes (20): pathOf(), segLength(), followSeg(), liesAgainst(), nextSeg(), advanceFront(), approaching(), dropRear() (+12 more)

### Community 247 - "effect-journal.test.ts"
Cohesion: 0.22
Nodes (12): beginRecording(), EffectEntry, endRecording(), isRecording(), redoEntries(), ReplayTarget, undoEntries(), withoutRecording() (+4 more)

### Community 249 - "graph.ts"
Cohesion: 0.38
Nodes (10): endsAtBuffers(), isFacingSignal(), leavesMap(), stepFrom(), arrival(), beyondRoute(), behind(), computeAspects() (+2 more)

### Community 250 - "operate-store.ts"
Cohesion: 0.16
Nodes (17): OperateClick, OperateInputState, OperateIntent, resolveOperateClick(), sameCell(), at, idle, start (+9 more)

### Community 251 - "log.ts"
Cohesion: 0.21
Nodes (8): clockText(), COUNTED, latenessText(), minutesLate(), PerformanceLog, TimedKind, Counters, LogLevel

### Community 252 - "locations.test.ts"
Cohesion: 0.36
Nodes (10): cellText(), name(), namedLocation(), platform(), cellToLocation(), getExitCells(), getLocationNames(), getStartableCells() (+2 more)

### Community 253 - "round1"
Cohesion: 0.80
Nodes (4): formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 254 - "shortcutGates.ts"
Cohesion: 0.20
Nodes (10): EscapeAction, EscapeContext, resolveEscape(), liveShortcuts(), ShortcutGateState, base, AddKind, PendingText (+2 more)

### Community 256 - "check-documents.ts"
Cohesion: 0.18
Nodes (13): c(), issueText(), loadRailway(), loadTimetable(), railwayProblems(), reportRailway(), reportTimetable(), timetableSpan() (+5 more)

### Community 269 - "EditHistory.ts"
Cohesion: 0.18
Nodes (4): DEFAULT_HISTORY_LIMIT, EditCommand, EditHistory, HistoryState

### Community 271 - "useTheme"
Cohesion: 0.83
Nodes (3): applyTheme(), getInitial(), useTheme()

## Knowledge Gaps
- **500 isolated node(s):** `map`, `train`, `services`, `APP_IMAGE_SIZE`, `DEFAULT_FONT` (+495 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **124 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map_` to `check-documents.ts`, `Track`, `enums.ts`, `map-serialization.ts`, `mapFile.ts`, `validate.ts`, `TextLayer`, `import-railos.ts`, `gridToWorld`, `map.ts`, `map-connectivity.ts`, `sim-bridge.ts`, `railway/index.ts`, `ElementLayer.ts`, `timetable/__tests__/fixtures.ts`, `Text`, `LinkHighlightLayer`, `engine.ts`, `PlacementController.ts`, `authoring.ts`, `Element`, `NamedElement`, `sim/__tests__/fixtures.ts`, `timetable-store.ts`, `effect-journal.test.ts`, `graph.ts`, `locations.test.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Track` connect `Track` to `import-railos.ts`, `PlacementController.ts`, `authoring.ts`, `ElementLayer.ts`, `map.ts`, `map-connectivity.ts`, `NamedElement`, `graph.ts`, `enums.ts`, `Map_`, `map-serialization.ts`, `Text`, `railway/index.ts`, `locations.test.ts`, `LinkHighlightLayer`, `createTrackData`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `PlacementController` connect `PlacementController` to `TimetableEditor.tsx`, `mode-store.ts`, `PlacementController.ts`, `ElementLayer.ts`, `Text`, `ViewportController`, `useEditorHotkeys.ts`, `map-serialization.ts`, `OperatePanel.tsx`, `mapFile.ts`, `SectionEditPanel.tsx`, `useEditorStore`, `Toolbar.tsx`, `LinkHighlightLayer`, `TextLayer`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `map`, `train`, `services` to the rest of the system?**
  _500 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TimetableEditor.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10204081632653061 - nodes in this community are weakly interconnected._
- **Should `Track` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._