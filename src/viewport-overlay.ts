import {
  renderBlocksToHtml,
  renderMarkdown,
  renderSingleBlockHtml,
  type RustBlock,
} from "./renderer";

const UTF8 = new TextEncoder();

/** 文档较小时直接全量渲染，避免 spacer 估算误差 */
const VIEWPORT_UTF8_THRESHOLD = 22_000;
const VIEWPORT_BLOCK_THRESHOLD = 56;

export function shouldUseViewportLayers(blocks: RustBlock[], utf8Len: number): boolean {
  return utf8Len >= VIEWPORT_UTF8_THRESHOLD || blocks.length >= VIEWPORT_BLOCK_THRESHOLD;
}

export function utf8ByteLength(text: string): number {
  return UTF8.encode(text).length;
}

/** 与 Rope / innerText 比对时统一换行 */
export function normalizeDocText(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

export function docTextsMatch(sourceInnerText: string, cached: string): boolean {
  return normalizeDocText(sourceInnerText) === normalizeDocText(cached);
}

/**
 * 块在文档中的大致纵向像素位置（与源码层线性映射一致）。
 */
export function computeByteAlignedTopSpacer(
  blockStart: number,
  utf8Len: number,
  scrollHeight: number,
): number {
  if (utf8Len <= 0) return 0;
  const sh = Math.max(1, scrollHeight);
  return Math.floor((blockStart / utf8Len) * sh);
}

export function computeBottomSpacer(scrollHeight: number, topPx: number, middleHeight: number): number {
  const sh = Math.max(1, scrollHeight);
  return Math.max(0, sh - topPx - middleHeight);
}

export function resolveViewportSpacers(
  scrollHeight: number,
  topPx: number,
  middleHeight: number,
): { topPx: number; bottomPx: number } {
  const sh = Math.max(1, scrollHeight);
  let t = Math.max(0, topPx);
  const m = Math.max(0, middleHeight);
  if (t + m > sh) {
    t = Math.max(0, sh - m);
    return { topPx: t, bottomPx: 0 };
  }
  return { topPx: t, bottomPx: Math.max(0, sh - t - m) };
}

export function isNearDocumentEnd(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
): boolean {
  const sh = Math.max(1, scrollHeight);
  const slack = Math.max(48, clientHeight * 0.12);
  return scrollTop + clientHeight >= sh - slack;
}

/**
 * 按 UTF-8 字节视口选块；接近文档末尾时强制包含最后一个块，避免底部空白。
 */
export function selectVisibleBlockIndices(
  blocks: RustBlock[],
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  utf8Len: number,
): { i0: number; i1: number } {
  if (blocks.length === 0) return { i0: 0, i1: -1 };

  const { vb0, vb1 } = visibleUtf8Range(scrollTop, clientHeight, scrollHeight, utf8Len);

  let i0 = 0;
  let i1 = blocks.length - 1;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i]!.end > vb0) {
      i0 = i;
      break;
    }
  }
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i]!.start < vb1) {
      i1 = i;
      break;
    }
  }

  if (isNearDocumentEnd(scrollTop, clientHeight, scrollHeight)) {
    i1 = blocks.length - 1;
    while (i0 > 0 && blocks[i0]!.start > vb0) {
      i0--;
    }
  }

  return { i0, i1 };
}

/** 解析器未覆盖的文末 Markdown 用行级渲染补上 */
export function renderUnparsedTailHtml(blocks: RustBlock[], fullText: string): string {
  if (blocks.length === 0) {
    return fullText.trim() ? renderMarkdown(fullText) : "";
  }
  const lastEnd = blocks[blocks.length - 1]!.end;
  if (lastEnd >= fullText.length) return "";
  const tail = fullText.slice(lastEnd);
  if (!tail.trim()) return "";
  return renderMarkdown(tail);
}

function renderSliceHtml(blocks: RustBlock[], i0: number, i1: number, fullText: string): string {
  if (i0 > i1) return renderBlocksToHtml(blocks);
  const slice = blocks.slice(i0, i1 + 1).map((b) => renderSingleBlockHtml(b));
  const tail = i1 === blocks.length - 1 ? renderUnparsedTailHtml(blocks, fullText) : "";
  return slice.join("") + tail;
}

export function buildOverlayInnerHtml(
  blocks: RustBlock[],
  utf8Len: number,
  docCheck: string,
  sourceEl: HTMLElement,
  scrollWrap: HTMLElement,
): string {
  if (blocks.length === 0) return "";

  const fullText = normalizeDocText(docCheck);

  if (utf8Len < VIEWPORT_UTF8_THRESHOLD && blocks.length < VIEWPORT_BLOCK_THRESHOLD) {
    return renderBlocksToHtml(blocks) + renderUnparsedTailHtml(blocks, fullText);
  }

  if (!docTextsMatch(sourceEl.innerText ?? "", fullText)) {
    return "";
  }

  const scrollTop = scrollWrap.scrollTop;
  const clientHeight = scrollWrap.clientHeight;
  const scrollHeight = Math.max(scrollWrap.scrollHeight, 1);

  const { i0, i1 } = selectVisibleBlockIndices(
    blocks,
    scrollTop,
    clientHeight,
    scrollHeight,
    utf8Len,
  );

  if (i0 > i1) {
    return renderBlocksToHtml(blocks) + renderUnparsedTailHtml(blocks, fullText);
  }

  const topPx = computeByteAlignedTopSpacer(blocks[i0]!.start, utf8Len, scrollHeight);
  const sliceHtml = renderSliceHtml(blocks, i0, i1, fullText);

  return (
    `<div class="md-ov-spacer md-ov-spacer--top" aria-hidden="true" style="height:${topPx}px"></div>` +
    `<div class="md-ov-slice">` +
    sliceHtml +
    `</div>` +
    `<div class="md-ov-spacer md-ov-spacer--bottom" aria-hidden="true" style="height:0px"></div>`
  );
}

function visibleUtf8Range(
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
  utf8Len: number,
): { vb0: number; vb1: number } {
  if (utf8Len === 0) return { vb0: 0, vb1: 0 };
  const sh = Math.max(1, scrollHeight);
  const margin = clientHeight * 0.45;
  const y0 = Math.max(0, scrollTop - margin);
  const y1 = Math.min(sh, scrollTop + clientHeight + margin);
  const vb0 = Math.floor((y0 / sh) * utf8Len);
  const vb1 = Math.ceil((y1 / sh) * utf8Len);
  return {
    vb0: clamp(vb0, 0, utf8Len),
    vb1: clamp(Math.max(vb0, vb1), 0, utf8Len),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
