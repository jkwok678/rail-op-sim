import { describe, expect, it } from "vitest";
import { parseHostMessage } from "#/transport/schemas";

describe("parseHostMessage", () => {
	it("accepts each command the engine understands", () => {
		for (const cmd of [
			{ type: "run" },
			{ type: "pause" },
			{ type: "setSpeed", speed: 4 },
			{ type: "checkRouteStart", at: { gx: 1, gy: 2 }, kind: "auto" },
			{
				type: "setRoute",
				from: { gx: 1, gy: 0 },
				to: { gx: 5, gy: 0 },
				kind: "preferred",
			},
			{ type: "cancelRoute", at: { gx: 3, gy: 0 } },
			{ type: "togglePoints", at: { gx: 3, gy: 0 } },
		]) {
			expect(
				parseHostMessage({ type: "command", id: 1, cmd }).ok,
				cmd.type,
			).toBe(true);
		}
	});

	it("rejects an unknown command or a malformed cell", () => {
		expect(
			parseHostMessage({ type: "command", id: 1, cmd: { type: "fly" } }).ok,
		).toBe(false);
		const bad = parseHostMessage({
			type: "command",
			id: 1,
			cmd: { type: "cancelRoute", at: { gx: "3" } },
		});
		expect(bad.ok).toBe(false);
	});

	it("checks a load carries a versioned map and timetable", () => {
		expect(
			parseHostMessage({
				type: "load",
				map: { version: 1 },
				timetable: { version: 1 },
			}).ok,
		).toBe(true);
		expect(
			parseHostMessage({ type: "load", map: {}, timetable: { version: 1 } }).ok,
		).toBe(false);
		expect(parseHostMessage({ type: "nonsense" }).ok).toBe(false);
	});
});
