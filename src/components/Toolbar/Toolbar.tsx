import { useState, type ReactNode } from "react";
import { bridge } from "../../lib/bridge";

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
      data-drag-region
      className={`relative flex h-12 shrink-0 items-center justify-between border-b border-white/7 bg-[#232323] px-3 transition-opacity duration-180 ${
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
          onClick={() => bridge.hideWindow()}
        />
        <TrafficLight
          color="#595A5F"
          hoverIcon="−"
          hovering={hovering}
          onClick={() => {}}
          disabled
        />
        <TrafficLight
          color="#595A5F"
          hoverIcon="+"
          hovering={hovering}
          onClick={() => {}}
          disabled
        />
      </div>

      {/* Title */}
      <span
        data-drag-region
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
  disabled = false,
}: {
  color: string;
  hoverIcon: string;
  hovering: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-3 w-3 items-center justify-center rounded-full text-[8px] leading-none text-black/60 transition-opacity ${
        disabled ? "cursor-default opacity-90" : "hover:brightness-110"
      }`}
      style={{ backgroundColor: color }}
    >
      {!disabled && hovering ? hoverIcon : ""}
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
