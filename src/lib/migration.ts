/**
 * One-shot migration: localStorage blob → vault .md files.
 * Runs once on first launch after vault mode is introduced.
 * Non-destructive: old localStorage data is preserved but ignored.
 */

import type { Note } from "../types/index";
import { bridge } from "./bridge";
import { jsonToMarkdown, type TipTapNode } from "./export";

const STORAGE_KEY = "freecastnotes.data.v1";
const MIGRATION_KEY = "freecastnotes.migrated.v1";

export async function runMigrationIfNeeded(): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MIGRATION_KEY, "1");
    return;
  }

  try {
    const parsed = JSON.parse(raw) as { notes?: unknown[] };

    if (!Array.isArray(parsed.notes) || parsed.notes.length === 0) {
      localStorage.setItem(MIGRATION_KEY, "1");
      return;
    }

    console.log(
      `[FreeCastNotes] Migrating ${parsed.notes.length} notes to vault...`,
    );

    for (const rawNote of parsed.notes) {
      try {
        await migrateNote(rawNote as Partial<Note>);
      } catch (e) {
        console.warn("[FreeCastNotes] Skipped note during migration:", e);
      }
    }

    localStorage.setItem(MIGRATION_KEY, "1");
    console.log("[FreeCastNotes] Migration complete.");
  } catch (e) {
    console.error("[FreeCastNotes] Migration failed:", e);
    // Don't set flag — allow retry on next startup
  }
}

async function migrateNote(rawNote: Partial<Note>): Promise<void> {
  if (!rawNote.id) return;

  let mdBody = "";

  if (rawNote.content) {
    if (rawNote.content.trimStart().startsWith("{")) {
      try {
        const doc = JSON.parse(rawNote.content) as TipTapNode;
        mdBody = jsonToMarkdown(doc);
      } catch {
        mdBody = rawNote.content;
      }
    } else {
      // Already markdown
      mdBody = rawNote.content;
    }
  }

  const note: Note = {
    id: rawNote.id,
    content: mdBody,
    created_at: rawNote.created_at ?? new Date().toISOString(),
    updated_at: rawNote.updated_at ?? new Date().toISOString(),
    last_opened_at: rawNote.last_opened_at,
    is_pinned: rawNote.is_pinned ?? 0,
    pin_order: rawNote.pin_order ?? -1,
    tags: rawNote.tags ?? [],
  };

  const filename = buildFilename(mdBody, note.id);
  const fileContent = buildFileContent(note, mdBody);

  // During migration, base64 images stay inline (no extraction)
  // They'll be extracted on first edit/save in vault mode
  await bridge.vaultWriteNote(filename, fileContent, []);
}

function buildFilename(body: string, id: string): string {
  for (const line of body.split("\n")) {
    const cleaned = line.replace(/^#+\s+/, "").trim();
    if (cleaned) {
      const slug =
        cleaned
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 50) || "untitled";
      return `${slug}-${id.slice(0, 8)}.md`;
    }
  }
  return `untitled-${id.slice(0, 8)}.md`;
}

function buildFileContent(note: Note, body: string): string {
  const lines = [
    "---",
    `id: ${note.id}`,
    `created_at: ${note.created_at}`,
    `updated_at: ${note.updated_at}`,
  ];
  if (note.last_opened_at) lines.push(`last_opened_at: ${note.last_opened_at}`);
  if (note.tags && note.tags.length > 0)
    lines.push(`tags: [${note.tags.join(", ")}]`);
  if (note.is_pinned) {
    lines.push("pinned: true");
    if (note.pin_order >= 0) lines.push(`pin_order: ${note.pin_order}`);
  }
  lines.push("---", "", "");
  return lines.join("\n") + body;
}
