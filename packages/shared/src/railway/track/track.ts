import { NamedElement, type NamedLocation } from "../element";
import {
	DEFAULT_MAIN_LENGTH,
	DEFAULT_MAIN_SPEED,
	DEFAULT_SECONDARY_LENGTH,
	DEFAULT_SECONDARY_SPEED,
} from "./track-color";
import type { TrackData } from "./track-data";
import {
	getLinksForSubtype,
	hasSecondaryPath,
	isTraversableLinkPair,
	kindToLabel,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
} from "./track-data";

// ============================================================================
// Track — single class replacing 11 subclasses via discriminated union
// ============================================================================

/**
 * A preferred travel direction across a track, expressed as an entry→exit pair
 * of link indices (0–8). Mirrors railway-dot-exe's TPrefDirElement ELink/XLink
 * model: one pair = one travel direction; two mirrored pairs = bidirectional.
 * Distinct pairs keep switch routes unambiguous (e.g. 3→5 vs 3→8).
 */
export interface PreferredDirection {
	/** Link index (0–8) the train enters from. */
	entry: number;
	/** Link index (0–8) the train exits toward. */
	exit: number;
}

/**
 * Whether the routes recorded through one track cell run one way, both ways,
 * or — on multi-route cells such as switches and crossovers — a mix of the two.
 * See {@link Track.getDirectionality}.
 */
export type TrackDirectionality =
	| "none"
	| "one-way"
	| "bidirectional"
	| "mixed";

/**
 * @brief Single Track class. Type-specific behaviour is driven by `data.kind`.
 *
 * Link grid layout (index 4 unused):
 * ```
 * 0 1 2     top-left,    top,      top-right
 * 3 4 5  =  left,        (unused), right
 * 6 7 8     bottom-left, bottom,   bottom-right
 * ```
 */
export class Track extends NamedElement {
	/** Type-specific data (reference is readonly; mutable fields via setters). */
	readonly data: TrackData;

	trackMainSpeed: number = DEFAULT_MAIN_SPEED;
	trackMainLength: number = DEFAULT_MAIN_LENGTH;
	trackSecondarySpeed: number;
	trackSecondaryLength: number;
	/** Bitmask of active link indices (bit i = 1 → link i is active). */
	readonly linkMask: number;

	/**
	 * Preferred travel directions as entry→exit link pairs; empty = none set.
	 * Mirrors ROS ELink/XLink. Placement-time identity (like {@link trackMainSpeed}),
	 * so it lives as a top-level field and is not touched by {@link restoreDefaults}.
	 */
	preferredDirections: PreferredDirection[] = [];

	linkedNamedLocation: NamedLocation | null = null;
	found: boolean = false;

	/** Only used when data.kind === "linked" */
	otherLinkedTrack: Track | null = null;

	constructor(data: TrackData, x: number, y: number) {
		super(x, y);
		this.data = data;

		// Compute secondary path defaults
		if (hasSecondaryPath(data.kind)) {
			this.trackSecondarySpeed = DEFAULT_SECONDARY_SPEED;
			this.trackSecondaryLength = DEFAULT_SECONDARY_LENGTH;
		} else {
			this.trackSecondarySpeed = -1;
			this.trackSecondaryLength = -1;
		}

		// Build link bitmask (each active link sets its corresponding bit)
		let mask = 0;
		for (const idx of getLinksForSubtype(data.kind, data.subtype)) {
			mask |= 1 << idx;
		}
		this.linkMask = mask;
	}

	// ── Speed / Length accessors ────────────────────────────────────────

	getTrackMainSpeed(): number {
		return this.trackMainSpeed;
	}

	getTrackMainLength(): number {
		return this.trackMainLength;
	}

	getTrackSecondarySpeed(): number {
		return this.trackSecondarySpeed;
	}

	getTrackSecondaryLength(): number {
		return this.trackSecondaryLength;
	}

	setTrackMainSpeed(v: number): void {
		this.trackMainSpeed = v;
	}

	setTrackMainLength(v: number): void {
		this.trackMainLength = v;
	}

