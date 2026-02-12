import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import "./styles.css";

export default function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    autofocus: true,
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <EditorContent editor={editor} />
    </div>
  );
}
