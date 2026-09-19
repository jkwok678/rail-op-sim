// Barrel exports for the railway module

// Undo/redo effect journal
export {
	beginRecording,
	type EffectEntry,
	endRecording,
	isRecording,
	redoEntries,
	undoEntries,
} from "./effect-journal";
// Element classes
export {
	Concourse,
	Element,
	NamedElement,
	NamedLocation,
	Parapet,
	Text,
} from "./element";
// Enums
export {
	BridgeUnderpassType,
	BufferType,
	CrossoverType,
	CurvedType,
	DirectedType,
	ExitType,
	FlyoverType,
	LinkedType,
	ParapetType,
	Platform,
	SignalType,
	StraightType,
	SwitchType,
} from "./enums";
// Errors
export {
	ElementAlreadyExistsError,
	ElementNotFoundError,
	LinkedTrackError,
	RailwayError,
	TrackNotConnectedError,
	ZeroTrackError,
} from "./errors";
// Map class
export { Map_ as Map } from "./map";
export type {
	ConnectivityReport,
	DanglingLink,
	LinkedTrackPair,
	LinkedTrackReport,
	PathOptions,
	PreferredDirectionIssue,
	PreferredDirectionIssueReason,
	PreferredDirectionRemovalResult,
	PreferredDirectionResult,
} from "./map/map-connectivity";
export {
	checkAllTracksConnected,
	clearPreferredDirectionsAlongPath,
	collectPreferredDirectionIssues,
	elementNeedsName,
	findPathBetween,
	getConnectivityReport,
	isRailwayComplete,
	LINK_OFFSETS,
	linkIndexForOffset,
	portalMouthLink,
	preferredDirectionIssue,
	resolvePathDirections,
	revalidatePreferredDirections,
	setPreferredDirectionsAlongPath,
} from "./map/map-connectivity";
export type {
	SerializedMap,
	SerializedNamedElement,
	SerializedParapet,
	SerializedText,
	SerializedTrack,
} from "./map/map-serialization";
export {
	deserializeMap,
	SERIALIZED_MAP_VERSION,
	serializeMap,
} from "./map/map-serialization";
// Timetable — locations a service can be booked to
export {
	cellToLocation,
	getExitCells,
	getLocationNames,
	getStartableCells,
	locationToCell,
	trackAtCell,
} from "./timetable/locations";
// Timetable — save / load
export {
	createDefaultTrainSpec,
	createEmptyTimetable,
	InvalidTimetableError,
	parseTimetable,
	SERIALIZED_TIMETABLE_VERSION,
	type SerializedTimetable,
} from "./timetable/serialization";
// Timetable — clock arithmetic
export {
	dayOffset,
	formatDuration,
	formatSimTime,
	formatWallClock,
	InvalidTimeError,
	parseSimTime,
	SECONDS_PER_DAY,
	type SimTime,
	tryParseSimTime,
} from "./timetable/time";
// Timetable — the data model
export type {
	Action,
	Cell,
	FinishAction,
	IntermediateAction,
	Repeat,
	Service,
	ServiceRef,
	StartAction,
	Timetable,
	TrainSpec,
} from "./timetable/types";
export {
	actionLocation,
	actionTime,
	createsTrain,
	FINISH_KINDS,
	INTERMEDIATE_KINDS,
	isFinishAction,
	isIntermediateAction,
	isShuttleAction,
	isStartAction,
	MAX_SERVICE_REF_LENGTH,
	SHUTTLE_KINDS,
	START_KINDS,
	TRAIN_CREATING_KINDS,
} from "./timetable/types";
// Timetable — validation
export type { TimetableIssue } from "./timetable/validate";
export {
	hasErrors,
	issuesForService,
	validateTimetable,
	validateTimetableAgainstMap,
	validateTimetableStructure,
} from "./timetable/validate";
export type {
	CreateTrackDataOptions,
	PreferredDirection,
	SignalAspectValue,
	TrackColorState,
	TrackData,
	TrackDirectionality,
	TrackKind,
	TrackKindMeta,
} from "./track";
// Track class
export {
	createTrackData,
	DEFAULT_MAIN_LENGTH,
	DEFAULT_MAIN_SPEED,
	DEFAULT_SECONDARY_LENGTH,
	DEFAULT_SECONDARY_SPEED,
	getDirectedFlow,
	getLinksForSubtype,
	getTrackColorState,
	hasSecondaryPath,
	isTraversableLinkPair,
	isValidSubtype,
	KIND_META,
	kindToLabel,
	SignalAspect,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
	TRACK_COLOR_ALPHA,
	TRACK_COLOR_BOTH,
	TRACK_COLOR_LENGTH,
	TRACK_COLOR_SPEED,
	Track,
} from "./track";
// Types
export type {
	FontInfo,
	MessageCallback,
	Point,
	TextSelectionPrompt,
} from "./types";
// Units
export {
	formatImperialLength,
	kmhToMph,
	metresToImperial,
	round1,
} from "./units";
