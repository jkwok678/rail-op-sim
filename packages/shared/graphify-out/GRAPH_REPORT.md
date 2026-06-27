# Graph Report - .  (2026-06-27)

## Corpus Check
- Corpus is ~19,680 words - fits in a single context window. You may not need a graph.

## Summary
- 423 nodes · 1064 edges · 23 communities (11 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Map Element Management|Map Element Management]]
- [[_COMMUNITY_Crossover Track & Test Suite|Crossover Track & Test Suite]]
- [[_COMMUNITY_Text Operations|Text Operations]]
- [[_COMMUNITY_Map Core Infrastructure|Map Core Infrastructure]]
- [[_COMMUNITY_Map Serialization & Connectivity|Map Serialization & Connectivity]]
- [[_COMMUNITY_Straight Track System|Straight Track System]]
- [[_COMMUNITY_Linked Track System|Linked Track System]]
- [[_COMMUNITY_Error Hierarchy|Error Hierarchy]]
- [[_COMMUNITY_Signal Track System|Signal Track System]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_BridgeUnderpass Track System|Bridge/Underpass Track System]]
- [[_COMMUNITY_Buffer Track System|Buffer Track System]]
- [[_COMMUNITY_Curved Track System|Curved Track System]]
- [[_COMMUNITY_Directed Track System|Directed Track System]]
- [[_COMMUNITY_Exit Track System|Exit Track System]]
- [[_COMMUNITY_Flyover Track System|Flyover Track System]]
- [[_COMMUNITY_Switch Track System|Switch Track System]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]

## God Nodes (most connected - your core abstractions)
1. `Map_` - 190 edges
2. `Track` - 44 edges
3. `StraightTrack` - 38 edges
4. `Text` - 35 edges
5. `LinkedTrack` - 28 edges
6. `SignalTrack` - 20 edges
7. `Element` - 17 edges
8. `NamedElement` - 17 edges
9. `NamedLocation` - 17 edges
10. `Parapet` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Map_` --references--> `Text`  [EXTRACTED]
  src/railway/map/map.ts → src/railway/element.ts
- `Track` --inherits--> `NamedElement`  [EXTRACTED]
  src/railway/track/track-base.ts → src/railway/element.ts
- `Map_` --references--> `NamedLocation`  [EXTRACTED]
  src/railway/map/map.ts → src/railway/element.ts
- `Track` --references--> `NamedLocation`  [EXTRACTED]
  src/railway/track/track-base.ts → src/railway/element.ts
- `Map_` --references--> `Concourse`  [EXTRACTED]
  src/railway/map/map.ts → src/railway/element.ts

## Import Cycles
- None detected.

## Communities (23 total, 12 thin omitted)

### Community 0 - "Map Element Management"
Cohesion: 0.06
Nodes (10): Concourse, Element, NamedElement, NamedLocation, Parapet, ParapetType, Point, TestElement (+2 more)

### Community 1 - "Crossover Track & Test Suite"
Cohesion: 0.07
Nodes (5): CrossoverType, testFont, TestTrack, CrossoverTrack, Track

### Community 2 - "Text Operations"
Cohesion: 0.10
Nodes (3): Text, FontInfo, testFont

### Community 3 - "Map Core Infrastructure"
Cohesion: 0.19
Nodes (13): checkAllTracksConnected(), addLevelCrossing(), addPlatform(), changeDeleteText(), deleteTextFromAllElements(), linkLocalText(), linkNewElementToText(), tryLinkNamedLocationNeighbor() (+5 more)

### Community 9 - "Error Hierarchy"
Cohesion: 0.27
Nodes (6): ElementAlreadyExistsError, ElementNotFoundError, LinkedTrackError, RailwayError, TrackNotConnectedError, ZeroTrackError

### Community 11 - "Package Configuration"
Cohesion: 0.15
Nodes (12): devDependencies, typescript, vitest, main, name, private, scripts, build (+4 more)

## Knowledge Gaps
- **16 isolated node(s):** `name`, `version`, `private`, `type`, `main` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Map_` connect `Map Serialization & Connectivity` to `Map Element Management`, `Crossover Track & Test Suite`, `Text Operations`, `Map Core Infrastructure`, `Straight Track System`, `Linked Track System`, `Map Existence Checks`, `Element Deletion`, `Signal Track System`, `Bridge/Underpass Track System`, `Buffer Track System`, `Curved Track System`, `Directed Track System`, `Exit Track System`, `Flyover Track System`, `Switch Track System`, `Non-Track Element Placement`, `Typed Lookups`, `LinkedTrack State Machine`?**
  _High betweenness centrality (0.557) - this node is a cross-community bridge._
- **Why does `Track` connect `Crossover Track & Test Suite` to `Map Element Management`, `Map Core Infrastructure`, `Map Serialization & Connectivity`, `Straight Track System`, `Linked Track System`, `Curved Track System`, `Exit Track System`, `Flyover Track System`, `Non-Track Element Placement`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `StraightTrack` connect `Straight Track System` to `Crossover Track & Test Suite`, `Map Core Infrastructure`, `Map Serialization & Connectivity`, `Map Existence Checks`, `Signal Track System`, `Bridge/Underpass Track System`, `Buffer Track System`, `Directed Track System`, `Switch Track System`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Map Element Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06219426974143955 - nodes in this community are weakly interconnected._
- **Should `Crossover Track & Test Suite` be split into smaller, more focused modules?**
  _Cohesion score 0.07372549019607844 - nodes in this community are weakly interconnected._
- **Should `Text Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.10461538461538461 - nodes in this community are weakly interconnected._