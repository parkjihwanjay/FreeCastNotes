/** Strip YAML frontmatter from markdown content */
function stripFrontmatter(content: string): string {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return content;
  }
  const end = content.indexOf("\n---", 3);
  if (end === -1) return content;
  const afterEnd = content.indexOf("\n", end + 1);
  return afterEnd !== -1 ? content.slice(afterEnd + 1).replace(/^\n+/, "") : "";
}

/**
 * Extract the title from either:
 * - Vault Markdown content (starts with "---" frontmatter or plain markdown)
 * - Legacy TipTap JSON (starts with "{")
 */
export function extractTitle(content: string): string {
  if (!content) return "Untitled";

  // Legacy TipTap JSON path
  if (content.trimStart().startsWith("{")) {
    try {
      const json = JSON.parse(content) as TipTapNode;
      const headingNode = findFirstHeading(json);
      if (headingNode) {
        const text = extractText(headingNode).trim();
        if (text) return text;
      }
      const fallback = findFirstText(json);
      return fallback?.trim() || "Untitled";
    } catch {
      return "Untitled";
    }
  }

  // Markdown path (vault mode)
  const body = stripFrontmatter(content);
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Strip heading markers and return
    return trimmed.replace(/^#+\s+/, "");
  }
  return "Untitled";
}

/** Count characters from either vault Markdown or legacy TipTap JSON content */
export function countCharacters(content: string): number {
  if (!content) return 0;

  // Legacy TipTap JSON path
  if (content.trimStart().startsWith("{")) {
    try {
      const json = JSON.parse(content) as TipTapNode;
      return extractText(json).length;
    } catch {
      return 0;
    }
  }

  // Markdown path (vault mode)
  const body = stripFrontmatter(content);
  // Strip common markdown syntax to get a character count closer to plain text
  const text = body
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, "").trim())
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s*/gm, "");
  return text.trim().length;
}

interface TipTapNode {
  type?: string;
  text?: string;
  attrs?: {
    level?: number;
  };
  content?: TipTapNode[];
}

function findFirstHeading(node: TipTapNode): TipTapNode | null {
  const level = Number(node.attrs?.level);
  if (node.type === "heading" && (level === 1 || level === 2 || level === 3)) {
    return node;
  }
  if (!Array.isArray(node.content)) return null;
  for (const child of node.content) {
    const found = findFirstHeading(child);
    if (found) return found;
  }
  return null;
}

function findFirstText(node: TipTapNode): string | null {
  if (typeof node.text === "string" && node.text.trim()) return node.text;
  if (!Array.isArray(node.content)) return null;
  for (const child of node.content) {
    const found = findFirstText(child);
    if (found) return found;
  }
  return null;
}

function extractText(node: TipTapNode): string {
  const ownText = typeof node.text === "string" ? node.text : "";
  if (!Array.isArray(node.content)) return ownText;
  return ownText + node.content.map((child) => extractText(child)).join("");
}

/** Format a relative time string from an ISO date */
export function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 30)}mo ago`;
}
