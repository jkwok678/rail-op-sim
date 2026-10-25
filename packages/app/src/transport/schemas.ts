import * as v from "valibot";
import type { HostToEngine } from "./types";

/**
 * Valibot schemas for what the engine accepts. Everything arriving at the
 * engine is checked here before it is acted on; the map and timetable carry
 * their own deeper validation (`deserializeMap`, `parseTimetable`), so they are
 * only checked for shape.
 */

const cell = v.object({ gx: v.number(), gy: v.number() });
const routeKind = v.picklist(["auto", "preferred", "unrestricted"]);

const simCommand = v.variant("type", [
	v.object({ type: v.literal("run") }),
	v.object({ type: v.literal("pause") }),
	v.object({ type: v.literal("setSpeed"), speed: v.number() }),
	v.object({ type: v.literal("checkRouteStart"), at: cell, kind: routeKind }),
	v.object({
		type: v.literal("setRoute"),
		from: cell,
		to: cell,
		kind: routeKind,
	}),
	v.object({ type: v.literal("cancelRoute"), at: cell }),
	v.object({ type: v.literal("togglePoints"), at: cell }),
]);

const hostToEngine = v.variant("type", [
	v.object({
		type: v.literal("load"),
		map: v.looseObject({ version: v.number() }),
		timetable: v.looseObject({ version: v.literal(1) }),
	}),
	v.object({ type: v.literal("command"), id: v.number(), cmd: simCommand }),
	v.object({ type: v.literal("dispose") }),
]);

/** `message` as a {@link HostToEngine}, or an error describing what is wrong. */
export function parseHostMessage(
	message: unknown,
): { ok: true; message: HostToEngine } | { ok: false; error: string } {
	const result = v.safeParse(hostToEngine, message);
	if (result.success) {
		return { ok: true, message: result.output as unknown as HostToEngine };
	}
	return { ok: false, error: v.summarize(result.issues) };
}
