import { useState, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import { extractTitle } from "../../lib/utils";
import NoteItem from "../NotesBrowser/NoteItem";

export default function NotesSidebar() {
  const [search, setSearch] = useState("");
  const { notes, currentNote, switchToNote, createNote, deleteNote, togglePin } =
    useAppStore();

  const visibleNotes = useMemo(
    () => (notes.length === 0 && currentNote ? [currentNote] : notes),
    [notes, currentNote],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return visibleNotes;
    const q = search.toLowerCase();
    return visibleNotes.filter((n) => {
      const title = extractTitle(n.content).toLowerCase();
      return title.includes(q) || n.content.toLowerCase().includes(q);
    });
  }, [visibleNotes, search]);

  return (
    <div className="flex h-full flex-col bg-[#1C1C1C] border-r border-white/8">
      {/* Search */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full rounded-lg bg-white/8 px-3 py-1.5 text-sm text-[#E5E5E7] placeholder-[#E5E5E7]/30 outline-none focus:bg-white/10"
        />
        <p className="mt-1.5 px-1 text-[10px] text-[#E5E5E7]/30">
          {filtered.length} / {visibleNotes.length} notes
        </p>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-[#E5E5E7]/30">
            {search ? "No notes found" : "No notes yet"}
          </p>
        ) : (
          filtered.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              isCurrent={note.id === currentNote?.id}
              isHighlighted={note.id === currentNote?.id}
              onSelect={() => switchToNote(note.id)}
              onPin={() => togglePin(note.id)}
              onDelete={() => deleteNote(note.id)}
            />
          ))
        )}
      </div>

      {/* New note */}
      <div className="shrink-0 border-t border-white/8 p-2">
        <button
          onClick={() => createNote()}
          className="w-full rounded-lg px-3 py-2 text-left text-xs text-[#E5E5E7]/50 transition-colors hover:bg-white/8 hover:text-[#E5E5E7]"
        >
          + New Note
        </button>
      </div>
    </div>
  );
}
