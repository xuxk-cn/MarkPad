/** 将 UTF-8 字节偏移转为 JS 字符串索引（与 Rust doc_search 一致，文本须已规范为 \n） */
export function byteOffsetToCharIndex(text: string, byteOffset: number): number {
  if (byteOffset <= 0) return 0;
  const bytes = new TextEncoder().encode(text);
  const end = Math.min(byteOffset, bytes.length);
  return new TextDecoder().decode(bytes.slice(0, end)).length;
}

/** 在 contenteditable 中选中 [start, end) 字符区间（与 innerText 顺序一致） */
export function selectFlatRange(source: HTMLElement, start: number, end: number): void {
  source.focus();
  const sel = window.getSelection();
  if (!sel) return;

  const s = Math.max(0, Math.min(start, end));
  const e = Math.max(s, end);

  const startPos = resolveTextPosition(source, s);
  const endPos = resolveTextPosition(source, e);
  if (!startPos || !endPos) return;

  const range = document.createRange();
  range.setStart(startPos.node, startPos.offset);
  range.setEnd(endPos.node, endPos.offset);
  sel.removeAllRanges();
  sel.addRange(range);
}

function resolveTextPosition(
  root: HTMLElement,
  charIndex: number,
): { node: Text; offset: number } | null {
  let remaining = charIndex;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    last = t;
    const len = t.length;
    if (remaining <= len) {
      return { node: t, offset: remaining };
    }
    remaining -= len;
  }
  if (last) {
    return { node: last, offset: last.length };
  }
  return null;
}

/** 将当前选区滚入 editor-wrapper 可视区域 */
export function scrollSelectionIntoView(
  source: HTMLElement,
  wrap: HTMLElement,
): void {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!source.contains(range.commonAncestorContainer)) return;

  const rect = range.getBoundingClientRect();
  if (rect.height === 0 && rect.width === 0) return;

  const wrapRect = wrap.getBoundingClientRect();
  const relTop = rect.top - wrapRect.top + wrap.scrollTop;
  const margin = Math.max(48, wrap.clientHeight * 0.2);
  let top = relTop - margin;
  const maxScroll = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
  top = Math.max(0, Math.min(top, maxScroll));
  wrap.scrollTop = top;
}
