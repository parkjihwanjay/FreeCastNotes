import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { SearchStorage } from "./extensions/SearchAndReplace";

interface FindBarProps {
  editor: Editor;
  onClose: () => void;
}

export default function FindBar({ editor, onClose }: FindBarProps) {
  const [searchTerm, setSearchTerm] = useState(() => {
    // Pre-fill with selected text
    const { from, to } = editor.state.selection;
    if (from !== to) {
      const selected = editor.state.doc.textBetween(from, to);
      if (selected && selected.length < 100 && !selected.includes("\n")) {
        return selected;
      }
    }
    return "";
  });
  const [replaceTerm, setReplaceTerm] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [, rerender] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storage = (editor.storage as any).searchAndReplace as SearchStorage;
  const resultCount = storage?.results?.length ?? 0;
  const currentIndex = storage?.currentIndex ?? 0;

  // Re-render on editor transactions to pick up result/index changes
  useEffect(() => {
    const onTransaction = () => rerender((n) => n + 1);
    editor.on("transaction", onTransaction);
    return () => {
      editor.off("transaction", onTransaction);
    };
  }, [editor]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Re-focus input on ⌘F when already open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && !e.shiftKey && !e.altKey && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Sync search term to extension
  useEffect(() => {
    editor.commands.setSearchTerm(searchTerm);
  }, [searchTerm, editor]);

  // Sync case sensitivity to extension
  useEffect(() => {
    editor.commands.setCaseSensitive(caseSensitive);
  }, [caseSensitive, editor]);

  const handleClose = () => {
    editor.commands.clearSearch();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editor.commands.goToNextMatch();
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      editor.commands.goToPrevMatch();
    }
  };

  return (
    <div
      data-find-bar
      className="flex flex-col border-b border-white/8 bg-[#2C2C2E] px-3 py-1.5"
    >
      {/* Search row */}
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find in note..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[#E5E5E7] placeholder-[#E5E5E7]/30 outline-none"
        />
        {searchTerm && (
          <span className="whitespace-nowrap text-[10px] text-[#E5E5E7]/40">
            {resultCount > 0
              ? `${currentIndex + 1} of ${resultCount}`
              : "No results"}
          </span>
        )}
        <button
          onClick={() => editor.commands.goToPrevMatch()}
          disabled={resultCount === 0}
          className="rounded p-0.5 text-xs text-[#E5E5E7]/50 hover:bg-white/10 hover:text-[#E5E5E7] disabled:opacity-30"
          title="Previous (Shift+Enter)"
        >
          ▲
        </button>
        <button
          onClick={() => editor.commands.goToNextMatch()}
          disabled={resultCount === 0}
          className="rounded p-0.5 text-xs text-[#E5E5E7]/50 hover:bg-white/10 hover:text-[#E5E5E7] disabled:opacity-30"
          title="Next (Enter)"
        >
          ▼
        </button>
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`rounded px-1 py-0.5 text-[10px] font-semibold transition-colors ${
            caseSensitive
              ? "bg-white/15 text-[#E5E5E7]"
              : "text-[#E5E5E7]/30 hover:bg-white/5 hover:text-[#E5E5E7]/50"
          }`}
          title="Case sensitive"
        >
          Aa
        </button>
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`rounded px-1 py-0.5 text-[10px] transition-colors ${
            showReplace
              ? "bg-white/15 text-[#E5E5E7]"
              : "text-[#E5E5E7]/30 hover:bg-white/5 hover:text-[#E5E5E7]/50"
          }`}
          title="Toggle replace"
        >
          ⇄
        </button>
        <button
          onClick={handleClose}
          className="rounded p-0.5 text-xs text-[#E5E5E7]/30 hover:bg-white/10 hover:text-[#E5E5E7]"
          title="Close (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1.5 pt-1.5">
          <input
            type="text"
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleClose();
            }}
            placeholder="Replace with..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#E5E5E7] placeholder-[#E5E5E7]/30 outline-none"
          />
          <button
            onClick={() => editor.commands.replaceCurrent(replaceTerm)}
            disabled={resultCount === 0}
            className="rounded px-2 py-0.5 text-[11px] text-[#E5E5E7]/60 hover:bg-white/10 hover:text-[#E5E5E7] disabled:opacity-30"
          >
            Replace
          </button>
          <button
            onClick={() => editor.commands.replaceAll(replaceTerm)}
            disabled={resultCount === 0}
            className="rounded px-2 py-0.5 text-[11px] text-[#E5E5E7]/60 hover:bg-white/10 hover:text-[#E5E5E7] disabled:opacity-30"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}
