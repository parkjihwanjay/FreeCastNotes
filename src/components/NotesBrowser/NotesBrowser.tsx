import { useState, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import { extractTitle } from "../../lib/utils";
import NoteItem from "./NoteItem";

interface NotesBrowserProps {
  open: boolean;
  onClose: () => void;
}

export default function NotesBrowser({ open, onClose }: NotesBrowserProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { notes, currentNote, switchToNote, createNote, deleteNote, togglePin } =
    useAppStore();

  // Focus search input when panel opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.metaKey && e.key === "n") {
        e.preventDefault();
        createNote().then(() => onClose());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, createNote]);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter((n) => {
      const title = extractTitle(n.content).toLowerCase();
      const content = n.content.toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [notes, search]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#1C1C1E]/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-white/8 px-4 pb-3 pt-14">
        {/* Search */}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for notes..."
          className="w-full rounded-lg bg-white/8 px-3 py-2 text-sm text-[#E5E5E7] placeholder-[#E5E5E7]/30 outline-none focus:bg-white/10"
        />
        {/* Count */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#E5E5E7]/40">
            {filtered.length}/{notes.length} Notes
          </span>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#E5E5E7]/30">
            No notes found
          </p>
        ) : (
          filtered.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isCurrent={note.id === currentNote?.id}
              onSelect={() => {
                switchToNote(note.id);
                onClose();
              }}
              onPin={() => togglePin(note.id)}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
