import { Element, NamedElement, NamedLocation, Concourse, Parapet, Text } from "../element";
import { Track } from "../track/track";
import type { TrackData, TrackKind } from "../track/track-data";
import { KIND_META, supportsPlatforms } from "../track/track-data";
import type { FontInfo, TextSelectionPrompt, MessageCallback } from "../types";
import { Platform } from "../enums";

import {
  linkLocalText,
  linkNewElementToText,
  changeDeleteText,
  deleteTextFromAllElements,
} from "./map-text-linking";
import { addPlatform as addPlatformFn, addLevelCrossing as addLevelCrossingFn } from "./map-platform";
import { checkAllTracksConnected as checkAllTracksConnectedFn } from "./map-connectivity";

// ============================================================================
// Map_ — data structure storing all user-placed content
// ============================================================================

function coordKey(x: number, y: number): string {
  return `${x},${y}`;
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
    return el instanceof Track || el instanceof Concourse || el instanceof Parapet;
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
    this.elementsByCoord.set(coordKey(el.getLocationX(), el.getLocationY()), el);
  }

  private unindexElement(x: number, y: number): void {
    this.elementsByCoord.delete(coordKey(x, y));
  }

  // ── Add Track ───────────────────────────────────────────────────────

  addTrack(data: TrackData, x: number, y: number): Track {
    // Guard against any existing element (not just tracks) at this coordinate
    if (this.checkElementExists(x, y)) {
      const existing = this.getTrackAt(x, y);
      if (existing) return existing;
      // A non-track element occupies this coordinate — refuse to overwrite
      throw new Error(
        `Cannot add track at (${x}, ${y}): a non-track element already exists.`,
      );
    }
    const track = new Track(data, x, y);
    this.indexElement(track);
    this.getOrCreateKindArray(data.kind).push(track);
    this.totalTrack++;
    return track;
  }

  // ── Add NamedLocation ───────────────────────────────────────────────

  addNamedLocation(nl: NamedLocation): void {
    const x = nl.getLocationX();
    const y = nl.getLocationY();
    if (this.checkCanAddNamedLocation(x, y)) {
      this.namedLocationList.push(nl);
      this.indexElement(nl);
      const track = this.getTrackAt(x, y);
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
      this.concourseList.push(c);
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
      this.parapetList.push(p);
      this.indexElement(p);
    }
  }

  createAddParapet(parapetType: import("../enums").ParapetType, x: number, y: number): void {
    const p = new Parapet(parapetType, x, y);
    this.addParapet(p);
  }

  // ── Text ────────────────────────────────────────────────────────────

  addText(t: Text): void {
    this.textList.push(t);
  }

  createAddText(x: number, y: number, readableBit: string, font: FontInfo): Text {
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
    for (let i = 0; i < this.textList.length; i++) {
      if (this.textList[i] === t) {
        this.textList.splice(i, 1);
        return true;
      }
    }
    return false;
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
      if (kindArr) {
        const idx = kindArr.indexOf(el);
        if (idx !== -1) kindArr.splice(idx, 1);
      }
      this.totalTrack--;
    } else if (el instanceof NamedLocation) {
      const idx = this.namedLocationList.indexOf(el);
      if (idx !== -1) this.namedLocationList.splice(idx, 1);
    } else if (el instanceof Concourse) {
      const idx = this.concourseList.indexOf(el);
      if (idx !== -1) this.concourseList.splice(idx, 1);
    } else if (el instanceof Parapet) {
      const idx = this.parapetList.indexOf(el);
      if (idx !== -1) this.parapetList.splice(idx, 1);
    }

    this.unindexElement(x, y);
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
  }

  private disconnectLinkedTrack(a: Track, b: Track): void {
    a.removeOtherLinkedTrack();
    b.removeOtherLinkedTrack();
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

  // ====================================================================
  // Connectivity (delegated)
  // ====================================================================

  checkAllTracksConnected(): boolean {
    return checkAllTracksConnectedFn(this);
  }
}
