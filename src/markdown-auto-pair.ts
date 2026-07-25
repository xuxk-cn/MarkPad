import { getSelectedPlainText, replaceSelection, wrapSelection } from "./markdown-edit";

export type EditContext = {
  before: string;
  after: string;
  selected: string;
  collapsed: boolean;
};

/** 光标前是否存在未闭合的 `**…` 加粗区段 */
export function isInsideOpenBold(before: string): boolean {
  const idx = before.lastIndexOf("**");
  if (idx < 0) return false;
  return !before.slice(idx + 2).includes("**");
}

/** 是否存在未配对的单星号（斜体 `*…` 尚未闭合） */
export function hasUnpairedSingleAsterisk(before: string): boolean {
  let singles = 0;
  let i = 0;
  while (i < before.length) {
    if (before[i] === "*" && before[i + 1] === "*") {
      i += 2;
      continue;
    }
    if (before[i] === "*") {
      singles++;
      i++;
      continue;
    }
    i++;
  }
  return singles % 2 === 1;
}

/** 纯逻辑：决定按 * 时如何处理加粗（Obsidian 式） */
export function planBoldAsteriskKey(ctx: EditContext): "pair-open" | "pair-close" | "skip-close" | null {
  if (!ctx.collapsed) return null;

  if (ctx.after.startsWith("**")) {
    const last = ctx.before.slice(-1);
    if (last && last !== "*" && !/\s/.test(last)) {
      return "skip-close";
    }
    return null;
  }

  if (ctx.before.length > 0 && isInsideOpenBold(ctx.before)) {
    const last = ctx.before.slice(-1);
    if (last !== "*" && !/\s/.test(last)) {
      return "pair-close";
    }
  }

  if (!ctx.before.endsWith("*") && !hasUnpairedSingleAsterisk(ctx.before)) {
    return "pair-open";
  }

  return null;
}

function getEditContext(source: HTMLElement): EditContext | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!source.contains(range.commonAncestorContainer)) return null;

  const pre = range.cloneRange();
  pre.selectNodeContents(source);
  pre.setEnd(range.startContainer, range.startOffset);
  const before = pre.toString();

  const post = range.cloneRange();
  post.selectNodeContents(source);
  post.setStart(range.endContainer, range.endOffset);
  const after = post.toString();

  return {
    before,
    after,
    selected: range.toString(),
    collapsed: range.collapsed,
  };
}

function setFlatOffset(el: HTMLElement, offset: number): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel) return;
  let rem = Math.max(0, offset);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  let last: Text | null = null;
  while ((node = walker.nextNode())) {
    const t = node as Text;
    last = t;
    if (rem <= t.length) {
      const r = document.createRange();
      r.setStart(t, rem);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
    rem -= t.length;
  }
  if (last) {
    const r = document.createRange();
    r.setStart(last, last.length);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

function getFlatOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return -1;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return -1;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function insertTextAndCaret(source: HTMLElement, text: string, caretOffset: number): void {
  const start = getFlatOffset(source);
  if (start < 0) return;
  replaceSelection(source, text);
  setFlatOffset(source, start + caretOffset);
}

function skipChars(source: HTMLElement, count: number): void {
  const pos = getFlatOffset(source);
  if (pos < 0) return;
  setFlatOffset(source, pos + count);
}

/** Obsidian 式 ** 加粗：* 自动成对、闭合跳过；Ctrl+B 包裹选区 */
export function handleMarkdownAutoPairKeydown(source: HTMLElement, e: KeyboardEvent): boolean {
  if (e.isComposing) return false;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
    e.preventDefault();
    const selected = getSelectedPlainText(source);
    if (selected) {
      wrapSelection(source, "**", "**");
    } else {
      insertTextAndCaret(source, "****", 2);
    }
    return true;
  }

  if (e.key !== "*" || e.ctrlKey || e.metaKey || e.altKey) return false;

  const ctx = getEditContext(source);
  if (!ctx) return false;

  const action = planBoldAsteriskKey(ctx);
  if (!action) return false;

  e.preventDefault();
  switch (action) {
    case "pair-open":
      insertTextAndCaret(source, "****", 2);
      break;
    case "pair-close":
      insertTextAndCaret(source, "**", 2);
      break;
    case "skip-close":
      skipChars(source, 2);
      break;
  }
  return true;
}
