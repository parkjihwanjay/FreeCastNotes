import { EditorContent, type Editor as TipTapEditor } from "@tiptap/react";
import "./styles.css";

interface EditorProps {
  editor: TipTapEditor | null;
}

export default function Editor({ editor }: EditorProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <EditorContent editor={editor} />
    </div>
  );
}
