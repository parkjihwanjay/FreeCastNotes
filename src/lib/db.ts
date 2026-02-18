import type { Note, DeletedNote, SortOrder } from "../types";
import { extractTitle } from "./utils";

interface LocalDbState {
  notes: Note[];
  deletedNotes: DeletedNote[];
}

const STORAGE_KEY = "freecastnotes.data.v1";

function uuid(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  if (typeof c?.getRandomValues === "function") {
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

function toIsoOrNow(value: unknown): string {
  if (typeof value !== "string") return now();
  const t = Date.parse(value);
  return Number.isNaN(t) ? now() : new Date(t).toISOString();
}

function normalizeNote(value: unknown): Note | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<Note>;
  if (typeof v.id !== "string") return null;
  return {
    id: v.id,
    content: typeof v.content === "string" ? v.content : "",
    created_at: toIsoOrNow(v.created_at),
    updated_at: toIsoOrNow(v.updated_at),
    last_opened_at:
      typeof v.last_opened_at === "string" ? v.last_opened_at : undefined,
    is_pinned: Number(v.is_pinned) ? 1 : 0,
    pin_order: Number.isFinite(Number(v.pin_order)) ? Number(v.pin_order) : -1,
    tags: Array.isArray(v.tags)
      ? (v.tags as unknown[]).filter((t): t is string => typeof t === "string")
      : [],
  };
}

function normalizeDeletedNote(value: unknown): DeletedNote | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<DeletedNote>;
  if (typeof v.id !== "string") return null;
  return {
    id: v.id,
    content: typeof v.content === "string" ? v.content : "",
    deleted_at: toIsoOrNow(v.deleted_at),
    original_created_at: toIsoOrNow(v.original_created_at),
  };
}

