import { firstOf, itemAt, lastOf } from "../../util/checked";
import { MinHeap } from "../../util/min-heap";
import { Concourse, type NamedElement, NamedLocation } from "../element";
import { type PreferredDirection, Track } from "../track/track";
import { getDirectedFlow, isTraversableLinkPair } from "../track/track-data";
import type { Map_ } from "./map";

/** Why a preferred-direction pair is not a valid route through the current map. */
export type PreferredDirectionIssueReason =
	| "not-traversable"
	| "no-neighbor"
	| "no-reciprocal"
	| "no-continuation";

/** One preferred-direction pair that does not continue through the map. */
export interface PreferredDirectionIssue {
	track: Track;
	pair: PreferredDirection;
	reason: PreferredDirectionIssueReason;
}

// ============================================================================
// Connectivity helpers for Map_
// ============================================================================

/**
 * Relative neighbour offsets for each link index (0-8).
 * Link 4 is unused (represented as [0, 0]).
 */
export const LINK_OFFSETS: readonly [number, number][] = [
	[-1, 1], // 0: top-left
	[0, 1], // 1: top
	[1, 1], // 2: top-right
	[-1, 0], // 3: left
	[0, 0], // 4: (unused)
	[1, 0], // 5: right
	[-1, -1], // 6: bottom-left
	[0, -1], // 7: bottom
	[1, -1], // 8: bottom-right
];

/** {@link LINK_OFFSETS} for `link`; throws for anything outside 0–8. */
export function linkOffset(link: number): readonly [number, number] {
	return itemAt(LINK_OFFSETS, link, "link");
}

/** A track with at least one active link that does not join a neighbour. */
export interface DanglingLink {
	track: Track;
	/**
	 * Link indices (0–8) whose neighbouring cell is empty, or whose neighbour
	 * does not expose the reciprocal link (`8 - link`). Occupancy alone is not
	 * a join — an H straight beside a V straight sits next door without
	 * connecting.
	 */
	links: number[];
}

/**
 * A full account of why a map is (or is not) a complete railway.
 *
 * {@link connected} is the physical gate (joined tracks, paired portals) that
 * unlocks the direction tool. {@link complete} is the operational railway:
 * connected, every nameable element named, every track directed, no broken
 * routes.
 */
export interface ConnectivityReport {
	/** Total tracks on the map. */
	total: number;
	/**
	 * True when every active link joins a neighbour that links back and every
	 * portal is paired. Empty maps are not connected. Naming and preferred
	 * directions are not part of this flag.
	 */
	connected: boolean;
	/**
	 * True when the railway is ready: {@link connected}, nothing unnamed,
	 * every track has preferred directions, and none of those routes are
	 * broken.
	 */
	complete: boolean;
	/** Tracks with an active link that does not join a neighbour, in map order. */
	dangling: DanglingLink[];
	/** Linked tracks (portals) with no partner. */
	unpairedLinked: Track[];
	/**
	 * Nameable elements still missing a label: named locations, concourses,
	 * platforms, and bridges/underpasses.
	 */
	unnamed: NamedElement[];
	/** Tracks with no preferred-direction pair set. */
	undirected: Track[];
	/**
	 * Preferred-direction pairs that do not continue through the current
	 * topology — pointing into empty space, into a cell that has no reciprocal
	 * link, through a missing switch rail, or into a neighbour (or portal
	 * partner) that does not receive the route.
	 */
	brokenRoutes: PreferredDirectionIssue[];
}

/**
 * Describe the connectivity of the whole map: every dangling link, unpaired
 * portal, unnamed element, and undirected track, not just whether a problem
 * exists.
 *
 * Unlike {@link checkAllTracksConnected} this does not short-circuit, so the
 * counts are complete and the UI can point the user at the first offender.
 */