	setTrackSecondarySpeed(v: number): void {
		if (hasSecondaryPath(this.data.kind)) {
			this.trackSecondarySpeed = v;
		}
	}

	setTrackSecondaryLength(v: number): void {
		if (hasSecondaryPath(this.data.kind)) {
			this.trackSecondaryLength = v;
		}
	}

	/** Reset speed/length to defaults (200/100). Secondary only reset when applicable. */
	restoreDefaults(): void {
		this.trackMainSpeed = DEFAULT_MAIN_SPEED;
		this.trackMainLength = DEFAULT_MAIN_LENGTH;
		if (hasSecondaryPath(this.data.kind)) {
			this.trackSecondarySpeed = DEFAULT_SECONDARY_SPEED;
			this.trackSecondaryLength = DEFAULT_SECONDARY_LENGTH;
		}
	}

	mainSpeedLengthToString(): string {
		return `${this.trackMainSpeed},${this.trackMainLength}`;
	}

	secondarySpeedLengthToString(): string {
		return `${this.trackSecondarySpeed},${this.trackSecondaryLength}`;
	}

	// ── Link accessors ──────────────────────────────────────────────────

	getLinkAt(link: number): boolean {
		return (this.linkMask & (1 << link)) !== 0;
	}

	// ── Preferred direction accessors ───────────────────────────────────

	getPreferredDirections(): readonly PreferredDirection[] {
		return this.preferredDirections;
	}

	/**
	 * True when `link` is the dead-end edge of a single-connection terminus
	 * (buffer/exit/portal): the edge geometrically opposite its one active link
	 * (`8 - only`, the centre index 4 excluded). A preferred direction may point
	 * into that edge even though no track connects there, so a route terminating
	 * at a buffer still records a travel direction — matching railway-dot-exe,
	 * which sends the PrefDir into the buffer stop. Linked tracks use the same
	 * mouth as the portal hop; it is not a place a route may end.
	 */
	isTerminusDeadEnd(link: number): boolean {
		if (link === 4) return false;
		// Exactly one active link ⇔ linkMask is a non-zero power of two.
		if (this.linkMask === 0 || (this.linkMask & (this.linkMask - 1)) !== 0) {
			return false;
		}
		const only = Math.log2(this.linkMask);
		return link === 8 - only;
	}

	/**
	 * Add an entry→exit preferred-direction pair. No-op (returns false) unless
	 * each of entry/exit is either an active link or the dead-end edge of a
	 * terminus (see {@link isTerminusDeadEnd}), *and* the pair is a path a train
	 * can actually run (see {@link isTraversableLinkPair}) — which rejects the
	 * impossible turn between the two independent paths of a crossover/flyover
	 * and a direction running against a one-way `directed` track. Identical
	 * pairs are deduped.
	 */
	addPreferredDirection(entry: number, exit: number): boolean {
		const usable = (link: number): boolean =>
			this.getLinkAt(link) || this.isTerminusDeadEnd(link);
		if (!usable(entry) || !usable(exit)) return false;
		if (
			!isTraversableLinkPair(
				this.data.kind,
				this.data.subtype,
				entry,
				exit,
				true,
			)
		) {
			return false;
		}
		if (
			this.preferredDirections.some((p) => p.entry === entry && p.exit === exit)
		) {
			return false;
		}
		this.preferredDirections.push({ entry, exit });
		return true;
	}

	/**
	 * Remove one entry→exit preferred-direction pair. Returns false when that
	 * exact pair was not set — the mirrored pair (exit→entry) is left alone, so
	 * undoing one direction of a two-way route leaves the other running.
	 */
	removePreferredDirection(entry: number, exit: number): boolean {
		const i = this.preferredDirections.findIndex(
			(p) => p.entry === entry && p.exit === exit,
		);
		if (i === -1) return false;
		this.preferredDirections.splice(i, 1);
		return true;
	}

	clearPreferredDirections(): void {
		this.preferredDirections = [];
	}

	hasPreferredDirection(): boolean {
		return this.preferredDirections.length > 0;
	}

