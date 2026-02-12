import { useState, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface FormatBarProps {
  editor: Editor | null;
}

export default function FormatBar({ editor }: FormatBarProps) {
  const [visible, setVisible] = useState(true);
  const [headingOpen, setHeadingOpen] = useState(false);

  // Toggle with ⌥⌘,
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.metaKey && e.key === ",") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Force re-render on editor selection/transaction changes
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const run = useCallback(
    (cmd: () => boolean) => {
      cmd();
      editor?.commands.focus();
    },
    [editor],
  );

  if (!visible || !editor) return null;

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  return (
    <div data-format-bar className="relative flex h-10 shrink-0 items-center gap-0.5 border-t border-white/8 bg-[#2C2C2E] px-2">
      {/* Heading dropdown */}
      <div className="relative">
        <FormatBtn
          label="H▾"
          active={isActive("heading")}
          onClick={() => setHeadingOpen((o) => !o)}
          title="Headings"
        />
        {headingOpen && (
          <div className="absolute bottom-full left-0 mb-1 w-28 rounded-md border border-white/10 bg-[#3A3A3C] py-1 shadow-lg">
            {([1, 2, 3] as const).map((level) => (
              <button
                key={level}
                onClick={() => {
                  run(() =>
                    editor.chain().focus().toggleHeading({ level }).run(),
                  );
                  setHeadingOpen(false);
                }}
                className={`flex w-full items-center px-3 py-1 text-left text-sm hover:bg-white/10 ${
                  isActive("heading", { level })
                    ? "text-white"
                    : "text-white/60"
                }`}
              >
                <span
                  style={{
                    fontSize: level === 1 ? 18 : level === 2 ? 15 : 13,
                    fontWeight: 700,
                  }}
                >
                  H{level}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Inline formats */}
      <FormatBtn
        label="B"
        active={isActive("bold")}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
        title="Bold (⌘B)"
        bold
      />
      <FormatBtn
        label="I"
        active={isActive("italic")}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
        title="Italic (⌘I)"
        italic
      />
      <FormatBtn
        label="S"
        active={isActive("strike")}
        onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
        title="Strikethrough (⇧⌘S)"
        strike
      />
      <FormatBtn
        label="U"
        active={isActive("underline")}
        onClick={() =>
          run(() => editor.chain().focus().toggleUnderline().run())
        }
        title="Underline (⌘U)"
        underline
      />
      <FormatBtn
        label="<>"
        active={isActive("code")}
        onClick={() => run(() => editor.chain().focus().toggleCode().run())}
        title="Inline Code (⌘E)"
      />
      <FormatBtn
        label="🔗"
        active={isActive("link")}
        onClick={() => {
          if (isActive("link")) {
            run(() => editor.chain().focus().unsetLink().run());
          } else {
            const url = window.prompt("URL:");
            if (url) {
              run(() =>
                editor.chain().focus().setLink({ href: url }).run(),
              );
            }
          }
        }}
        title="Link (⌘L)"
      />

      <Separator />

      {/* Block formats */}
      <FormatBtn
        label="❝"
        active={isActive("blockquote")}
        onClick={() =>
          run(() => editor.chain().focus().toggleBlockquote().run())
        }
        title="Blockquote (⇧⌘B)"
      />
      <FormatBtn
        label="•"
        active={isActive("bulletList")}
        onClick={() =>
          run(() => editor.chain().focus().toggleBulletList().run())
        }
        title="Bullet List (⇧⌘8)"
      />
      <FormatBtn
        label="1."
        active={isActive("orderedList")}
        onClick={() =>
          run(() => editor.chain().focus().toggleOrderedList().run())
        }
        title="Ordered List (⇧⌘7)"
      />
      <FormatBtn
        label="☐"
        active={isActive("taskList")}
        onClick={() =>
          run(() => editor.chain().focus().toggleTaskList().run())
        }
        title="Task List (⇧⌘9)"
      />

      {/* Close button */}
      <div className="ml-auto">
        <FormatBtn
          label="✕"
          active={false}
          onClick={() => setVisible(false)}
          title="Hide Format Bar (⌥⌘,)"
        />
      </div>
    </div>
  );
}

function FormatBtn({
  label,
  active,
  onClick,
  title,
  bold,
  italic,
  strike,
  underline,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  underline?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/50 hover:bg-white/8 hover:text-white/80"
      }`}
      style={{
        fontWeight: bold ? 700 : undefined,
        fontStyle: italic ? "italic" : undefined,
        textDecoration: [
          strike ? "line-through" : "",
          underline ? "underline" : "",
        ]
          .filter(Boolean)
          .join(" ") || undefined,
      }}
    >
      {label}
    </button>
  );
}

function Separator() {
  return <div className="mx-1 h-4 w-px bg-white/10" />;
}
