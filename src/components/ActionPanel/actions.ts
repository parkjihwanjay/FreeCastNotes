import type { Editor } from "@tiptap/react";
import {
  copyAsMarkdown,
  copyAsHTML,
  copyAsPlainText,
  exportToFile,
} from "../../lib/export";
import { useAppStore } from "../../stores/appStore";

export interface Action {
  id: string;
  label: string;
  shortcut?: string;
  icon: string;
  category: "notes" | "format" | "export" | "window";
  submenu?: Action[];
  execute?: () => void | Promise<void>;
  disabled?: boolean;
}

export function buildActions(
  editor: Editor | null,
  callbacks: {
    onNewNote: () => void;
    onBrowseNotes: () => void;
    onImportFile: () => void;
    onClose: () => void;
  },
): Action[] {
  const store = useAppStore.getState();
  const { currentNote, showToast } = store;

  const actions: Action[] = [
    // --- Notes ---
    {
      id: "new-note",
      label: "New Note",
      shortcut: "⌘N",
      icon: "📝",
      category: "notes",
      execute: () => {
        callbacks.onNewNote();
        callbacks.onClose();
      },
    },
    {
      id: "duplicate-note",
      label: "Duplicate Note",
      shortcut: "⌘D",
      icon: "📋",
      category: "notes",
      disabled: !currentNote,
      execute: async () => {
        if (!currentNote) return;
        await store.duplicateNote(currentNote.id);
        showToast("Note duplicated");
        callbacks.onClose();
      },
    },
    {
      id: "browse-notes",
      label: "Browse Notes",
      shortcut: "⌘P",
      icon: "📂",
      category: "notes",
      execute: () => {
        callbacks.onClose();
        callbacks.onBrowseNotes();
      },
    },
    {
      id: "pin-note",
      label: currentNote?.is_pinned ? "Unpin Note" : "Pin Note",
      shortcut: "⇧⌘P",
      icon: "📌",
      category: "notes",
      disabled: !currentNote,
      execute: async () => {
        if (!currentNote) return;
        await store.togglePin(currentNote.id);
        showToast(currentNote.is_pinned ? "Note unpinned" : "Note pinned");
        callbacks.onClose();
      },
    },
    {
      id: "delete-note",
      label: "Delete Note",
      icon: "🗑",
      category: "notes",
      disabled: !currentNote,
      execute: async () => {
        if (!currentNote) return;
        await store.deleteNote(currentNote.id);
        showToast("Note deleted");
        callbacks.onClose();
      },
    },
    {
      id: "import-markdown",
      label: "Import Markdown",
      icon: "📥",
      category: "notes",
      execute: async () => {
        callbacks.onClose();
        await callbacks.onImportFile();
      },
    },

    // --- Export ---
    {
      id: "copy-markdown",
      label: "Copy as Markdown",
      shortcut: "⇧⌘C",
      icon: "📄",
      category: "export",
      disabled: !editor,
      execute: async () => {
        if (!editor) return;
        await copyAsMarkdown(editor);
        showToast("Copied as Markdown");
        callbacks.onClose();
      },
    },
    {
      id: "copy-html",
      label: "Copy as HTML",
      icon: "🌐",
      category: "export",
      disabled: !editor,
      execute: async () => {
        if (!editor) return;
        await copyAsHTML(editor);
        showToast("Copied as HTML");
        callbacks.onClose();
      },
    },
    {
      id: "copy-plaintext",
      label: "Copy as Plain Text",
      icon: "📃",
      category: "export",
      disabled: !editor,
      execute: async () => {
        if (!editor) return;
        await copyAsPlainText(editor);
        showToast("Copied as Plain Text");
        callbacks.onClose();
      },
    },
    {
      id: "export-file",
      label: "Export...",
      shortcut: "⇧⌘E",
      icon: "💾",
      category: "export",
      disabled: !editor,
      submenu: [
        {
          id: "export-md",
          label: "Markdown (.md)",
          icon: "📄",
          category: "export",
          execute: async () => {
            if (!editor) return;
            const saved = await exportToFile(editor, "md");
            if (saved) showToast("Exported as Markdown");
            callbacks.onClose();
          },
        },
        {
          id: "export-html",
          label: "HTML (.html)",
          icon: "🌐",
          category: "export",
          execute: async () => {
            if (!editor) return;
            const saved = await exportToFile(editor, "html");
            if (saved) showToast("Exported as HTML");
            callbacks.onClose();
          },
        },
        {
          id: "export-txt",
          label: "Plain Text (.txt)",
          icon: "📃",
          category: "export",
          execute: async () => {
            if (!editor) return;
            const saved = await exportToFile(editor, "txt");
            if (saved) showToast("Exported as Plain Text");
            callbacks.onClose();
          },
        },
      ],
    },
    {
      id: "copy-deeplink",
      label: "Copy Deeplink",
      shortcut: "⇧⌘D",
      icon: "🔗",
      category: "export",
      disabled: !currentNote,
      execute: async () => {
        if (!currentNote) return;
        await navigator.clipboard.writeText(
          `freecastnotes://note/${currentNote.id}`,
        );
        showToast("Deeplink copied");
        callbacks.onClose();
      },
    },

    // --- Format ---
    {
      id: "format-heading1",
      label: "Heading 1",
      shortcut: "⌥⌘1",
      icon: "H1",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleHeading({ level: 1 }).run();
        callbacks.onClose();
      },
    },
    {
      id: "format-heading2",
      label: "Heading 2",
      shortcut: "⌥⌘2",
      icon: "H2",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleHeading({ level: 2 }).run();
        callbacks.onClose();
      },
    },
    {
      id: "format-heading3",
      label: "Heading 3",
      shortcut: "⌥⌘3",
      icon: "H3",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleHeading({ level: 3 }).run();
        callbacks.onClose();
      },
    },
    {
      id: "format-bold",
      label: "Bold",
      shortcut: "⌘B",
      icon: "B",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleBold().run();
        callbacks.onClose();
      },
    },
    {
      id: "format-italic",
      label: "Italic",
      shortcut: "⌘I",
      icon: "I",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleItalic().run();
        callbacks.onClose();
      },
    },
    {
      id: "format-code-block",
      label: "Code Block",
      shortcut: "⌥⌘C",
      icon: "<>",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleCodeBlock().run();
        callbacks.onClose();
      },
    },
    {
      id: "format-bullet-list",
      label: "Bullet List",
      shortcut: "⇧⌘8",
      icon: "•",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleBulletList().run();
        callbacks.onClose();
      },
    },
    {
      id: "format-ordered-list",
      label: "Ordered List",
      shortcut: "⇧⌘7",
      icon: "1.",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleOrderedList().run();
        callbacks.onClose();
      },
    },
    {
      id: "format-task-list",
      label: "Task List",
      shortcut: "⇧⌘9",
      icon: "☐",
      category: "format",
      disabled: !editor,
      execute: () => {
        editor?.chain().focus().toggleTaskList().run();
        callbacks.onClose();
      },
    },

    // --- Window ---
    {
      id: "toggle-split-layout",
      label:
        store.layoutMode === "split"
          ? "Switch to Single Layout"
          : "Switch to Split Layout",
      shortcut: "⌘\\",
      icon: "⊞",
      category: "window",
      execute: () => {
        const s = useAppStore.getState();
        s.setLayoutMode(s.layoutMode === "split" ? "single" : "split");
        callbacks.onClose();
      },
    },
    {
      id: "toggle-auto-resize",
      label: store.autoResizeEnabled
        ? "Disable Window Auto-sizing"
        : "Enable Window Auto-sizing",
      shortcut: "⇧⌘/",
      icon: "↕",
      category: "window",
      execute: () => {
        const wasEnabled = store.autoResizeEnabled;
        store.toggleAutoResize();
        showToast(
          wasEnabled ? "Auto-sizing disabled" : "Auto-sizing enabled",
        );
        callbacks.onClose();
      },
    },
    {
      id: "hide-format-bar",
      label: "Toggle Format Bar",
      shortcut: "⌥⌘,",
      icon: "⌨",
      category: "window",
      execute: () => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: ",",
            altKey: true,
            metaKey: true,
          }),
        );
        callbacks.onClose();
      },
    },
  ];

  return actions;
}
