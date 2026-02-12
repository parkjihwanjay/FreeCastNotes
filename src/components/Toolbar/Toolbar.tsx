import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

interface ToolbarProps {
  title?: string;
  onBrowse?: () => void;
  onNewNote?: () => void;
  onActionPanel?: () => void;
}

export default function Toolbar({ title = "Untitled", onBrowse, onNewNote, onActionPanel }: ToolbarProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      data-tauri-drag-region
      className="flex h-12 shrink-0 items-center justify-between px-3"
      style={{ backgroundColor: "#2C2C2E" }}
    >
      {/* Traffic Lights */}
      <div
        className="flex items-center gap-2"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <TrafficLight
          color="#FF5F57"
          hoverIcon="×"
          hovering={hovering}
          onClick={() => appWindow.hide()}
        />
        <TrafficLight
          color="#FEBC2E"
          hoverIcon="−"
          hovering={hovering}
          onClick={() => appWindow.minimize()}
        />
        <TrafficLight
          color="#28C840"
          hoverIcon="+"
          hovering={hovering}
          onClick={() => {
            /* fullscreen — no-op for now */
          }}
        />
      </div>

      {/* Title */}
      <span
        data-tauri-drag-region
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium text-[#E5E5E7]/70"
      >
        {title}
      </span>

      {/* Right buttons */}
      <div className="flex items-center gap-1">
        <ToolbarButton label="⌘K" onClick={() => onActionPanel?.()} title="Action Panel" />
        <ToolbarButton label="☰" onClick={() => onBrowse?.()} title="Browse Notes" />
        <ToolbarButton label="+" onClick={() => onNewNote?.()} title="New Note" />
      </div>
    </div>
  );
}

function TrafficLight({
  color,
  hoverIcon,
  hovering,
  onClick,
}: {
  color: string;
  hoverIcon: string;
  hovering: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-3 w-3 items-center justify-center rounded-full text-[8px] leading-none text-black/60 transition-opacity hover:brightness-110"
      style={{ backgroundColor: color }}
    >
      {hovering ? hoverIcon : ""}
    </button>
  );
}

function ToolbarButton({
  label,
  onClick,
  title,
}: {
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-[34px] items-center rounded-md px-2.5 text-[14px] text-[#E5E5E7]/65 transition-colors hover:bg-white/10 hover:text-[#E5E5E7]"
    >
      {label}
    </button>
  );
}
