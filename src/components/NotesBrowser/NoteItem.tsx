import { extractTitle, countCharacters, timeAgo } from "../../lib/utils";
import type { Note } from "../../types";

interface NoteItemProps {
  note: Note;
  isCurrent: boolean;
  onSelect: () => void;
  onPin: () => void;
  onDelete: () => void;
}

export default function NoteItem({
  note,
  isCurrent,
  onSelect,
  onPin,
  onDelete,
}: NoteItemProps) {
  const title = extractTitle(note.content);
  const charCount = countCharacters(note.content);
  const time = isCurrent ? "Current" : `Opened ${timeAgo(note.updated_at)}`;

  return (
    <button
      onClick={onSelect}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/8"
    >
      {/* Current indicator or pin icon */}
      <div className="flex w-4 shrink-0 items-center justify-center">
        {isCurrent ? (
          <span className="h-2 w-2 rounded-full bg-red-500" />
        ) : note.is_pinned ? (
          <span className="text-[10px] text-white/40">📌</span>
        ) : null}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#E5E5E7]">{title}</p>
        <p className="text-xs text-[#E5E5E7]/40">
          {time} &middot; {charCount} Characters
        </p>
      </div>

      {/* Hover actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <ActionBtn
          label={note.is_pinned ? "📌" : "📌"}
          title={note.is_pinned ? "Unpin" : "Pin"}
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
        />
        <ActionBtn
          label="🗑"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </div>
    </button>
  );
}

function ActionBtn({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded text-xs transition-colors hover:bg-white/10"
    >
      {label}
    </button>
  );
}
