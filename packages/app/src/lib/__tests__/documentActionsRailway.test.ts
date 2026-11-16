import { createEmptyTimetable } from "@rail-op-sim/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDocument } from "#/lib/documentActions";
import {
	type DocumentFileFormat,
	inferDocumentFormat,
	pickAndReadDocuments,
} from "#/lib/documentFile";
import { applyLoadedMap } from "#/lib/mapActions";
import { type TrackStatus, useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useTimetableStore } from "#/store/timetable-store";

vi.mock("#/lib/documentFile", async (importActual) => ({
	...(await importActual<typeof import("#/lib/documentFile")>()),
	pickAndReadDocuments: vi.fn(),
}));
vi.mock("#/lib/mapActions", () => ({
	applyLoadedMap: vi.fn(),
	loadMap: vi.fn(),
	saveMap: vi.fn(),
}));
// A map file is any object with `tracks`; the real parser needs a full map.
vi.mock("#/lib/mapFile", () => ({
	parseMapText: (text: string, format: DocumentFileFormat) => {
		const parsed = format === "json" ? JSON.parse(text) : null;
		if (!parsed || !Array.isArray(parsed.tracks))
			throw new Error("not a railway");
		return parsed;
	},
}));

const pick = vi.mocked(pickAndReadDocuments);
const apply = vi.mocked(applyLoadedMap);

const railwayText = JSON.stringify({ tracks: [] });
const timetableText = JSON.stringify({
	...createEmptyTimetable(),
	services: [
		{
			ref: "1A01",
			train: {
				startSpeedKmh: 0,
				maxSpeedKmh: 100,
				massTonnes: 100,
				brakeForceTonnes: 50,
				powerKw: 1000,
			},
			actions: [
				{
					kind: "startNew",
					time: 3600,
					rear: { gx: 0, gy: 0 },
					front: { gx: 1, gy: 0 },
				},
				{ kind: "finishRemainHere" },
			],
		},
	],
});

/** Make the picker "choose" these files, running the caller's parser on each. */
function choose(...files: { name: string; text: string }[]) {
	pick.mockImplementation(async (parse) =>
		files.map(({ name, text }) => {
			const format = inferDocumentFormat(name, text);
			try {
				return { name, format, data: parse(text, format) };
			} catch (err) {
				throw new Error(`${name}: ${(err as Error).message}`);
			}
		}),
	);
}

const railway = { name: "line.json", text: railwayText };
const timetable = { name: "tt.json", text: timetableText };

const complete: TrackStatus = {
	total: 2,
	connected: true,
	complete: true,
	dangling: 0,
	unpairedLinked: 0,
	unnamed: 0,
	undirected: 0,
	brokenRoutes: 0,
	firstIssue: null,
};

describe("loadDocument in railway mode", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		useModeStore.setState({ mode: "railway" });
	});
	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllMocks();
		useModeStore.setState({ mode: "railway" });
		useEditorStore.setState({ trackStatus: null });
		useTimetableStore.setState({
			timetable: createEmptyTimetable(),
			issues: [],
			loadError: null,
		});
	});

	it.each([
		["railway then timetable", [railway, timetable]],
		["timetable then railway", [timetable, railway]],
	])(
		"loads both files picked together (%s), railway first",
		async (_n, files) => {
			const order: string[] = [];
			apply.mockImplementation(() => void order.push("map"));
			const unsub = useTimetableStore.subscribe((s, p) => {
				if (s.timetable !== p.timetable) order.push("timetable");
			});
			choose(...files);

			await loadDocument();
			unsub();

			expect(order).toEqual(["map", "timetable"]);
			expect(useTimetableStore.getState().timetable.services).toHaveLength(1);
			expect(useTimetableStore.getState().loadError).toBeNull();
		},
	);

	it("loads a lone timetable without touching the railway", async () => {
		choose(timetable);
		await loadDocument();
		expect(apply).not.toHaveBeenCalled();
		expect(useTimetableStore.getState().timetable.services).toHaveLength(1);
	});

	it("loads a lone railway", async () => {
		choose(railway);
		await loadDocument();
		expect(apply).toHaveBeenCalledOnce();
	});

	it("refuses two railways and applies nothing", async () => {
		choose(railway, { name: "other.json", text: railwayText });
		await loadDocument();
		expect(apply).not.toHaveBeenCalled();
		expect(useTimetableStore.getState().loadError).toMatch(/at most one/);
	});

	it("refuses two timetables and applies nothing", async () => {
		choose(timetable, { name: "tt2.json", text: timetableText });
		await loadDocument();
		expect(useTimetableStore.getState().timetable.services).toHaveLength(0);
		expect(useTimetableStore.getState().loadError).toMatch(/at most one/);
	});

	it("names the file that failed to parse and applies nothing", async () => {
		choose(railway, { name: "broken.json", text: '{"services": [{}]}' });
		await loadDocument();
		expect(apply).not.toHaveBeenCalled();
		expect(useTimetableStore.getState().loadError).toContain("broken.json");
	});

	it("lets the user go straight to operate after loading both", async () => {
		useEditorStore.setState({ trackStatus: complete });
		choose(railway, timetable);
		await loadDocument();

		expect(useModeStore.getState().mode).toBe("railway");
		expect(useModeStore.getState().setMode("operate")).toBe(true);
		expect(useModeStore.getState().mode).toBe("operate");
	});
});
