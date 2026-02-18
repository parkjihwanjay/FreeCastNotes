import { useEffect, useMemo, useState } from "react";
import type { SortOrder } from "../../types/index";
import { useAppStore } from "../../stores/appStore";
import { bridge } from "../../lib/bridge";

interface PreferencesPanelProps {
  open: boolean;
  currentShortcut: string;
  onClose: () => void;
  onSaveShortcut: (shortcut: string) => Promise<void>;
  /** When true, rendered in the standalone Preferences window (no overlay, close = hide window) */
  standalone?: boolean;
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

export default function PreferencesPanel({
  open,
  currentShortcut,
  onClose,
  onSaveShortcut,
  standalone = false,
}: PreferencesPanelProps) {
  const { layoutMode, setLayoutMode, sortOrder, setSortOrder, notes } = useAppStore();
  const [shortcutValue, setShortcutValue] = useState(currentShortcut);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultFolder, setVaultFolder] = useState("~/Documents/FreeCastNotes");
  const [movingVault, setMovingVault] = useState(false);

  useEffect(() => {
    if (!open && !standalone) return;
    setShortcutValue(currentShortcut);
    setRecording(false);
    setSaving(false);
    setError(null);
    bridge.vaultGetFolder().then(setVaultFolder).catch(() => {});
  }, [open, currentShortcut, standalone]);

