import type { Note } from "../types";
import { bridge } from "./bridge";
import { extractTitle } from "./utils";
import { jsonToMarkdown, type TipTapNode } from "./export";

export interface BatchFile {
  path: string;
  content: string;
  encoding?: "utf8" | "base64";
}

/** Export every note as a .md file into a user-chosen folder. */
export async function exportAllNotes(notes: Note[]): Promise<boolean> {
  const files: BatchFile[] = [];

  for (const note of notes) {
    const { mdContent, attachments } = noteToExportFiles(note);
    files.push({ path: noteFilename(note), content: mdContent });
    files.push(...attachments);
  }

  const result = await bridge.exportBatch(files);
  return result.success;
}

// --- Helpers ---

function noteFilename(note: Note): string {
  const title = extractTitle(note.content);
  const slug = title
    ? title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50)
    : "untitled";
  const shortId = note.id.slice(0, 8);
  return `${slug}-${shortId}.md`;
}

function noteToExportFiles(note: Note): {
  mdContent: string;
  attachments: BatchFile[];
} {
  let doc: TipTapNode;
  try {
    doc = JSON.parse(note.content || "{}") as TipTapNode;
  } catch {
    doc = { type: "doc", content: [] };
  }

  const attachments: BatchFile[] = [];
  const shortId = note.id.slice(0, 8);
  let imageIndex = 0;

  // Walk the doc, extract base64 images → attachments/, replace src with relative path
  function processNode(node: TipTapNode): TipTapNode {
    if (
      node.type === "image" &&
      typeof node.attrs?.src === "string" &&
      (node.attrs.src as string).startsWith("data:")
    ) {
      const src = node.attrs.src as string;
      const match = src.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === "jpeg" ? "jpg" : match[1];
        const base64 = match[2];
        const relPath = `attachments/${shortId}-${imageIndex++}.${ext}`;
        attachments.push({ path: relPath, content: base64, encoding: "base64" });
        return { ...node, attrs: { ...node.attrs, src: relPath } };
      }
    }
    if (node.content) {
      return { ...node, content: node.content.map(processNode) };
    }
    return node;
  }

  const processedDoc = processNode(doc);
  const md = jsonToMarkdown(processedDoc);
  const mdContent = buildFrontmatter(note) + md;

  return { mdContent, attachments };
}

function buildFrontmatter(note: Note): string {
  const lines = [
    "---",
    `id: ${note.id}`,
    `created_at: ${note.created_at}`,
    `updated_at: ${note.updated_at}`,
  ];
  if (note.tags.length) lines.push(`tags: [${note.tags.join(", ")}]`);
  if (note.is_pinned) lines.push("pinned: true");
  lines.push("---", "", "");
  return lines.join("\n");
}