export function getConnectivityReport(map: Map_): ConnectivityReport {
	map.makeTrackList();
	const trackList: Track[] = map.getTrackList();
	const grid = map.getImageSize();

	const dangling: DanglingLink[] = [];
	for (const track of trackList) {
		const cx = track.getLocationX();
		const cy = track.getLocationY();
		const links: number[] = [];

		for (let link = 0; link <= 8; link++) {
			if (link === 4) continue; // unused slot
			if (!track.getLinkAt(link)) continue;
			if (!isActiveLinkJoined(map, link, grid, cx, cy)) {
				links.push(link);
			}
		}
		if (links.length > 0) dangling.push({ track, links });
	}

	const unpairedLinked = findUnpairedLinkedTracks(map);
	const unnamed = collectUnnamedElements(map);
	const undirected = collectUndirectedTracks(map);
	const brokenRoutes = collectPreferredDirectionIssues(map);
	const connected =
		trackList.length > 0 &&
		dangling.length === 0 &&
		unpairedLinked.length === 0;

	return {
		total: trackList.length,
		connected,
		complete:
			connected &&
			unnamed.length === 0 &&
			undirected.length === 0 &&
			brokenRoutes.length === 0,
		dangling,
		unpairedLinked,
		unnamed,
		undirected,
		brokenRoutes,
	};
}

/**
 * True when the railway is ready to operate: tracks joined, portals paired,
 * every nameable element named, and preferred directions set on every track
 * with none broken.
 *
 * Physical joining alone is {@link ConnectivityReport.connected} (and
 * {@link checkAllTracksConnected}); this is the stricter operational check.
 */
export function isRailwayComplete(map: Map_): boolean {
	return getConnectivityReport(map).complete;
}

/** Named locations, concourses, platforms, and bridges/underpasses need a label. */
export function elementNeedsName(el: NamedElement): boolean {
	if (el instanceof NamedLocation || el instanceof Concourse) return true;
	if (el instanceof Track) {
		return el.data.kind === "bridgeUnderpass" || el.hasPlatform();
	}
	return false;
}

function collectUnnamedElements(map: Map_): NamedElement[] {
	const unnamed: NamedElement[] = [];
	for (const el of map.getNamedLocationList()) {
		if (!el.getNamed()) unnamed.push(el);
	}
	for (const el of map.getConcourseList()) {
		if (!el.getNamed()) unnamed.push(el);
	}
	map.forEachTrack((track) => {
		if (elementNeedsName(track) && !track.getNamed()) unnamed.push(track);
	});
	return unnamed;
}

function collectUndirectedTracks(map: Map_): Track[] {
	const undirected: Track[] = [];
	map.forEachTrack((track) => {
		if (!track.hasPreferredDirection()) undirected.push(track);
	});
	return undirected;
}

/**
 * Check that all tracks on the map are properly connected.
 *
 * A thin wrapper over {@link getConnectivityReport} — use that instead when the
 * caller wants to tell the user *what* is wrong, {@link isRailwayComplete}
 * when the railway must also be named and directed, or
 * {@link ConnectivityReport.connected} when a boolean with no message is enough
 * for physical joining alone.
 */
export function checkAllTracksConnected(map: Map_): boolean {
	const report = getConnectivityReport(map);

	if (report.total === 0) {
		map.getOnMessage()?.("error", "There are zero tracks stored.");
		return false;
	}

	return report.connected;
}

/**
 * Whether the active `link` at `(cx, cy)` joins a neighbour that exposes the
 * reciprocal edge. Empty cells and occupancy-only neighbours (H next to V)
 * both fail — same test railway-dot-exe uses when filling `ConnLinkPos`.
 */
function isActiveLinkJoined(
	map: Map_,
	link: number,
	step: number,
	cx: number,
	cy: number,
): boolean {
	const [dx, dy] = linkOffset(link);
	const neighbor = map.getTrackAt(cx + dx * step, cy + dy * step);
	return neighbor?.getLinkAt(8 - link) === true;
}

// ============================================================================
// Linked track diagnostics
// ============================================================================

