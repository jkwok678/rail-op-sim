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
import { SignalAspect } from "./signal-aspects";
import type { TrackData, TrackKind } from "./track-data";
import { isValidSubtype, KIND_META } from "./track-data";

/** Options for constructing a new track's data. */
export interface CreateTrackDataOptions {
	platform1?: boolean;
	platform2?: boolean;
	levelCrossing?: boolean;
	/**
	 * Signal capability type (how many aspects/lights the signal supports).
	 * Only used by the `signal` kind. Defaults to {@link SignalAspect.FOUR_ASPECT}.
	 */
	aspect?: number;
}

/**
 * Build a fully-typed {@link TrackData} for a given kind and subtype, filling
 * in sensible defaults for the kind's required fields.
 *
 * This is the single, type-safe construction point for placing a track — it
 * replaces ad-hoc object literals so the per-kind required fields can never
 * drift out of sync with the {@link TrackData} union.
 *
 * @throws If `subtype` is not a recognised value for `kind`.
 */
export function createTrackData<K extends TrackKind>(
	kind: K,
	subtype: string,
	options?: CreateTrackDataOptions,
): Extract<TrackData, { kind: K }>;
export function createTrackData(
	kind: TrackKind,
	subtype: string,
	options?: CreateTrackDataOptions,
): TrackData;
export function createTrackData(
	kind: TrackKind,
	subtype: string,
	options: CreateTrackDataOptions = {},
): TrackData {
	// Validate subtype for known kinds — unknown kinds are caught by the
	// exhaustiveness check in the switch's default branch.
	if (kind in KIND_META && !isValidSubtype(kind, subtype)) {
		throw new Error(
			`Invalid subtype "${subtype}" for track kind "${kind}". ` +
				`Ensure the subtype matches the kind.`,
		);
	}

	const {
		platform1 = false,
		platform2 = false,
		levelCrossing = false,
		aspect = SignalAspect.FOUR_ASPECT,
	} = options;

	switch (kind) {
		case "straight":
			return {
				kind: "straight",
				subtype: subtype as StraightType,
				platform1,
				platform2,
				levelCrossing,
			};
		case "directed":
			return {
				kind: "directed",
				subtype: subtype as DirectedType,
				platform1,
				platform2,
			};
		case "curved":
			return { kind: "curved", subtype: subtype as CurvedType };
		case "linked":
			return { kind: "linked", subtype: subtype as LinkedType };
		case "exit":
			return { kind: "exit", subtype: subtype as ExitType };
		case "buffer":
			return {
				kind: "buffer",
				subtype: subtype as BufferType,
				platform1,
				platform2,
			};
		case "signal":
			return {
				kind: "signal",
				subtype: subtype as SignalType,
				aspect,
				platform1,
				platform2,
			};
		case "bridgeUnderpass":
			return {
				kind: "bridgeUnderpass",
				subtype: subtype as BridgeUnderpassType,
				platform1,
				platform2,
			};
		case "switch":
			return {
				kind: "switch",
				subtype: subtype as SwitchType,
				platform1,
				platform2,
			};
		case "crossover":
			return { kind: "crossover", subtype: subtype as CrossoverType };
		case "flyover":
			return { kind: "flyover", subtype: subtype as FlyoverType };
		default: {
			// Exhaustiveness guard — a new kind must be handled above.
			const _never: never = kind;
			throw new Error(`Unknown track kind: ${String(_never)}`);
		}
	}
}