	/**
	 * True when the entry→exit pair `p` is also recorded in reverse, i.e. that
	 * one route can be run both ways. On a switch, crossover or flyover each
	 * route is judged independently — a cell can hold both mirrored and
	 * one-way pairs.
	 */
	isDirectionMirrored(p: PreferredDirection): boolean {
		return this.preferredDirections.some(
			(q) => q.entry === p.exit && q.exit === p.entry,
		);
	}

	/**
	 * How the recorded routes through this cell run, as a whole:
	 * - `"none"` — no preferred directions set
	 * - `"one-way"` — no route is mirrored
	 * - `"bidirectional"` — every route is mirrored
	 * - `"mixed"` — some routes are mirrored and some are not, which only
	 *   multi-route cells (switches, crossovers, flyovers) can reach
	 *
	 * Use {@link isDirectionMirrored} for the per-route answer within a cell.
	 */
	getDirectionality(): TrackDirectionality {
		if (this.preferredDirections.length === 0) return "none";
		let mirrored = 0;
		for (const p of this.preferredDirections) {
			if (this.isDirectionMirrored(p)) mirrored++;
		}
		if (mirrored === 0) return "one-way";
		if (mirrored === this.preferredDirections.length) return "bidirectional";
		return "mixed";
	}

	/** True when every route through this cell can be run both ways. */
	isBidirectional(): boolean {
		return this.getDirectionality() === "bidirectional";
	}

	// ── NamedLocation linkage ───────────────────────────────────────────

	hasLinkedNamedLocation(): boolean {
		return this.linkedNamedLocation !== null;
	}

	getLinkedNamedLocation(): NamedLocation | null {
		return this.linkedNamedLocation;
	}

	setLinkedNamedLocation(nl: NamedLocation | null): void {
		this.linkedNamedLocation = nl;
	}

	// ── Found flag (for connectivity traversal) ─────────────────────────

	getFound(): boolean {
		return this.found;
	}

	setFound(f: boolean): void {
		this.found = f;
	}

	// ── Platform accessors (conditional on kind) ────────────────────────

	/** Helper narrows this.data to a platform-capable variant, or returns null. */
	private platformData(): { platform1: boolean; platform2: boolean } | null {
		const d = this.data;
		switch (d.kind) {
			case "straight":
			case "directed":
			case "buffer":
			case "signal":
			case "bridgeUnderpass":
			case "switch":
				return d;
			default:
				return null;
		}
	}

	hasPlatform(): boolean {
		const pd = this.platformData();
		return pd !== null && (pd.platform1 || pd.platform2);
	}

	getPlatform1(): boolean {
		return this.platformData()?.platform1 ?? false;
	}

	setPlatform1(val: boolean): void {
		const pd = this.platformData();
		if (pd) pd.platform1 = val;
	}

	getPlatform2(): boolean {
		return this.platformData()?.platform2 ?? false;
	}

	setPlatform2(val: boolean): void {
		const pd = this.platformData();
		if (pd) pd.platform2 = val;
	}

	platformsToString(): string {
		return `${Number(this.getPlatform1())},${Number(this.getPlatform2())}`;
	}

	// ── Level crossing (straight only) ──────────────────────────────────

	hasLevelCrossing(): boolean {
		if (this.data.kind === "straight") {
			return this.data.levelCrossing;
		}
		return false;
	}

	addLevelCrossing(): void {
		if (this.data.kind === "straight") {
			this.data.levelCrossing = true;
		}
	}

	removeLevelCrossing(): void {
		if (this.data.kind === "straight") {
			this.data.levelCrossing = false;
		}
	}

	levelCrossingToString(): string {
		return `${Number(this.hasLevelCrossing())}`;
	}

	// ── Signal aspect (signal only) ─────────────────────────────────────

	getAspect(): number {
		return this.data.kind === "signal" ? this.data.aspect : -1;
	}

	aspectToString(): string {
		return this.data.kind === "signal" ? `${this.data.aspect}` : "";
	}

