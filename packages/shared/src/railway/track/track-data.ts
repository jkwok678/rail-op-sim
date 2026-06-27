import type {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	SignalType,
	StraightType,
	SwitchType,
} from "../enums";

// ============================================================================
// TrackData — discriminated union of all track-type-specific data
// ============================================================================

export type TrackData =
	| {
			kind: "straight";
			subtype: StraightType;
			platform1: boolean;
			platform2: boolean;
			levelCrossing: boolean;
	  }
	| {
			kind: "directed";
			subtype: DirectedType;
			platform1: boolean;
			platform2: boolean;
	  }
	| { kind: "curved"; subtype: CurvedType }
	| {
			kind: "linked";
			subtype: LinkedType;
	  }
	| { kind: "exit"; subtype: ExitType }
	| {
			kind: "buffer";
			subtype: BufferType;
			platform1: boolean;
			platform2: boolean;
	  }
	| {
			kind: "signal";
			subtype: SignalType;
			aspect: number;
			platform1: boolean;
			platform2: boolean;
	  }
	| {
			kind: "bridgeUnderpass";
			subtype: BridgeUnderpassType;
			platform1: boolean;
			platform2: boolean;
	  }
	| {
			kind: "switch";
			subtype: SwitchType;
			platform1: boolean;
			platform2: boolean;
	  }
	| { kind: "crossover"; subtype: CrossoverType }
	| { kind: "flyover"; subtype: FlyoverType };

export type TrackKind = TrackData["kind"];

// ============================================================================
// TrackKindMeta — single source of truth for per-kind behavioral flags
// ============================================================================

export interface TrackKindMeta {
	hasSecondaryPath: boolean;
	supportsPlatforms: boolean;
	supportsLevelCrossing: boolean;
	/** Subtypes that can accept a NamedLocation (empty = none). */
	canAddNamedLocationSubtypes: readonly string[];
}

export const KIND_META: Record<TrackKind, TrackKindMeta> = {
	straight: {
		hasSecondaryPath: false,
		supportsPlatforms: true,
		supportsLevelCrossing: true,
		canAddNamedLocationSubtypes: ["STRAIGHTH", "STRAIGHTV"],
	},
	directed: {
		hasSecondaryPath: false,
		supportsPlatforms: true,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [
			"DIRECTEDLEFT",
			"DIRECTEDRIGHT",
			"DIRECTEDUP",
			"DIRECTEDDOWN",
		],
	},
	curved: {
		hasSecondaryPath: false,
		supportsPlatforms: false,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [
			"CURVE1",
			"CURVE2",
			"CURVE3",
			"CURVE4",
			"CURVE5",
			"CURVE6",
			"CURVE7",
			"CURVE8",
		],
	},
	linked: {
		hasSecondaryPath: false,
		supportsPlatforms: false,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [],
	},
	exit: {
		hasSecondaryPath: false,
		supportsPlatforms: false,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [
			"EXITLEFT",
			"EXITRIGHT",
			"EXITUP",
			"EXITDOWN",
		],
	},
	buffer: {
		hasSecondaryPath: false,
		supportsPlatforms: true,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [
			"BUFFERLEFT",
			"BUFFERRIGHT",
			"BUFFERUP",
			"BUFFERDOWN",
		],
	},
	signal: {
		hasSecondaryPath: false,
		supportsPlatforms: true,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [],
	},
	bridgeUnderpass: {
		hasSecondaryPath: false,
		supportsPlatforms: true,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [],
	},
	switch: {
		hasSecondaryPath: true,
		supportsPlatforms: true,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [],
	},
	crossover: {
		hasSecondaryPath: true,
		supportsPlatforms: false,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [],
	},
	flyover: {
		hasSecondaryPath: true,
		supportsPlatforms: false,
		supportsLevelCrossing: false,
		canAddNamedLocationSubtypes: [],
	},
};

// ============================================================================
// Link configuration tables
// ============================================================================
// Each entry maps a subtype enum string value to the list of link indices (0-8)
// that are active for that track subtype. Indices follow the grid layout:
//   0 1 2     top-left,    top,      top-right
//   3 4 5  =  left,        (unused), right
//   6 7 8     bottom-left, bottom,   bottom-right

type SubtypeKey = string;

const STRAIGHT_LINKS: Record<SubtypeKey, number[]> = {
	STRAIGHTH: [3, 5],
	STRAIGHTV: [1, 7],
	STRAIGHTLEFTUP: [0, 8],
	STRAIGHTRIGHTUP: [2, 6],
};