export interface LinkedTrackPair {
	a: Track;
	b: Track;
}

export interface LinkedTrackReport {
	total: number;
	paired: number;
	unpaired: number;
	allPaired: boolean;
	pairedPairs: LinkedTrackPair[];
	unpairedTracks: Track[];
}

/** Return every linked track on the map. */
export function findAllLinkedTracks(map: Map_): Track[] {
	return map.getTracksOfKind("linked");
}

/** Return linked tracks that have no partner. */
export function findUnpairedLinkedTracks(map: Map_): Track[] {
	return findAllLinkedTracks(map).filter((t) => !t.isLinked());
}

/** Collect properly paired linked tracks as `{a, b}` tuples (each pair once). */
export function getLinkedTrackPairs(map: Map_): LinkedTrackPair[] {
	const linked = findAllLinkedTracks(map);
	const pairs: LinkedTrackPair[] = [];

	// Use the Track.found flag to avoid double-counting
	for (const t of linked) t.setFound(false);
	for (const t of linked) {
		if (t.getFound()) continue;
		const partner = t.getOtherLinkedTrack();
		if (partner) {
			pairs.push({ a: t, b: partner });
			t.setFound(true);
			partner.setFound(true);
		}
	}
	for (const t of linked) t.setFound(false);

	return pairs;
}

/** Aggregate summary of all linked tracks and their pairing status. */
export function getLinkedTrackReport(map: Map_): LinkedTrackReport {
	const allLinked = findAllLinkedTracks(map);
	const pairs = getLinkedTrackPairs(map);
	const unpairedTracks = findUnpairedLinkedTracks(map);
	return {
		total: allLinked.length,
		paired: pairs.length * 2,
		unpaired: unpairedTracks.length,
		allPaired: unpairedTracks.length === 0,
		pairedPairs: pairs,
		unpairedTracks,
	};
}

// ============================================================================
// Section path-finding
// ============================================================================

/** Options for {@link findPathBetween}. */
export interface PathOptions {
	/**
	 * Refuse to route against the arrow of a one-way `directed` track. Off by
	 * default (section selection is direction-agnostic); on for preferred
	 * directions, which record an actual travel direction.
	 */
	respectOneWay?: boolean;
}

/** A search node: a track reached through a given entry link (null for `start`). */
interface PathNode {
	track: Track;
	/** Link index the track was entered by, or `null` for the start track. */
	entry: number | null;
	prev: PathNode | null;
	/** Tracks stepped onto so far. */
	steps: number;
	/** Tracks so far run through other than straight across. */
	bends: number;
}

/**
 * Find the shortest path between two tracks: the fewest tracks, and of paths
 * as short, the one with fewest bends — so it runs straight through points
 * rather than round a loop or over a crossover and back.
 * Returns the path as an array of tracks (inclusive of start and end),
 * or `null` if the tracks are in disconnected components.
 *
 * The search is link-aware: a track is expanded per entry link, and only exits
 * that {@link isTraversableLinkPair} allows for that entry are followed. So a
 * route cannot U-turn, nor hop between the two independent paths of a
 * crossover/flyover, nor take an impossible turn across a switch. A step is
 * also only taken when the neighbour links back: occupancy alone is not a
 * connection (an H straight sits beside a V straight without joining it), and
 * {@link isRailwayComplete} requires the same reciprocal join, so the check
 * has to happen here as well as in the completeness report.
 *
 * With `respectOneWay`, a `directed` track is entered only by its arrow's entry
 * edge and left only by its exit edge — including when it is the start track
 * (seeded with the arrow's entry) or the goal.
 *
 * Paired linked tracks are one edge: the search hops from a portal mouth to
 * its partner's mouth, so a route (and a section) can be set across a portal
 * in one gesture.
 */