  useEffect(() => {
    if ((!open && !standalone) || !recording) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setRecording(false);
        return;
      }
      if (MODIFIER_KEYS.has(e.key)) {
        e.preventDefault();
        return;
      }
      const captured = toShortcutString(e);
      if (!captured) return;
      e.preventDefault();
      setShortcutValue(captured);
      setRecording(false);
      setError(null);
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, standalone, recording]);

  const prettyShortcut = useMemo(
    () => formatShortcut(shortcutValue),
    [shortcutValue],
  );

  const handleChangeVaultFolder = async () => {
    try {
      setMovingVault(true);
      const newPath = await bridge.vaultSetFolder();
      if (newPath) {
        setVaultFolder(newPath);
      }
    } finally {
      setMovingVault(false);
    }
  };

  if (!open && !standalone) return null;

  // Standalone: Escape closes the Preferences window
  useEffect(() => {
    if (!standalone) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [standalone, onClose]);

  const handleSaveShortcut = async () => {
    if (!hasModifier(shortcutValue)) {
      setError("Use at least one modifier key (Cmd/Ctrl, Shift or Alt).");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSaveShortcut(shortcutValue);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not update global shortcut",
      );
    } finally {
      setSaving(false);
    }
  };

  const panelContent = (
    <div
      className={
        standalone
          ? "w-[400px] overflow-y-auto rounded-xl border border-white/12 bg-[#2C2C2E] shadow-2xl"
          : "animate-panel-in w-[400px] overflow-hidden rounded-xl border border-white/12 bg-[#2C2C2E] shadow-2xl"
      }
      onClick={standalone ? undefined : (e) => e.stopPropagation()}
    >
        {/* Header */}
        <div className="border-b border-white/8 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#E5E5E7]">Preferences</h3>
        </div>

        <div className="divide-y divide-white/8">
          {/* Vault Folder section */}
          <div className="space-y-2 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-[#E5E5E7]/40">
              Vault Folder
            </p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-mono text-[11px] text-[#E5E5E7]/75">
                  {vaultFolder.replace(/^\/Users\/[^/]+/, "~")}
                </p>
                <p className="text-[11px] text-[#E5E5E7]/35">
                  {notes.length} {notes.length === 1 ? "note" : "notes"}
                </p>
              </div>
              <button
                onClick={handleChangeVaultFolder}
                disabled={movingVault}
                className="shrink-0 rounded-md px-2.5 py-1 text-[11px] text-[#E5E5E7]/65 transition-colors hover:bg-white/8 hover:text-[#E5E5E7] disabled:opacity-50"
              >
                {movingVault ? "Moving…" : "Change Location…"}
              </button>
            </div>
          </div>

          {/* Layout section */}
          <div className="space-y-2 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-[#E5E5E7]/40">
              Layout
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLayoutMode("single")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  layoutMode === "single"
                    ? "border-[#FF5F5A]/60 bg-[#FF5F5A]/12 text-[#E5E5E7]"
                    : "border-white/10 bg-white/5 text-[#E5E5E7]/70 hover:bg-white/8"
                }`}
              >
                <span className="block text-xs font-medium">Single</span>
                <span className="block text-[11px] text-[#E5E5E7]/40">
                  Editor only
                </span>
              </button>
              <button
                onClick={() => setLayoutMode("split")}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  layoutMode === "split"
                    ? "border-[#FF5F5A]/60 bg-[#FF5F5A]/12 text-[#E5E5E7]"
                    : "border-white/10 bg-white/5 text-[#E5E5E7]/70 hover:bg-white/8"
                }`}
              >
                <span className="block text-xs font-medium">Split</span>
                <span className="block text-[11px] text-[#E5E5E7]/40">
                  List + Editor
                </span>
              </button>
            </div>
          </div>

          {/* Sort section */}
          <div className="space-y-2 px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-[#E5E5E7]/40">
              Sort Notes By
            </p>
            <div className="flex flex-col gap-1">
              {(
                [
                  { value: "modified", label: "Last Modified", desc: "Most recently edited first" },
                  { value: "opened",   label: "Last Opened",   desc: "Most recently viewed first" },
                  { value: "title",    label: "Title",         desc: "Alphabetical A → Z" },
                ] as { value: SortOrder; label: string; desc: string }[]
              ).map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setSortOrder(value)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    sortOrder === value
                      ? "border-[#FF5F5A]/60 bg-[#FF5F5A]/12 text-[#E5E5E7]"
                      : "border-white/10 bg-white/5 text-[#E5E5E7]/70 hover:bg-white/8"
                  }`}
                >
                  <span
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                      sortOrder === value
                        ? "border-[#FF5F5A] bg-[#FF5F5A]"
                        : "border-white/30"
                    }`}
                  />
                  <span>
                    <span className="block text-xs font-medium">{label}</span>
                    <span className="block text-[11px] text-[#E5E5E7]/40">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Global Shortcut section */}
          <div className="space-y-3 px-4 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#E5E5E7]/40">
                Global Shortcut
              </p>
              <p className="mt-1 text-xs text-[#E5E5E7]/45">
                Toggles the notes window from anywhere.
              </p>
            </div>
            <button
              onClick={() => setRecording((v) => !v)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                recording
                  ? "border-[#FF5F5A] bg-[#FF5F5A]/12 text-[#E5E5E7]"
                  : "border-white/10 bg-white/5 text-[#E5E5E7]/80 hover:bg-white/8"
              }`}
            >
              {recording
                ? "Recording... press your shortcut"
                : "Record shortcut"}
            </button>
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-[#E5E5E7]/35">
                Current
              </p>
              <p className="mt-1 font-mono text-sm text-[#E5E5E7]">
                {prettyShortcut}
              </p>
            </div>
            {error && <p className="text-xs text-red-300">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-[#E5E5E7]/65 transition-colors hover:bg-white/8 hover:text-[#E5E5E7]"
          >
            Done
          </button>
          <button
            onClick={handleSaveShortcut}
            disabled={saving}
            className="rounded-md bg-[#FF5F5A]/22 px-3 py-1.5 text-xs text-[#E5E5E7] transition-colors hover:bg-[#FF5F5A]/32 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Shortcut"}
          </button>
        </div>
      </div>
  );

  if (standalone) {
    return panelContent;
  }

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] flex items-start justify-center bg-black/40 pt-16"
      onClick={onClose}
    >
      {panelContent}
    </div>
  );
}

function hasModifier(shortcut: string): boolean {
  const parts = shortcut.split("+");
  return parts.some((p) =>
    ["CMDORCTRL", "CMD", "COMMAND", "CTRL", "SHIFT", "ALT", "OPTION"].includes(
      p.toUpperCase(),
    ),
  );
}

function toShortcutString(e: KeyboardEvent): string | null {
  const key = keyTokenFromEvent(e);
  if (!key) return null;
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push("CmdOrCtrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  parts.push(key);
  return parts.join("+");
}

function keyTokenFromEvent(e: KeyboardEvent): string | null {
  const code = e.code;
  if (!code) return null;
  if (code.startsWith("Key")) return code;
  if (code.startsWith("Digit")) return code;
  if (/^F\d{1,2}$/.test(code)) return code;
  if (code.startsWith("Numpad")) return code;
  const accepted = new Set([
    "Backquote", "Backslash", "BracketLeft", "BracketRight", "Comma",
    "Equal", "Minus", "Period", "Quote", "Semicolon", "Slash", "Space",
    "Tab", "Enter", "Escape", "Backspace", "Delete", "Home", "End",
    "PageUp", "PageDown", "Insert", "ArrowUp", "ArrowDown", "ArrowLeft",
    "ArrowRight",
  ]);
  return accepted.has(code) ? code : null;
}

function formatShortcut(shortcut: string): string {
  return shortcut
    .split("+")
    .map((token) => {
      const t = token.trim();
      const u = t.toUpperCase();
      if (u === "CMDORCTRL" || u === "CMD" || u === "COMMAND") return "⌘";
      if (u === "SHIFT") return "⇧";
      if (u === "ALT" || u === "OPTION") return "⌥";
      if (u.startsWith("KEY") && t.length === 4) return t.slice(3).toUpperCase();
      if (u.startsWith("DIGIT") && t.length === 6) return t.slice(5);
      if (u === "ARROWUP") return "↑";
      if (u === "ARROWDOWN") return "↓";
      if (u === "ARROWLEFT") return "←";
      if (u === "ARROWRIGHT") return "→";
      return t;
    })
    .join(" ");
}
