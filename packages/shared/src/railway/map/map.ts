import { record, recordField } from "../effect-journal";
import {
	Concourse,
	type Element,
	NamedElement,
	NamedLocation,
	Parapet,
	Text,
} from "../element";
import type { Platform } from "../enums";
import { ElementAlreadyExistsError } from "../errors";
import { Track } from "../track/track";
import type { TrackData, TrackKind } from "../track/track-data";
import { KIND_META, supportsPlatforms } from "../track/track-data";
import type { FontInfo, MessageCallback, TextSelectionPrompt } from "../types";
import {
	checkAllTracksConnected as checkAllTracksConnectedFn,
	findAllLinkedTracks as findAllLinkedTracksFn,
	findUnpairedLinkedTracks as findUnpairedLinkedTracksFn,
	getLinkedTrackPairs as getLinkedTrackPairsFn,
	getLinkedTrackReport as getLinkedTrackReportFn,
	type LinkedTrackPair,
	type LinkedTrackReport,
	revalidatePreferredDirections,
} from "./map-connectivity";
import {
	addLevelCrossing as addLevelCrossingFn,
	addPlatform as addPlatformFn,
	removeLevelCrossing as removeLevelCrossingFn,
	removePlatform as removePlatformFn,
} from "./map-platform";
import {
	changeDeleteText,
	deleteTextFromAllElements,
	linkLocalText,
	linkNewElementToText,
} from "./map-text-linking";

// ============================================================================
// Map_ — data structure storing all user-placed content
// ============================================================================

function coordKey(x: number, y: number): string {
	return `${x},${y}`;
}

/** Lightweight debug log — gated so production builds are silent by default. */
const MAP_DEBUG = (() => {
	try {
		// Vite / Vitest: import.meta.env.DEV is true in development.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (import.meta as any).env?.DEV === true;
	} catch {
		return false;
	}
})();

function mapDebug(msg: string, ...data: unknown[]): void {
	if (MAP_DEBUG) console.debug(`[map] ${msg}`, ...data);
}

/**
 * @brief Data structure for storing all user-placed content.
 * Ported from RailwayBuilder map.h / map.cpp Map class.
 */
export class Map_ {
	// ── image & counters ────────────────────────────────────────────────
	private imageSize: number = 16;
	private totalTrack: number = 0;

	// ── spatial index — O(1) lookups ────────────────────────────────────
	private elementsByCoord = new Map<string, Element>();

	// ── kind-based track arrays (for iteration without scanning) ────────
	private tracksByKind = new Map<TrackKind, Track[]>();

	// ── non-track element arrays (for iteration & save order) ───────────
	private namedLocationList: NamedLocation[] = [];
	private concourseList: Concourse[] = [];
	private parapetList: Parapet[] = [];
	private textList: Text[] = [];

	// ── unified track list ──────────────────────────────────────────────
	private trackList: Track[] = [];

	// ── linked‑track connection state machine ────────────────────────────
	private linkedTrack1: Track | null = null;
	private linkedTrack2: Track | null = null;

	// ── text drag‑and‑drop ───────────────────────────────────────────────
	private textToMove: Text | null = null;

	// ── callbacks ────────────────────────────────────────────────────────
	private textSelectionPrompt: TextSelectionPrompt | null;
	private onMessage: MessageCallback | null;

	/**
	 * Nesting depth for {@link deferPreferredDirectionRevalidation}. While
	 * non-zero, add/delete/relink skip the prune pass so a deserialize can
	 * rebuild the whole map before pairs are judged against their neighbours.
	 */
	private preferredDirRevalidateDepth = 0;

	constructor(options?: {
		textSelectionPrompt?: TextSelectionPrompt;
		onMessage?: MessageCallback;
	}) {
		this.textSelectionPrompt = options?.textSelectionPrompt ?? null;
		this.onMessage = options?.onMessage ?? null;
	}

	// ====================================================================
	// Internal accessors (for extracted modules)
	// ====================================================================

	getTextSelectionPrompt(): TextSelectionPrompt | null {
		return this.textSelectionPrompt;
	}

	getOnMessage(): MessageCallback | null {
		return this.onMessage;
	}

