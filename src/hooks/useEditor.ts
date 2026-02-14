import { useEditor as useTipTapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { KeyboardShortcuts } from "../components/Editor/extensions/KeyboardShortcuts";
import { SearchAndReplace } from "../components/Editor/extensions/SearchAndReplace";
import { ResizableImage } from "../components/Editor/extensions/ResizableImage";
import { compressImage, validateImageFile } from "../lib/imageUtils";

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
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    autofocus: true,
    editorProps: {
      attributes: {
        class: "editor-content",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return true;
            const error = validateImageFile(file);
            if (error) {
              console.warn("Image paste rejected:", error);
              return true;
            }
            compressImage(file).then((src) => {
              _view.dispatch(
                _view.state.tr.replaceSelectionWith(
                  _view.state.schema.nodes.image.create({ src }),
                ),
              );
            });
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;
        event.preventDefault();
        const error = validateImageFile(file);
        if (error) {
          console.warn("Image drop rejected:", error);
          return true;
        }
        const coords = _view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        compressImage(file).then((src) => {
          const node = _view.state.schema.nodes.image.create({ src });
          const pos = coords?.pos ?? _view.state.selection.to;
          _view.dispatch(_view.state.tr.insert(pos, node));
        });
        return true;
      },
    },
  });

  return editor;
}
