import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../../stores/appStore";
import NotesSidebar from "../NotesSidebar/NotesSidebar";

interface SplitLayoutProps {
  children: React.ReactNode;
}

export default function SplitLayout({ children }: SplitLayoutProps) {
  const { splitPanelWidth, setSplitPanelWidth } = useAppStore();
  const [localWidth, setLocalWidth] = useState(splitPanelWidth);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(splitPanelWidth);
  const currentWidthRef = useRef(splitPanelWidth);

  // Sync from store when changed externally
  useEffect(() => {
    setLocalWidth(splitPanelWidth);
    currentWidthRef.current = splitPanelWidth;
  }, [splitPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - startX.current;
      const next = Math.min(500, Math.max(200, startWidth.current + delta));
      currentWidthRef.current = next;
      setLocalWidth(next);
    };

    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setSplitPanelWidth(currentWidthRef.current);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setSplitPanelWidth]);

  const handleDragStart = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = localWidth;
    e.preventDefault();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        style={{ width: localWidth, minWidth: 200, maxWidth: 500 }}
        className="shrink-0"
      >
        <NotesSidebar />
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="w-1 shrink-0 cursor-col-resize bg-white/6 transition-colors hover:bg-white/18 select-none"
      />

      {/* Editor area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
