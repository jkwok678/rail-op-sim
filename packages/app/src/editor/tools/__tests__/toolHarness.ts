import {
	createTrackData,
	ExitType,
	Map as Map_,
	StraightType,
	type Text,
} from "@rail-op-sim/shared";
import { Container, Texture } from "pixi.js";
import { vi } from "vitest";
import type { RefreshFlags } from "#/editor/EditHistory";
import type {
	GridCell,
	ToolContext,
	ToolLayers,
	ToolPointer,
} from "#/editor/tools/Tool";
import { gridToWorld } from "#/lib/grid";
import type { TextureCache } from "#/renderer/textureCache";
import { useEditorStore } from "#/store/editor-store";
import { useModeStore } from "#/store/mode-store";
import { useOperateStore } from "#/store/operate-store";
import { useTimetableStore } from "#/store/timetable-store";

/** Every layer method a tool might call, as a spy; containers are plain objects. */
export function stubLayers() {
	const layers = {
		track: {
			sync: vi.fn(),
			upsertCell: vi.fn(),
			removeCell: vi.fn(),
			clear: vi.fn(),
		},
		element: { sync: vi.fn(), clear: vi.fn() },
		text: {
			sync: vi.fn(),
			clear: vi.fn(),
			hitTest: vi.fn((): Text | null => null),
			moveTo: vi.fn(),
		},
		linkHighlight: {
			container: { visible: false },
			sync: vi.fn(),
			syncSelection: vi.fn(),
			setLinkPreview: vi.fn(),
			highlightSection: vi.fn(),
			setSectionPreview: vi.fn(),
			setSectionRouteVisible: vi.fn(),
			clearSectionHighlight: vi.fn(),
		},
		trackColor: { show: vi.fn(), sync: vi.fn(), hide: vi.fn() },
		direction: {
			container: { visible: false },
			sync: vi.fn(),
			setSelection: vi.fn(),
			setRoutePreview: vi.fn(),
		},
	};
	return layers as typeof layers & ToolLayers;
}

export type StubLayers = ReturnType<typeof stubLayers>;

/** Put every store back to its initial state — zustand keeps one per module. */
export function resetStores(): void {
	useEditorStore.setState(useEditorStore.getInitialState(), true);
	useTimetableStore.setState(useTimetableStore.getInitialState(), true);
	useOperateStore.setState(useOperateStore.getInitialState(), true);
	useModeStore.setState(useModeStore.getInitialState(), true);
}

export interface Harness {
	ctx: ToolContext;
	map: Map_;
	layers: StubLayers;
	ghost: Container;
	/** Labels of every commit, in order, with the refresh it asked for. */
	commits: { label: string; refresh: RefreshFlags }[];
	publishTrackStatus: ReturnType<typeof vi.fn>;
	setCursor: ReturnType<typeof vi.fn>;
	/** What `isPanning()` returns. */
	panning: { value: boolean };
}

/**
 * A tool context over a real map (at the app's unit image size), stub layers
 * and the real stores. `commit` runs the edit and records its label.
 */
export function makeHarness(map = newMap()): Harness {
	const layers = stubLayers();
	const ghost = new Container();
	const commits: Harness["commits"] = [];
	const publishTrackStatus = vi.fn();
	const setCursor = vi.fn();
	const panning = { value: false };
	const textures = {
		get: vi.fn(() => Texture.WHITE),
	} as unknown as TextureCache;
	const ctx: ToolContext = {
		map,
		layers,
		stores: {
			editor: useEditorStore,
			timetable: useTimetableStore,
			operate: useOperateStore,
			mode: useModeStore,
		},
		ghost,
		textures,
		commit: (label, refresh, fn) => {
			commits.push({ label, refresh });
			return fn();
		},
		publishTrackStatus,
		isPanning: () => panning.value,
		setCursor,
	};
	return {
		ctx,
		map,
		layers,
		ghost,
		commits,
		publishTrackStatus,
		setCursor,
		panning,
	};
}

export function newMap(): Map_ {
	const map = new Map_();
	map.setImageSize(1);
	return map;
}

/** A pointer at the centre of a grid cell. */
export function at(gx: number, gy: number, button = 0): ToolPointer {
	return atCell({ gx, gy }, button);
}

function atCell(cell: GridCell, button: number): ToolPointer {
	return {
		button,
		clientX: cell.gx * 10,
		clientY: cell.gy * 10,
		cell,
		world: gridToWorld(cell.gx, cell.gy),
	};
}

/** A pointer at an exact world position (the cell is whatever is under it). */
export function atWorld(x: number, y: number, button = 0): ToolPointer {
	return {
		button,
		clientX: x,
		clientY: y,
		cell: { gx: Math.round(x / 32), gy: Math.round(-y / 32) },
		world: { x, y },
	};
}

/**
 * A straight horizontal line from `x0` to `x1` on row 0, closed by an exit at
 * each end so it counts as physically joined.
 */
export function addLine(map: Map_, x0: number, x1: number): void {
	map.addTrack(createTrackData("exit", ExitType.EXITLEFT), x0 - 1, 0);
	for (let gx = x0; gx <= x1; gx++) {
		map.addTrack(createTrackData("straight", StraightType.STRAIGHTH), gx, 0);
	}
	map.addTrack(createTrackData("exit", ExitType.EXITRIGHT), x1 + 1, 0);
	map.makeTrackList();
}