export function findPathBetween(
	map: Map_,
	start: Track,
	end: Track,
	opts: PathOptions = {},
): Track[] | null {
	if (start === end) return [start];

	map.makeTrackList();
	const trackList = map.getTrackList();

	// Reset found flags before traversal
	for (const t of trackList) t.setFound(false);

	/** Entry links already expanded per track (`-1` = the start track). */
	const settled = new Map<Track, Set<number>>();
	const settle = (node: PathNode): boolean => {
		let entries = settled.get(node.track);
		if (entries === undefined) {
			entries = new Set();
			settled.set(node.track, entries);
		}
		const key = node.entry ?? -1;
		if (entries.has(key)) return false;
		entries.add(key);
		node.track.setFound(true);
		return true;
	};

	/**
	 * Whether `track` may be entered by `entry`: the link must be active or a
	 * terminus dead-end (portal mouth), and a one-way track accepts only its
	 * arrow's entry edge.
	 */
	const canEnter = (track: Track, entry: number): boolean => {
		if (!track.getLinkAt(entry) && !track.isTerminusDeadEnd(entry)) {
			return false;
		}
		if (!opts.respectOneWay || track.data.kind !== "directed") return true;
		const flow = getDirectedFlow(track.data.subtype);
		return flow === null || entry === flow.entry;
	};

	/** Whether `node` may be left by `exit`. */
	const canLeave = (node: PathNode, exit: number): boolean =>
		node.entry === null ||
		isTraversableLinkPair(
			node.track.data.kind,
			node.track.data.subtype,
			node.entry,
			exit,
			opts.respectOneWay,
		);

	/** The node for stepping off `from` by `exit` onto `track` by `entry`. */
	const stepTo = (
		from: PathNode,
		exit: number,
		track: Track,
		entry: number,
	): PathNode => ({
		track,
		entry,
		prev: from,
		steps: from.steps + 1,
		bends:
			from.bends + (from.entry === null || from.entry + exit === 8 ? 0 : 1),
	});

	// A one-way start track can only be left by its arrow, so seed the search
	// with the arrow's entry edge instead of leaving it unconstrained.
	const startEntry =
		opts.respectOneWay && start.data.kind === "directed"
			? (getDirectedFlow(start.data.subtype)?.entry ?? null)
			: null;

	const step = map.getImageSize();
	const queue = new MinHeap<PathNode>((a, b) =>
		a.steps !== b.steps ? a.steps < b.steps : a.bends < b.bends,
	);
	queue.push({
		track: start,
		entry: startEntry,
		prev: null,
		steps: 0,
		bends: 0,
	});
	let goal: PathNode | null = null;

	while (queue.size > 0) {
		const current = queue.pop() as PathNode;
		if (current.track === end) {
			goal = current;
			break;
		}
		if (!settle(current)) continue;
		const cx = current.track.getLocationX();
		const cy = current.track.getLocationY();

		for (let link = 0; link <= 8; link++) {
			if (link === 4) continue;
			if (!current.track.getLinkAt(link) || !canLeave(current, link)) continue;
			const [dx, dy] = linkOffset(link);
			const neighbor = map.getTrackAt(cx + dx * step, cy + dy * step);
			// The neighbour is entered by its opposite link.
			if (!neighbor || !canEnter(neighbor, 8 - link)) continue;
			if (settled.get(neighbor)?.has(8 - link)) continue;
			queue.push(stepTo(current, link, neighbor, 8 - link));
		}

		// Hop through a paired portal: leave via this cell's mouth, arrive
		// via the partner's mouth. A U-turn back through the same mouth is
		// rejected by isTraversableLinkPair (entry === exit).
		const partner = current.track.getOtherLinkedTrack();
		const mouth = portalMouthLink(current.track);
		const partnerMouth = partner ? portalMouthLink(partner) : null;
		if (
			partner &&
			mouth !== null &&
			partnerMouth !== null &&
			canLeave(current, mouth) &&
			canEnter(partner, partnerMouth) &&
			!settled.get(partner)?.has(partnerMouth)
		) {
			queue.push(stepTo(current, mouth, partner, partnerMouth));
		}
	}

	// Always reset found flags after traversal
	for (const t of trackList) t.setFound(false);

	if (goal === null) return null;

	// Reconstruct path by walking the parent chain from end to start
	const path: Track[] = [];
	for (let node: PathNode | null = goal; node !== null; node = node.prev) {
		path.push(node.track);
	}
	path.reverse();
	return path;
}

