import { SignalAspect, type SignalAspectValue } from "./signal-aspects";
import type { TrackKind } from "./track-data";

// ============================================================================
// Human-facing track vocabulary
// ============================================================================
//
// Distinct from the `kindToLabel` table in track-data.ts, which produces the
// class-style names the serializer and `toString` headers use
// ("StraightTrack"). Those names must not reach the UI, so every surface the
// user reads — the Add palette, the hover tooltip, undo labels — resolves its
// wording here instead, and a rewording lands everywhere at once.

/** The two registers each kind needs: a button caption and a sentence noun. */
export interface TrackKindLabels {
	/** Title-case caption for a control or a tooltip heading ("Straight"). */
	short: string;
	/** Lower-case noun phrase to drop into a sentence ("straight track"). */
	phrase: string;
}

const TRACK_KIND_LABELS: Record<TrackKind, TrackKindLabels> = {
	straight: { short: "Straight", phrase: "straight track" },
	curved: { short: "Curved", phrase: "curved track" },
	switch: { short: "Switch", phrase: "switch" },
	signal: { short: "Signal", phrase: "signal" },
	buffer: { short: "Buffer", phrase: "buffer" },
	exit: { short: "Exit", phrase: "exit track" },
	directed: { short: "Directed", phrase: "directed track" },
	crossover: { short: "Crossover", phrase: "crossover" },
	flyover: { short: "Flyover", phrase: "flyover" },
	linked: { short: "Linked", phrase: "linked track" },
	bridgeUnderpass: {
		short: "Bridge / Underpass",
		phrase: "bridge / underpass",
	},
};

/** Title-case caption for `kind` — palette buttons and tooltip headings. */
export function kindToShortLabel(kind: TrackKind): string {
	return TRACK_KIND_LABELS[kind].short;
}

/** Lower-case noun phrase for `kind` — for sentences such as undo labels. */
export function kindToPhrase(kind: TrackKind): string {
	return TRACK_KIND_LABELS[kind].phrase;
}

const SIGNAL_ASPECT_LABELS: Record<SignalAspectValue, string> = {
	[SignalAspect.FOUR_ASPECT]: "4-aspect",
	[SignalAspect.THREE_ASPECT]: "3-aspect",
	[SignalAspect.TWO_ASPECT]: "2-aspect",
	[SignalAspect.SHUNT]: "Shunt",
};

/**
 * Label for a signal's aspect capability. Falls back to the raw number for a
 * value outside the enum, which a hand-edited save file can still carry.
 */
export function aspectToLabel(aspect: number): string {
	return (
		SIGNAL_ASPECT_LABELS[aspect as SignalAspectValue] ?? `${aspect}-aspect`
	);
}

/**
 * Name a subtype tile, qualified by its aspect when one applies — a signal's
 * direction alone doesn't identify it, since the same direction is offered for
 * each aspect.
 *
 * Shared by the palette tile's hover title and its accessible name. Those were
 * once composed separately and drifted: one tested `aspect` for truthiness,
 * and every aspect value is truthy, so all four read "(shunt)".
 */
export function subtypeWithAspect(subtype: string, aspect?: number): string {
	return aspect === undefined
		? subtype
		: `${subtype} (${aspectToLabel(aspect)})`;
}
