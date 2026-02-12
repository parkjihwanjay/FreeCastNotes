import { useState, type ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

interface ToolbarProps {
  title?: string;
  chromeActive?: boolean;
  onBrowse?: () => void;
  onNewNote?: () => void;
  onActionPanel?: () => void;
}

export default function Toolbar({
  title = "Untitled",
  chromeActive = true,
  onBrowse,
  onNewNote,
  onActionPanel,
}: ToolbarProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      data-tauri-drag-region
      className={`relative flex h-12 shrink-0 items-center justify-between border-b border-white/7 bg-[#2B2C30]/95 px-3 transition-opacity duration-180 ${
        chromeActive ? "opacity-100" : "opacity-38"
      }`}
    >
      {/* Traffic Lights */}
      <div
        className="relative z-10 flex items-center gap-2"
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
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-[0.01em] text-[#E5E5E7]/58"
      >
        {title}
      </span>

      {/* Right buttons */}
      <div className="relative z-10 flex items-center gap-0.5">
        <ToolbarButton
          icon={<CommandIcon />}
          onClick={() => onActionPanel?.()}
          title="Action Panel (⌘K)"
        />
        <ToolbarButton
          icon={<BrowseIcon />}
          onClick={() => onBrowse?.()}
          title="Browse Notes (⌘P)"
        />
        <ToolbarButton
          icon={<PlusIcon />}
          onClick={() => onNewNote?.()}
          title="New Note (⌘N)"
        />
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
      type="button"
      onClick={onClick}
      className="flex h-3 w-3 items-center justify-center rounded-full text-[8px] leading-none text-black/60 transition-opacity hover:brightness-110"
      style={{ backgroundColor: color }}
    >
      {hovering ? hoverIcon : ""}
    </button>
  );
}

function ToolbarButton({
  icon,
  onClick,
  title,
}: {
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[#D6D7DA]/72 transition-all hover:bg-white/10 hover:text-[#F1F1F3]"
    >
      {icon}
    </button>
  );
}

function CommandIcon() {
  return (
    <span className="text-[16px] leading-none font-medium">⌘</span>
  );
}

function BrowseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3.2" width="14" height="13.6" rx="2.5" />
      <path d="M6.5 7h7" />
      <path d="M6.5 10h7" />
      <path d="M6.5 13h7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[16px] w-[16px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 4.5v11" />
      <path d="M4.5 10h11" />
    </svg>
  );
}
