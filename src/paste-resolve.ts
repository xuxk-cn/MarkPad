import { normalizeDocText } from "./viewport-overlay";

/** 剪贴板是否更像 Markdown 源码（优先保留 text/plain） */
export function looksLikeMarkdown(text: string): boolean {
  if (!text.trim()) return false;
  return /(^|\n)\s{0,3}#{1,6}\s|(^|\n)\s{0,3}[-*+]\s|(^|\n)\s{0,3}\d+\.\s|(^|\n)>\s|```[\s\S]*?```|(\*\*|__).+?(\*\*|__)|\[[^\]]+\]\([^)]+\)|\|.+\|/m.test(
    text,
  );
}

export type PastePayload = {
  plain?: string;
  html?: string;
  markdown?: string;
};

/** 根据剪贴板各 MIME 内容选择最终粘贴文本 */
export function resolvePastePayload(payload: PastePayload): string {
  const plain = payload.plain ?? "";
  const markdown = payload.markdown ?? "";
  const html = payload.html ?? "";

  if (markdown.trim()) return normalizeDocText(markdown);
  if (plain.trim() && looksLikeMarkdown(plain)) return normalizeDocText(plain);
  if (html.trim()) {
    const fromHtml = htmlToMarkdown(html);
    if (!plain.trim()) return fromHtml;
    if (!looksLikeMarkdown(plain) && fromHtml.trim()) return fromHtml;
  }
  return normalizeDocText(plain);
}

/** 从 DataTransfer（paste 事件）解析应插入的文本 */
export function resolvePasteFromDataTransfer(data: DataTransfer): string {
  return resolvePastePayload({
    plain: data.getData("text/plain"),
    markdown: data.getData("text/markdown") || data.getData("text/x-markdown"),
    html: data.getData("text/html"),
  });
}

/** 从 Clipboard API（右键粘贴）解析应插入的文本 */
export async function resolvePasteFromNavigatorClipboard(): Promise<string> {
  if (!navigator.clipboard?.read) {
    try {
      return normalizeDocText(await navigator.clipboard.readText());
    } catch {
      return "";
    }
  }

  try {
    const items = await navigator.clipboard.read();
    let plain = "";
    let markdown = "";
    let html = "";

    for (const item of items) {
      if (!plain && item.types.includes("text/plain")) {
        plain = await item.getType("text/plain").then((b) => b.text());
      }
      for (const t of ["text/markdown", "text/x-markdown"] as const) {
        if (!markdown && item.types.includes(t)) {
          markdown = await item.getType(t).then((b) => b.text());
        }
      }
      if (!html && item.types.includes("text/html")) {
        html = await item.getType("text/html").then((b) => b.text());
      }
    }

    return resolvePastePayload({ plain, html, markdown });
  } catch {
    try {
      return normalizeDocText(await navigator.clipboard.readText());
    } catch {
      return "";
    }
  }
}

/** 将常见 HTML 片段转为 Markdown（用于富文本剪贴板） */
export function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("script, style, meta, link").forEach((n) => n.remove());
  const md = convertChildren(doc.body, "").trim();
  return normalizeDocText(md.replace(/\n{3,}/g, "\n\n"));
}

function convertChildren(parent: Node, prefix: string): string {
  let out = prefix;
  for (const node of Array.from(parent.childNodes)) {
    out += convertNode(node);
  }
  return out;
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\u00a0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const inner = () => convertChildren(el, "").trim();

  switch (tag) {
    case "h1":
      return `\n\n# ${inner()}\n\n`;
    case "h2":
      return `\n\n## ${inner()}\n\n`;
    case "h3":
      return `\n\n### ${inner()}\n\n`;
    case "h4":
      return `\n\n#### ${inner()}\n\n`;
    case "h5":
      return `\n\n##### ${inner()}\n\n`;
    case "h6":
      return `\n\n###### ${inner()}\n\n`;
    case "p":
    case "div":
    case "section":
    case "article": {
      const t = inner();
      return t ? `\n\n${t}\n\n` : "";
    }
    case "br":
      return "\n";
    case "strong":
    case "b":
      return wrapInline(inner(), "**");
    case "em":
    case "i":
      return wrapInline(inner(), "*");
    case "del":
    case "s":
    case "strike":
      return wrapInline(inner(), "~~");
    case "code":
      return el.parentElement?.tagName.toLowerCase() === "pre" ? inner() : wrapInline(inner(), "`");
    case "pre": {
      const code = el.querySelector("code");
      const body = (code?.textContent ?? inner()).replace(/\n$/, "");
      return `\n\n\`\`\`\n${body}\n\`\`\`\n\n`;
    }
    case "blockquote": {
      const lines = inner().split("\n").filter((l) => l.length > 0);
      return `\n\n${lines.map((l) => `> ${l}`).join("\n")}\n\n`;
    }
    case "ul":
      return listMarkdown(el, false);
    case "ol":
      return listMarkdown(el, true);
    case "li": {
      return inner();
    }
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const label = inner() || href;
      if (!href || href === label) return label;
      return `[${label}](${href})`;
    }
    case "hr":
      return "\n\n---\n\n";
    case "table":
      return tableMarkdown(el);
    case "img": {
      const alt = el.getAttribute("alt") ?? "";
      const src = el.getAttribute("src") ?? "";
      return src ? `![${alt}](${src})` : "";
    }
    case "span":
    case "font":
      return inner();
    default:
      return convertChildren(el, "");
  }
}

function wrapInline(text: string, marker: string): string {
  if (!text) return "";
  if (/\s/.test(text)) return `${marker}${text}${marker}`;
  return `${marker}${text}${marker}`;
}

function listMarkdown(list: HTMLElement, ordered: boolean): string {
  const items = Array.from(list.children).filter((c) => c.tagName.toLowerCase() === "li");
  if (items.length === 0) return "";
  const lines = items.map((li, i) => {
    const prefix = ordered ? `${i + 1}. ` : "- ";
    const text = convertChildren(li, "").trim().replace(/\n+/g, " ");
    return `${prefix}${text}`;
  });
  return `\n\n${lines.join("\n")}\n\n`;
}

function tableMarkdown(table: HTMLElement): string {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length === 0) return "";

  const lines: string[] = [];
  rows.forEach((tr, rowIdx) => {
    const cells = Array.from(tr.querySelectorAll("th, td")).map((c) =>
      convertChildren(c, "").trim().replace(/\|/g, "\\|").replace(/\n/g, " "),
    );
    if (cells.length === 0) return;
    lines.push(`| ${cells.join(" | ")} |`);
    if (rowIdx === 0) {
      lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
    }
  });
  return lines.length ? `\n\n${lines.join("\n")}\n\n` : "";
}
