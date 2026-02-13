import { useCallback } from "react";
import { EditorContent, type Editor as TipTapEditor } from "@tiptap/react";
import "./styles.css";

interface EditorProps {
  editor: TipTapEditor | null;
}

export default function Editor({ editor }: EditorProps) {
  // Click on empty area below content → focus editor at end
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor) return;
      // Only trigger when clicking the wrapper, not the editor content itself
      if (e.target === e.currentTarget) {
        editor.commands.focus("end");
      }
    },
    [editor],
  );

  return (
    <div
      className="flex-1 cursor-text overflow-y-auto px-4 py-3"
      onClick={handleClick}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
