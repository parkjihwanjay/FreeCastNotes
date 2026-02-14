import { useCallback, useEffect, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import "./resizableImage.css";

const MIN_WIDTH = 100;

function ResizableImageView({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);

  const width = node.attrs.width as number | null;
  const src = node.attrs.src as string;
  const alt = (node.attrs.alt as string) || "";

  const onMouseDown = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(true);

      const startX = e.clientX;
      const startWidth = imgRef.current?.offsetWidth ?? 300;
      // For left-side handles, dragging left = wider
      const invertX = corner === "top-left" || corner === "bottom-left";

      const onMouseMove = (ev: MouseEvent) => {
        const deltaX = ev.clientX - startX;
        const newWidth = Math.max(
          MIN_WIDTH,
          invertX ? startWidth - deltaX : startWidth + deltaX,
        );
        updateAttributes({ width: newWidth });
      };

      const onMouseUp = () => {
        setResizing(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [updateAttributes],
  );

  // Prevent drag ghost while resizing
  useEffect(() => {
    if (!resizing) return;
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragstart", prevent);
    return () => window.removeEventListener("dragstart", prevent);
  }, [resizing]);

  const handles = ["top-left", "top-right", "bottom-left", "bottom-right"];

  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-drag-handle>
      <div
        className={`resizable-image-container${selected ? " selected" : ""}`}
        style={{ width: width ? `${width}px` : undefined }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="resizable-image"
          draggable={false}
        />
        {selected &&
          handles.map((corner) => (
            <div
              key={corner}
              className={`resize-handle resize-handle-${corner}`}
              onMouseDown={(e) => onMouseDown(e, corner)}
            />
          ))}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width");
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