	// ====================================================================
	// General map methods
	// ====================================================================

	getImageSize(): number {
		return this.imageSize;
	}

	setImageSize(n: number): void {
		this.imageSize = n;
	}

	getTotalTrack(): number {
		return this.totalTrack;
	}

	setTotalTrack(n: number): void {
		this.totalTrack = n;
	}

	/**
	 * Remove every user-placed element and reset all counters and transient
	 * state machines to their empty defaults. Used before loading a saved map
	 * into this instance so the caller can repopulate a clean slate.
	 */
	clearAll(): void {
		this.elementsByCoord.clear();
		this.tracksByKind.clear();
		this.namedLocationList = [];
		this.concourseList = [];
		this.parapetList = [];
		this.textList = [];
		this.trackList = [];
		this.totalTrack = 0;
		this.linkedTrack1 = null;
		this.linkedTrack2 = null;
		this.textToMove = null;
	}

	// ── Kind-based track access ─────────────────────────────────────────

	/** O(1) — ensures a kind array exists and returns it. */
	private getOrCreateKindArray(kind: TrackKind): Track[] {
		let arr = this.tracksByKind.get(kind);
		if (!arr) {
			arr = [];
			this.tracksByKind.set(kind, arr);
		}
		return arr;
	}

	/** Get all tracks of a specific kind. */
	getTracksOfKind(kind: TrackKind): Track[] {
		return this.tracksByKind.get(kind) ?? [];
	}

	/** Iterate all tracks regardless of kind. */
	forEachTrack(fn: (track: Track) => void): void {
		for (const arr of this.tracksByKind.values()) {
			for (const t of arr) fn(t);
		}
	}

	// ── Existence checks (O(1)) ─────────────────────────────────────────

	checkElementExists(x: number, y: number): boolean {
		return this.elementsByCoord.has(coordKey(x, y));
	}

	checkTrackConcourseParapetExists(x: number, y: number): boolean {
		const el = this.elementsByCoord.get(coordKey(x, y));
		return (
			el instanceof Track || el instanceof Concourse || el instanceof Parapet
		);
	}

	hasElementAt(x: number, y: number): boolean {
		return this.elementsByCoord.has(coordKey(x, y));
	}

	hasTrackAt(x: number, y: number): boolean {
		const el = this.elementsByCoord.get(coordKey(x, y));
		return el instanceof Track;
	}

	hasElementExcludingTrack(x: number, y: number): boolean {
		const el = this.elementsByCoord.get(coordKey(x, y));
		return el !== undefined && !(el instanceof Track);
	}

	// ── Generic element lookups ─────────────────────────────────────────

	getElementAt(x: number, y: number): Element | null {
		return this.elementsByCoord.get(coordKey(x, y)) ?? null;
	}

	getElementExcludingTrackAt(x: number, y: number): Element | null {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (el && !(el instanceof Track)) return el;
		return null;
	}

	getNamedElementAt(x: number, y: number): NamedElement | null {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (el instanceof NamedElement) return el;
		return null;
	}

	getTrackAt(x: number, y: number): Track | null {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (el instanceof Track) return el;
		return null;
	}

	/** Get a platform-capable track at the given coordinates. */
	getTrackHasPlatformAt(x: number, y: number): Track | null {
		const t = this.getTrackAt(x, y);
		if (t && supportsPlatforms(t.data.kind)) {
			return t;
		}
		return null;
	}

	// ── Can add NamedLocation check ─────────────────────────────────────

	checkCanAddNamedLocation(x: number, y: number): boolean {
		// If a non-track element occupies this coordinate, refuse
		if (this.hasElementExcludingTrack(x, y)) return false;

		const t = this.getTrackAt(x, y);
		if (!t) return true;

		// Use declarative metadata from KIND_META
		const meta = KIND_META[t.data.kind];
		const allowed = meta.canAddNamedLocationSubtypes as readonly string[];
		if (!allowed.includes(t.data.subtype)) return false;

		// Additional platform/level-crossing restrictions
		if (t.hasPlatform()) return false;
		if (t.data.kind === "straight" && t.hasLevelCrossing()) return false;

		return true;
	}

