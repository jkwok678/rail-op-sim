# Graph Report - packages  (2026-07-02)

## Corpus Check
- 77 files · ~70,056 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 645 nodes · 1465 edges · 30 communities (21 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `956850a1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]

## God Nodes (most connected - your core abstractions)
1. `Map_` - 101 edges
2. `Track` - 72 edges
3. `PlacementController` - 35 edges
4. `Text` - 35 edges
5. `cn()` - 25 edges
6. `ViewportController` - 23 edges
7. `debugLog()` - 20 edges
8. `useEditorStore` - 18 edges
9. `Element` - 18 edges
10. `NamedElement` - 18 edges

## Surprising Connections (you probably didn't know these)
- `SectionEditPanel()` --calls--> `formatImperialLength()`  [EXTRACTED]
  app/src/components/sim/SectionEditPanel.tsx → shared/src/railway/units.ts
- `EditorState` --references--> `SignalAspectValue`  [EXTRACTED]
  app/src/store/editor-store.ts → shared/src/railway/track/signal-aspects.ts
- `TooltipContent()` --calls--> `cn()`  [EXTRACTED]
  app/src/components/ui/tooltip.tsx → app/src/lib/utils.ts
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  app/src/components/ui/dialog.tsx → app/src/lib/utils.ts
- `DialogDescription()` --calls--> `cn()`  [EXTRACTED]
  app/src/components/ui/dialog.tsx → app/src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (30 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (49): checkAllTracksConnected(), findAllLinkedTracks(), findPathBetween(), findUnpairedLinkedTracks(), getLinkedTrackPairs(), getLinkedTrackReport(), LINK_OFFSETS, LinkedTrackPair (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (51): useTheme(), ASPECT_SVG_MAP, cn(), AddPalette(), ALL_LABELS, ASPECT_OPTIONS, CATEGORIES, CATEGORY_LABELS (+43 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (20): PlacementController, PlacementControllerOptions, platformSubtypeToSide(), ElementLayer, makeElementSprite(), PLATFORM_SIDE_MAP, PlatformSideMapping, SpriteEntry (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (39): getTrackColorState(), TrackColorState, BRIDGE_UNDERPASS_CODES, BRIDGE_UNDERPASS_LINKS, BUFFER_CODES, BUFFER_LINKS, CODE_TABLES, CROSSOVER_CODES (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (23): usePixiApp(), buildDomColorMap(), buildThemeColorMap(), ColorMap, escapeRegExp(), normalizeCssColor(), normalizedCache, recolorSvg() (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): dependencies, class-variance-authority, clsx, @fontsource-variable/jetbrains-mono, @phosphor-icons/react, pixi.js, radix-ui, @rail-op-sim/shared (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (4): ViewportController, ViewportControllerOptions, ViewportState, UsePixiAppReturn

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (15): Route, Route, getRouter(), Register, FileRoutesByFullPath, FileRoutesById, FileRoutesByPath, FileRoutesByTo (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.12
Nodes (17): devDependencies, babel-plugin-react-compiler, @biomejs/biome, jsdom, @rolldown/plugin-babel, @tailwindcss/typography, @tanstack/devtools-vite, @tanstack/router-cli (+9 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (3): coordKey(), Element, TestElement

### Community 14 - "Community 14"
Cohesion: 0.26
Nodes (6): ElementAlreadyExistsError, ElementNotFoundError, LinkedTrackError, RailwayError, TrackNotConnectedError, ZeroTrackError

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (12): devDependencies, typescript, vitest, main, name, private, scripts, build (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (3): Concourse, NamedElement, TestNamedElement

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (9): scripts, build, check, dev, format, generate-routes, lint, preview (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): compilerOptions, jsx, paths, types, extends, include, #/*, @rail-op-sim/shared

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (3): DEFAULTS, GroundLayer, GroundLayerOptions

### Community 24 - "Community 24"
Cohesion: 0.80
Nodes (4): formatImperialLength(), kmhToMph(), metresToImperial(), round1()

### Community 25 - "Community 25"
Cohesion: 0.40
Nodes (4): imports, name, private, type

## Knowledge Gaps
- **169 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Community 6` to `Community 0`, `Community 2`, `Community 3`, `Community 12`, `Community 13`, `Community 16`, `Community 20`, `Community 23`, `Community 26`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **Why does `Track` connect `Community 3` to `Community 0`, `Community 2`, `Community 4`, `Community 6`, `Community 13`, `Community 16`, `Community 23`, `Community 26`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `NamedElement` connect `Community 16` to `Community 0`, `Community 1`, `Community 3`, `Community 4`, `Community 12`, `Community 17`, `Community 23`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07471264367816093 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05878332194121668 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07890122735242548 - nodes in this community are weakly interconnected._