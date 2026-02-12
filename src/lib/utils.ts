/** Extract the title (first H1/H2/H3 heading, fallback to first text) from a TipTap JSON content string */
export function extractTitle(content: string): string {
  if (!content) return "Untitled";

  try {
    const json = JSON.parse(content) as TipTapNode;
    const headingNode = findFirstHeading(json);
    if (headingNode) {
      const headingText = extractText(headingNode).trim();
      if (headingText) return headingText;
    }

    const fallbackText = findFirstText(json);
    return fallbackText?.trim() || "Untitled";
  } catch {
    return "Untitled";
  }
}

/** Count characters from a TipTap JSON content string */
export function countCharacters(content: string): number {
  if (!content) return 0;

  try {
    const json = JSON.parse(content) as TipTapNode;
    return extractText(json).length;
  } catch {
    return 0;
  }
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
