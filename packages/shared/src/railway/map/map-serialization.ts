import { Concourse, NamedLocation, Parapet, Text } from "../element";
import type { ParapetType } from "../enums";
import type { Track } from "../track/track";
import type { TrackData } from "../track/track-data";
import type { FontInfo } from "../types";
import type { Map_ } from "./map";

// ============================================================================
// map-serialization — plain-JSON snapshot of a Map_ for file save / load
// ============================================================================
//
// `TrackData` is already a plain, serialisable discriminated union (kind/subtype
// plus platform1/platform2/levelCrossing/aspect flags), so it is stored verbatim.
// Every track is serialised with its *full* main + secondary speed/length quad —
// defaults included — so a save→load reproduces exact values regardless of what
// the `Track` constructor's `DEFAULT_*` seeds happen to be.
//
// Text objects (both standalone and element labels, which may be flood-fill
// shared across several elements) live in one authoritative `texts` array; named
// elements reference their label by index, preserving sharing losslessly.

/** Bump when the on-disk shape changes in a backwards-incompatible way. */
export const SERIALIZED_MAP_VERSION = 1;

export interface SerializedTrack {
	/** Full TrackData union — carries kind, subtype, platforms, level crossing, aspect. */
	data: TrackData;
	x: number;
	y: number;
	mainSpeed: number;
	mainLength: number;
	/** `-1` when the kind has no secondary path. */
	secondarySpeed: number;
	secondaryLength: number;
	/** Grid coords of the paired track (only for wired "linked" tracks). */
	linkedTo?: [number, number];
	/** Preferred travel directions (entry→exit link pairs); omitted when empty. */
	preferredDirections?: { entry: number; exit: number }[];
	/** Index into {@link SerializedMap.texts} of this track's label, if named. */
	textIndex?: number;
}

export interface SerializedNamedElement {
	x: number;
	y: number;
	/** Index into {@link SerializedMap.texts} of this element's label, if named. */
	textIndex?: number;
}

export interface SerializedParapet {
	type: ParapetType;
	x: number;
	y: number;
}

export interface SerializedText {
	x: number;
	y: number;
	readableText: string;
	font: FontInfo;
}

export interface SerializedMap {
	version: typeof SERIALIZED_MAP_VERSION;
	imageSize: number;
	tracks: SerializedTrack[];
	namedLocations: SerializedNamedElement[];
	concourses: SerializedNamedElement[];
	parapets: SerializedParapet[];
	texts: SerializedText[];
}

/** Build a plain-JSON snapshot of every user-placed element in `map`. */
export function serializeMap(map: Map_): SerializedMap {
	// The Text list is authoritative; elements reference their label by index.
	const textList = map.getTextList();
	const indexOfText = new Map<Text, number>();
	textList.forEach((t, i) => {
		indexOfText.set(t, i);
	});

	const texts: SerializedText[] = textList.map((t) => ({
		x: t.getLocationX(),
		y: t.getLocationY(),
		readableText: t.getReadableText(),
		font: { ...t.getFont() },
	}));

	const tracks: SerializedTrack[] = [];
	map.forEachTrack((t) => {
		const entry: SerializedTrack = {
			data: structuredClone(t.data),
			x: t.getLocationX(),
			y: t.getLocationY(),
			mainSpeed: t.getTrackMainSpeed(),
			mainLength: t.getTrackMainLength(),
			secondarySpeed: t.getTrackSecondarySpeed(),
			secondaryLength: t.getTrackSecondaryLength(),
		};
		const other = t.getOtherLinkedTrack();
		if (other) entry.linkedTo = [other.getLocationX(), other.getLocationY()];
		const prefDirs = t.getPreferredDirections();
		if (prefDirs.length > 0) {
			entry.preferredDirections = prefDirs.map((p) => ({
				entry: p.entry,
				exit: p.exit,
			}));
		}
		const label = t.getText();
		if (label) entry.textIndex = indexOfText.get(label);
		tracks.push(entry);
	});

	const serializeNamed = (
		el: NamedLocation | Concourse,
	): SerializedNamedElement => {
		const e: SerializedNamedElement = {
			x: el.getLocationX(),
			y: el.getLocationY(),
		};
		const label = el.getText();
		if (label) e.textIndex = indexOfText.get(label);
		return e;
	};

	return {
		version: SERIALIZED_MAP_VERSION,
		imageSize: map.getImageSize(),
		tracks,
		namedLocations: map.getNamedLocationList().map(serializeNamed),
		concourses: map.getConcourseList().map(serializeNamed),
		parapets: map.getParapetList().map((p) => ({
			type: p.getParapetType(),
			x: p.getLocationX(),
			y: p.getLocationY(),
		})),
		texts,
	};
}

/**
 * Rebuild `target` in place from a {@link SerializedMap} snapshot. The caller is
 * responsible for resetting `target` first (see {@link Map_.clearAll}) and for
 * re-syncing any render layers afterwards.
 */
export function deserializeMap(data: SerializedMap, target: Map_): void {
	target.setImageSize(data.imageSize);

	// Rebuild under one prune pass: each addTrack would otherwise drop pairs
	// whose neighbours have not been loaded yet.
	target.deferPreferredDirectionRevalidation(() => {
		// 1. Recreate the authoritative Text list so elements can reference by index.
		const texts = data.texts.map((s) => {
			const t = new Text(s.x, s.y, s.readableText, { ...s.font });
			target.addText(t);
			return t;
		});

		const attachLabel = (
			el: Track | NamedLocation | Concourse,
			textIndex: number | undefined,
		): void => {
			if (textIndex !== undefined && texts[textIndex]) {
				el.setText(texts[textIndex]);
			}
		};

		// 2. Tracks — data carries platforms/level-crossing/aspect; always restore the
		//    full speed/length quad rather than leaving the constructor's defaults.
		const linkPairs: Array<[[number, number], [number, number]]> = [];
		for (const s of data.tracks) {
			const track = target.addTrack(structuredClone(s.data), s.x, s.y);
			track.setTrackMainSpeed(s.mainSpeed);
			track.setTrackMainLength(s.mainLength);
			track.setTrackSecondarySpeed(s.secondarySpeed);
			track.setTrackSecondaryLength(s.secondaryLength);
			// Restore through the adder so link-mask and traversability validation
			// still apply — a pair an older build wrote through an impossible turn
			// (or against a one-way track) is dropped rather than reloaded. A
			// second pass at the end of this batch then drops pairs that do not
			// continue through the finished topology.
			for (const p of s.preferredDirections ?? []) {
				track.addPreferredDirection(p.entry, p.exit);
			}
			attachLabel(track, s.textIndex);
			if (s.linkedTo) linkPairs.push([[s.x, s.y], s.linkedTo]);
		}

		// 3. Re-wire linked-track pairs by coordinate (both directions serialise the
		//    partner, so each side gets set as its own entry is processed).
		for (const [a, b] of linkPairs) {
			const ta = target.getTrackAt(a[0], a[1]);
			const tb = target.getTrackAt(b[0], b[1]);
			if (ta && tb) ta.setOtherLinkedTrack(tb);
		}

		// 4. Non-track elements.
		for (const s of data.namedLocations) {
			const nl = new NamedLocation(s.x, s.y);
			target.addNamedLocation(nl);
			attachLabel(nl, s.textIndex);
		}
		for (const s of data.concourses) {
			const c = new Concourse(s.x, s.y);
			target.addConcourse(c);
			attachLabel(c, s.textIndex);
		}
		for (const s of data.parapets) {
			target.addParapet(new Parapet(s.type, s.x, s.y));
		}

		target.makeTrackList();
	});
}
