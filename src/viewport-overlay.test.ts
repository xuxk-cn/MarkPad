import { describe, it, expect } from "vitest";
import {
  utf8ByteLength,
  shouldUseViewportLayers,
  buildOverlayInnerHtml,
  computeByteAlignedTopSpacer,
  computeBottomSpacer,
  resolveViewportSpacers,
  selectVisibleBlockIndices,
  isNearDocumentEnd,
  renderUnparsedTailHtml,
} from "./viewport-overlay";
import type { RustBlock } from "./renderer";

function paragraphBlock(start: number, end: number, text: string): RustBlock {
  return { start, end, kind: { paragraph: null }, text };
}

describe("utf8ByteLength", () => {
  it("counts ASCII bytes", () => {
    expect(utf8ByteLength("abc")).toBe(3);
  });

  it("counts UTF-8 for CJK", () => {
    expect(utf8ByteLength("你好")).toBe(6);
  });
});

describe("shouldUseViewportLayers", () => {
  it("is false for small document", () => {
    expect(shouldUseViewportLayers([paragraphBlock(0, 1, "a\n")], 100)).toBe(false);
  });

  it("is true when block count exceeds threshold", () => {
    const blocks = Array.from({ length: 60 }, (_, i) => paragraphBlock(i * 2, i * 2 + 1, "x\n"));
    expect(shouldUseViewportLayers(blocks, 100)).toBe(true);
  });
});

describe("computeByteAlignedTopSpacer", () => {
  it("maps block start to scroll height proportionally", () => {
    expect(computeByteAlignedTopSpacer(2500, 10_000, 8000)).toBe(2000);
  });
});

describe("computeBottomSpacer", () => {
  it("fills remaining scroll height", () => {
    expect(computeBottomSpacer(5000, 1000, 300)).toBe(3700);
  });
});

describe("resolveViewportSpacers", () => {
  it("sums to scrollHeight when middle fits", () => {
    const sh = 5000;
    const top = 1000;
    const mid = 300;
    const { topPx, bottomPx } = resolveViewportSpacers(sh, top, mid);
    expect(topPx + mid + bottomPx).toBe(sh);
  });
});

describe("selectVisibleBlockIndices", () => {
  const blocks: RustBlock[] = [];
  let off = 0;
  for (let i = 0; i < 80; i++) {
    const t = `line ${i}\n`;
    blocks.push(paragraphBlock(off, off + t.length, t));
    off += t.length;
  }
  const utf8Len = off;

  it("includes last block when scrolled to document end", () => {
    const scrollHeight = 12_000;
    const clientHeight = 200;
    const scrollTop = scrollHeight - clientHeight;
    const { i0, i1 } = selectVisibleBlockIndices(
      blocks,
      scrollTop,
      clientHeight,
      scrollHeight,
      utf8Len,
    );
    expect(i1).toBe(blocks.length - 1);
    expect(i0).toBeLessThan(i1);
  });
});

describe("renderUnparsedTailHtml", () => {
  it("renders markdown after last block end", () => {
    const full = "a\n\n## Tail\n\n**bold**";
    const blocks = [paragraphBlock(0, 2, "a\n")];
    const html = renderUnparsedTailHtml(blocks, full);
    expect(html).toContain("md-h2");
    expect(html).toContain("Tail");
  });
});

describe("buildOverlayInnerHtml", () => {
  it("returns empty string when doc snapshot mismatches source", () => {
    const src = document.createElement("div");
    src.innerText = "hello";
    const wrap = document.createElement("div");
    Object.defineProperty(wrap, "scrollTop", { value: 0, configurable: true });
    Object.defineProperty(wrap, "clientHeight", { value: 100, configurable: true });
    Object.defineProperty(wrap, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(src, "offsetHeight", { value: 500, configurable: true });
    const blocks = Array.from({ length: 60 }, (_, i) => paragraphBlock(i * 4, i * 4 + 3, "p\n"));
    expect(buildOverlayInnerHtml(blocks, 5000, "not-hello", src, wrap)).toBe("");
  });

  it("uses byte-aligned top spacer at scroll position", () => {
    const content = "x\n".repeat(15_000);
    const src = document.createElement("div");
    src.innerText = content;
    const wrap = document.createElement("div");
    const scrollHeight = 12_000;
    const clientHeight = 200;
    const scrollTop = scrollHeight - clientHeight;
    Object.defineProperty(wrap, "scrollTop", { value: scrollTop, configurable: true });
    Object.defineProperty(wrap, "clientHeight", { value: clientHeight, configurable: true });
    Object.defineProperty(wrap, "scrollHeight", { value: scrollHeight, configurable: true });
    Object.defineProperty(src, "offsetHeight", { value: scrollHeight, configurable: true });

    const blocks: RustBlock[] = [];
    let off = 0;
    for (let i = 0; i < 80; i++) {
      const t = `line ${i}\n`;
      blocks.push(paragraphBlock(off, off + t.length, t));
      off += t.length;
    }
    const utf8Len = utf8ByteLength(content);
    const { i0 } = selectVisibleBlockIndices(blocks, scrollTop, clientHeight, scrollHeight, utf8Len);
    const html = buildOverlayInnerHtml(blocks, utf8Len, content, src, wrap);
    const expectedTop = computeByteAlignedTopSpacer(blocks[i0]!.start, utf8Len, scrollHeight);
    expect(html).toContain(`height:${expectedTop}px`);
    expect(html).toContain("line 79");
  });
});
