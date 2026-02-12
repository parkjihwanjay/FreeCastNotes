import { useEffect, useRef, useCallback, useState } from "react";
import Toolbar from "./components/Toolbar/Toolbar";
import Editor from "./components/Editor/Editor";
import FormatBar from "./components/Editor/FormatBar";
import NotesBrowser from "./components/NotesBrowser/NotesBrowser";
import { useAppEditor } from "./hooks/useEditor";
import { useAppStore } from "./stores/appStore";
import { extractTitle } from "./lib/utils";

function App() {
  const editor = useAppEditor();
  const [browseOpen, setBrowseOpen] = useState(false);
  const {
    currentNote,
    loading,
    loadNotes,
    createNote,
    updateCurrentNoteContent,
    notes,
    switchToNote,
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
      // ⌘P — Browse Notes
      if (e.metaKey && e.key === "p") {
        e.preventDefault();
        setBrowseOpen((o) => !o);
      }
      // ⌘N — New Note
      if (e.metaKey && e.key === "n") {
        e.preventDefault();
        createNote().then(() => {
          setBrowseOpen(false);
          editor?.commands.focus();
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createNote, editor]);

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
      />
      <Editor editor={editor} />
      <FormatBar editor={editor} />
      <NotesBrowser open={browseOpen} onClose={() => setBrowseOpen(false)} />
    </div>
  );
}

export default App;
