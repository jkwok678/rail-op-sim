import { describe, expect, it } from "vitest";
import { describeConnectivity } from "#/lib/connectivity";
import type { TrackStatus } from "#/store/editor-store";

const status = (overrides: Partial<TrackStatus> = {}): TrackStatus => ({
	total: 4,
	connected: false,
	complete: false,
	dangling: 0,
	unpairedLinked: 0,
	unnamed: 0,
	undirected: 0,
	brokenRoutes: 0,
	firstIssue: null,
	...overrides,
});

describe("describeConnectivity", () => {
	it("says it is loading before the controller has published anything", () => {
		expect(describeConnectivity(null).label).toBe("Loading…");
	});

	it("says there are no tracks on an empty map", () => {
		expect(describeConnectivity(status({ total: 0 })).label).toBe("No tracks");
	});

	it("reserves the lagoon pill for a complete railway", () => {
		expect(
			describeConnectivity(
				status({ total: 1, complete: true, connected: true }),
			),
		).toEqual({ label: "1 track · complete", color: "bg-lagoon" });
	});

	it("names every fault, singular or plural, and where to start looking", () => {
		const pill = describeConnectivity(
			status({
				dangling: 2,
				unpairedLinked: 1,
				unnamed: 3,
				undirected: 2,
				brokenRoutes: 1,
				firstIssue: { gx: 5, gy: 7 },
			}),
		);
		expect(pill.color).toBe("bg-amber-500");
		expect(pill.label).toBe(
			"4 tracks · 2 with open ends, 1 unpaired portal, 3 unnamed, 2 without directions, 1 broken route · first at (5, 7)",
		);
	});

	it("falls back to 'incomplete' when no fault is counted", () => {
		expect(describeConnectivity(status()).label).toBe("4 tracks · incomplete");
	});
});
