import type { TrackStatus } from "#/store/editor-store";

/** The footer's status pill: what it says, and the dot colour beside it. */
export interface ConnectivityPill {
	label: string;
	color: string;
}

type FaultCount =
	| "dangling"
	| "unpairedLinked"
	| "unnamed"
	| "undirected"
	| "brokenRoutes";

const plural = (n: number, one: string, many: string): string =>
	n === 1 ? one : many;

/** Each kind of fault the pill can name, in the order it names them. */
const FAULTS: [FaultCount, (n: number) => string][] = [
	["dangling", (n) => `${n} with open ends`],
	["unpairedLinked", (n) => `${n} unpaired ${plural(n, "portal", "portals")}`],
	["unnamed", (n) => `${n} unnamed`],
	["undirected", (n) => `${n} without ${plural(n, "direction", "directions")}`],
	["brokenRoutes", (n) => `${n} broken ${plural(n, "route", "routes")}`],
];

/**
 * The footer's summary of how complete the railway is, from the plain status
 * the placement controller publishes. Kept out of the layout so the wording is
 * testable without rendering it, and so the layout needs no pixi access.
 */
export function describeConnectivity(
	status: TrackStatus | null,
): ConnectivityPill {
	if (!status) return { label: "Loading…", color: "bg-muted-foreground" };
	const { total, firstIssue } = status;
	if (total === 0) return { label: "No tracks", color: "bg-muted-foreground" };

	const tracks = `${total} ${plural(total, "track", "tracks")}`;
	// Physical joining unlocks the direction tool; the lagoon pill is reserved
	// for a complete railway.
	if (status.complete) {
		return { label: `${tracks} · complete`, color: "bg-lagoon" };
	}

	// Name each fault and where to start looking.
	const faults = FAULTS.filter(([field]) => (status[field] ?? 0) > 0).map(
		([field, phrase]) => phrase(status[field]),
	);
	const where = firstIssue
		? ` · first at (${firstIssue.gx}, ${firstIssue.gy})`
		: "";
	return {
		label: `${tracks} · ${faults.join(", ") || "incomplete"}${where}`,
		color: "bg-amber-500",
	};
}
