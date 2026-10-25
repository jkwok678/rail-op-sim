// Barrel exports for the simulation engine

export { SIM_DT, SPEEDS, stepSpeed } from "./clock";
export { createEngine, type Engine, type EngineOptions } from "./engine";
export {
	buildGraph,
	type GraphNode,
	type GraphPath,
	type NodeId,
	type RailGraph,
	type Seg,
} from "./graph";
export type {
	CommandResult,
	Counters,
	LogLevel,
	LogLine,
	Route,
	RouteKind,
	RunState,
	SimCommand,
	SimState,
	SimView,
	TrainStatus,
	TrainView,
	ViewSeg,
	WaitReason,
} from "./types";