const DIRECTED_LINKS: Record<SubtypeKey, number[]> = {
	DIRECTEDLEFT: [3, 5],
	DIRECTEDRIGHT: [3, 5],
	DIRECTEDUP: [1, 7],
	DIRECTEDDOWN: [1, 7],
	DIRECTEDLEFTUP: [0, 8],
	DIRECTEDRIGHTDOWN: [0, 8],
	DIRECTEDRIGHTUP: [2, 6],
	DIRECTEDLEFTDOWN: [2, 6],
};

const CURVED_LINKS: Record<SubtypeKey, number[]> = {
	// Tight (90°) curves
	TIGHTCURVE1: [5, 7],
	TIGHTCURVE2: [3, 7],
	TIGHTCURVE3: [1, 5],
	TIGHTCURVE4: [1, 3],
	// Wide (135°) curves
	CURVE1: [5, 6],
	CURVE2: [3, 8],
	CURVE3: [0, 5],
	CURVE4: [2, 3],
	CURVE5: [1, 8],
	CURVE6: [1, 6],
	CURVE7: [2, 7],
	CURVE8: [0, 7],
};

const LINKED_LINKS: Record<SubtypeKey, number[]> = {
	LINKLEFT: [5],
	LINKRIGHT: [3],
	LINKUP: [7],
	LINKDOWN: [1],
	LINKLEFTUP: [8],
	LINKRIGHTDOWN: [0],
	LINKLEFTDOWN: [2],
	LINKRIGHTUP: [6],
};

const EXIT_LINKS: Record<SubtypeKey, number[]> = {
	EXITLEFT: [5],
	EXITRIGHT: [3],
	EXITUP: [7],
	EXITDOWN: [1],
	EXITLEFTUP: [8],
	EXITRIGHTUP: [6],
	EXITLEFTDOWN: [2],
	EXITRIGHTDOWN: [0],
};

const BUFFER_LINKS: Record<SubtypeKey, number[]> = {
	BUFFERLEFT: [5],
	BUFFERRIGHT: [3],
	BUFFERUP: [7],
	BUFFERDOWN: [1],
	BUFFERLEFTUP: [8],
	BUFFERRIGHTUP: [6],
	BUFFERLEFTDOWN: [2],
	BUFFERRIGHTDOWN: [0],
};

const SIGNAL_LINKS: Record<SubtypeKey, number[]> = {
	SIGNALLEFT: [3, 5],
	SIGNALRIGHT: [3, 5],
	SIGNALUP: [1, 7],
	SIGNALDOWN: [1, 7],
	SIGNALLEFTUP: [0, 8],
	SIGNALRIGHTDOWN: [0, 8],
	SIGNALRIGHTUP: [2, 6],
	SIGNALLEFTDOWN: [2, 6],
};

const BRIDGE_UNDERPASS_LINKS: Record<SubtypeKey, number[]> = {
	BRIDGE1: [3, 5],
	UNDERPASS1: [3, 5],
	BRIDGE2: [1, 7],
	UNDERPASS2: [1, 7],
};

const SWITCH_LINKS: Record<SubtypeKey, number[]> = {
	SWITCHTIGHT1: [1, 3, 5],
	SWITCHTIGHT2: [1, 3, 5],
	SWITCHTIGHT3: [3, 5, 7],
	SWITCHTIGHT4: [3, 5, 7],
	SWITCHTIGHT5: [1, 3, 7],
	SWITCHTIGHT6: [1, 5, 7],
	SWITCHTIGHT7: [1, 3, 7],
	SWITCHTIGHT8: [1, 5, 7],
	SWITCHSPLIT1: [2, 3, 8],
	SWITCHSPLIT2: [0, 5, 6],
	SWITCHSPLIT3: [2, 3, 7],
	SWITCHSPLIT4: [1, 5, 6],
	SWITCHSPLIT5: [1, 3, 8],
	SWITCHSPLIT6: [0, 5, 7],
	SWITCHSPLIT7: [0, 2, 7],
	SWITCHSPLIT8: [1, 6, 8],
	SWITCH1: [2, 3, 5],
	SWITCH2: [0, 3, 5],
	SWITCH3: [3, 5, 8],
	SWITCH4: [3, 5, 6],
	SWITCH5: [0, 1, 7],
	SWITCH6: [1, 2, 7],
	SWITCH7: [1, 6, 7],
	SWITCH8: [1, 7, 8],
	SWITCH9: [0, 1, 8],
	SWITCH10: [1, 2, 6],
	SWITCH11: [2, 6, 7],
	SWITCH12: [0, 7, 8],
	SWITCH13: [0, 3, 8],
	SWITCH14: [2, 5, 6],
	SWITCH15: [2, 3, 6],
	SWITCH16: [0, 5, 8],
};

