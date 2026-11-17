import type { SerializedMap, Timetable } from "@rail-op-sim/shared";
import Dexie, { type EntityTable } from "dexie";
import type { DocumentFileFormat } from "#/lib/documentFile";

/**
 * The browser-local session store: one Dexie database with a `sessions` table.
 *
 * Opened lazily, on first use, so importing this module on the server (TanStack
 * Start renders there) never touches `indexedDB`. Where there is no IndexedDB
 * every function resolves to nothing rather than throwing.
 */

/** Current shape of {@link SessionState}. */
export const SESSION_STATE_VERSION = 1;

/** The session the editor keeps up to date by itself. */
export const AUTOSAVE_SESSION_ID = "autosave";

/** Everything a refresh must not lose: the railway, its timetable, the encoding. */
export interface SessionState {
	version: typeof SESSION_STATE_VERSION;
	map: SerializedMap;
	timetable: Timetable;
	saveFormat: DocumentFileFormat;
}

export interface SessionRecord {
	id: string;
	name: string;
	description: string;
	createdAt: number;
	updatedAt: number;
	state: SessionState;
}

type SessionDatabase = Dexie & {
	sessions: EntityTable<SessionRecord, "id">;
};

let database: SessionDatabase | null = null;

function getDatabase(): SessionDatabase | null {
	if (typeof indexedDB === "undefined") return null;
	if (!database) {
		const db = new Dexie("rail-op-sim") as SessionDatabase;
		db.version(1).stores({ sessions: "id, updatedAt" });
		database = db;
	}
	return database;
}

/**
 * Write `record`, keeping the `createdAt` of any record it replaces.
 * Resolves `false` when there is no IndexedDB to write to.
 */
export async function saveSession(record: SessionRecord): Promise<boolean> {
	const db = getDatabase();
	if (!db) return false;
	await db.transaction("rw", db.sessions, async () => {
		const existing = await db.sessions.get(record.id);
		await db.sessions.put({
			...record,
			createdAt: existing?.createdAt ?? record.createdAt,
		});
	});
	return true;
}

export async function loadSession(id: string): Promise<SessionRecord | null> {
	const db = getDatabase();
	if (!db) return null;
	return (await db.sessions.get(id)) ?? null;
}

/** Every saved session, most recently updated first. */
export async function listSessions(): Promise<SessionRecord[]> {
	const db = getDatabase();
	if (!db) return [];
	return db.sessions.orderBy("updatedAt").reverse().toArray();
}

export async function deleteSession(id: string): Promise<void> {
	const db = getDatabase();
	if (!db) return;
	await db.sessions.delete(id);
}
