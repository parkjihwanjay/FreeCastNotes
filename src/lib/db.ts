import Database from "@tauri-apps/plugin-sql";
import type { Note, DeletedNote } from "../types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:notes.db");
  }
  return db;
}

function uuid(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  if (typeof c?.getRandomValues === "function") {
    // RFC4122 v4 fallback for WebViews without randomUUID
    const bytes = c.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function swapPlaceholders(query: string): string {
  if (/\$\d+/.test(query)) {
    return query.replace(/\$\d+/g, "?");
  }

  if (query.includes("?")) {
    let i = 0;
    return query.replace(/\?/g, () => `$${++i}`);
  }

  return query;
}

async function executeQuery(
  d: Database,
  query: string,
  values: unknown[] = [],
) {
  try {
    return await d.execute(query, values);
  } catch (firstError) {
    const fallback = swapPlaceholders(query);
    if (fallback === query) {
      throw firstError;
    }

    try {
      return await d.execute(fallback, values);
    } catch (secondError) {
      console.error("SQL execute failed", { query, fallback, firstError, secondError });
      throw secondError;
    }
  }
}

async function selectQuery<T>(
  d: Database,
  query: string,
  values: unknown[] = [],
): Promise<T> {
  try {
    return await d.select<T>(query, values);
  } catch (firstError) {
    const fallback = swapPlaceholders(query);
    if (fallback === query) {
      throw firstError;
    }

    try {
      return await d.select<T>(fallback, values);
    } catch (secondError) {
      console.error("SQL select failed", { query, fallback, firstError, secondError });
      throw secondError;
    }
  }
}

export async function createNote(): Promise<Note> {
  const d = await getDb();
  const note: Note = {
    id: uuid(),
    content: "",
    created_at: now(),
    updated_at: now(),
    is_pinned: 0,
    pin_order: -1,
  };
  await executeQuery(
    d,
    "INSERT INTO notes (id, content, created_at, updated_at, is_pinned, pin_order) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      note.id,
      note.content,
      note.created_at,
      note.updated_at,
      note.is_pinned,
      note.pin_order,
    ],
  );
  return note;
}

export async function getNote(id: string): Promise<Note | null> {
  const d = await getDb();
  const rows = await selectQuery<Note[]>(d, "SELECT * FROM notes WHERE id = $1", [
    id,
  ]);
  return rows[0] ?? null;
}

export async function updateNote(id: string, content: string): Promise<void> {
  const d = await getDb();
  await executeQuery(
    d,
    "UPDATE notes SET content = $1, updated_at = $2 WHERE id = $3",
    [content, now(), id],
  );
}

export async function deleteNote(id: string): Promise<void> {
  const d = await getDb();
  const rows = await selectQuery<Note[]>(d, "SELECT * FROM notes WHERE id = $1", [
    id,
  ]);
  const note = rows[0];
  if (!note) return;
  await executeQuery(
    d,
    "INSERT INTO deleted_notes (id, content, deleted_at, original_created_at) VALUES ($1, $2, $3, $4)",
    [note.id, note.content, now(), note.created_at],
  );
  await executeQuery(d, "DELETE FROM notes WHERE id = $1", [id]);
}

export async function listNotes(): Promise<Note[]> {
  const d = await getDb();
  return selectQuery<Note[]>(
    d,
    "SELECT * FROM notes ORDER BY is_pinned DESC, pin_order ASC, updated_at DESC",
  );
}

export async function searchNotes(query: string): Promise<Note[]> {
  const d = await getDb();
  const pattern = `%${query}%`;
  return selectQuery<Note[]>(
    d,
    "SELECT * FROM notes WHERE content LIKE $1 ORDER BY is_pinned DESC, updated_at DESC",
    [pattern],
  );
}

export async function togglePin(id: string): Promise<Note | null> {
  const d = await getDb();
  const rows = await selectQuery<Note[]>(d, "SELECT * FROM notes WHERE id = $1", [
    id,
  ]);
  const note = rows[0];
  if (!note) return null;
  const newPinned = note.is_pinned ? 0 : 1;
  const newPinOrder = newPinned ? 0 : -1;
  await executeQuery(
    d,
    "UPDATE notes SET is_pinned = $1, pin_order = $2, updated_at = $3 WHERE id = $4",
    [newPinned, newPinOrder, now(), id],
  );
  return { ...note, is_pinned: newPinned, pin_order: newPinOrder };
}

export async function duplicateNote(id: string): Promise<Note | null> {
  const d = await getDb();
  const rows = await selectQuery<Note[]>(d, "SELECT * FROM notes WHERE id = $1", [
    id,
  ]);
  const note = rows[0];
  if (!note) return null;
  const dup: Note = {
    id: uuid(),
    content: note.content,
    created_at: now(),
    updated_at: now(),
    is_pinned: 0,
    pin_order: -1,
  };
  await executeQuery(
    d,
    "INSERT INTO notes (id, content, created_at, updated_at, is_pinned, pin_order) VALUES ($1, $2, $3, $4, $5, $6)",
    [dup.id, dup.content, dup.created_at, dup.updated_at, dup.is_pinned, dup.pin_order],
  );
  return dup;
}

export async function listDeletedNotes(): Promise<DeletedNote[]> {
  const d = await getDb();
  return selectQuery<DeletedNote[]>(
    d,
    "SELECT * FROM deleted_notes ORDER BY deleted_at DESC",
  );
}

export async function restoreNote(id: string): Promise<Note | null> {
  const d = await getDb();
  const rows = await selectQuery<DeletedNote[]>(
    d,
    "SELECT * FROM deleted_notes WHERE id = $1",
    [id],
  );
  const deleted = rows[0];
  if (!deleted) return null;
  const note: Note = {
    id: deleted.id,
    content: deleted.content,
    created_at: deleted.original_created_at,
    updated_at: now(),
    is_pinned: 0,
    pin_order: -1,
  };
  await executeQuery(
    d,
    "INSERT INTO notes (id, content, created_at, updated_at, is_pinned, pin_order) VALUES ($1, $2, $3, $4, $5, $6)",
    [note.id, note.content, note.created_at, note.updated_at, note.is_pinned, note.pin_order],
  );
  await executeQuery(d, "DELETE FROM deleted_notes WHERE id = $1", [id]);
  return note;
}

export async function purgeDeletedNotes(): Promise<void> {
  const d = await getDb();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await executeQuery(d, "DELETE FROM deleted_notes WHERE deleted_at < $1", [cutoff]);
}