	// ====================================================================
	// Generic add / remove (single source of truth)
	// ====================================================================

	private indexElement(el: Element): void {
		const key = el.locationToString();
		const prev = this.elementsByCoord.get(key);
		record(
			"indexElement",
			() => {
				if (prev === undefined) this.elementsByCoord.delete(key);
				else this.elementsByCoord.set(key, prev);
			},
			() => {
				this.elementsByCoord.set(key, el);
			},
		);
		this.elementsByCoord.set(key, el);
	}

	private unindexElement(x: number, y: number): void {
		const key = coordKey(x, y);
		const prev = this.elementsByCoord.get(key);
		if (prev === undefined) return;
		record(
			"unindexElement",
			() => {
				this.elementsByCoord.set(key, prev);
			},
			() => {
				this.elementsByCoord.delete(key);
			},
		);
		this.elementsByCoord.delete(key);
	}

	/** Append to a model list, journalling the insertion. */
	private pushTo<T>(list: T[], item: T): void {
		list.push(item);
		record(
			"listPush",
			() => {
				const i = list.indexOf(item);
				if (i !== -1) list.splice(i, 1);
			},
			() => {
				list.push(item);
			},
		);
	}

	/**
	 * Remove from a model list by identity, journalling the index it came from so
	 * an undo restores position as well as membership — serializeMap references
	 * shared labels by their index in textList, so order is part of the state.
	 */
	private removeFrom<T>(list: T[], item: T): boolean {
		const i = list.indexOf(item);
		if (i === -1) return false;
		list.splice(i, 1);
		record(
			"listRemove",
			() => {
				list.splice(i, 0, item);
			},
			() => {
				const j = list.indexOf(item);
				if (j !== -1) list.splice(j, 1);
			},
		);
		return true;
	}

	/** Adjust the track counter, journalling the previous value. */
	private bumpTotalTrack(delta: number): void {
		const next = this.totalTrack + delta;
		recordField("totalTrack", this.totalTrack, next, (n) => {
			this.totalTrack = n;
		});
		this.totalTrack = next;
	}

	// ── Add Track ───────────────────────────────────────────────────────

	addTrack(data: TrackData, x: number, y: number): Track {
		mapDebug(
			`addTrack — kind=${data.kind} subtype=${data.subtype} at (${x},${y})`,
		);
		// Guard against any existing element (not just tracks) at this coordinate
		if (this.checkElementExists(x, y)) {
			const existing = this.getTrackAt(x, y);
			if (existing) {
				// Idempotent only when the existing track matches — otherwise refuse
				if (
					existing.data.kind === data.kind &&
					existing.data.subtype === data.subtype
				) {
					mapDebug(
						`addTrack — idempotent return (same kind/subtype already at (${x},${y}))`,
					);
					return existing;
				}
				mapDebug(`addTrack — ELEMENT_EXISTS at (${x},${y})`);
				throw new ElementAlreadyExistsError(x, y);
			}
			// A non-track element occupies this coordinate — refuse to overwrite
			mapDebug(`addTrack — REJECTED: non-track element at (${x},${y})`);
			throw new Error(
				`Cannot add track at (${x}, ${y}): a non-track element already exists.`,
			);
		}
		const track = new Track(data, x, y);
		this.indexElement(track);
		this.pushTo(this.getOrCreateKindArray(data.kind), track);
		this.bumpTotalTrack(1);
		mapDebug(`addTrack — OK, totalTrack=${this.totalTrack}`);
		this.afterTrackTopologyChange();
		return track;
	}

	/**
	 * Run `fn` without pruning preferred directions after each topology
	 * change, then prune once at the end. Deserialize uses this so pairs are
	 * judged against the finished map, not against half-loaded neighbours.
	 */
	deferPreferredDirectionRevalidation(fn: () => void): void {
		this.preferredDirRevalidateDepth++;
		try {
			fn();
		} finally {
			this.preferredDirRevalidateDepth--;
			if (this.preferredDirRevalidateDepth === 0) {
				revalidatePreferredDirections(this);
			}
		}
	}

	private afterTrackTopologyChange(): void {
		if (this.preferredDirRevalidateDepth === 0) {
			revalidatePreferredDirections(this);
		}
	}

