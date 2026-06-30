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
import type { TrackData, TrackKind } from "./track-data";
import { isValidSubtype, KIND_META } from "./track-data";
import { SignalAspect } from "./signal-aspects";

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
				kind,
				subtype: subtype as StraightType,
				platform1,
				platform2,
				levelCrossing,
			};
		case "directed":
			return {
				kind,
				subtype: subtype as DirectedType,
				platform1,
				platform2,
			};
		case "curved":
			return { kind, subtype: subtype as CurvedType };
		case "linked":
			return { kind, subtype: subtype as LinkedType };
		case "exit":
			return { kind, subtype: subtype as ExitType };
		case "buffer":
			return {
				kind,
				subtype: subtype as BufferType,
				platform1,
				platform2,
			};
		case "signal":
			return {
				kind,
				subtype: subtype as SignalType,
				aspect,
				platform1,
				platform2,
			};
		case "bridgeUnderpass":
			return {
				kind,
				subtype: subtype as BridgeUnderpassType,
				platform1,
				platform2,
			};
		case "switch":
			return {
				kind,
				subtype: subtype as SwitchType,
				platform1,
				platform2,
			};
		case "crossover":
			return { kind, subtype: subtype as CrossoverType };
		case "flyover":
			return { kind, subtype: subtype as FlyoverType };
		default: {
			// Exhaustiveness guard — a new kind must be handled above.
			const _never: never = kind;
			throw new Error(`Unknown track kind: ${String(_never)}`);
		}
	}
}
