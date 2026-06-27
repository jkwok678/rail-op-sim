import { Element, NamedElement, NamedLocation, Concourse, Parapet, Text } from "../element";
import {
  StraightTrack,
  DirectedTrack,
  CurvedTrack,
  LinkedTrack,
  ExitTrack,
  BufferTrack,
  SignalTrack,
  BridgeUnderpassTrack,
  SwitchTrack,
  CrossoverTrack,
  FlyoverTrack,
  Track,
} from "../track";
import type { FontInfo, TextSelectionPrompt, MessageCallback } from "../types";
import {
  StraightType,
  DirectedType,
  CurvedType,
  LinkedType,
  ExitType,
  BufferType,
  SignalType,
  BridgeUnderpassType,
  SwitchType,
  CrossoverType,
  FlyoverType,
  ParapetType,
  Platform,
} from "../enums";

import {
  linkLocalText,
  linkNewElementToText,
  changeDeleteText,
  deleteTextFromAllElements,
} from "./map-text-linking";
import { addPlatform as addPlatformFn, addLevelCrossing as addLevelCrossingFn } from "./map-platform";
import { checkAllTracksConnected as checkAllTracksConnectedFn } from "./map-connectivity";

// ============================================================================
// Map — data structure storing all user-placed content
// ============================================================================

/**
 * @brief Data structure for storing all content the user adds to the screen.
 * Ported from RailwayBuilder map.h / map.cpp Map class.
 */
export class Map_ {
  // ── image & counters ──────────────────────────────────────────────
  private imageSize: number = 16;
  private totalTrack: number = 0;

  // ── type‑specific element arrays ───────────────────────────────────
  private straightTrackList: StraightTrack[] = [];
  private directedTrackList: DirectedTrack[] = [];
  private curvedTrackList: CurvedTrack[] = [];
  private linkedTrackList: LinkedTrack[] = [];
  private exitTrackList: ExitTrack[] = [];
  private bufferTrackList: BufferTrack[] = [];
  private signalTrackList: SignalTrack[] = [];
  private bridgeUnderpassTrackList: BridgeUnderpassTrack[] = [];
  private switchTrackList: SwitchTrack[] = [];
  private crossoverTrackList: CrossoverTrack[] = [];
  private flyoverTrackList: FlyoverTrack[] = [];
  private namedLocationList: NamedLocation[] = [];
  private concourseList: Concourse[] = [];
  private parapetList: Parapet[] = [];
  private textList: Text[] = [];

  // ── unified track list (built by makeTrackList) ────────────────────
  private trackList: Track[] = [];

  // ── linked‑track connection state machine ──────────────────────────
  private linkedTrack1: LinkedTrack | null = null;
  private linkedTrack2: LinkedTrack | null = null;

  // ── text drag‑and‑drop ─────────────────────────────────────────────
  private textToMove: Text | null = null;

  // ── callbacks (replace QMessageBox / QInputDialog) ─────────────────
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

  /** @internal — exposed for map-text-linking */
  getTextSelectionPrompt(): TextSelectionPrompt | null {
    return this.textSelectionPrompt;
  }

  /** @internal — exposed for map-connectivity */
  getOnMessage(): MessageCallback | null {
    return this.onMessage;
  }

  // ====================================================================
  // General map methods
  // ====================================================================

  getImageSize(): number {
    return this.imageSize;
  }

  setImageSize(newImageSize: number): void {
    this.imageSize = newImageSize;
  }

  getTotalTrack(): number {
    return this.totalTrack;
  }

  setTotalTrack(newTrackTotal: number): void {
    this.totalTrack = newTrackTotal;
  }

  // ── existence checks ───────────────────────────────────────────────

  checkElementExists(locationX: number, locationY: number): boolean {
    return (
      this.checkStraightTrackAt(locationX, locationY) ||
      this.checkDirectedTrackAt(locationX, locationY) ||
      this.checkCurvedTrackAt(locationX, locationY) ||
      this.checkLinkedTrackAt(locationX, locationY) ||
      this.checkExitTrackAt(locationX, locationY) ||
      this.checkBufferTrackAt(locationX, locationY) ||
      this.checkSignalTrackAt(locationX, locationY) ||
      this.checkBridgeUnderpassTrackAt(locationX, locationY) ||
      this.checkSwitchTrackAt(locationX, locationY) ||
      this.checkCrossoverTrackAt(locationX, locationY) ||
      this.checkFlyoverTrackAt(locationX, locationY) ||
      this.checkNamedLocationAt(locationX, locationY) ||
      this.checkConcourseAt(locationX, locationY) ||
      this.checkParapetAt(locationX, locationY)
    );
  }

