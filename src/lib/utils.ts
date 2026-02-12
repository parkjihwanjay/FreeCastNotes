/** Extract the title (first line of text) from a TipTap JSON content string */
export function extractTitle(content: string): string {
  if (!content) return "Untitled";
  try {
    const json = JSON.parse(content);
    const firstNode = json?.content?.[0];
    const text = firstNode?.content?.[0]?.text;
    return text?.trim() || "Untitled";
  } catch {
    return "Untitled";
  }
}

/** Count characters from a TipTap JSON content string */
export function countCharacters(content: string): number {
  if (!content) return 0;
  try {
    const json = JSON.parse(content);
    return extractText(json).length;
  } catch {
    return 0;
  }
}

function extractText(node: Record<string, unknown>): string {
  if (node.text && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map((child: Record<string, unknown>) => extractText(child)).join("");
  }
  return "";
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