// ============================================================================
// Preferred-direction assignment
// ============================================================================

/**
 * Reverse of {@link LINK_OFFSETS}: map a neighbour offset back to its link
 * index. Returns `null` for the unused centre `[0, 0]` or any offset outside
 * the 3×3 neighbourhood.
 *
 * Formula: `link = (1 - dy) * 3 + (dx + 1)` (e.g. `[-1,1]→0`, `[1,0]→5`,
 * `[0,-1]→7`), rejecting `[0,0]` (→4, unused) and any non-integer offset (which
 * would otherwise yield a fractional index that silently truncates downstream).
 */
export function linkIndexForOffset(dx: number, dy: number): number | null {
	if (!Number.isInteger(dx) || !Number.isInteger(dy)) return null;
	if (dx < -1 || dx > 1 || dy < -1 || dy > 1) return null;
	if (dx === 0 && dy === 0) return null;
	return (1 - dy) * 3 + (dx + 1);
}

/**
 * Resolve the "other" link at a path endpoint — the entry when we know the exit,
 * or vice-versa — mirroring railway-dot-exe's handling of a PrefDir's first/last
 * element (which always receives a direction, derived from the element's opposite
 * connection slot):
 *  - straights & curves (2 links): the track's other active link;
 *  - buffers & exits (1 link): the dead-end edge opposite the single link
 *    (`8 - known`), so the route records travel into the terminus;
 *  - linked tracks (1 link): `null` — a portal is not a terminus; the route
 *    either continues through the partner (an interior hop) or leaves the
 *    portal unset;
 *  - switches & crossovers (3+ links): the unique traversable partner among
 *    active links, so a trailing entry (or a crossover's only legal pair)
 *    resolves and a facing/stem entry — two surviving partners — stays unset.
 */
function endpointOtherLink(track: Track, known: number): number | null {
	const active: number[] = [];
	for (let link = 0; link <= 8; link++) {
		if (link === 4) continue;
		if (track.getLinkAt(link)) active.push(link);
	}
	if (active.length === 2) return active.find((l) => l !== known) ?? null;
	if (active.length === 1) {
		if (track.data.kind === "linked") return null;
		return 8 - known;
	}
	const partners = active.filter(
		(l) =>
			l !== known &&
			isTraversableLinkPair(track.data.kind, track.data.subtype, known, l),
	);
	return partners.length === 1 ? (partners[0] ?? null) : null;
}

/** Outcome of {@link setPreferredDirectionsAlongPath}. */
export interface PreferredDirectionResult {
	/** The path the directions were assigned along, start→end inclusive. */
	path: Track[];
	/** Pairs newly added (already-present pairs are deduped and not counted). */
	applied: number;
	/** Path tracks that received no new pair (undeterminable, rejected, or duplicate). */
	unassigned: number;
	/**
	 * True when a path endpoint is a facing switch (two legal exits). Nothing
	 * was written — the caller should keep the gesture open so the user can
	 * click past the switch and pick a branch.
	 */
	facingSwitchEndpoint: boolean;
}

