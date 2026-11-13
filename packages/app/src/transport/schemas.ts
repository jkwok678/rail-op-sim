import { z } from "zod";
import type { HostToEngine } from "./types";

/**
 * Zod schemas for what the engine accepts. Everything arriving at the engine
 * is checked here before it is acted on; the map and timetable carry their own
 * deeper validation (`deserializeMap`, `parseTimetable`), so they are only
 * checked for shape.
 */

const cell = z.object({ gx: z.number(), gy: z.number() });
const routeKind = z.enum(["auto", "preferred", "unrestricted"]);

const simCommand = z.discriminatedUnion("type", [
	z.object({ type: z.literal("run") }),
	z.object({ type: z.literal("pause") }),
	z.object({ type: z.literal("setSpeed"), speed: z.number() }),
	z.object({ type: z.literal("checkRouteStart"), at: cell, kind: routeKind }),
	z.object({
		type: z.literal("setRoute"),
		from: cell,
		to: cell,
		kind: routeKind,
	}),
	z.object({ type: z.literal("cancelRoute"), at: cell }),
	z.object({ type: z.literal("togglePoints"), at: cell }),
]);

const hostToEngine = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("load"),
		map: z.looseObject({ version: z.number() }),
		timetable: z.looseObject({ version: z.literal(1) }),
	}),
	z.object({ type: z.literal("command"), id: z.number(), cmd: simCommand }),
	z.object({ type: z.literal("dispose") }),
]);

/** `message` as a {@link HostToEngine}, or an error describing what is wrong. */
export function parseHostMessage(
	message: unknown,
): { ok: true; message: HostToEngine } | { ok: false; error: string } {
	const result = hostToEngine.safeParse(message);
	if (result.success) {
		return { ok: true, message: result.data as unknown as HostToEngine };
	}
	return { ok: false, error: z.prettifyError(result.error) };
}
