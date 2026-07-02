import { NamedElement, type NamedLocation } from "../element";
import type { TrackData } from "./track-data";
import {
	getLinksForSubtype,
	hasSecondaryPath,
	kindToLabel,
	subtypeToCode,
	supportsLevelCrossing,
	supportsPlatforms,
} from "./track-data";
import {
	DEFAULT_MAIN_LENGTH,
	DEFAULT_MAIN_SPEED,
	DEFAULT_SECONDARY_LENGTH,
	DEFAULT_SECONDARY_SPEED,
} from "./track-color";

// ============================================================================
// Track — single class replacing 11 subclasses via discriminated union
// ============================================================================

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