/**
 * Assign preferred travel directions to every track along the shortest path
 * from `start` to `end` (found via {@link findPathBetween}), additively.
 *
 * For each interior track the entry→exit pair points from the previous track
 * toward the next. Endpoints (the first/last clicked track) also receive a
 * direction, borrowing their missing link via {@link endpointOtherLink}: the
 * other active link for straights/curves, the dead-end edge for buffers/exits,
 * and the unique traversable partner for switches and crossovers. A facing
 * switch endpoint (two legal exits) refuses the whole write — see below.
 *
 * Returns the path plus what was actually written (tracks mutated in place), or
 * `null` when the tracks are disconnected (in which case nothing is mutated).
 * `applied === 0` means the gesture changed nothing — every pair was already
 * present, or none could be determined.
 *
 * A facing-switch endpoint (two legal exits) is not a partial write: nothing
 * is mutated and `facingSwitchEndpoint` is set, so the caller can keep the
 * start click and ask the user to click past the switch.
 *
 * Paired portals are one edge ({@link findPathBetween} hops them), so a
 * gesture that starts on one side and ends on the other assigns both mouths
 * and the far railway in one go.
 */
export function setPreferredDirectionsAlongPath(
	map: Map_,
	start: Track,
	end: Track,
): PreferredDirectionResult | null {
	const path = findPathBetween(map, start, end, { respectOneWay: true });
	if (path === null) return null;

	const legs = resolvePathDirections(map, path);
	const facingSwitchEndpoint =
		path.length > 1 &&
		((legs[0] === null && firstOf(path, "track").data.kind === "switch") ||
			(legs[path.length - 1] === null &&
				lastOf(path, "track").data.kind === "switch"));
	if (facingSwitchEndpoint) {
		return {
			path,
			applied: 0,
			unassigned: path.length,
			facingSwitchEndpoint: true,
		};
	}

	let applied = 0;
	let unassigned = 0;

	for (const [i, track] of path.entries()) {
		const leg = legs[i];
		if (leg && track.addPreferredDirection(leg.entry, leg.exit)) {
			applied++;
		} else {
			unassigned++;
		}
	}

	return { path, applied, unassigned, facingSwitchEndpoint: false };
}

/** Outcome of {@link clearPreferredDirectionsAlongPath}. */
export interface PreferredDirectionRemovalResult {
	/** The path the directions were removed along, start→end inclusive. */
	path: Track[];
	/** Path tracks that lost at least one pair. */
	removed: number;
	/** Path tracks that had nothing to remove (undeterminable or never set). */
	untouched: number;
}

/**
 * Undo {@link setPreferredDirectionsAlongPath}: clear the route each track
 * along the start→end path carries — both the entry→exit pair that gesture
 * would have assigned *and* its mirror — leaving every other pair on those
 * tracks in place.
 *
 * Taking the mirror too is what "erase this route" means: a stretch set to run
 * both ways is one route in the user's head, so retracing it either way round
 * clears it rather than silently leaving it one-way. Routes that merely cross
 * it survive — a spur set separately through a switch keeps its directions.
 *
 * Returns the path plus how many of its tracks were changed (tracks mutated in
 * place), or `null` when the tracks are disconnected (nothing is mutated).
 * `removed === 0` means the gesture changed nothing — no track along the path
 * carried the route — which callers should surface rather than reporting
 * success.
 */
export function clearPreferredDirectionsAlongPath(
	map: Map_,
	start: Track,
	end: Track,
): PreferredDirectionRemovalResult | null {
	const path = findPathBetween(map, start, end, { respectOneWay: true });
	if (path === null) return null;

	const legs = resolvePathDirections(map, path);
	let removed = 0;
	let untouched = 0;

	for (const [i, track] of path.entries()) {
		const leg = legs[i];
		// Both calls run: a track may carry either direction, or both.
		const forward = leg
			? track.removePreferredDirection(leg.entry, leg.exit)
			: false;
		const backward = leg
			? track.removePreferredDirection(leg.exit, leg.entry)
			: false;
		if (forward || backward) removed++;
		else untouched++;
	}

	return { path, removed, untouched };
}

