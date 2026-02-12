import { useEffect, useRef, useCallback, useState } from "react";
import Toolbar from "./components/Toolbar/Toolbar";
import Editor from "./components/Editor/Editor";
import FormatBar from "./components/Editor/FormatBar";
import NotesBrowser from "./components/NotesBrowser/NotesBrowser";
import ActionPanel from "./components/ActionPanel/ActionPanel";
import Toast from "./components/Toast/Toast";
import { useAppEditor } from "./hooks/useEditor";
import { useAppStore } from "./stores/appStore";
import { extractTitle } from "./lib/utils";
import { copyAsMarkdown } from "./lib/export";

function App() {
  const editor = useAppEditor();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [actionPanelOpen, setActionPanelOpen] = useState(false);
  const {
    currentNote,
    loading,
    loadNotes,
    createNote,
    updateCurrentNoteContent,
    notes,
    switchToNote,
    goBack,
    goForward,
    togglePin,
    showToast,
  } = useAppStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNoteIdRef = useRef<string | null>(null);

  // Track current note ID without re-triggering editor effects
  useEffect(() => {
    currentNoteIdRef.current = currentNote?.id ?? null;
  }, [currentNote?.id]);

  // Initialize: load notes, open most recent or create first note
  useEffect(() => {
    (async () => {
      await loadNotes();
    })();
  }, [loadNotes]);

  // After notes load, open the most recent one (or create one)
  const initialized = useRef(false);
  useEffect(() => {
    if (loading || initialized.current) return;
    initialized.current = true;
    if (notes.length > 0) {
      switchToNote(notes[0].id);
    } else {
      createNote();
    }
  }, [loading, notes, switchToNote, createNote]);

  // When currentNote changes, load its content into editor
  useEffect(() => {
    if (!editor || !currentNote) return;
    const currentContent = JSON.stringify(editor.getJSON());
    const noteContent = currentNote.content || "";
    if (noteContent && noteContent !== currentContent) {
      try {
        const json = JSON.parse(noteContent);
        editor.commands.setContent(json);
      } catch {
        editor.commands.setContent("");
      }
    } else if (!noteContent) {
      editor.commands.setContent("");
    }
  }, [editor, currentNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on editor changes with 300ms debounce
  const handleUpdate = useCallback(() => {
    if (!editor || !currentNoteIdRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const content = JSON.stringify(editor.getJSON());
      updateCurrentNoteContent(content);
    }, 300);
  }, [editor, updateCurrentNoteContent]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, handleUpdate]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K — Action Panel
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "k") {
        e.preventDefault();
        setActionPanelOpen((o) => !o);
        setBrowseOpen(false);
      }
      // ⌘P — Browse Notes
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "p") {
        e.preventDefault();
        setBrowseOpen((o) => !o);
        setActionPanelOpen(false);
      }
      // ⌘N — New Note
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "n") {
        e.preventDefault();
        createNote().then(() => {
          setBrowseOpen(false);
          setActionPanelOpen(false);
          editor?.commands.focus();
        });
      }
      // ⌘D — Duplicate Note
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "d") {
        e.preventDefault();
        const note = useAppStore.getState().currentNote;
        if (note) {
          useAppStore.getState().duplicateNote(note.id).then(() => {
            showToast("Note duplicated");
            editor?.commands.focus();
          });
        }
      }
      // ⌘[ — Navigate Back
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "[") {
        e.preventDefault();
        goBack();
      }
      // ⌘] — Navigate Forward
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "]") {
        e.preventDefault();
        goForward();
      }
      // ⇧⌘P — Toggle Pin
      if (e.metaKey && e.shiftKey && !e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        const note = useAppStore.getState().currentNote;
        if (note) {
          togglePin(note.id).then(() => {
            showToast(note.is_pinned ? "Note unpinned" : "Note pinned");
          });
        }
      }
      // ⇧⌘C — Copy as Markdown
      if (e.metaKey && e.shiftKey && !e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        if (editor) {
          copyAsMarkdown(editor).then(() => showToast("Copied as Markdown"));
        }
      }
      // ⇧⌘E — Export (open action panel)
      if (e.metaKey && e.shiftKey && !e.altKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        setActionPanelOpen(true);
      }
      // ⌘0-⌘9 — Quick access to pinned notes
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key >= "0" && e.key <= "9") {
        const pinnedNotes = useAppStore.getState().notes.filter((n) => n.is_pinned);
        const idx = e.key === "0" ? 9 : parseInt(e.key) - 1;
        if (idx < pinnedNotes.length) {
          e.preventDefault();
          switchToNote(pinnedNotes[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createNote, editor, goBack, goForward, togglePin, showToast, switchToNote]);

  const title = extractTitle(currentNote?.content ?? "");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1C1C1E]">
        <p className="text-sm text-[#E5E5E7]/40">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-[#1C1C1E]">
      <Toolbar
        title={title}
        onBrowse={() => setBrowseOpen(true)}
        onNewNote={() => {
          createNote().then(() => editor?.commands.focus());
        }}
        onActionPanel={() => setActionPanelOpen(true)}
      />
      <Editor editor={editor} />
      <FormatBar editor={editor} />
      <NotesBrowser open={browseOpen} onClose={() => setBrowseOpen(false)} />
      <ActionPanel
        open={actionPanelOpen}
        onClose={() => setActionPanelOpen(false)}
        editor={editor}
        onNewNote={() => {
          createNote().then(() => editor?.commands.focus());
        }}
        onBrowseNotes={() => setBrowseOpen(true)}
      />
      <Toast />
    </div>
  );
}

export default App;
