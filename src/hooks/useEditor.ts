import { useEditor as useTipTapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { KeyboardShortcuts } from "../components/Editor/extensions/KeyboardShortcuts";
import { SearchAndReplace } from "../components/Editor/extensions/SearchAndReplace";

export function useAppEditor() {
  const editor = useTipTapEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: "code-block" } },
        blockquote: { HTMLAttributes: { class: "blockquote" } },
        bulletList: { HTMLAttributes: { class: "bullet-list" } },
        orderedList: { HTMLAttributes: { class: "ordered-list" } },
        listItem: { HTMLAttributes: { class: "list-item" } },
        horizontalRule: {},
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      TaskList.configure({
        HTMLAttributes: { class: "task-list" },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "task-item" },
      }),
      KeyboardShortcuts,
      SearchAndReplace,
    ],
    autofocus: true,
    editorProps: {
      attributes: {
        class: "editor-content",
      },
    },
  });

  return editor;
}