	// ── Linked track accessors ──────────────────────────────────────────

	isLinked(): boolean {
		return this.otherLinkedTrack !== null;
	}

	getOtherLinkedTrack(): Track | null {
		return this.otherLinkedTrack;
	}

	setOtherLinkedTrack(t: Track | null): void {
		this.otherLinkedTrack = t;
	}

	removeOtherLinkedTrack(): void {
		this.otherLinkedTrack = null;
	}

	// ── Subtype code ────────────────────────────────────────────────────

	/** Short code for serialization (e.g. "SH", "C1", "SWT3"). */
	subtypeCode(): string {
		return subtypeToCode(this.data.kind, this.data.subtype);
	}

	/** Human-readable kind label (e.g. "StraightTrack"). */
	kindLabel(): string {
		return kindToLabel(this.data.kind);
	}

	// ── Linked track helpers ────────────────────────────────────────────

	private otherLinkedTrackToString(): string {
		const other = this.otherLinkedTrack;
		if (!other) return "";
		return `LinkedTrack,${other.subtypeCode()},${other.locationToString()},${this.mainSpeedLengthToString()}`;
	}

	private otherLinkedTrackToSaveString(): string {
		const other = this.otherLinkedTrack;
		if (!other) return "";
		return `${other.subtypeCode()},${other.locationToString()},${other.getTrackMainSpeed()},${other.getTrackMainLength()}`;
	}

	// ── CSV escaping ────────────────────────────────────────────────────

	private escapeCSV(s: string): string {
		// Escape backslashes, commas, newlines, and other control characters
		if (/[,\\\n\r\t]/.test(s)) {
			return s
				.replace(/\\/g, "\\\\")
				.replace(/,/g, "\\,")
				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/\t/g, "\\t");
		}
		return s;
	}

	// ── Serialization ───────────────────────────────────────────────────

	/**
	 * Build the shared field list used by both toString and toSaveString.
	 * Each entry is a comma-joined string of fields for one logical group.
	 */
	private serializeFieldGroups(): string[] {
		const groups: string[] = [];

		// Signal aspect (before coordinates)
		if (this.data.kind === "signal") {
			groups.push(`${this.data.aspect}`);
		}

		// Coordinates + main speed/length
		groups.push(
			`${this.locationToString()},${this.getTrackMainSpeed()},${this.getTrackMainLength()}`,
		);

		// Secondary speed/length
		if (hasSecondaryPath(this.data.kind)) {
			groups.push(
				`${this.getTrackSecondarySpeed()},${this.getTrackSecondaryLength()}`,
			);
		}

		// Platform flags
		if (supportsPlatforms(this.data.kind)) {
			groups.push(this.platformsToString());
		}

		// Level crossing
		if (supportsLevelCrossing(this.data.kind)) {
			groups.push(this.levelCrossingToString());
		}

		// Linked track info
		if (this.data.kind === "linked") {
			if (this.isLinked()) {
				groups.push(`1,${this.otherLinkedTrackToSaveString()}`);
			} else {
				groups.push("0");
			}
		}

		return groups;
	}

	/** @returns human-readable string representation */
	toString(): string {
		const parts = [
			`${this.kindLabel()},${this.subtypeCode()}`,
			...this.serializeFieldGroups(),
		];

		// Linked track (human-readable format)
		// Override: linked uses different format in toString
		if (this.data.kind === "linked" && this.isLinked()) {
			// replace last group with human-readable linked track format
			const linkIdx = parts.length - 1;
			parts[linkIdx] = `1,${this.otherLinkedTrackToString()}`;
		}

		// Text label
		const txt = this.getText();
		if (txt) {
			parts.push(txt.toString());
		}

		return parts.join(",");
	}

	/** @returns file-save format string */
	toSaveString(): string {
		const parts = [this.subtypeCode(), ...this.serializeFieldGroups()];

		// Text label (escaped)
		const txt = this.getText();
		if (txt) {
			parts.push(this.escapeCSV(txt.getReadableText()));
		}

		return parts.join(",");
	}
}