const CROSSOVER_LINKS: Record<SubtypeKey, number[]> = {
	CROSSOVER1: [1, 3, 5, 7],
	CROSSOVER2: [0, 2, 6, 8],
	CROSSOVER3: [0, 1, 7, 8],
	CROSSOVER4: [1, 2, 6, 7],
	CROSSOVER5: [0, 3, 5, 8],
	CROSSOVER6: [2, 3, 5, 6],
};

const FLYOVER_LINKS: Record<SubtypeKey, number[]> = {
	FLYOVER1: [1, 3, 5, 7],
	FLYOVER2: [1, 3, 5, 7],
	FLYOVER3: [0, 2, 6, 8],
	FLYOVER4: [0, 2, 6, 8],
	FLYOVER5: [0, 1, 7, 8],
	FLYOVER6: [1, 2, 6, 7],
	FLYOVER7: [0, 1, 7, 8],
	FLYOVER8: [1, 2, 6, 7],
	FLYOVER9: [0, 3, 5, 8],
	FLYOVER10: [2, 3, 5, 6],
	FLYOVER11: [0, 3, 5, 8],
	FLYOVER12: [2, 3, 5, 6],
};

// Unified link table (mirrors CODE_TABLES pattern below)
const LINK_TABLES: Record<TrackKind, Record<SubtypeKey, number[]>> = {
	straight: STRAIGHT_LINKS,
	directed: DIRECTED_LINKS,
	curved: CURVED_LINKS,
	linked: LINKED_LINKS,
	exit: EXIT_LINKS,
	buffer: BUFFER_LINKS,
	signal: SIGNAL_LINKS,
	bridgeUnderpass: BRIDGE_UNDERPASS_LINKS,
	switch: SWITCH_LINKS,
	crossover: CROSSOVER_LINKS,
	flyover: FLYOVER_LINKS,
};

/** Map from subtype enum value → active link indices for every track kind. */
export function getLinksForSubtype(
	kind: TrackKind,
	subtype: SubtypeKey,
): number[] {
	return LINK_TABLES[kind]?.[subtype] ?? [];
}

/** Whether a track kind has a secondary path (separate speed/length). */
export function hasSecondaryPath(kind: TrackKind): boolean {
	return KIND_META[kind].hasSecondaryPath;
}

/** Whether a track kind supports platforms. */
export function supportsPlatforms(kind: TrackKind): boolean {
	return KIND_META[kind].supportsPlatforms;
}

/** Whether a track kind supports level crossings. */
export function supportsLevelCrossing(kind: TrackKind): boolean {
	return KIND_META[kind].supportsLevelCrossing;
}

// ============================================================================
// Subtype → short code mappings (for toString / toSaveString)
// ============================================================================

const STRAIGHT_CODES: Record<SubtypeKey, string> = {
	STRAIGHTH: "SH",
	STRAIGHTV: "SV",
	STRAIGHTLEFTUP: "SLU",
	STRAIGHTRIGHTUP: "SRU",
};

const DIRECTED_CODES: Record<SubtypeKey, string> = {
	DIRECTEDLEFT: "DL",
	DIRECTEDRIGHT: "DR",
	DIRECTEDUP: "DU",
	DIRECTEDDOWN: "DD",
	DIRECTEDLEFTUP: "DLU",
	DIRECTEDRIGHTUP: "DRU",
	DIRECTEDLEFTDOWN: "DLD",
	DIRECTEDRIGHTDOWN: "DRD",
};

const CURVED_CODES: Record<SubtypeKey, string> = {
	TIGHTCURVE1: "TC1",
	TIGHTCURVE2: "TC2",
	TIGHTCURVE3: "TC3",
	TIGHTCURVE4: "TC4",
	CURVE1: "C1",
	CURVE2: "C2",
	CURVE3: "C3",
	CURVE4: "C4",
	CURVE5: "C5",
	CURVE6: "C6",
	CURVE7: "C7",
	CURVE8: "C8",
};

const LINKED_CODES: Record<SubtypeKey, string> = {
	LINKLEFT: "LL",
	LINKRIGHT: "LR",
	LINKUP: "LU",
	LINKDOWN: "LD",
	LINKLEFTUP: "LLU",
	LINKRIGHTUP: "LRU",
	LINKLEFTDOWN: "LLD",
	LINKRIGHTDOWN: "LRD",
};

const EXIT_CODES: Record<SubtypeKey, string> = {
	EXITLEFT: "EL",
	EXITRIGHT: "ER",
	EXITUP: "EU",
	EXITDOWN: "ED",
	EXITLEFTUP: "ELU",
	EXITRIGHTUP: "ERU",
	EXITLEFTDOWN: "ELD",
	EXITRIGHTDOWN: "ERD",
};

