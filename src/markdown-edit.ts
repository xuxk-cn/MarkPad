import { t, getLocale } from "./i18n";

export function getSelectedPlainText(source: HTMLElement): string {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return "";
  const range = sel.getRangeAt(0);
  if (!source.contains(range.commonAncestorContainer)) return "";
  return range.toString();
}

export function replaceSelection(source: HTMLElement, text: string): void {
  source.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    document.execCommand("insertText", false, text);
    source.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  const range = sel.getRangeAt(0);
  if (!source.contains(range.commonAncestorContainer)) return;
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  source.dispatchEvent(new Event("input", { bubbles: true }));
}

export function wrapSelection(source: HTMLElement, before: string, after: string, emptyLabel?: string): void {
  const label = emptyLabel ?? t("placeholder.text");
  const selected = getSelectedPlainText(source);
  const inner = selected || label;
  replaceSelection(source, before + inner + after);
}

export function insertBlock(source: HTMLElement, snippet: string, cursorOffsetFromEnd = 0): void {
  const sel = window.getSelection();
  let needsLeadingNl = false;
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (source.contains(range.commonAncestorContainer)) {
      const pre = range.cloneRange();
      pre.selectNodeContents(source);
      pre.setEnd(range.startContainer, range.startOffset);
      const before = pre.toString();
      needsLeadingNl = before.length > 0 && !before.endsWith("\n");
    }
  }
  const text = (needsLeadingNl ? "\n" : "") + snippet;
  replaceSelection(source, text);
  if (cursorOffsetFromEnd > 0) {
    placeCaretAtEnd(source, cursorOffsetFromEnd);
  }
}

function placeCaretAtEnd(source: HTMLElement, charsFromEnd: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let n: Node | null;
  while ((n = walker.nextNode())) last = n as Text;
  if (!last) return;
  const pos = Math.max(0, last.length - charsFromEnd);
  const range = document.createRange();
  range.setStart(last, pos);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

const STRIP_PATTERNS: RegExp[] = [
  /^\s*#{1,6}\s+/gm,
  /\*\*(.+?)\*\*/g,
  /\*(.+?)\*/g,
  /~~(.+?)~~/g,
  /==(.+?)==/g,
  /`(.+?)`/g,
  /\$([^$\n]+?)\$/g,
  /<!--\s*([\s\S]*?)\s*-->/g,
  /^\s*>\s?/gm,
  /^\s*[-*+]\s+/gm,
  /^\s*\d+\.\s+/gm,
  /\[\^([^\]]+)\]/g,
];

export function clearMarkdownFormatting(text: string): string {
  let s = text;
  for (const re of STRIP_PATTERNS) {
    s = s.replace(re, (_m, g1?: string) => (g1 !== undefined ? g1 : ""));
  }
  return s;
}

export function insertFootnote(source: HTMLElement): void {
  const label = t("placeholder.text");
  insertBlock(source, `[^1]\n\n[^1]: ${label}\n`, 0);
}

/**
 * Obsidian 风格管道表格：空单元格用两个空格占位，GFM 分隔行。
 * @param cols 列数
 * @param totalRows 总行数（含表头行），与 Obsidian 网格选择器语义一致
 */
export function buildObsidianStyleTableMarkdown(cols: number, totalRows: number): string {
  if (cols < 1 || totalRows < 1) return "";
  const row = "|" + "  |".repeat(cols);
  const sep = "|" + " --- |".repeat(cols);
  const dataRows = Math.max(0, totalRows - 1);
  const lines = [row, sep, ...Array(dataRows).fill(row)];
  return `${lines.join("\n")}\n`;
}

/** Insert snippet and place caret at 0-based offset inside `snippet` (ignores optional leading \\n). */
export function insertBlockWithCaretInSnippet(
  source: HTMLElement,
  snippet: string,
  offsetInSnippet: number,
): void {
  const sel = window.getSelection();
  let needsLeadingNl = false;
  let flatStart = (source.textContent ?? "").length;
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (source.contains(range.commonAncestorContainer)) {
      const pre = range.cloneRange();
      pre.selectNodeContents(source);
      pre.setEnd(range.startContainer, range.startOffset);
      const before = pre.toString();
      flatStart = before.length;
      needsLeadingNl = before.length > 0 && !before.endsWith("\n");
    }
  }
  const text = (needsLeadingNl ? "\n" : "") + snippet;
  replaceSelection(source, text);
  const nl = needsLeadingNl ? 1 : 0;
  const pos = flatStart + nl + Math.max(0, Math.min(offsetInSnippet, snippet.length));
  placeCaretAtFlatOffset(source, pos);
}

function placeCaretAtFlatOffset(source: HTMLElement, offset: number): void {
  source.focus();
  const sel = window.getSelection();
  if (!sel) return;
  let remaining = Math.max(0, offset);
  const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    last = t;
    const len = t.length;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(t, remaining);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    remaining -= len;
  }
  if (last) {
    const range = document.createRange();
    range.setStart(last, last.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function localeIsZh(): boolean {
  return getLocale() === "zh";
}

export function insertCallout(source: HTMLElement): void {
  const label = t("placeholder.text");
  const zh = localeIsZh();
  const prefix = zh ? "> **标注：** " : "> **Note:** ";
  insertBlock(source, `${prefix}${label}\n`, 0);
}

export function insertHr(source: HTMLElement): void {
  insertBlock(source, "---\n", 0);
}

export function insertCodeBlock(source: HTMLElement): void {
  insertBlock(source, "```\n\n```\n", 5);
}

export function insertMathBlock(source: HTMLElement): void {
  insertBlock(source, "$$\n\n$$\n", 4);
}
