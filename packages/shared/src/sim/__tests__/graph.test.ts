import { describe, expect, it } from "vitest";
import { Text } from "../../railway/element";
import {
	buildGraph,
	endsAtBuffers,
	isFacingSignal,
	leavesMap,
	nodeAt,
	nodeOf,
	stepFrom,
} from "../graph";
import { CELL, cell, line, nameCells, passingLoop } from "./fixtures";

describe("buildGraph", () => {
	it("numbers every track and finds it by cell", () => {
		const graph = buildGraph(line("X-->X"));
		expect(graph.nodes).toHaveLength(5);
		expect(graph.nodes.map((n) => n.cell.gx)).toEqual([0, 1, 2, 3, 4]);
		expect(nodeAt(graph, cell(3))).toBe(3);
		expect(nodeAt(graph, cell(9))).toBeNull();
	});

	it("steps between joined cells, and off the map at an exit", () => {
		const graph = buildGraph(line("X--X"));
		expect(stepFrom(graph, 1, 5)).toEqual({ node: 2, entry: 3 });
		expect(stepFrom(graph, 1, 3)).toEqual({ node: 0, entry: 5 });
		const exit = nodeOf(graph, 3);
		expect(exit.deadEnd).toBe(5);
		expect(stepFrom(graph, 3, 5)).toBeNull();
		expect(leavesMap(graph, { node: 3, entry: 3, exit: 5 })).toBe(true);
	});

	it("gives a dead end a path in each direction", () => {
		const graph = buildGraph(line("[--]"));
		expect(nodeOf(graph, 3).paths.map((p) => [p.entry, p.exit])).toEqual([
			[3, 5],
			[5, 3],
		]);
		expect(endsAtBuffers(graph, { node: 3, entry: 3, exit: 5 })).toBe(true);
	});

	it("knows which way a signal faces", () => {
		const graph = buildGraph(line("X><X"));
		expect(isFacingSignal(graph, { node: 1, entry: 3, exit: 5 })).toBe(true);
		expect(isFacingSignal(graph, { node: 1, entry: 5, exit: 3 })).toBe(false);
		expect(isFacingSignal(graph, { node: 2, entry: 5, exit: 3 })).toBe(true);
		expect(nodeOf(graph, 1).signalAspects).toBe(4);
	});

	it("indexes locations by name", () => {
		const map = line("X-PP-X");
		nameCells(map, [2, 3], "Ashfield");
		const graph = buildGraph(map);
		expect(graph.locations.get("Ashfield")).toEqual([2, 3]);
		expect(nodeOf(graph, 2).location).toBe("Ashfield");
		expect(nodeOf(graph, 1).location).toBeNull();
	});

	it("gives a switch two rails and lies it on the main one", () => {
		const graph = buildGraph(passingLoop());
		const sw = nodeOf(graph, nodeAt(graph, cell(2)) as number);
		expect(sw.rails).toHaveLength(2);
		expect(sw.rails[sw.defaultLie]).toMatchObject({ secondary: false });
		expect(sw.paths).toHaveLength(4);
		expect(sw.occKeys[0]).toBe(sw.occKeys[1]);
	});

	it("keeps a line joined through a named location riding on it", () => {
		const map = line("X----X");
		map.createAddNamedLocation(2 * CELL, 0);
		const named = map.getNamedLocationAt(2 * CELL, 0);
		if (!named) throw new Error("no named location");
		named.setText(
			new Text(2 * CELL, 0, "Junction", {
				family: "sans-serif",
				pointSize: 12,
			}),
		);
		const graph = buildGraph(map);
		expect(graph.nodes).toHaveLength(6);
		expect(stepFrom(graph, 1, 5)).toEqual({ node: 2, entry: 3 });
		expect(nodeOf(graph, 2).location).toBe("Junction");
	});
});