	// ── Add NamedLocation ───────────────────────────────────────────────

	addNamedLocation(nl: NamedLocation): void {
		const x = nl.getLocationX();
		const y = nl.getLocationY();
		if (this.checkCanAddNamedLocation(x, y)) {
			// Capture the track BEFORE indexElement overwrites the coordinate entry
			const track = this.getTrackAt(x, y);
			this.pushTo(this.namedLocationList, nl);
			this.indexElement(nl);
			if (track) {
				track.setLinkedNamedLocation(nl);
			}
		}
	}

	createAddNamedLocation(x: number, y: number): void {
		const nl = new NamedLocation(x, y);
		this.addNamedLocation(nl);
		this.linkNewElementToText(x, y);
	}

	// ── Add Concourse ───────────────────────────────────────────────────

	addConcourse(c: Concourse): void {
		if (!this.checkElementExists(c.getLocationX(), c.getLocationY())) {
			this.pushTo(this.concourseList, c);
			this.indexElement(c);
		}
	}

	createAddConcourse(x: number, y: number): void {
		const c = new Concourse(x, y);
		this.addConcourse(c);
		this.linkNewElementToText(x, y);
	}

	// ── Add Parapet ─────────────────────────────────────────────────────

	addParapet(p: Parapet): void {
		if (!this.checkElementExists(p.getLocationX(), p.getLocationY())) {
			this.pushTo(this.parapetList, p);
			this.indexElement(p);
		}
	}

	createAddParapet(
		parapetType: import("../enums").ParapetType,
		x: number,
		y: number,
	): void {
		const p = new Parapet(parapetType, x, y);
		this.addParapet(p);
	}

	// ── Text ────────────────────────────────────────────────────────────

	addText(t: Text): void {
		this.pushTo(this.textList, t);
	}

	createAddText(
		x: number,
		y: number,
		readableBit: string,
		font: FontInfo,
	): Text {
		const t = new Text(x, y, readableBit, font);
		this.addText(t);
		return t;
	}

	createAddLinkText(
		x: number,
		y: number,
		readableBit: string,
		ok: boolean,
		font: FontInfo,
	): void {
		let text = readableBit;
		if (text.startsWith(" ")) text = "";
		if (text !== "" && ok) {
			const t = this.createAddText(x, y, text, font);
			this.linkLocalText(x, y, t);
		}
	}

	getTextAt(x: number, y: number): Text | null {
		for (const t of this.textList) {
			if (x >= t.getLocationX() && x <= t.getEditableX()) {
				if (y >= t.getLocationY() && y <= t.getEditableY()) {
					return t;
				}
			}
		}
		return null;
	}

	checkTextExists(x: number, y: number): boolean {
		return this.getTextAt(x, y) !== null;
	}

	deleteText(t: Text): boolean {
		return this.removeFrom(this.textList, t);
	}

	getTextToMove(): Text | null {
		return this.textToMove;
	}

	setTextToMove(exactX: number, exactY: number): boolean;
	setTextToMove(t: Text | null): void;
	setTextToMove(arg1: number | Text | null, arg2?: number): boolean | void {
		if (typeof arg1 === "number" && typeof arg2 === "number") {
			if (this.checkTextExists(arg1, arg2)) {
				this.textToMove = this.getTextAt(arg1, arg2);
				return true;
			}
			this.textToMove = null;
			return false;
		}
		this.textToMove = arg1 as Text | null;
	}

	moveText(x: number, y: number): void {
		if (this.textToMove) {
			const fs = this.textToMove.getFontSize();
			this.textToMove.setLocationX(x);
			this.textToMove.setLocationY(y);
			this.textToMove.setEditableX(x + fs);
			this.textToMove.setEditableY(y + fs);
		}
	}

	// ── Remove ──────────────────────────────────────────────────────────

