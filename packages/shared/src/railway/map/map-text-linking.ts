import type { Map_ } from "./map";
import type { Text } from "../element";

// ============================================================================
// Text-linking helpers for Map_
// ============================================================================
//
// Extracted from the Map_ class so that text management logic lives in a
// focused file. Each function receives the Map_ instance and calls its
// public API.
// ============================================================================

/**
 * Try to link a text to an adjacent track / concourse / bridge.
 * (Formerly private Map_ method.)
 */
function tryLinkTrackOrConcourseOrBridge(
  map: Map_,
  x: number,
  y: number,
  linkedText: Text,
): void {
  const trackTemp = map.getTrackHasPlatformAt(x, y);
  const concourseTemp = map.getConcourseAt(x, y);
  const bridgeTemp = map.getBridgeUnderpassTrack(x, y);

  if (trackTemp !== null) {
    if (trackTemp.hasPlatform()) {
      if (!trackTemp.getNamed()) {
        linkLocalText(map, x, y, linkedText);
      }
    }
  } else if (concourseTemp !== null) {
    if (!concourseTemp.getNamed()) {
      linkLocalText(map, x, y, linkedText);
    }
  }
  if (bridgeTemp !== null) {
    if (!bridgeTemp.getNamed()) {
      linkLocalText(map, x, y, linkedText);
    }
  }
}

/**
 * Try to link a text to an adjacent named location.
 * (Formerly private Map_ method.)
 */
function tryLinkNamedLocationNeighbor(
  map: Map_,
  x: number,
  y: number,
  linkedText: Text,
): void {
  if (!map.checkElementExists(x, y)) return;
  const nl = map.getNamedLocationAt(x, y);
  if (nl !== null) {
    if (!nl.getNamed()) {
      linkLocalText(map, x, y, linkedText);
    }
  }
}

/**
 * Link a local text to elements at the given coordinates and propagate
 * to neighbors. (Formerly Map_.linkLocalText.)
 */
export function linkLocalText(
  map: Map_,
  locationX: number,
  locationY: number,
  linkedText: Text,
): void {
  if (map.checkElementExists(locationX, locationY)) {
    const track = map.getTrackHasPlatformAt(locationX, locationY);
    const concourse = map.getConcourseAt(locationX, locationY);
    const namedLocation = map.getNamedLocationAt(locationX, locationY);
    const bridgeUnderpassTrack = map.getBridgeUnderpassTrack(
      locationX,
      locationY,
    );

    if (bridgeUnderpassTrack !== null) {
      if (!bridgeUnderpassTrack.getNamed()) {
        bridgeUnderpassTrack.setText(linkedText);
      }
    }
    if (track !== null) {
      if (track.hasPlatform()) {
        track.setText(linkedText);
      }
    }
    if (concourse !== null) {
      if (!concourse.getNamed()) {
        concourse.setText(linkedText);
      }
    }
    if (namedLocation !== null) {
      if (!namedLocation.getNamed()) {
        namedLocation.setText(linkedText);
      }
    }

    if (track !== null || concourse !== null) {
      // above
      if (map.checkElementExists(locationX, locationY + 16)) {
        tryLinkTrackOrConcourseOrBridge(
          map,
          locationX,
          locationY + 16,
          linkedText,
        );
      }
      // below
      if (map.checkElementExists(locationX, locationY - 16)) {
        tryLinkTrackOrConcourseOrBridge(
          map,
          locationX,
          locationY - 16,
          linkedText,
        );
      }
      // right
      if (map.checkElementExists(locationX + 16, locationY)) {
        tryLinkTrackOrConcourseOrBridge(
          map,
          locationX + 16,
          locationY,
          linkedText,
        );
      }
      // left
      if (map.checkElementExists(locationX - 16, locationY)) {
        tryLinkTrackOrConcourseOrBridge(
          map,
          locationX - 16,
          locationY,
          linkedText,
        );
      }
    } else {
      // namedLocation neighbor propagation
      tryLinkNamedLocationNeighbor(
        map,
        locationX,
        locationY + 16,
        linkedText,
      );
      tryLinkNamedLocationNeighbor(
        map,
        locationX,
        locationY - 16,
        linkedText,
      );
      tryLinkNamedLocationNeighbor(
        map,
        locationX + 16,
        locationY,
        linkedText,
      );
      tryLinkNamedLocationNeighbor(
        map,
        locationX - 16,
        locationY,
        linkedText,
      );
    }
  }
}

