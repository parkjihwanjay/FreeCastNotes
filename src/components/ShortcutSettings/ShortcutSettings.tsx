import { useEffect, useMemo, useState } from "react";

interface ShortcutSettingsProps {
  open: boolean;
  currentShortcut: string;
  onClose: () => void;
  onSave: (shortcut: string) => Promise<void>;
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

export default function ShortcutSettings({
  open,
  currentShortcut,
  onClose,
  onSave,
}: ShortcutSettingsProps) {
  const [value, setValue] = useState(currentShortcut);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(currentShortcut);
    setRecording(false);
    setSaving(false);
    setError(null);
  }, [open, currentShortcut]);

  useEffect(() => {
    if (!open || !recording) return;

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
      setValue(captured);
      setRecording(false);
      setError(null);
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open, recording]);

  const prettyValue = useMemo(() => formatShortcut(value), [value]);

  if (!open) return null;

  const handleSave = async () => {
    if (!hasModifier(value)) {
      setError("Use at least one modifier key (Cmd/Ctrl, Shift or Alt).");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(value);
      onClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not update global shortcut";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] flex items-start justify-center bg-black/40 pt-24"
      onClick={onClose}
    >
      <div
        className="animate-panel-in w-[420px] overflow-hidden rounded-xl border border-white/12 bg-[#2C2C2E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/8 px-4 py-3">
          <h3 className="text-sm font-semibold text-[#E5E5E7]">
            Set Global Shortcut
          </h3>
          <p className="mt-1 text-xs text-[#E5E5E7]/45">
            This shortcut toggles the main notes window.
          </p>
        </div>

        <div className="space-y-3 px-4 py-4">
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
            <p className="mt-1 font-mono text-sm text-[#E5E5E7]">{prettyValue}</p>
          </div>

          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/8 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs text-[#E5E5E7]/65 transition-colors hover:bg-white/8 hover:text-[#E5E5E7]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-[#FF5F5A]/22 px-3 py-1.5 text-xs text-[#E5E5E7] transition-colors hover:bg-[#FF5F5A]/32 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
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
    "Backquote",
    "Backslash",
    "BracketLeft",
    "BracketRight",
    "Comma",
    "Equal",
    "Minus",
    "Period",
    "Quote",
    "Semicolon",
    "Slash",
    "Space",
    "Tab",
    "Enter",
    "Escape",
    "Backspace",
    "Delete",
    "Home",
    "End",
    "PageUp",
    "PageDown",
    "Insert",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
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