  checkTrackConcourseParapetExists(
    locationX: number,
    locationY: number,
  ): boolean {
    return (
      this.checkStraightTrackAt(locationX, locationY) ||
      this.checkDirectedTrackAt(locationX, locationY) ||
      this.checkCurvedTrackAt(locationX, locationY) ||
      this.checkLinkedTrackAt(locationX, locationY) ||
      this.checkExitTrackAt(locationX, locationY) ||
      this.checkBufferTrackAt(locationX, locationY) ||
      this.checkSignalTrackAt(locationX, locationY) ||
      this.checkBridgeUnderpassTrackAt(locationX, locationY) ||
      this.checkSwitchTrackAt(locationX, locationY) ||
      this.checkCrossoverTrackAt(locationX, locationY) ||
      this.checkFlyoverTrackAt(locationX, locationY) ||
      this.checkConcourseAt(locationX, locationY) ||
      this.checkParapetAt(locationX, locationY)
    );
  }

  // prettier-ignore
  checkCanAddNamedLocation(locationX: number, locationY: number): boolean {
    if (this.hasElementAt(locationX, locationY)) {
      const straightTrack = this.getStraightTrackAt(locationX, locationY);
      if (straightTrack !== null) {
        switch (straightTrack.getStraightType()) {
          case StraightType.STRAIGHTH:
          case StraightType.STRAIGHTV:
            if (straightTrack.hasPlatform() || straightTrack.hasLevelCrossing()) return false;
            return true;
          default: return false;
        }
      }
      const directedTrack = this.getDirectedTrackAt(locationX, locationY);
      if (directedTrack !== null) {
        switch (directedTrack.getDirectType()) {
          case DirectedType.DIRECTEDLEFT: case DirectedType.DIRECTEDRIGHT:
          case DirectedType.DIRECTEDUP:   case DirectedType.DIRECTEDDOWN:
            if (directedTrack.hasPlatform()) return false;
            return true;
          default: return false;
        }
      }
      const curvedTrack = this.getCurvedTrackAt(locationX, locationY);
      if (curvedTrack !== null) {
        switch (curvedTrack.getCurvedType()) {
          case CurvedType.CURVE1: case CurvedType.CURVE2:
          case CurvedType.CURVE3: case CurvedType.CURVE4:
          case CurvedType.CURVE5: case CurvedType.CURVE6:
          case CurvedType.CURVE7: case CurvedType.CURVE8:
            return true;
          default: return false;
        }
      }
      const exitTrack = this.getExitTrackAt(locationX, locationY);
      if (exitTrack !== null) {
        switch (exitTrack.getExitType()) {
          case ExitType.EXITLEFT: case ExitType.EXITRIGHT:
          case ExitType.EXITUP:   case ExitType.EXITDOWN:
            return true;
          default: return false;
        }
      }
      const bufferTrack = this.getBufferTrackAt(locationX, locationY);
      if (bufferTrack !== null) {
        switch (bufferTrack.getBufferType()) {
          case BufferType.BUFFERLEFT: case BufferType.BUFFERRIGHT:
          case BufferType.BUFFERUP:   case BufferType.BUFFERDOWN:
            if (bufferTrack.hasPlatform()) return false;
            return true;
          default: return false;
        }
      }
      return false;
    }
    return true;
  }

  // ====================================================================
  // Private add methods
  // ====================================================================