export function sortNotes(notes: Note[], sortOrder: SortOrder = "modified"): Note[] {
  return [...notes].sort((a, b) => {
    // Pinned notes always first
    if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
    // Both pinned → preserve pin_order
    if (a.is_pinned && b.is_pinned && a.pin_order !== b.pin_order) {
      return a.pin_order - b.pin_order;
    }
    // Unpinned (or same pin tier) → sort by user preference
    if (sortOrder === "title") {
      return extractTitle(a.content).localeCompare(
        extractTitle(b.content),
        undefined,
        { sensitivity: "base" },
      );
    }
    if (sortOrder === "opened") {
      const aDate = a.last_opened_at ?? a.updated_at;
      const bDate = b.last_opened_at ?? b.updated_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    }
    // "modified" (default)
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

// Internal alias — storage always uses "modified" order
const sortForStorage = (notes: Note[]) => sortNotes(notes, "modified");

function loadState(): LocalDbState {
  const empty: LocalDbState = { notes: [], deletedNotes: [] };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;

    const parsed = JSON.parse(raw) as {
      notes?: unknown[];
      deletedNotes?: unknown[];
    };

    const notes = Array.isArray(parsed.notes)
      ? parsed.notes.map(normalizeNote).filter((n): n is Note => n !== null)
      : [];

    const deletedNotes = Array.isArray(parsed.deletedNotes)
      ? parsed.deletedNotes
          .map(normalizeDeletedNote)
          .filter((n): n is DeletedNote => n !== null)
      : [];

    return {
      notes: sortForStorage(notes),
      deletedNotes: deletedNotes.sort(
        (a, b) =>
          new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime(),
      ),
    };
  } catch {
    return empty;
  }
}

function saveState(state: LocalDbState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function createNote(): Promise<Note> {
  const state = loadState();
  const timestamp = now();
  const note: Note = {
    id: uuid(),
    content: "",
    created_at: timestamp,
    updated_at: timestamp,
    is_pinned: 0,
    pin_order: -1,
    tags: [],
  };

  state.notes.unshift(note);
  saveState({ ...state, notes: sortForStorage(state.notes) });
  return note;
}

export async function getNote(id: string): Promise<Note | null> {
  const state = loadState();
  return state.notes.find((n) => n.id === id) ?? null;
}

export async function updateNote(id: string, content: string): Promise<void> {
  const state = loadState();
  const idx = state.notes.findIndex((n) => n.id === id);
  if (idx < 0) return;

  state.notes[idx] = {
    ...state.notes[idx],
    content,
    updated_at: now(),
  };

  saveState({ ...state, notes: sortForStorage(state.notes) });
}

export async function deleteNote(id: string): Promise<void> {
  const state = loadState();
  const idx = state.notes.findIndex((n) => n.id === id);
  if (idx < 0) return;

  const note = state.notes[idx];
  state.notes.splice(idx, 1);
  state.deletedNotes.unshift({
    id: note.id,
    content: note.content,
    deleted_at: now(),
    original_created_at: note.created_at,
  });

  saveState({
    notes: sortForStorage(state.notes),
    deletedNotes: state.deletedNotes,
  });
}

export async function listNotes(): Promise<Note[]> {
  return loadState().notes; // Already sorted by modified (sortForStorage in loadState)
}

export async function searchNotes(query: string): Promise<Note[]> {
  const q = query.trim().toLowerCase();
  if (!q) return listNotes();

  const notes = loadState().notes;
  return notes.filter((n) => n.content.toLowerCase().includes(q));
}

export function updateLastOpened(id: string): void {
  const state = loadState();
  const idx = state.notes.findIndex((n) => n.id === id);
  if (idx < 0) return;
  state.notes[idx] = { ...state.notes[idx], last_opened_at: now() };
  saveState({ ...state, notes: sortForStorage(state.notes) });
}

export async function togglePin(id: string): Promise<Note | null> {
  const state = loadState();
  const idx = state.notes.findIndex((n) => n.id === id);
  if (idx < 0) return null;

  const note = state.notes[idx];
  const willPin = note.is_pinned === 0;
  const maxPinOrder = state.notes.reduce(
    (max, n) => (n.is_pinned ? Math.max(max, n.pin_order) : max),
    -1,
  );

  const updated: Note = {
    ...note,
    is_pinned: willPin ? 1 : 0,
    pin_order: willPin ? maxPinOrder + 1 : -1,
    updated_at: now(),
  };

  state.notes[idx] = updated;
  saveState({ ...state, notes: sortForStorage(state.notes) });
  return updated;
}

export async function duplicateNote(id: string): Promise<Note | null> {
  const state = loadState();
  const original = state.notes.find((n) => n.id === id);
  if (!original) return null;

  const timestamp = now();
  const dup: Note = {
    id: uuid(),
    content: original.content,
    created_at: timestamp,
    updated_at: timestamp,
    is_pinned: 0,
    pin_order: -1,
    tags: [...(original.tags ?? [])],
  };

  state.notes.unshift(dup);
  saveState({ ...state, notes: sortForStorage(state.notes) });
  return dup;
}

export async function listDeletedNotes(): Promise<DeletedNote[]> {
  return [...loadState().deletedNotes].sort(
    (a, b) =>
      new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime(),
  );
}

export async function restoreNote(id: string): Promise<Note | null> {
  const state = loadState();
  const idx = state.deletedNotes.findIndex((n) => n.id === id);
  if (idx < 0) return null;

  const deleted = state.deletedNotes[idx];
  state.deletedNotes.splice(idx, 1);

  const note: Note = {
    id: deleted.id,
    content: deleted.content,
    created_at: deleted.original_created_at,
    updated_at: now(),
    is_pinned: 0,
    pin_order: -1,
    tags: [],
  };

  const existingIdx = state.notes.findIndex((n) => n.id === id);
  if (existingIdx >= 0) {
    state.notes[existingIdx] = note;
  } else {
    state.notes.unshift(note);
  }

  saveState({ ...state, notes: sortForStorage(state.notes) });
  return note;
}

export async function purgeDeletedNotes(): Promise<void> {
  const state = loadState();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const filtered = state.deletedNotes.filter(
    (n) => new Date(n.deleted_at).getTime() >= cutoff,
  );
  saveState({ ...state, deletedNotes: filtered });
}

export async function updateNoteTags(
  id: string,
  tags: string[],
): Promise<void> {
  const state = loadState();
  const idx = state.notes.findIndex((n) => n.id === id);
  if (idx < 0) return;
  state.notes[idx] = { ...state.notes[idx], tags };
  saveState(state);
}
