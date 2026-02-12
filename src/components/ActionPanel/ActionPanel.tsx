import { useState, useEffect, useRef, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import { buildActions, type Action } from "./actions";

interface ActionPanelProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
  onNewNote: () => void;
  onBrowseNotes: () => void;
}

export default function ActionPanel({
  open,
  onClose,
  editor,
  onNewNote,
  onBrowseNotes,
}: ActionPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [submenu, setSubmenu] = useState<Action[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo(
    () => buildActions(editor, { onNewNote, onBrowseNotes, onClose }),
    [editor, onNewNote, onBrowseNotes, onClose],
  );

  const filtered = useMemo(() => {
    const list = submenu || actions;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }, [actions, submenu, search]);

  // Reset state when panel opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
      setSubmenu(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keep selectedIndex in bounds
  useEffect(() => {
    if (selectedIndex >= filtered.length) {
      setSelectedIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (submenu) {
          setSubmenu(null);
          setSearch("");
          setSelectedIndex(0);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const action = filtered[selectedIndex];
        if (action && !action.disabled) {
          if (action.submenu) {
            setSubmenu(action.submenu);
            setSearch("");
            setSelectedIndex(0);
          } else {
            action.execute?.();
          }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, filtered, selectedIndex, submenu]);

  if (!open) return null;

  // Group actions by category when not in submenu and no search
  const grouped = !submenu && !search.trim();
  const categories = grouped
    ? (["notes", "export", "format", "window"] as const)
    : null;

  let globalIdx = -1;

  return (
    <div
      className="animate-overlay-in absolute inset-0 z-50 flex items-start justify-center pt-16"
      onClick={onClose}
    >
      <div
        className="animate-panel-in w-80 overflow-hidden rounded-xl border border-white/10 bg-[#2C2C2E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="border-b border-white/8 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={submenu ? "Search submenu..." : "Search for actions..."}
            className="w-full bg-transparent text-sm text-[#E5E5E7] placeholder-[#E5E5E7]/30 outline-none"
          />
        </div>

        {/* Actions list */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[#E5E5E7]/30">
              No actions found
            </p>
          ) : grouped && categories ? (
            categories.map((cat) => {
              const catActions = filtered.filter((a) => a.category === cat);
              if (catActions.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-[#E5E5E7]/30">
                    {cat === "notes"
                      ? "Notes"
                      : cat === "export"
                        ? "Export & Copy"
                        : cat === "format"
                          ? "Format"
                          : "Window"}
                  </div>
                  {catActions.map((action) => {
                    globalIdx++;
                    const idx = globalIdx;
                    return (
                      <ActionItem
                        key={action.id}
                        action={action}
                        selected={selectedIndex === idx}
                        onHover={() => setSelectedIndex(idx)}
                        onExecute={() => {
                          if (action.submenu) {
                            setSubmenu(action.submenu);
                            setSearch("");
                            setSelectedIndex(0);
                          } else {
                            action.execute?.();
                          }
                        }}
                      />
                    );
                  })}
                </div>
              );
            })
          ) : (
            filtered.map((action, i) => (
              <ActionItem
                key={action.id}
                action={action}
                selected={selectedIndex === i}
                onHover={() => setSelectedIndex(i)}
                onExecute={() => {
                  if (action.submenu) {
                    setSubmenu(action.submenu);
                    setSearch("");
                    setSelectedIndex(0);
                  } else {
                    action.execute?.();
                  }
                }}
              />
            ))
          )}
        </div>

        {/* Footer hint */}
        {submenu && (
          <div className="border-t border-white/8 px-3 py-1.5">
            <span className="text-[10px] text-[#E5E5E7]/30">
              Esc to go back
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItem({
  action,
  selected,
  onHover,
  onExecute,
}: {
  action: Action;
  selected: boolean;
  onHover: () => void;
  onExecute: () => void;
}) {
  return (
    <button
      onMouseEnter={onHover}
      onClick={() => {
        if (!action.disabled) onExecute();
      }}
      className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
        action.disabled
          ? "cursor-default text-[#E5E5E7]/20"
          : selected
            ? "bg-white/10 text-[#E5E5E7]"
            : "text-[#E5E5E7]/70 hover:bg-white/5"
      }`}
    >
      <span className="w-5 text-center text-xs">{action.icon}</span>
      <span className="flex-1">{action.label}</span>
      {action.submenu && (
        <span className="text-[10px] text-[#E5E5E7]/30">▶</span>
      )}
      {action.shortcut && (
        <span className="text-xs text-[#E5E5E7]/30">{action.shortcut}</span>
      )}
    </button>
  );
}
