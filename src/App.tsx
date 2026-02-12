import { useEffect, useRef, useCallback, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PhysicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import Toolbar from "./components/Toolbar/Toolbar";
import Editor from "./components/Editor/Editor";
import FormatBar from "./components/Editor/FormatBar";
import NotesBrowser from "./components/NotesBrowser/NotesBrowser";
import ActionPanel from "./components/ActionPanel/ActionPanel";
import Toast from "./components/Toast/Toast";
import FindBar from "./components/Editor/FindBar";
import { useAppEditor } from "./hooks/useEditor";
import { useAppStore } from "./stores/appStore";
import { extractTitle } from "./lib/utils";
import { copyAsMarkdown } from "./lib/export";

function App() {
  const editor = useAppEditor();
  const [browseOpen, setBrowseOpen] = useState(false);
  const [actionPanelOpen, setActionPanelOpen] = useState(false);
  const [findBarOpen, setFindBarOpen] = useState(false);
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
    autoResizeEnabled,
    toggleAutoResize,
  } = useAppStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNoteIdRef = useRef<string | null>(null);

  // Refs for overlay state (used in Esc handler without re-creating effect)
  const browseOpenRef = useRef(browseOpen);
  browseOpenRef.current = browseOpen;
  const actionPanelOpenRef = useRef(actionPanelOpen);
  actionPanelOpenRef.current = actionPanelOpen;
  const findBarOpenRef = useRef(findBarOpen);
  findBarOpenRef.current = findBarOpen;

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
    // Clear search when switching notes
    editor.commands.clearSearch();
    setFindBarOpen(false);
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

  // Listen for tray "New Note" event
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    listen("tray-new-note", () => {
      createNote().then(() => editor?.commands.focus());
    }).then((fn) => {
      unlistenFn = fn;
    });
    return () => {
      unlistenFn?.();
    };
  }, [createNote, editor]);

  // Window position persistence
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    const setup = async () => {
      const appWindow = getCurrentWindow();

      // Restore saved position
      const saved = localStorage.getItem("windowPos");
      if (saved) {
        try {
          const { x, y } = JSON.parse(saved);
          await appWindow.setPosition(new PhysicalPosition(x, y));
        } catch {
          /* ignore invalid saved position */
        }
      }

      // Save position on window move (debounced)
      let moveTimer: number;
      unlistenFn = await appWindow.onMoved(({ payload }) => {
        clearTimeout(moveTimer);
        moveTimer = window.setTimeout(() => {
          localStorage.setItem(
            "windowPos",
            JSON.stringify({ x: payload.x, y: payload.y }),
          );
        }, 500);
      });
    };

    setup();
    return () => {
      unlistenFn?.();
    };
  }, []);

  // Auto-resize window to content
  useEffect(() => {
    if (!autoResizeEnabled || !editor) return;

    const prosemirror = document.querySelector(".ProseMirror");
    if (!prosemirror) return;

    const doResize = async () => {
      const contentH = prosemirror.scrollHeight;
      const formatBarEl = document.querySelector("[data-format-bar]");
      const formatH = formatBarEl ? 40 : 0;
      const findBarEl = document.querySelector("[data-find-bar]");
      const findBarH = findBarEl
        ? findBarEl.getBoundingClientRect().height
        : 0;
      const total = 48 + contentH + 24 + formatH + findBarH; // toolbar + content + editor padding + format bar + find bar
      const maxH = window.screen.availHeight * 0.8;
      const clamped = Math.max(200, Math.min(Math.ceil(total), maxH));
      try {
        await getCurrentWindow().setSize(new LogicalSize(400, clamped));
      } catch {
        /* ignore resize errors */
      }
    };

    let timer: number;
    const scheduleResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(doResize, 50);
    };

    // Initial resize
    scheduleResize();

    const resizeObs = new ResizeObserver(scheduleResize);
    resizeObs.observe(prosemirror);

    const mutObs = new MutationObserver(scheduleResize);
    mutObs.observe(prosemirror, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObs.disconnect();
      mutObs.disconnect();
      clearTimeout(timer);
    };
  }, [autoResizeEnabled, editor]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Esc — Hide window when no overlay is open
      if (
        e.key === "Escape" &&
        !browseOpenRef.current &&
        !actionPanelOpenRef.current &&
        !findBarOpenRef.current
      ) {
        e.preventDefault();
        getCurrentWindow().hide();
      }
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
      // ⌘F — Find in Note
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "f") {
        e.preventDefault();
        setFindBarOpen(true);
        // Focus handled by FindBar component
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
      if (
        e.metaKey &&
        e.shiftKey &&
        !e.altKey &&
        (e.key === "p" || e.key === "P")
      ) {
        e.preventDefault();
        const note = useAppStore.getState().currentNote;
        if (note) {
          togglePin(note.id).then(() => {
            showToast(note.is_pinned ? "Note unpinned" : "Note pinned");
          });
        }
      }
      // ⇧⌘C — Copy as Markdown
      if (
        e.metaKey &&
        e.shiftKey &&
        !e.altKey &&
        (e.key === "c" || e.key === "C")
      ) {
        e.preventDefault();
        if (editor) {
          copyAsMarkdown(editor).then(() => showToast("Copied as Markdown"));
        }
      }
      // ⇧⌘E — Export (open action panel)
      if (
        e.metaKey &&
        e.shiftKey &&
        !e.altKey &&
        (e.key === "e" || e.key === "E")
      ) {
        e.preventDefault();
        setActionPanelOpen(true);
      }
      // ⇧⌘/ — Toggle auto-resize
      if (e.metaKey && e.shiftKey && !e.altKey && e.key === "/") {
        e.preventDefault();
        const wasEnabled = useAppStore.getState().autoResizeEnabled;
        toggleAutoResize();
        showToast(
          wasEnabled ? "Auto-sizing disabled" : "Auto-sizing enabled",
        );
      }
      // ⌘0-⌘9 — Quick access to pinned notes
      if (
        e.metaKey &&
        !e.shiftKey &&
        !e.altKey &&
        e.key >= "0" &&
        e.key <= "9"
      ) {
        const pinnedNotes = useAppStore
          .getState()
          .notes.filter((n) => n.is_pinned);
        const idx = e.key === "0" ? 9 : parseInt(e.key) - 1;
        if (idx < pinnedNotes.length) {
          e.preventDefault();
          switchToNote(pinnedNotes[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    createNote,
    editor,
    goBack,
    goForward,
    togglePin,
    showToast,
    switchToNote,
    toggleAutoResize,
  ]);

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
      {findBarOpen && editor && (
        <FindBar
          editor={editor}
          onClose={() => setFindBarOpen(false)}
        />
      )}
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