/**
 * Delete a text from all named elements that reference it.
 * (Formerly Map_.deleteTextFromAllElements.)
 */
export function deleteTextFromAllElements(
  map: Map_,
  textToDelete: Text,
): void {
  const allNamed = [
    map.getStraightTrackList(),
    map.getDirectedTrackList(),
    map.getCurvedTrackList(),
    map.getLinkedTrackList(),
    map.getExitTrackList(),
    map.getBufferTrackList(),
    map.getSignalTrackList(),
    map.getBridgeUnderpassTrackList(),
    map.getSwitchTrackList(),
    map.getCrossoverTrackList(),
    map.getFlyoverTrackList(),
    map.getNamedLocationList(),
    map.getConcourseList(),
  ];
  for (const list of allNamed) {
    for (const el of list) {
      if (el.getText() === textToDelete) {
        el.setText(null);
      }
    }
  }
}

/**
 * Link a newly placed element to text from neighbors.
 * (Formerly Map_.linkNewElementToText.)
 */
export function linkNewElementToText(
  map: Map_,
  locationX: number,
  locationY: number,
): void {
  const namedLocation = map.getNamedLocationAt(locationX, locationY);
  const surroundingTextList: Text[] = [];

  if (namedLocation !== null) {
    const above = map.getNamedLocationAt(locationX, locationY + 16);
    if (above?.getNamed()) surroundingTextList.push(above.getText()!);
    const below = map.getNamedLocationAt(locationX, locationY - 16);
    if (below?.getNamed()) surroundingTextList.push(below.getText()!);
    const right = map.getNamedLocationAt(locationX + 16, locationY);
    if (right?.getNamed()) surroundingTextList.push(right.getText()!);
    const left = map.getNamedLocationAt(locationX - 16, locationY);
    if (left?.getNamed()) surroundingTextList.push(left.getText()!);
  } else {
    const trackAbove = map.getTrackAt(locationX, locationY + 16);
    const concourseAbove = map.getConcourseAt(locationX, locationY + 16);
    if (trackAbove?.getNamed()) surroundingTextList.push(trackAbove.getText()!);
    else if (concourseAbove?.getNamed())
      surroundingTextList.push(concourseAbove.getText()!);

    const trackBelow = map.getTrackAt(locationX, locationY - 16);
    const concourseBelow = map.getConcourseAt(locationX, locationY - 16);
    if (trackBelow?.getNamed()) surroundingTextList.push(trackBelow.getText()!);
    else if (concourseBelow?.getNamed())
      surroundingTextList.push(concourseBelow.getText()!);

    const trackRight = map.getTrackAt(locationX + 16, locationY);
    const concourseRight = map.getConcourseAt(locationX + 16, locationY);
    if (trackRight?.getNamed())
      surroundingTextList.push(trackRight.getText()!);
    else if (concourseRight?.getNamed())
      surroundingTextList.push(concourseRight.getText()!);

    const trackLeft = map.getTrackAt(locationX - 16, locationY);
    const concourseLeft = map.getConcourseAt(locationX - 16, locationY);
    if (trackLeft?.getNamed()) surroundingTextList.push(trackLeft.getText()!);
    else if (concourseLeft?.getNamed())
      surroundingTextList.push(concourseLeft.getText()!);
  }

  if (surroundingTextList.length > 0) {
    let textToLink: Text | null = null;

    if (surroundingTextList.length > 1) {
      const options = surroundingTextList.map((t) => t.getReadableText());
      const chosen = map.getTextSelectionPrompt()?.(options) ?? "";
      for (const t of surroundingTextList) {
        if (t.getReadableText() === chosen) {
          textToLink = t;
        }
      }
    } else {
      textToLink = surroundingTextList[0];
    }

    if (textToLink === null) {
      for (const t of surroundingTextList) {
        deleteTextFromAllElements(map, t);
        map.deleteText(t);
      }
    } else {
      linkLocalText(map, locationX, locationY, textToLink);
    }
  }
}

/**
 * Change or delete a text based on user input.
 * (Formerly Map_.changeDeleteText.)
 */
export function changeDeleteText(
  map: Map_,
  readableBit: string,
  ok: boolean,
  text: Text,
): void {
  let t = readableBit;
  if (t.startsWith(" ")) t = "";
  if (t !== "" && ok) {
    text.setReadableText(t);
  } else {
    deleteTextFromAllElements(map, text);
    map.deleteText(text);
  }
}
