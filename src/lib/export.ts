import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { Editor } from "@tiptap/react";

/** Copy plain text to clipboard */
export async function copyAsPlainText(editor: Editor): Promise<void> {
  const text = editor.getText();
  await navigator.clipboard.writeText(text);
}

/** Copy HTML to clipboard */
export async function copyAsHTML(editor: Editor): Promise<void> {
  const html = editor.getHTML();
  await navigator.clipboard.writeText(html);
}

/** Copy Markdown to clipboard */
export async function copyAsMarkdown(editor: Editor): Promise<void> {
  const json = editor.getJSON();
  const md = jsonToMarkdown(json);
  await navigator.clipboard.writeText(md);
}

/** Export note to file via save dialog */
export async function exportToFile(
  editor: Editor,
  format: "md" | "html" | "txt",
): Promise<boolean> {
  let content: string;
  let extension: string;
  let filterName: string;

  switch (format) {
    case "md":
      content = jsonToMarkdown(editor.getJSON());
      extension = "md";
      filterName = "Markdown";
      break;
    case "html":
      content = editor.getHTML();
      extension = "html";
      filterName = "HTML";
      break;
    case "txt":
      content = editor.getText();
      extension = "txt";
      filterName = "Plain Text";
      break;
  }

  const filePath = await save({
    filters: [{ name: filterName, extensions: [extension] }],
    defaultPath: `note.${extension}`,
  });

  if (!filePath) return false;

  await writeTextFile(filePath, content);
  return true;
}

// --- TipTap JSON to Markdown converter ---

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
}

function jsonToMarkdown(doc: TipTapNode): string {
  if (!doc.content) return "";
  return doc.content.map((node) => nodeToMarkdown(node, 0)).join("\n");
}

function nodeToMarkdown(node: TipTapNode, depth: number): string {
  switch (node.type) {
    case "paragraph":
      return inlineContent(node) + "\n";

    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      const prefix = "#".repeat(level);
      return `${prefix} ${inlineContent(node)}\n`;
    }

    case "bulletList":
      return (
        (node.content || [])
          .map((item) => listItemToMarkdown(item, depth, "- "))
          .join("\n") + "\n"
      );

    case "orderedList":
      return (
        (node.content || [])
          .map((item, i) => listItemToMarkdown(item, depth, `${i + 1}. `))
          .join("\n") + "\n"
      );

    case "taskList":
      return (
        (node.content || [])
          .map((item) => {
            const checked = item.attrs?.checked ? "x" : " ";
            return listItemToMarkdown(item, depth, `- [${checked}] `);
          })
          .join("\n") + "\n"
      );

    case "codeBlock":
      return "```\n" + plainTextContent(node) + "\n```\n";

    case "blockquote":
      return (
        (node.content || [])
          .map((child) => "> " + nodeToMarkdown(child, depth).trimEnd())
          .join("\n") + "\n"
      );

    case "horizontalRule":
      return "---\n";

    default:
      return inlineContent(node) + "\n";
  }
}

function listItemToMarkdown(
  item: TipTapNode,
  depth: number,
  prefix: string,
): string {
  const indent = "  ".repeat(depth);
  const children = item.content || [];
  const lines: string[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child.type === "bulletList" ||
      child.type === "orderedList" ||
      child.type === "taskList"
    ) {
      lines.push(nodeToMarkdown(child, depth + 1).trimEnd());
    } else if (i === 0) {
      lines.push(`${indent}${prefix}${inlineContent(child)}`);
    } else {
      lines.push(`${indent}  ${inlineContent(child)}`);
    }
  }

  return lines.join("\n");
}

function inlineContent(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content.map(inlineNode).join("");
}

function inlineNode(node: TipTapNode): string {
  if (node.type === "hardBreak") return "\n";
  if (node.type !== "text" || !node.text) return "";

  let text = node.text;

  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case "bold":
          text = `**${text}**`;
          break;
        case "italic":
          text = `*${text}*`;
          break;
        case "strike":
          text = `~~${text}~~`;
          break;
        case "code":
          text = `\`${text}\``;
          break;
        case "link":
          text = `[${text}](${mark.attrs?.href || ""})`;
          break;
        case "underline":
          text = `<u>${text}</u>`;
          break;
      }
    }
  }

  return text;
}

function plainTextContent(node: TipTapNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(plainTextContent).join("");
}