/**
 * Work out which entry→exit pair each track of `path` would receive, without
 * mutating anything — the derivation {@link setPreferredDirectionsAlongPath}
 * then writes.
 *
 * Returns one slot per path track, in path order. A `null` slot means no pair
 * is determinable for that track: a facing-switch endpoint (two legal exits),
 * a portal used as a path endpoint, a single-track path, or a path track that
 * is not a grid neighbour (or portal partner) of its predecessor. A non-null
 * slot is the pair that *would* be added — it says nothing about whether that
 * pair is already set.
 *
 * Exported so a UI can preview the exact legs a gesture will affect, rather
 * than highlighting whole cells and implying that legs which are not on the
 * route — a switch's untouched spur, say — are part of it.
 */
export function resolvePathDirections(
	map: Map_,
	path: readonly Track[],
): (PreferredDirection | null)[] {
	const step = map.getImageSize();

	/** Link index on `from` pointing at `to`, or null if not a neighbour. */
	const linkToward = (from: Track, to: Track): number | null => {
		if (from.getOtherLinkedTrack() === to) return portalMouthLink(from);
		const dx = (to.getLocationX() - from.getLocationX()) / step;
		const dy = (to.getLocationY() - from.getLocationY()) / step;
		return linkIndexForOffset(dx, dy);
	};

	return path.map((track, i) => {
		const prev = i > 0 ? path[i - 1] : null;
		const next = i < path.length - 1 ? path[i + 1] : null;

		let entry: number | null;
		let exit: number | null;

		if (prev && next) {
			entry = linkToward(track, prev);
			exit = linkToward(track, next);
		} else if (next) {
			// Start endpoint: exit toward next, entry = the endpoint's other link.
			exit = linkToward(track, next);
			entry = exit === null ? null : endpointOtherLink(track, exit);
		} else if (prev) {
			// End endpoint: entry from prev, exit = the endpoint's other link.
			entry = linkToward(track, prev);
			exit = entry === null ? null : endpointOtherLink(track, entry);
		} else {
			// Single-track path (start === end) — nothing to assign.
			return null;
		}

		if (entry === null || exit === null) return null;
		return { entry, exit };
	});
}

// ============================================================================
// Preferred-direction revalidation
// ============================================================================

/**
 * Portal mouth of a one-link linked track: the dead-end opposite its only
 * active link. `null` when the track is not a portal (or has no single link).
 */
export function portalMouthLink(track: Track): number | null {
	if (track.data.kind !== "linked") return null;
	for (let link = 0; link <= 8; link++) {
		if (link === 4) continue;
		if (track.isTerminusDeadEnd(link)) return link;
	}
	return null;
}

/** Grid neighbour through an active link, or the portal partner through a mouth. */
export function neighborThroughLink(
	map: Map_,
	track: Track,
	link: number,
): Track | null {
	if (track.isTerminusDeadEnd(link)) {
		return track.data.kind === "linked" ? track.getOtherLinkedTrack() : null;
	}
	const step = map.getImageSize();
	const [dx, dy] = linkOffset(link);
	return map.getTrackAt(
		track.getLocationX() + dx * step,
		track.getLocationY() + dy * step,
	);
}

/** Entry link the neighbour must expose to receive travel leaving via `link`. */
export function expectedEntryOnNeighbor(
	track: Track,
	link: number,
	neighbor: Track,
): number | null {
	if (track.isTerminusDeadEnd(link) && track.data.kind === "linked") {
		return portalMouthLink(neighbor);
	}
	return 8 - link;
}

/**
 * Why `pair` is not a valid route through `track` on this map, or `null`
 * when the pair is locally legal and continues (or is allowed to stop).
 *
 * Incomplete routes — a neighbour with no preferred directions of its own —
 * are not issues, nor is one direction of a two-way cell ending against a
 * one-way neighbour while the other direction crosses (RailOS lays out
 * reversible stretches that way). A portal mouth, though, must continue on the partner:
 * that is the only way a route crosses the hop.
 */
