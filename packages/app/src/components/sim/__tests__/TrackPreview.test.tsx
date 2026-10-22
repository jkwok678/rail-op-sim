// @vitest-environment jsdom
import { SignalAspect } from "@rail-op-sim/shared";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The art itself is fetched at runtime and never resolves under jsdom, which
// would leave the placeholder (and no title) on screen. Stub the loaders so
// the real preview — the thing carrying the hover title — renders.
vi.mock("#/lib/svgMap", () => ({
	loadRawSvg: () => Promise.resolve("<svg></svg>"),
	loadRawSvgByFilename: () => Promise.resolve("<svg></svg>"),
	SHUNT_SVG_MAP: { SIGNALLEFT: "shuntLeftRed.svg" } as Record<string, string>,
}));

const { TrackPreview } = await import("#/components/sim/TrackPreview");

/** The hover title the browser shows over a preview tile. */
async function titleOf(subtype: string, aspect?: number): Promise<string> {
	const { container } = render(
		<TrackPreview subtype={subtype} aspect={aspect} />,
	);
	await waitFor(() =>
		expect(container.querySelector("span[title]")).not.toBeNull(),
	);
	return container.querySelector("span[title]")?.getAttribute("title") ?? "";
}

describe("TrackPreview hover title", () => {
	afterEach(cleanup);

	it("names the selected aspect, not always shunt", async () => {
		// The reported bug: `aspect ? ... : ...` is truthy for all four aspect
		// values, so a 4-aspect signal's tooltip claimed "(shunt)".
		expect(await titleOf("SIGNALLEFT", SignalAspect.FOUR_ASPECT)).toBe(
			"SIGNALLEFT (4-aspect)",
		);
		cleanup();
		expect(await titleOf("SIGNALLEFT", SignalAspect.THREE_ASPECT)).toBe(
			"SIGNALLEFT (3-aspect)",
		);
		cleanup();
		expect(await titleOf("SIGNALLEFT", SignalAspect.TWO_ASPECT)).toBe(
			"SIGNALLEFT (2-aspect)",
		);
	});

	it("still names the shunt aspect shunt", async () => {
		expect(await titleOf("SIGNALLEFT", SignalAspect.SHUNT)).toBe(
			"SIGNALLEFT (Shunt)",
		);
	});

	it("leaves a non-signal subtype unqualified", async () => {
		expect(await titleOf("STRAIGHTH")).toBe("STRAIGHTH");
	});

	it("agrees with the aspect the tile's art is loaded for", async () => {
		// Title and art are two expressions of one choice; they drifted before.
		expect(await titleOf("SIGNALLEFT", SignalAspect.SHUNT)).toContain("Shunt");
		expect(screen.queryByTitle("SIGNALLEFT (shunt)")).toBeNull();
	});
});