	deleteElement(x: number, y: number): boolean {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (!el) return false;

		// A NamedLocation displaces the track it sits on out of the spatial index,
		// so deleting it has to put that track back. The re-index must happen
		// *after* unindexElement below, which clears this very coordinate — doing
		// it inline here would write the key and then immediately lose it.
		let displacedTrack: Track | null = null;

		// Handle text cleanup for named elements
		if (el instanceof NamedElement && el.getNamed()) {
			const txt = el.getText();
			if (txt) {
				this.deleteTextFromAllElements(txt);
				this.deleteText(txt);
			}
		}

		if (el instanceof Track) {
			// Handle linked track cleanup
			if (el.data.kind === "linked" && el.getOtherLinkedTrack()) {
				this.disconnectLinkedTrack(el, el.getOtherLinkedTrack()!);
			}

			// Remove from kind array
			const kindArr = this.tracksByKind.get(el.data.kind);
			if (kindArr) this.removeFrom(kindArr, el);
			this.bumpTotalTrack(-1);
		} else if (el instanceof NamedLocation) {
			this.removeFrom(this.namedLocationList, el);
			// Restore co-located track to the spatial index (it was displaced
			// when the NamedLocation was indexed in addNamedLocation).
			for (const arr of this.tracksByKind.values()) {
				const colocated = arr.find(
					(t) => t.getLocationX() === x && t.getLocationY() === y,
				);
				if (colocated) {
					displacedTrack = colocated;
					colocated.setLinkedNamedLocation(null);
					break;
				}
			}
		} else if (el instanceof Concourse) {
			this.removeFrom(this.concourseList, el);
		} else if (el instanceof Parapet) {
			this.removeFrom(this.parapetList, el);
		}

		this.unindexElement(x, y);
		if (displacedTrack) this.indexElement(displacedTrack);
		if (el instanceof Track) this.afterTrackTopologyChange();
		return true;
	}

	// ══ NamedLocation accessors ══════════════════════════════════════════

	getNamedLocationList(): NamedLocation[] {
		return this.namedLocationList;
	}

	getNamedLocationAt(x: number, y: number): NamedLocation | null {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (el instanceof NamedLocation) return el;
		return null;
	}

	checkNamedLocationAt(x: number, y: number): boolean {
		return this.getNamedLocationAt(x, y) !== null;
	}

	namedLocationListToSaveString(): string {
		return this.namedLocationList.map((e) => e.toSaveString()).join("\n");
	}

	// ══ Concourse accessors ══════════════════════════════════════════════

	getConcourseList(): Concourse[] {
		return this.concourseList;
	}

	getConcourseAt(x: number, y: number): Concourse | null {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (el instanceof Concourse) return el;
		return null;
	}

	checkConcourseAt(x: number, y: number): boolean {
		return this.getConcourseAt(x, y) !== null;
	}

	concourseListToSaveString(): string {
		return this.concourseList.map((e) => e.toSaveString()).join("\n");
	}

	// ══ Parapet accessors ════════════════════════════════════════════════

	getParapetList(): Parapet[] {
		return this.parapetList;
	}

	getParapetAt(x: number, y: number): Parapet | null {
		const el = this.elementsByCoord.get(coordKey(x, y));
		if (el instanceof Parapet) return el;
		return null;
	}

	checkParapetAt(x: number, y: number): boolean {
		return this.getParapetAt(x, y) !== null;
	}

	parapetListToSaveString(): string {
		return this.parapetList.map((e) => e.toSaveString()).join("\n");
	}

	// ══ Text accessors ═══════════════════════════════════════════════════

	getTextList(): Text[] {
		return this.textList;
	}

	setTextList(list: Text[]): void {
		this.textList = list;
	}

	textListToSaveString(): string {
		return this.textList.map((t) => t.toSaveString()).join("\n");
	}

	// ====================================================================
	// Linked track connection state machine
	// ====================================================================

	private connectLinkedTrack(): void {
		if (this.linkedTrack1 && this.linkedTrack2) {
			this.linkedTrack1.setOtherLinkedTrack(this.linkedTrack2);
			this.linkedTrack2.setOtherLinkedTrack(this.linkedTrack1);
		}
		this.resetConnectLinkedTrack();
		this.afterTrackTopologyChange();
	}

	private disconnectLinkedTrack(a: Track, b: Track): void {
		a.removeOtherLinkedTrack();
		b.removeOtherLinkedTrack();
		this.afterTrackTopologyChange();
	}

