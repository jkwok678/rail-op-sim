import "fake-indexeddb/auto";
import {
	createEmptyTimetable,
	SERIALIZED_MAP_VERSION,
} from "@rail-op-sim/shared";
import { beforeEach, describe, expect, it } from "vitest";
import {
	AUTOSAVE_SESSION_ID,
	deleteSession,
	listSessions,
	loadSession,
	type SessionRecord,
	saveSession,
} from "#/lib/db";

const record = (id: string, updatedAt: number, createdAt = updatedAt) =>
	({
		id,
		name: id,
		description: "",
		createdAt,
		updatedAt,
		state: {
			version: 1,
			map: {
				version: SERIALIZED_MAP_VERSION,
				tracks: [],
				namedLocations: [],
				concourses: [],
				parapets: [],
				texts: [],
			},
			timetable: createEmptyTimetable(),
			saveFormat: "json",
		},
	}) as unknown as SessionRecord;

describe("session store", () => {
	beforeEach(async () => {
		for (const r of await listSessions()) await deleteSession(r.id);
	});

	it("round-trips a record", async () => {
		const r = record(AUTOSAVE_SESSION_ID, 10);
		expect(await saveSession(r)).toBe(true);
		expect(await loadSession(AUTOSAVE_SESSION_ID)).toEqual(r);
	});

	it("resolves null for an unknown id", async () => {
		expect(await loadSession("nope")).toBeNull();
	});

	it("lists newest updatedAt first", async () => {
		await saveSession(record("a", 1));
		await saveSession(record("c", 3));
		await saveSession(record("b", 2));
		expect((await listSessions()).map((r) => r.id)).toEqual(["c", "b", "a"]);
	});

	it("deletes a record", async () => {
		await saveSession(record("a", 1));
		await deleteSession("a");
		expect(await loadSession("a")).toBeNull();
	});

	it("keeps createdAt when overwriting", async () => {
		await saveSession(record("a", 1, 1));
		await saveSession(record("a", 5, 5));
		const loaded = await loadSession("a");
		expect(loaded?.createdAt).toBe(1);
		expect(loaded?.updatedAt).toBe(5);
	});
});
