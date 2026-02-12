import { create } from "zustand";
import type { Note } from "../types";
import * as db from "../lib/db";

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  createNote: () => Promise<Note>;
  switchToNote: (id: string) => Promise<void>;
  updateCurrentNoteContent: (content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<Note | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: true,

  loadNotes: async () => {
    const notes = await db.listNotes();
    set({ notes, loading: false });
  },

  createNote: async () => {
    const note = await db.createNote();
    const notes = await db.listNotes();
    set({ notes, currentNote: note });
    return note;
  },

  switchToNote: async (id: string) => {
    const note = await db.getNote(id);
    if (note) {
      set({ currentNote: note });
    }
  },

  updateCurrentNoteContent: async (content: string) => {
    const { currentNote } = get();
    if (!currentNote) return;
    await db.updateNote(currentNote.id, content);
    const updatedNote = { ...currentNote, content, updated_at: new Date().toISOString() };
    set((state) => ({
      currentNote: updatedNote,
      notes: state.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
    }));
  },

  deleteNote: async (id: string) => {
    await db.deleteNote(id);
    const notes = await db.listNotes();
    const { currentNote } = get();
    if (currentNote?.id === id) {
      // Switch to the first remaining note, or create a new one
      if (notes.length > 0) {
        set({ notes, currentNote: notes[0] });
      } else {
        const newNote = await db.createNote();
        const refreshed = await db.listNotes();
        set({ notes: refreshed, currentNote: newNote });
      }
    } else {
      set({ notes });
    }
  },

  togglePin: async (id: string) => {
    const updated = await db.togglePin(id);
    if (!updated) return;
    const notes = await db.listNotes();
    const { currentNote } = get();
    set({
      notes,
      currentNote: currentNote?.id === id ? updated : currentNote,
    });
  },

  duplicateNote: async (id: string) => {
    const dup = await db.duplicateNote(id);
    if (!dup) return null;
    const notes = await db.listNotes();
    set({ notes, currentNote: dup });
    return dup;
  },
}));
