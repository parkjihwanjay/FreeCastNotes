/**
 * Convert Markdown text to HTML that TipTap can parse via editor.commands.setContent().
 */
export function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing ```
      html.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
      continue;
    }

    // Blank line — skip
    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      html.push("<hr>");
      i++;
      continue;
    }

    // HTML image tag: <img src="..." alt="..." width="...">
    const htmlImgMatch = line.match(/^<img\s+src="([^"]+)"\s+alt="([^"]*)"(?:\s+width="(\d+)")?\s*>$/);
    if (htmlImgMatch) {
      const src = htmlImgMatch[1];
      const alt = htmlImgMatch[2];
      const width = htmlImgMatch[3];
      const widthAttr = width ? ` width="${width}"` : "";
      html.push(`<img src="${src}" alt="${alt}"${widthAttr}>`);
      i++;
      continue;
    }

    // Standalone image line: ![alt](src)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      html.push(`<img src="${imgMatch[2]}" alt="${imgMatch[1]}">`);
      i++;
      continue;
    }

    // Task list (must check before regular unordered list)
    if (/^[-*]\s+\[[ xX]\]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const tm = lines[i].match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
        if (!tm) break;
        const checked = tm[1] !== " ";
        items.push(
          `<li data-type="taskItem" data-checked="${checked}"><p>${parseInline(tm[2])}</p></li>`,
        );
        i++;
      }
      html.push(`<ul data-type="taskList">${items.join("")}</ul>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(
          `<li><p>${parseInline(lines[i].replace(/^[-*]\s+/, ""))}</p></li>`,
        );
        i++;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(
          `<li><p>${parseInline(lines[i].replace(/^\d+\.\s+/, ""))}</p></li>`,
        );
        i++;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html.push(
        `<blockquote><p>${parseInline(quoteLines.join(" "))}</p></blockquote>`,
      );
      continue;
    }

    // Paragraph (default)
    html.push(`<p>${parseInline(line)}</p>`);
    i++;
  }

  return html.join("");
}

function parseInline(text: string): string {
  // Extract inline code first to protect it from other transformations
  const codes: string[] = [];
  let result = text.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(code);
    return `\x00CODE${codes.length - 1}\x00`;
  });

  // Images: ![alt](src) — must come before links
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1">',
  );

  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>',
  );

  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");

  // Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, "<s>$1</s>");

  // Restore inline code (escaped)
  result = result.replace(/\x00CODE(\d+)\x00/g, (_, idx: string) => {
    return `<code>${escapeHtml(codes[parseInt(idx)])}</code>`;
  });

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