const BUFFER_CODES: Record<SubtypeKey, string> = {
	BUFFERLEFT: "BL",
	BUFFERRIGHT: "BR",
	BUFFERUP: "BU",
	BUFFERDOWN: "BD",
	BUFFERLEFTUP: "BLU",
	BUFFERRIGHTUP: "BRU",
	BUFFERLEFTDOWN: "BLD",
	BUFFERRIGHTDOWN: "BRD",
};

const SIGNAL_CODES: Record<SubtypeKey, string> = {
	SIGNALLEFT: "SIGL",
	SIGNALRIGHT: "SIGR",
	SIGNALUP: "SIGU",
	SIGNALDOWN: "SIGD",
	SIGNALLEFTUP: "SIGLU",
	SIGNALRIGHTUP: "SIGRU",
	SIGNALLEFTDOWN: "SIGLD",
	SIGNALRIGHTDOWN: "SIGRD",
};

const BRIDGE_UNDERPASS_CODES: Record<SubtypeKey, string> = {
	BRIDGE1: "BR1",
	BRIDGE2: "BR2",
	UNDERPASS1: "UP1",
	UNDERPASS2: "UP2",
};

const SWITCH_CODES: Record<SubtypeKey, string> = {
	SWITCHTIGHT1: "SWT1",
	SWITCHTIGHT2: "SWT2",
	SWITCHTIGHT3: "SWT3",
	SWITCHTIGHT4: "SWT4",
	SWITCHTIGHT5: "SWT5",
	SWITCHTIGHT6: "SWT6",
	SWITCHTIGHT7: "SWT7",
	SWITCHTIGHT8: "SWT8",
	SWITCHSPLIT1: "SWS1",
	SWITCHSPLIT2: "SWS2",
	SWITCHSPLIT3: "SWS3",
	SWITCHSPLIT4: "SWS4",
	SWITCHSPLIT5: "SWS5",
	SWITCHSPLIT6: "SWS6",
	SWITCHSPLIT7: "SWS7",
	SWITCHSPLIT8: "SWS8",
	SWITCH1: "SW1",
	SWITCH2: "SW2",
	SWITCH3: "SW3",
	SWITCH4: "SW4",
	SWITCH5: "SW5",
	SWITCH6: "SW6",
	SWITCH7: "SW7",
	SWITCH8: "SW8",
	SWITCH9: "SW9",
	SWITCH10: "SW10",
	SWITCH11: "SW11",
	SWITCH12: "SW12",
	SWITCH13: "SW13",
	SWITCH14: "SW14",
	SWITCH15: "SW15",
	SWITCH16: "SW16",
};

const CROSSOVER_CODES: Record<SubtypeKey, string> = {
	CROSSOVER1: "CR1",
	CROSSOVER2: "CR2",
	CROSSOVER3: "CR3",
	CROSSOVER4: "CR4",
	CROSSOVER5: "CR5",
	CROSSOVER6: "CR6",
};

const FLYOVER_CODES: Record<SubtypeKey, string> = {
	FLYOVER1: "F1",
	FLYOVER2: "F2",
	FLYOVER3: "F3",
	FLYOVER4: "F4",
	FLYOVER5: "F5",
	FLYOVER6: "F6",
	FLYOVER7: "F7",
	FLYOVER8: "F8",
	FLYOVER9: "F9",
	FLYOVER10: "F10",
	FLYOVER11: "F11",
	FLYOVER12: "F12",
};

const CODE_TABLES: Record<TrackKind, Record<SubtypeKey, string>> = {
	straight: STRAIGHT_CODES,
	directed: DIRECTED_CODES,
	curved: CURVED_CODES,
	linked: LINKED_CODES,
	exit: EXIT_CODES,
	buffer: BUFFER_CODES,
	signal: SIGNAL_CODES,
	bridgeUnderpass: BRIDGE_UNDERPASS_CODES,
	switch: SWITCH_CODES,
	crossover: CROSSOVER_CODES,
	flyover: FLYOVER_CODES,
};

/** Convert a subtype enum value to its short string code for serialization. */
export function subtypeToCode(kind: TrackKind, subtype: SubtypeKey): string {
	return CODE_TABLES[kind][subtype] ?? subtype;
}

// ============================================================================
// Kind name constants (for toString headers)
// ============================================================================

const KIND_LABELS: Record<TrackKind, string> = {
	straight: "StraightTrack",
	directed: "DirectedTrack",
	curved: "CurvedTrack",
	linked: "LinkedTrack",
	exit: "ExitTrack",
	buffer: "BufferTrack",
	signal: "SignalTrack",
	bridgeUnderpass: "BridgeUnderpassTrack",
	switch: "SwitchTrack",
	crossover: "CrossoverTrack",
	flyover: "FlyoverTrack",
};

export function kindToLabel(kind: TrackKind): string {
	return KIND_LABELS[kind];
}
