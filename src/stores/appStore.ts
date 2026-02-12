import { create } from "zustand";
import type { Note } from "../types";
import * as db from "../lib/db";

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;

  // Toast
  toast: string | null;
  showToast: (message: string) => void;
  clearToast: () => void;

  // Navigation history
  history: string[];
  historyIndex: number;

  // Actions
  loadNotes: () => Promise<void>;
  createNote: () => Promise<Note>;
  switchToNote: (id: string) => Promise<void>;
  updateCurrentNoteContent: (content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<Note | null>;

  // Navigation
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  canGoBack: () => boolean;
  canGoForward: () => boolean;

  // Auto-resize
  autoResizeEnabled: boolean;
  toggleAutoResize: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: true,

  // Toast
  toast: null,
  showToast: (message: string) => set({ toast: message }),
  clearToast: () => set({ toast: null }),

  // Navigation history
  history: [],
  historyIndex: -1,

  loadNotes: async () => {
    try {
      const notes = await db.listNotes();
      set({ notes, loading: false });
    } catch (error) {
      console.error("Failed to load notes", error);
      set({ notes: [], loading: false });
      get().showToast("Could not load notes");
    }
  },

  createNote: async () => {
    try {
      const note = await db.createNote();
      const notes = await db.listNotes();
      const { history, historyIndex } = get();
      const newHistory = [...history.slice(0, historyIndex + 1), note.id];
      set({
        notes: notes.length > 0 ? notes : [note],
        currentNote: note,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
      return note;
    } catch (error) {
      console.error("Failed to create note", error);
      get().showToast("Could not create note");
      throw error;
    }
  },

  switchToNote: async (id: string) => {
    const note = await db.getNote(id);
    if (note) {
      const { history, historyIndex, currentNote } = get();
      // Don't push to history if we're navigating to the same note
      if (currentNote?.id === id) {
        set({ currentNote: note });
      } else {
        const newHistory = [...history.slice(0, historyIndex + 1), id];
        set({ currentNote: note, history: newHistory, historyIndex: newHistory.length - 1 });
      }
    }
  },

  updateCurrentNoteContent: async (content: string) => {
    const { currentNote } = get();
    if (!currentNote) return;
    try {
      await db.updateNote(currentNote.id, content);
      const updatedNote = {
        ...currentNote,
        content,
        updated_at: new Date().toISOString(),
      };
      set((state) => ({
        currentNote: updatedNote,
        notes: state.notes.map((n) =>
          n.id === updatedNote.id ? updatedNote : n,
        ),
      }));
    } catch (error) {
      console.error("Failed to update note", error);
    }
  },

  deleteNote: async (id: string) => {
    try {
      await db.deleteNote(id);
      const notes = await db.listNotes();
      const { currentNote } = get();
      if (currentNote?.id === id) {
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
    } catch (error) {
      console.error("Failed to delete note", error);
      get().showToast("Could not delete note");
    }
  },

  togglePin: async (id: string) => {
    try {
      const updated = await db.togglePin(id);
      if (!updated) return;
      const notes = await db.listNotes();
      const { currentNote } = get();
      set({
        notes,
        currentNote: currentNote?.id === id ? updated : currentNote,
      });
    } catch (error) {
      console.error("Failed to pin/unpin note", error);
      get().showToast("Could not update pin");
    }
  },

  duplicateNote: async (id: string) => {
    try {
      const dup = await db.duplicateNote(id);
      if (!dup) return null;
      const notes = await db.listNotes();
      const { history, historyIndex } = get();
      const newHistory = [...history.slice(0, historyIndex + 1), dup.id];
      set({
        notes,
        currentNote: dup,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
      return dup;
    } catch (error) {
      console.error("Failed to duplicate note", error);
      get().showToast("Could not duplicate note");
      return null;
    }
  },

  // Navigation
  goBack: async () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const noteId = history[newIndex];
    const note = await db.getNote(noteId);
    if (note) {
      set({ currentNote: note, historyIndex: newIndex });
    }
  },

  goForward: async () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const noteId = history[newIndex];
    const note = await db.getNote(noteId);
    if (note) {
      set({ currentNote: note, historyIndex: newIndex });
    }
  },

  canGoBack: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canGoForward: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  // Auto-resize
  autoResizeEnabled: localStorage.getItem("autoResize") !== "false",
  toggleAutoResize: () => {
    set((state) => {
      const next = !state.autoResizeEnabled;
      localStorage.setItem("autoResize", String(next));
      return { autoResizeEnabled: next };
    });
  },
}));