  private addStraightTrack(newStraightTrack: StraightTrack): void {
    const x = newStraightTrack.getLocationX();
    const y = newStraightTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.straightTrackList.push(newStraightTrack);
      ++this.totalTrack;
    }
  }

  private addDirectedTrack(newDirectedTrack: DirectedTrack): void {
    const x = newDirectedTrack.getLocationX();
    const y = newDirectedTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.directedTrackList.push(newDirectedTrack);
      ++this.totalTrack;
    }
  }

  private addCurvedTrack(newCurvedTrack: CurvedTrack): void {
    const x = newCurvedTrack.getLocationX();
    const y = newCurvedTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.curvedTrackList.push(newCurvedTrack);
      ++this.totalTrack;
    }
  }

  private addLinkedTrack(newLinkedTrack: LinkedTrack): void {
    const x = newLinkedTrack.getLocationX();
    const y = newLinkedTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.linkedTrackList.push(newLinkedTrack);
      ++this.totalTrack;
    }
  }

  private addExitTrack(newExitTrack: ExitTrack): void {
    const x = newExitTrack.getLocationX();
    const y = newExitTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.exitTrackList.push(newExitTrack);
      ++this.totalTrack;
    }
  }

  private addBufferTrack(newBufferTrack: BufferTrack): void {
    const x = newBufferTrack.getLocationX();
    const y = newBufferTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.bufferTrackList.push(newBufferTrack);
      ++this.totalTrack;
    }
  }

  private addSignalTrack(newSignalTrack: SignalTrack): void {
    const x = newSignalTrack.getLocationX();
    const y = newSignalTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.signalTrackList.push(newSignalTrack);
      ++this.totalTrack;
    }
  }

  private addBridgeUnderpassTrack(
    newBridgeUnderpassTrack: BridgeUnderpassTrack,
  ): void {
    const x = newBridgeUnderpassTrack.getLocationX();
    const y = newBridgeUnderpassTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.bridgeUnderpassTrackList.push(newBridgeUnderpassTrack);
      ++this.totalTrack;
    }
  }

  private addSwitchTrack(newSwitchTrack: SwitchTrack): void {
    const x = newSwitchTrack.getLocationX();
    const y = newSwitchTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.switchTrackList.push(newSwitchTrack);
      ++this.totalTrack;
    }
  }

  private addCrossoverTrack(newCrossoverTrack: CrossoverTrack): void {
    const x = newCrossoverTrack.getLocationX();
    const y = newCrossoverTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.crossoverTrackList.push(newCrossoverTrack);
      ++this.totalTrack;
    }
  }

  private addFlyoverTrack(newFlyoverTrack: FlyoverTrack): void {
    const x = newFlyoverTrack.getLocationX();
    const y = newFlyoverTrack.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.flyoverTrackList.push(newFlyoverTrack);
      ++this.totalTrack;
    }
  }

  private addNamedLocation(newNamedLocation: NamedLocation): void {
    const x = newNamedLocation.getLocationX();
    const y = newNamedLocation.getLocationY();
    if (this.checkCanAddNamedLocation(x, y)) {
      this.namedLocationList.push(newNamedLocation);
      const track = this.getTrackAt(x, y);
      if (track !== null) {
        track.setLinkedNamedLocation(newNamedLocation);
      }
    }
  }

  private addConcourse(newConcourse: Concourse): void {
    const x = newConcourse.getLocationX();
    const y = newConcourse.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.concourseList.push(newConcourse);
    }
  }

  private addParapet(newParapet: Parapet): void {
    const x = newParapet.getLocationX();
    const y = newParapet.getLocationY();
    if (!this.checkElementExists(x, y)) {
      this.parapetList.push(newParapet);
    }
  }

  private addText(newText: Text): void {
    this.textList.push(newText);
  }

  // ====================================================================
  // Private remove methods
  // ====================================================================

  private removeStraightTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.straightTrackList.length; i++) {
      const el = this.straightTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.straightTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeDirectedTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.directedTrackList.length; i++) {
      const el = this.directedTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.directedTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeCurvedTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.curvedTrackList.length; i++) {
      const el = this.curvedTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.curvedTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeLinkedTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.linkedTrackList.length; i++) {
      const el = this.linkedTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        if (el.getOtherLinkedTrack() !== null) {
          this.disconnectLinkedTrack(
            el,
            el.getOtherLinkedTrack()!,
          );
        }
        this.linkedTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeExitTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.exitTrackList.length; i++) {
      const el = this.exitTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.exitTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeBufferTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.bufferTrackList.length; i++) {
      const el = this.bufferTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.bufferTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeSignalTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.signalTrackList.length; i++) {
      const el = this.signalTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.signalTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeBridgeUnderpassTrack(
    xLocation: number,
    yLocation: number,
  ): boolean {
    for (let i = 0; i < this.bridgeUnderpassTrackList.length; i++) {
      const el = this.bridgeUnderpassTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.bridgeUnderpassTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeSwitchTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.switchTrackList.length; i++) {
      const el = this.switchTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.switchTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeCrossoverTrack(
    xLocation: number,
    yLocation: number,
  ): boolean {
    for (let i = 0; i < this.crossoverTrackList.length; i++) {
      const el = this.crossoverTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.crossoverTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeFlyoverTrack(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.flyoverTrackList.length; i++) {
      const el = this.flyoverTrackList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.flyoverTrackList.splice(i, 1);
        --this.totalTrack;
        return true;
      }
    }
    return false;
  }

  private removeNamedLocation(
    xLocation: number,
    yLocation: number,
  ): boolean {
    for (let i = 0; i < this.namedLocationList.length; i++) {
      const el = this.namedLocationList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.namedLocationList.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  private removeConcourse(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.concourseList.length; i++) {
      const el = this.concourseList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.concourseList.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  private removeParapet(xLocation: number, yLocation: number): boolean {
    for (let i = 0; i < this.parapetList.length; i++) {
      const el = this.parapetList[i];
      if (el.getLocationX() === xLocation && el.getLocationY() === yLocation) {
        this.parapetList.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  // ====================================================================
  // Linked Track private methods
  // ====================================================================

  private connectLinkedTrack(): void {
    this.linkedTrack1!.setOtherLinkedTrack(this.linkedTrack2);
    this.linkedTrack2!.setOtherLinkedTrack(this.linkedTrack1);
    this.resetConnectLinkedTrack();
  }

  private disconnectLinkedTrack(
    alreadyLinkedTrack1: LinkedTrack,
    alreadyLinkedTrack2: LinkedTrack,
  ): void {
    alreadyLinkedTrack1.removeOtherLinkedTrack();
    alreadyLinkedTrack2.removeOtherLinkedTrack();
  }

  private resetConnectLinkedTrack(): void {
    this.linkedTrack1 = null;
    this.linkedTrack2 = null;
  }

  // ====================================================================
  // Public — StraightTrack
  // ====================================================================

  getStraightTrackList(): StraightTrack[] {
    return this.straightTrackList;
  }

  setStraightTrackList(newList: StraightTrack[]): void {
    this.straightTrackList = newList;
  }

  createAddStraightTrack(
    straightType: StraightType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new StraightTrack(straightType, overallX, overallY);
    this.addStraightTrack(track);
  }

  getStraightTrackAt(
    locationX: number,
    locationY: number,
  ): StraightTrack | null {
    for (const el of this.straightTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkStraightTrackAt(locationX: number, locationY: number): boolean {
    return this.getStraightTrackAt(locationX, locationY) !== null;
  }

  straightTrackListToSaveString(): string {
    return this.straightTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ DirectedTrack ═══════════════════════════════════════════════════

  getDirectedTrackList(): DirectedTrack[] {
    return this.directedTrackList;
  }

  setDirectedTrackList(newList: DirectedTrack[]): void {
    this.directedTrackList = newList;
  }

  createAddDirectedTrack(
    directedType: DirectedType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new DirectedTrack(directedType, overallX, overallY);
    this.addDirectedTrack(track);
  }

  getDirectedTrackAt(
    locationX: number,
    locationY: number,
  ): DirectedTrack | null {
    for (const el of this.directedTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkDirectedTrackAt(locationX: number, locationY: number): boolean {
    return this.getDirectedTrackAt(locationX, locationY) !== null;
  }

  directedTrackListToSaveString(): string {
    return this.directedTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ CurvedTrack ═════════════════════════════════════════════════════

  getCurvedTrackList(): CurvedTrack[] {
    return this.curvedTrackList;
  }

  setCurvedTrackList(newList: CurvedTrack[]): void {
    this.curvedTrackList = newList;
  }

  createAddCurvedTrack(
    curvedType: CurvedType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new CurvedTrack(curvedType, overallX, overallY);
    this.addCurvedTrack(track);
  }

  getCurvedTrackAt(
    locationX: number,
    locationY: number,
  ): CurvedTrack | null {
    for (const el of this.curvedTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkCurvedTrackAt(locationX: number, locationY: number): boolean {
    return this.getCurvedTrackAt(locationX, locationY) !== null;
  }

  curvedTrackListToSaveString(): string {
    return this.curvedTrackList.map((t) => t.toSaveString()).join("\n");
  }

  // ══ LinkedTrack ═════════════════════════════════════════════════════

  getLinkedTrackList(): LinkedTrack[] {
    return this.linkedTrackList;
  }

  setLinkedTrackList(newList: LinkedTrack[]): void {
    this.linkedTrackList = newList;
  }

  createAddLinkedTrack(
    linkedType: LinkedType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new LinkedTrack(linkedType, overallX, overallY);
    this.addLinkedTrack(track);
  }

  getLinkedTrackAt(
    locationX: number,
    locationY: number,
  ): LinkedTrack | null {
    for (const el of this.linkedTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkLinkedTrackAt(locationX: number, locationY: number): boolean {
    return this.getLinkedTrackAt(locationX, locationY) !== null;
  }

  // ── LinkedTrack connection ──────────────────────────────────────────

  getLinkedTrack1(): LinkedTrack | null {
    return this.linkedTrack1;
  }

  setLinkedTrack1(newLinkedTrack1: LinkedTrack | null): void {
    this.linkedTrack1 = newLinkedTrack1;
  }

  getLinkedTrack2(): LinkedTrack | null {
    return this.linkedTrack2;
  }

  setLinkedTrack2(newLinkedTrack2: LinkedTrack | null): void {
    this.linkedTrack2 = newLinkedTrack2;
  }

  hasLinkedTrackAt(locationX: number, locationY: number): boolean {
    return this.getLinkedTrackAt(locationX, locationY) !== null;
  }

  connectTwoLinkedTracks(locationX: number, locationY: number): void {
    if (this.linkedTrack1 === null) {
      if (this.hasLinkedTrackAt(locationX, locationY)) {
        this.linkedTrack1 = this.getLinkedTrackAt(locationX, locationY);
      }
    } else if (
      this.linkedTrack2 === null &&
      this.linkedTrack1 !== null
    ) {
      if (this.hasLinkedTrackAt(locationX, locationY)) {
        const temp2 = this.getLinkedTrackAt(locationX, locationY)!;
        if (temp2 !== this.linkedTrack1) {
          this.linkedTrack2 = temp2;
          if (!temp2.isLinked()) {
            this.connectLinkedTrack();
          } else {
            if (this.linkedTrack1.isLinked()) {
              this.disconnectLinkedTrack(
                this.linkedTrack1,
                this.linkedTrack1.getOtherLinkedTrack()!,
              );
            }
            if (this.linkedTrack2.isLinked()) {
              this.disconnectLinkedTrack(
                this.linkedTrack2,
                this.linkedTrack2.getOtherLinkedTrack()!,
              );
            }
            this.connectLinkedTrack();
          }
        }
      }
    }
  }

  checkAllLinkedTrackLinked(): boolean {
    if (this.linkedTrackList.length % 2 === 0) {
      for (const linkedTrack of this.linkedTrackList) {
        if (!linkedTrack.isLinked()) return false;
      }
      return true;
    }
    return false;
  }

  linkedTrackListToSaveString(): string {
    return this.linkedTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ ExitTrack ═══════════════════════════════════════════════════════

  getExitTrackList(): ExitTrack[] {
    return this.exitTrackList;
  }

  setExitTrackList(newList: ExitTrack[]): void {
    this.exitTrackList = newList;
  }

  createAddExitTrack(
    exitType: ExitType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new ExitTrack(exitType, overallX, overallY);
    this.addExitTrack(track);
  }

  getExitTrackAt(
    locationX: number,
    locationY: number,
  ): ExitTrack | null {
    for (const el of this.exitTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkExitTrackAt(locationX: number, locationY: number): boolean {
    return this.getExitTrackAt(locationX, locationY) !== null;
  }

  exitTrackListToSaveString(): string {
    return this.exitTrackList.map((t) => t.toSaveString()).join("\n");
  }

  // ══ BufferTrack ═════════════════════════════════════════════════════

  getBufferTrackList(): BufferTrack[] {
    return this.bufferTrackList;
  }

  setBufferTrackList(newList: BufferTrack[]): void {
    this.bufferTrackList = newList;
  }

  createAddBufferTrack(
    bufferType: BufferType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new BufferTrack(bufferType, overallX, overallY);
    this.addBufferTrack(track);
  }

  getBufferTrackAt(
    locationX: number,
    locationY: number,
  ): BufferTrack | null {
    for (const el of this.bufferTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkBufferTrackAt(locationX: number, locationY: number): boolean {
    return this.getBufferTrackAt(locationX, locationY) !== null;
  }

  bufferTrackListToSaveString(): string {
    return this.bufferTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ SignalTrack ═════════════════════════════════════════════════════

  getSignalTrackList(): SignalTrack[] {
    return this.signalTrackList;
  }

  setSignalTrackList(newList: SignalTrack[]): void {
    this.signalTrackList = newList;
  }

  createAddSignalTrack(
    signalType: SignalType,
    aspect: number,
    overallX: number,
    overallY: number,
  ): void {
    const track = new SignalTrack(signalType, aspect, overallX, overallY);
    this.addSignalTrack(track);
  }

  getSignalTrackAt(
    locationX: number,
    locationY: number,
  ): SignalTrack | null {
    for (const el of this.signalTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkSignalTrackAt(locationX: number, locationY: number): boolean {
    return this.getSignalTrackAt(locationX, locationY) !== null;
  }

  signalTrackListToSaveString(): string {
    return this.signalTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ BridgeUnderpassTrack ════════════════════════════════════════════

  getBridgeUnderpassTrackList(): BridgeUnderpassTrack[] {
    return this.bridgeUnderpassTrackList;
  }

  setBridgeUnderpassTrackList(newList: BridgeUnderpassTrack[]): void {
    this.bridgeUnderpassTrackList = newList;
  }

  createAddBridgeUnderpassTrack(
    bridgeUnderpassType: BridgeUnderpassType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new BridgeUnderpassTrack(
      bridgeUnderpassType,
      overallX,
      overallY,
    );
    this.addBridgeUnderpassTrack(track);
  }

  getBridgeUnderpassTrack(
    locationX: number,
    locationY: number,
  ): BridgeUnderpassTrack | null {
    for (const el of this.bridgeUnderpassTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkBridgeUnderpassTrackAt(
    locationX: number,
    locationY: number,
  ): boolean {
    return this.getBridgeUnderpassTrack(locationX, locationY) !== null;
  }

  bridgeUnderpassTrackListToSaveString(): string {
    return this.bridgeUnderpassTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ SwitchTrack ═════════════════════════════════════════════════════

  getSwitchTrackList(): SwitchTrack[] {
    return this.switchTrackList;
  }

  setSwitchTrackList(newList: SwitchTrack[]): void {
    this.switchTrackList = newList;
  }

  createAddSwitchTrack(
    switchType: SwitchType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new SwitchTrack(switchType, overallX, overallY);
    this.addSwitchTrack(track);
  }

  getSwitchTrackAt(
    locationX: number,
    locationY: number,
  ): SwitchTrack | null {
    for (const el of this.switchTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkSwitchTrackAt(locationX: number, locationY: number): boolean {
    return this.getSwitchTrackAt(locationX, locationY) !== null;
  }

  switchTrackListToSaveString(): string {
    return this.switchTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ CrossoverTrack ══════════════════════════════════════════════════

  getCrossoverTrackList(): CrossoverTrack[] {
    return this.crossoverTrackList;
  }

  setCrossoverTrackList(newList: CrossoverTrack[]): void {
    this.crossoverTrackList = newList;
  }

  createAddCrossoverTrack(
    crossoverType: CrossoverType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new CrossoverTrack(crossoverType, overallX, overallY);
    this.addCrossoverTrack(track);
  }

  getCrossoverTrackAt(
    locationX: number,
    locationY: number,
  ): CrossoverTrack | null {
    for (const el of this.crossoverTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkCrossoverTrackAt(
    locationX: number,
    locationY: number,
  ): boolean {
    return this.getCrossoverTrackAt(locationX, locationY) !== null;
  }

  crossoverTrackListToSaveString(): string {
    return this.crossoverTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ FlyoverTrack ════════════════════════════════════════════════════

  getFlyoverTrackList(): FlyoverTrack[] {
    return this.flyoverTrackList;
  }

  setFlyoverTrackList(newList: FlyoverTrack[]): void {
    this.flyoverTrackList = newList;
  }

  createAddFlyoverTrack(
    flyoverType: FlyoverType,
    overallX: number,
    overallY: number,
  ): void {
    const track = new FlyoverTrack(flyoverType, overallX, overallY);
    this.addFlyoverTrack(track);
  }

  getFlyoverTrackAt(
    locationX: number,
    locationY: number,
  ): FlyoverTrack | null {
    for (const el of this.flyoverTrackList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkFlyoverTrackAt(locationX: number, locationY: number): boolean {
    return this.getFlyoverTrackAt(locationX, locationY) !== null;
  }

  flyoverTrackListToSaveString(): string {
    return this.flyoverTrackList
      .map((t) => t.toSaveString())
      .join("\n");
  }

  // ══ NamedLocation ═══════════════════════════════════════════════════

  getNamedLocationList(): NamedLocation[] {
    return this.namedLocationList;
  }

  setNamedLocationList(newList: NamedLocation[]): void {
    this.namedLocationList = newList;
  }

  createAddNamedLocation(overallX: number, overallY: number): void {
    const namedLocation = new NamedLocation(overallX, overallY);
    this.addNamedLocation(namedLocation);
    this.linkNewElementToText(overallX, overallY);
  }

  getNamedLocationAt(
    locationX: number,
    locationY: number,
  ): NamedLocation | null {
    for (const el of this.namedLocationList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkNamedLocationAt(locationX: number, locationY: number): boolean {
    return this.getNamedLocationAt(locationX, locationY) !== null;
  }

  namedLocationListToSaveString(): string {
    return this.namedLocationList
      .map((el) => el.toSaveString())
      .join("\n");
  }

  // ══ Concourse ═══════════════════════════════════════════════════════

  getConcourseList(): Concourse[] {
    return this.concourseList;
  }

  setConcourseList(newList: Concourse[]): void {
    this.concourseList = newList;
  }

  createAddConcourse(overallX: number, overallY: number): void {
    const concourse = new Concourse(overallX, overallY);
    this.addConcourse(concourse);
    this.linkNewElementToText(overallX, overallY);
  }

  getConcourseAt(
    locationX: number,
    locationY: number,
  ): Concourse | null {
    for (const el of this.concourseList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkConcourseAt(locationX: number, locationY: number): boolean {
    return this.getConcourseAt(locationX, locationY) !== null;
  }

  concourseListToSaveString(): string {
    return this.concourseList
      .map((el) => el.toSaveString())
      .join("\n");
  }

  // ══ Parapet ═════════════════════════════════════════════════════════

  getParapetList(): Parapet[] {
    return this.parapetList;
  }

  setParapetList(newList: Parapet[]): void {
    this.parapetList = newList;
  }

  createAddParapet(
    parapetType: ParapetType,
    overallX: number,
    overallY: number,
  ): void {
    const parapet = new Parapet(parapetType, overallX, overallY);
    this.addParapet(parapet);
  }

  getParapetAt(
    locationX: number,
    locationY: number,
  ): Parapet | null {
    for (const el of this.parapetList) {
      if (
        el.getLocationX() === locationX &&
        el.getLocationY() === locationY
      )
        return el;
    }
    return null;
  }

  checkParapetAt(locationX: number, locationY: number): boolean {
    return this.getParapetAt(locationX, locationY) !== null;
  }

  parapetListToSaveString(): string {
    return this.parapetList.map((el) => el.toSaveString()).join("\n");
  }

  // ══ Text ════════════════════════════════════════════════════════════

  getTextList(): Text[] {
    return this.textList;
  }

  setTextList(newTextList: Text[]): void {
    this.textList = newTextList;
  }

  createAddText(
    overallX: number,
    overallY: number,
    readableBit: string,
    currentFont: FontInfo,
  ): Text {
    const text = new Text(overallX, overallY, readableBit, currentFont);
    this.addText(text);
    return text;
  }

  createAddLinkText(
    overallX: number,
    overallY: number,
    readableBit: string,
    ok: boolean,
    currentFont: FontInfo,
  ): void {
    let text = readableBit;
    if (text.startsWith(" ")) text = "";
    if (text !== "" && ok) {
      const t = this.createAddText(overallX, overallY, text, currentFont);
      this.linkLocalText(overallX, overallY, t);
    }
  }

  getTextAt(locationX: number, locationY: number): Text | null {
    for (const currentText of this.textList) {
      const textX = currentText.getLocationX();
      const textY = currentText.getLocationY();
      const editableX = currentText.getEditableX();
      const editableY = currentText.getEditableY();
      if (locationX >= textX && locationX <= editableX) {
        if (locationY >= textY && locationY <= editableY) {
          return currentText;
        }
      }
    }
    return null;
  }

  checkTextExists(locationX: number, locationY: number): boolean {
    for (const currentText of this.textList) {
      const textX = currentText.getLocationX();
      const textY = currentText.getLocationY();
      const editableX = currentText.getEditableX();
      const editableY = currentText.getEditableY();
      if (locationX >= textX && locationX <= editableX) {
        if (locationY >= textY && locationY <= editableY) {
          return true;
        }
      }
    }
    return false;
  }

  deleteText(textToDelete: Text): boolean {
    for (let i = 0; i < this.textList.length; i++) {
      if (this.textList[i] === textToDelete) {
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
  setTextToMove(newTextToMove: Text | null): void;
  setTextToMove(
    arg1: number | Text | null,
    arg2?: number,
  ): boolean | void {
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

  moveText(exactX: number, exactY: number): void {
    if (this.textToMove !== null) {
      const fontSize = this.textToMove.getFontSize();
      this.textToMove.setLocationX(exactX);
      this.textToMove.setLocationY(exactY);
      this.textToMove.setEditableX(exactX + fontSize);
      this.textToMove.setEditableY(exactY + fontSize);
    }
  }

  // ====================================================================
  // Text linking (delegated to map-text-linking)
  // ====================================================================

  /** @see map-text-linking.linkLocalText */
  linkLocalText(
    locationX: number,
    locationY: number,
    linkedText: Text,
  ): void {
    linkLocalText(this, locationX, locationY, linkedText);
  }

  /** @see map-text-linking.deleteTextFromAllElements */
  deleteTextFromAllElements(textToDelete: Text): void {
    deleteTextFromAllElements(this, textToDelete);
  }

  /** @see map-text-linking.linkNewElementToText */
  linkNewElementToText(locationX: number, locationY: number): void {
    linkNewElementToText(this, locationX, locationY);
  }

  /** @see map-text-linking.changeDeleteText */
  changeDeleteText(
    readableBit: string,
    ok: boolean,
    text: Text,
  ): void {
    changeDeleteText(this, readableBit, ok, text);
  }

  textListToSaveString(): string {
    return this.textList.map((t) => t.toSaveString()).join("\n");
  }

  // ====================================================================
  // Platform & level crossing (delegated to map-platform)
  // ====================================================================

  /** @see map-platform.addPlatform */
  addPlatform(
    side: Platform,
    locationX: number,
    locationY: number,
  ): void {
    addPlatformFn(this, side, locationX, locationY);
  }

  /** @see map-platform.addLevelCrossing */
  addLevelCrossing(locationX: number, locationY: number): void {
    addLevelCrossingFn(this, locationX, locationY);
  }

  // ══ Delete Element ══════════════════════════════════════════════════

  deleteElement(locationX: number, locationY: number): boolean {
    let deleted = false;
    const track = this.getTrackAt(locationX, locationY);
    const namedLocation = this.getNamedLocationAt(locationX, locationY);
    const concourse = this.getConcourseAt(locationX, locationY);

    if (track !== null && track.getNamed()) {
      const txt = track.getText();
      if (txt !== null) {
        this.deleteTextFromAllElements(txt);
        this.deleteText(txt);
      }
    } else if (namedLocation !== null && namedLocation.getNamed()) {
      const txt = namedLocation.getText();
      if (txt !== null) {
        this.deleteTextFromAllElements(txt);
        this.deleteText(txt);
      }
    } else if (concourse !== null && concourse.getNamed()) {
      const txt = concourse.getText();
      if (txt !== null) {
        this.deleteTextFromAllElements(txt);
        this.deleteText(txt);
      }
    }

    if (!deleted)
      deleted = this.removeStraightTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeDirectedTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeCurvedTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeLinkedTrack(locationX, locationY);
    if (!deleted) deleted = this.removeExitTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeBufferTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeSignalTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeBridgeUnderpassTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeSwitchTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeCrossoverTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeFlyoverTrack(locationX, locationY);
    if (!deleted)
      deleted = this.removeNamedLocation(locationX, locationY);
    if (!deleted)
      deleted = this.removeConcourse(locationX, locationY);
    if (!deleted)
      deleted = this.removeParapet(locationX, locationY);

    return deleted;
  }

  // ══ General lookups ═════════════════════════════════════════════════

  getElementAt(locationX: number, locationY: number): Element | null {
    const el = this.getElementExcludingTrackAt(locationX, locationY);
    if (el !== null) return el;
    return this.getTrackAt(locationX, locationY);
  }

  hasElementAt(locationX: number, locationY: number): boolean {
    return this.getElementAt(locationX, locationY) !== null;
  }

  getElementExcludingTrackAt(
    locationX: number,
    locationY: number,
  ): Element | null {
    // prettier-ignore
    for (const el of this.namedLocationList)
      if (el.getLocationX() === locationX && el.getLocationY() === locationY) return el;
    for (const el of this.concourseList)
      if (el.getLocationX() === locationX && el.getLocationY() === locationY) return el;
    for (const el of this.parapetList)
      if (el.getLocationX() === locationX && el.getLocationY() === locationY) return el;
    return null;
  }

  hasElementExcludingTrack(
    locationX: number,
    locationY: number,
  ): boolean {
    return (
      this.getElementExcludingTrackAt(locationX, locationY) !== null
    );
  }

  getNamedElementAt(
    locationX: number,
    locationY: number,
  ): NamedElement | null {
    for (const el of this.namedLocationList)
      if (el.getLocationX() === locationX && el.getLocationY() === locationY) return el;
    for (const el of this.concourseList)
      if (el.getLocationX() === locationX && el.getLocationY() === locationY) return el;
    return null;
  }

  getTrackAt(locationX: number, locationY: number): Track | null {
    // prettier-ignore
    for (const t of this.straightTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.directedTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.curvedTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.linkedTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.exitTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.bufferTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.signalTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.bridgeUnderpassTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.switchTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.crossoverTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.flyoverTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    return null;
  }

  hasTrackAt(locationX: number, locationY: number): boolean {
    return this.getTrackAt(locationX, locationY) !== null;
  }

  getTrackHasPlatformAt(
    locationX: number,
    locationY: number,
  ): StraightTrack | null {
    for (const t of this.straightTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.directedTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.bufferTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.signalTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    for (const t of this.switchTrackList)
      if (t.getLocationX() === locationX && t.getLocationY() === locationY) return t;
    return null;
  }

  // ══ Unified track list ══════════════════════════════════════════════

  getTrackList(): Track[] {
    return this.trackList;
  }

  setTrackList(newTrackList: Track[]): void {
    this.trackList = newTrackList;
  }

  makeTrackList(): void {
    const temp: Track[] = [];
    for (const t of this.straightTrackList) temp.push(t);
    for (const t of this.directedTrackList) temp.push(t);
    for (const t of this.curvedTrackList) temp.push(t);
    for (const t of this.linkedTrackList) temp.push(t);
    for (const t of this.exitTrackList) temp.push(t);
    for (const t of this.bufferTrackList) temp.push(t);
    for (const t of this.signalTrackList) temp.push(t);
    for (const t of this.bridgeUnderpassTrackList) temp.push(t);
    for (const t of this.switchTrackList) temp.push(t);
    for (const t of this.crossoverTrackList) temp.push(t);
    for (const t of this.flyoverTrackList) temp.push(t);
    this.trackList = temp;
  }

  // ====================================================================
  // Connectivity (delegated to map-connectivity)
  // ====================================================================

  /** @see map-connectivity.checkAllTracksConnected */
  checkAllTracksConnected(): boolean {
    return checkAllTracksConnectedFn(this);
  }
}
