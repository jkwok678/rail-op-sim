import type { Map_ } from "./map";
import type { Text } from "../element";

// ============================================================================
// Text-linking helpers for Map_
// ============================================================================

/** Cardinal direction offsets (dx, dy) in grid units. */
const NEIGHBOR_OFFSETS: readonly [number, number][] = [
  [0, 1],   // above
  [0, -1],  // below
  [1, 0],   // right
  [-1, 0],  // left
];

/**
 * Try to link a text to an adjacent track / concourse / bridge.
 */
function tryLinkTrackOrConcourseOrBridge(
  map: Map_,
  x: number,
  y: number,
  linkedText: Text,
): void {
  const trackTemp = map.getTrackHasPlatformAt(x, y);
  const concourseTemp = map.getConcourseAt(x, y);
  const bridgeTemp = map.getTrackAt(x, y);

  if (trackTemp) {
    if (trackTemp.hasPlatform() && !trackTemp.getNamed()) {
      linkLocalText(map, x, y, linkedText);
    }
  } else if (concourseTemp) {
    if (!concourseTemp.getNamed()) {
      linkLocalText(map, x, y, linkedText);
    }
  }

  // Check if it's a bridge/underpass (now included in getTrackHasPlatformAt)
  if (bridgeTemp && (bridgeTemp.data.kind === "bridgeUnderpass")) {
    if (!bridgeTemp.getNamed()) {
      linkLocalText(map, x, y, linkedText);
    }
  }
}

/**
 * Try to link a text to an adjacent named location.
 */
function tryLinkNamedLocationNeighbor(
  map: Map_,
  x: number,
  y: number,
  linkedText: Text,
): void {
  if (!map.checkElementExists(x, y)) return;
  const nl = map.getNamedLocationAt(x, y);
  if (nl && !nl.getNamed()) {
    linkLocalText(map, x, y, linkedText);
  }
}

/**
 * Link a local text to elements at the given coordinates and propagate
 * to neighbors.
 */
export function linkLocalText(
  map: Map_,
  locationX: number,
  locationY: number,
  linkedText: Text,
): void {
  if (!map.checkElementExists(locationX, locationY)) return;

  const track = map.getTrackHasPlatformAt(locationX, locationY);
  const concourse = map.getConcourseAt(locationX, locationY);
  const namedLocation = map.getNamedLocationAt(locationX, locationY);
  const bridgeUnderpassTrack = map.getTrackAt(locationX, locationY);

  if (bridgeUnderpassTrack && bridgeUnderpassTrack.data.kind === "bridgeUnderpass") {
    if (!bridgeUnderpassTrack.getNamed()) {
      bridgeUnderpassTrack.setText(linkedText);
    }
  }
  if (track && track.hasPlatform()) {
    track.setText(linkedText);
  }
  if (concourse && !concourse.getNamed()) {
    concourse.setText(linkedText);
  }
  if (namedLocation && !namedLocation.getNamed()) {
    namedLocation.setText(linkedText);
  }

  const grid = map.getImageSize();

  if (track || concourse) {
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      if (map.checkElementExists(locationX + dx * grid, locationY + dy * grid)) {
        tryLinkTrackOrConcourseOrBridge(
          map,
          locationX + dx * grid,
          locationY + dy * grid,
          linkedText,
        );
      }
    }
  } else {
    // namedLocation neighbor propagation
    for (const [dx, dy] of NEIGHBOR_OFFSETS) {
      tryLinkNamedLocationNeighbor(
        map,
        locationX + dx * grid,
        locationY + dy * grid,
        linkedText,
      );
    }
  }
}

/**
 * Delete a text from all named elements that reference it.
 */
export function deleteTextFromAllElements(
  map: Map_,
  textToDelete: Text,
): void {
  // Iterate all tracks dynamically (no hardcoded kind list)
  map.forEachTrack((el) => {
    if (el.getText() === textToDelete) {
      el.setText(null);
    }
  });

  for (const el of map.getNamedLocationList()) {
    if (el.getText() === textToDelete) {
      el.setText(null);
    }
  }

  for (const el of map.getConcourseList()) {
    if (el.getText() === textToDelete) {
      el.setText(null);
    }
  }
}

/**
 * Collect texts from named neighbours in the 4 cardinal directions.
 */
function collectNeighbourTexts(
  map: Map_,
  locationX: number,
  locationY: number,
  isNamedLocation: boolean,
): Text[] {
  const grid = map.getImageSize();
  const surroundingTextList: Text[] = [];

  for (const [dx, dy] of NEIGHBOR_OFFSETS) {
    const nx = locationX + dx * grid;
    const ny = locationY + dy * grid;

    if (isNamedLocation) {
      const neighbour = map.getNamedLocationAt(nx, ny);
      if (neighbour?.getNamed()) {
        const t = neighbour.getText();
        if (t) surroundingTextList.push(t);
      }
    } else {
      const trackNeighbour = map.getTrackAt(nx, ny);
      const concourseNeighbour = map.getConcourseAt(nx, ny);
      if (trackNeighbour?.getNamed()) {
        const t = trackNeighbour.getText();
        if (t) surroundingTextList.push(t);
      } else if (concourseNeighbour?.getNamed()) {
        const t = concourseNeighbour.getText();
        if (t) surroundingTextList.push(t);
      }
    }
  }

  return surroundingTextList;
}

/**
 * Link a newly placed element to text from neighbors.
 */
export function linkNewElementToText(
  map: Map_,
  locationX: number,
  locationY: number,
): void {
  const namedLocation = map.getNamedLocationAt(locationX, locationY);
  const surroundingTextList = collectNeighbourTexts(
    map,
    locationX,
    locationY,
    namedLocation !== null,
  );

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
