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
  const [title, setTitle] = useState("Untitled");
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
      createNote().catch((error) => {
        console.error("Failed to create initial note", error);
      });
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

  // Keep title in sync with saved/current note content
  useEffect(() => {
    setTitle(extractTitle(currentNote?.content ?? ""));
  }, [currentNote?.content]);

  // Update title live from editor content (before debounce save completes)
  useEffect(() => {
    if (!editor) return;
    const syncTitle = () => {
      setTitle(extractTitle(JSON.stringify(editor.getJSON())));
    };
    syncTitle();
    editor.on("update", syncTitle);
    return () => {
      editor.off("update", syncTitle);
    };
  }, [editor]);

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

  const createNoteAndFocus = useCallback(
    async (closePanels: boolean) => {
      try {
        await createNote();
        if (closePanels) {
          setBrowseOpen(false);
          setActionPanelOpen(false);
        }
        editor?.commands.focus();
      } catch (error) {
        console.error("Failed to create note", error);
      }
    },
    [createNote, editor],
  );

  const openBrowse = useCallback(() => {
    setActionPanelOpen(false);
    setBrowseOpen(true);
    loadNotes().catch((error) => {
      console.error("Failed to refresh notes before opening browser", error);
    });
  }, [loadNotes]);

  // Listen for tray "New Note" event
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    listen("tray-new-note", () => {
      createNoteAndFocus(true);
    }).then((fn) => {
      unlistenFn = fn;
    });
    return () => {
      unlistenFn?.();
    };
  }, [createNoteAndFocus]);

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

  // Keep fixed window width and sane height on startup
  useEffect(() => {
    const enforceWindowSize = async () => {
      try {
        const appWindow = getCurrentWindow();
        const currentSize = await appWindow.innerSize();
        const maxH = Math.max(200, Math.floor(window.screen.availHeight * 0.8));
        const nextHeight = Math.max(
          200,
          Math.min(currentSize.height, maxH),
        );
        if (currentSize.width !== 650 || currentSize.height !== nextHeight) {
          await appWindow.setSize(new LogicalSize(650, nextHeight));
        }
      } catch {
        /* ignore resize errors */
      }
    };

    enforceWindowSize();
  }, []);

  // Auto-resize window to content
  useEffect(() => {
    if (!autoResizeEnabled || !editor || actionPanelOpen || browseOpen) return;

    const prosemirror = document.querySelector(".ProseMirror");
    if (!prosemirror) return;

    const doResize = async () => {
      const contentH = prosemirror.scrollHeight;
      const formatBarEl = document.querySelector("[data-format-bar]");
      const formatH = formatBarEl
        ? formatBarEl.getBoundingClientRect().height
        : 0;
      const findBarEl = document.querySelector("[data-find-bar]");
      const findBarH = findBarEl
        ? findBarEl.getBoundingClientRect().height
        : 0;
      const total = 48 + contentH + 24 + formatH + findBarH; // toolbar + content + editor padding + format bar + find bar
      const maxH = window.screen.availHeight * 0.8;
      const clamped = Math.max(200, Math.min(Math.ceil(total), maxH));
      try {
        await getCurrentWindow().setSize(new LogicalSize(650, clamped));
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
  }, [autoResizeEnabled, editor, actionPanelOpen, browseOpen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      try {
        const key = (e.key ?? "").toLowerCase();
        const mod = e.metaKey || e.ctrlKey;

        // Esc — Hide window
        if (key === "escape") {
          e.preventDefault();
          setBrowseOpen(false);
          setActionPanelOpen(false);
          setFindBarOpen(false);
          getCurrentWindow().hide();
          return;
        }
        // ⌘K — Action Panel
        if (mod && !e.shiftKey && !e.altKey && (key === "k" || e.code === "KeyK")) {
          e.preventDefault();
          setActionPanelOpen((o) => !o);
          setBrowseOpen(false);
        }
        // ⌘P — Browse Notes
        if (mod && !e.shiftKey && !e.altKey && (key === "p" || e.code === "KeyP")) {
          e.preventDefault();
          setBrowseOpen((isOpen) => {
            const next = !isOpen;
            if (next) {
              loadNotes().catch((error) => {
                console.error("Failed to refresh notes from shortcut", error);
              });
            }
            return next;
          });
          setActionPanelOpen(false);
        }
        // ⌘F — Find in Note
        if (mod && !e.shiftKey && !e.altKey && (key === "f" || e.code === "KeyF")) {
          e.preventDefault();
          setFindBarOpen(true);
          // Focus handled by FindBar component
        }
        // ⌘N — New Note
        if (mod && !e.shiftKey && !e.altKey && (key === "n" || e.code === "KeyN")) {
          e.preventDefault();
          createNoteAndFocus(true);
        }
        // ⌘D — Duplicate Note
        if (mod && !e.shiftKey && !e.altKey && (key === "d" || e.code === "KeyD")) {
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
        if (mod && !e.shiftKey && !e.altKey && (key === "[" || e.code === "BracketLeft")) {
          e.preventDefault();
          goBack();
        }
        // ⌘] — Navigate Forward
        if (mod && !e.shiftKey && !e.altKey && (key === "]" || e.code === "BracketRight")) {
          e.preventDefault();
          goForward();
        }
        // ⇧⌘P — Toggle Pin
        if (
          mod &&
          e.shiftKey &&
          !e.altKey &&
          (key === "p" || e.code === "KeyP")
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
          mod &&
          e.shiftKey &&
          !e.altKey &&
          (key === "c" || e.code === "KeyC")
        ) {
          e.preventDefault();
          if (editor) {
            copyAsMarkdown(editor).then(() => showToast("Copied as Markdown"));
          }
        }
        // ⇧⌘E — Export (open action panel)
        if (
          mod &&
          e.shiftKey &&
          !e.altKey &&
          (key === "e" || e.code === "KeyE")
        ) {
          e.preventDefault();
          setActionPanelOpen(true);
        }
        // ⇧⌘/ — Toggle auto-resize
        if (mod && e.shiftKey && !e.altKey && (key === "/" || e.code === "Slash")) {
          e.preventDefault();
          const wasEnabled = useAppStore.getState().autoResizeEnabled;
          toggleAutoResize();
          showToast(
            wasEnabled ? "Auto-sizing disabled" : "Auto-sizing enabled",
          );
        }
        // ⌘0-⌘9 — Quick access to pinned notes
        if (
          mod &&
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
      } catch (error) {
        console.error("Shortcut handler error", error);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [
    createNoteAndFocus,
    editor,
    goBack,
    goForward,
    togglePin,
    showToast,
    switchToNote,
    toggleAutoResize,
    loadNotes,
  ]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1F1F1F]">
        <p className="text-sm text-[#E5E5E7]/40">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-[#1F1F1F]">
      <Toolbar
        title={title}
        onBrowse={openBrowse}
        onNewNote={() => {
          createNoteAndFocus(true);
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
          createNoteAndFocus(true);
        }}
        onBrowseNotes={openBrowse}
      />
      <Toast />
    </div>
  );
}

export default App;