	private resetConnectLinkedTrack(): void {
		this.linkedTrack1 = null;
		this.linkedTrack2 = null;
	}

	getLinkedTrack1(): Track | null {
		return this.linkedTrack1;
	}

	setLinkedTrack1(t: Track | null): void {
		this.linkedTrack1 = t;
	}

	getLinkedTrack2(): Track | null {
		return this.linkedTrack2;
	}

	setLinkedTrack2(t: Track | null): void {
		this.linkedTrack2 = t;
	}

	connectTwoLinkedTracks(x: number, y: number): void {
		const clicked = this.getTrackAt(x, y);
		if (!clicked || clicked.data.kind !== "linked") return;

		if (!this.linkedTrack1) {
			this.linkedTrack1 = clicked;
		} else if (!this.linkedTrack2 && clicked !== this.linkedTrack1) {
			this.linkedTrack2 = clicked;
			// If either is already linked, disconnect first
			if (clicked.isLinked()) {
				this.disconnectLinkedTrack(clicked, clicked.getOtherLinkedTrack()!);
			}
			if (this.linkedTrack1.isLinked()) {
				this.disconnectLinkedTrack(
					this.linkedTrack1,
					this.linkedTrack1.getOtherLinkedTrack()!,
				);
			}
			this.connectLinkedTrack();
		}
	}

	checkAllLinkedTrackLinked(): boolean {
		const linkedTracks = this.getTracksOfKind("linked");
		if (linkedTracks.length % 2 === 0) {
			for (const lt of linkedTracks) {
				if (!lt.isLinked()) return false;
			}
			return true;
		}
		return false;
	}

	// ====================================================================
	// Save strings (delegated to individual element methods)
	// ====================================================================

	/** Generates save strings for all track kinds. */
	tracksToSaveStrings(): Map<TrackKind, string> {
		const result = new Map<TrackKind, string>();
		for (const [kind, tracks] of this.tracksByKind) {
			result.set(kind, tracks.map((t) => t.toSaveString()).join("\n"));
		}
		return result;
	}

	// ====================================================================
	// Unified track list
	// ====================================================================

	getTrackList(): Track[] {
		return this.trackList;
	}

	setTrackList(list: Track[]): void {
		this.trackList = list;
	}

	/** Rebuild the unified track list from all kind arrays. */
	makeTrackList(): void {
		const all: Track[] = [];
		for (const arr of this.tracksByKind.values()) {
			for (const t of arr) all.push(t);
		}
		this.trackList = all;
	}

	// ====================================================================
	// Text linking (delegated)
	// ====================================================================

	linkLocalText(x: number, y: number, linkedText: Text): void {
		linkLocalText(this, x, y, linkedText);
	}

	deleteTextFromAllElements(t: Text): void {
		deleteTextFromAllElements(this, t);
	}

	linkNewElementToText(x: number, y: number): void {
		linkNewElementToText(this, x, y);
	}

	changeDeleteText(readableBit: string, ok: boolean, text: Text): void {
		changeDeleteText(this, readableBit, ok, text);
	}

	// ====================================================================
	// Platform & level crossing (delegated)
	// ====================================================================

	addPlatform(side: Platform, x: number, y: number): void {
		addPlatformFn(this, side, x, y);
	}

	addLevelCrossing(x: number, y: number): void {
		addLevelCrossingFn(this, x, y);
	}

	removePlatform(x: number, y: number): boolean {
		return removePlatformFn(this, x, y);
	}

	removeLevelCrossing(x: number, y: number): boolean {
		return removeLevelCrossingFn(this, x, y);
	}

	// ====================================================================
	// Connectivity (delegated)
	// ====================================================================

	checkAllTracksConnected(): boolean {
		return checkAllTracksConnectedFn(this);
	}

	findAllLinkedTracks(): Track[] {
		return findAllLinkedTracksFn(this);
	}

	findUnpairedLinkedTracks(): Track[] {
		return findUnpairedLinkedTracksFn(this);
	}

	getLinkedTrackPairs(): LinkedTrackPair[] {
		return getLinkedTrackPairsFn(this);
	}

	getLinkedTrackReport(): LinkedTrackReport {
		return getLinkedTrackReportFn(this);
	}
}