export function preferredDirectionIssue(
	map: Map_,
	track: Track,
	pair: PreferredDirection,
): PreferredDirectionIssueReason | null {
	const usable = (link: number): boolean =>
		track.getLinkAt(link) || track.isTerminusDeadEnd(link);
	if (!usable(pair.entry) || !usable(pair.exit)) return "not-traversable";
	if (
		!isTraversableLinkPair(
			track.data.kind,
			track.data.subtype,
			pair.entry,
			pair.exit,
			true,
		)
	) {
		return "not-traversable";
	}

	for (const link of [pair.entry, pair.exit]) {
		if (track.isTerminusDeadEnd(link)) {
			if (track.data.kind !== "linked") continue;
			const partner = track.getOtherLinkedTrack();
			const mouth = partner ? portalMouthLink(partner) : null;
			if (!partner || mouth === null) return "no-neighbor";
			const continues = partner
				.getPreferredDirections()
				.some((p) =>
					link === pair.exit ? p.entry === mouth : p.exit === mouth,
				);
			if (!continues) return "no-continuation";
			continue;
		}

		const neighbor = neighborThroughLink(map, track, link);
		if (!neighbor) return "no-neighbor";
		const recip = expectedEntryOnNeighbor(track, link, neighbor);
		if (recip === null || !neighbor.getLinkAt(recip)) return "no-reciprocal";
		if (!neighbor.hasPreferredDirection()) continue;
		// Does the neighbour carry travel across this link in the given sense?
		const carries = (leaving: boolean): boolean =>
			neighbor
				.getPreferredDirections()
				.some((p) => (leaving ? p.entry === recip : p.exit === recip));
		if (carries(link === pair.exit)) continue;
		// A two-way stretch may end where the line turns one-way: the pair
		// against the one-way flow stops here, as long as another pair on this
		// cell crosses the same link and carries on. Without one, nothing
		// crosses the boundary and the neighbours contradict each other.
		const crossed = track
			.getPreferredDirections()
			.some(
				(q) =>
					(q.entry !== pair.entry || q.exit !== pair.exit) &&
					((q.exit === link && carries(true)) ||
						(q.entry === link && carries(false))),
			);
		if (!crossed) return "no-continuation";
	}
	return null;
}

/** Every preferred-direction pair on the map that fails {@link preferredDirectionIssue}. */
export function collectPreferredDirectionIssues(
	map: Map_,
): PreferredDirectionIssue[] {
	const issues: PreferredDirectionIssue[] = [];
	map.forEachTrack((track) => {
		for (const pair of track.getPreferredDirections()) {
			const reason = preferredDirectionIssue(map, track, pair);
			if (reason) issues.push({ track, pair, reason });
		}
	});
	return issues;
}

/**
 * Drop every preferred-direction pair that is no longer valid on the current
 * topology. Called after add/delete/relink and at the end of deserialize, so
 * a pair pointing into empty space, into a cell that has no reciprocal link,
 * through a missing switch rail, or into a portal with no continuation cannot
 * survive a map edit or a save/load.
 *
 * Returns how many pairs were removed.
 */
export function revalidatePreferredDirections(map: Map_): number {
	let pruned = 0;
	// A portal mouth is valid only while its partner still carries the matching
	// pair. Removing one can orphan the other, so one snapshot is not enough —
	// repeat until a pass finds nothing left to drop.
	for (;;) {
		const doomed: { track: Track; pair: PreferredDirection }[] = [];
		map.forEachTrack((track) => {
			for (const pair of track.getPreferredDirections()) {
				if (preferredDirectionIssue(map, track, pair) !== null) {
					doomed.push({ track, pair });
				}
			}
		});
		if (doomed.length === 0) break;
		let removedThisPass = 0;
		for (const { track, pair } of doomed) {
			if (track.removePreferredDirection(pair.entry, pair.exit)) {
				removedThisPass++;
			}
		}
		if (removedThisPass === 0) break;
		pruned += removedThisPass;
	}
	return pruned;
}
