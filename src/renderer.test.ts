import { describe, it, expect } from "vitest";
import { renderInline, renderBlocksToHtml, renderMarkdown, type RustBlock } from "./renderer";

describe("renderInline", () => {
  it("escapes angle brackets", () => {
    const out = renderInline("<script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;");
  });

  it("renders bold markers", () => {
    expect(renderInline("a **b** c")).toContain("<strong>");
  });

  it("renders html comment without breaking on escaped angle brackets", () => {
    const out = renderInline("a <!-- note --> b");
    expect(out).toContain("md-comment");
    expect(out).toContain("note");
    expect(out).not.toContain("&lt;!--");
  });
});

describe("renderMarkdown", () => {
  it("wraps each source line and renders tail section", () => {
    const md = "top\n\n## 📢 立即体验\n\n**别让寻找文件浪费你的生命。**";
    const html = renderMarkdown(md);
    expect(html.match(/class="md-line"/g)?.length).toBe(5);
    expect(html).toContain("md-h2");
    expect(html).toContain("立即体验");
    expect(html).toContain("<strong>");
  });

  it("renders ATX h4–h6 when hashes are followed by space", () => {
    const html = renderMarkdown("#### 四\n##### 五\n###### 六");
    expect(html).toContain('md-h4');
    expect(html).toContain('md-h5');
    expect(html).toContain('md-h6');
    expect(html).toContain('四');
    expect(html).toContain('五');
    expect(html).toContain('六');
  });

  it("does not treat ####word as heading (no space after hashes)", () => {
    const html = renderMarkdown("####word");
    expect(html).toContain("md-p");
    expect(html).not.toContain("md-h4");
  });

  it("renders GFM pipe table as grid when caret outside table", () => {
    const md = "|  |  |\n| --- | --- |\n|  |  |\n";
    const html = renderMarkdown(md, { caretLine: null });
    expect(html).toContain("md-table-wrap");
    expect(html).toContain("md-table-row--head");
    expect(html).toContain("md-table-cell");
    expect(html).not.toContain("md-table-wrap--editing");
  });

  it("renders GFM pipe table as source lines when caret inside table", () => {
    const md = "|  |  |\n| --- | --- |\n|  |  |\n";
    const html = renderMarkdown(md, { caretLine: 2 });
    expect(html).toContain("md-table-wrap--editing");
    expect(html.match(/md-table-src/g)?.length).toBe(3);
  });

  it("keeps tables as source lines when table source mode is forced", () => {
    const md = "| A | B |\n| --- | --- |\n| 1 | 2 |\n\noutside";
    const html = renderMarkdown(md, { caretLine: 4, sourceMode: true, tableSourceMode: true });
    expect(html).toContain("md-table-wrap");
    expect(html).toContain("md-table-wrap--editing");
    expect(html).not.toContain("md-table-cell");
    expect(html).toContain("md-src");
  });

  it("keeps tables as source lines while editing (focused)", () => {
    const md = "| A | B |\n| --- | --- |\n| 1 | 2 |\n\noutside";
    const html = renderMarkdown(md, { caretLine: 4, sourceMode: true });
    expect(html).toContain("md-table-wrap--editing");
    expect(html).not.toContain("md-table-cell");
    expect(html).toContain("md-src");
  });

  it("renders tables as grid preview when the editor is not focused", () => {
    const md = "| A | B |\n| --- | --- |\n| 1 | 2 |\n\noutside";
    const html = renderMarkdown(md, { caretLine: null, sourceMode: false });
    expect(html).toContain("md-table-wrap");
    expect(html).not.toContain("md-table-wrap--editing");
    expect(html).toContain("md-table-cell");
  });

  it("renders all lines as source text while editing (sourceMode)", () => {
    const html = renderMarkdown("## title\n**bold**", { caretLine: 0, sourceMode: true });
    expect(html).toContain("## title");
    expect(html).toContain("**bold**");
    expect(html).not.toContain("md-h2");
    expect(html).not.toContain("<strong>");
  });

  it("renders markdown preview when not editing (sourceMode off)", () => {
    const html = renderMarkdown("# A\n## B\n### C\n**bold**", { caretLine: 3, sourceMode: false });
    expect(html).toContain("md-h1");
    expect(html).toContain("md-h2");
    expect(html).toContain("md-h3");
    expect(html).toContain("<strong>");
    expect(html).not.toContain("**bold**");
  });
});

describe("renderBlocksToHtml", () => {
  it("renders heading block", () => {
    const blocks: RustBlock[] = [
      {
        start: 0,
        end: 10,
        kind: { heading: { level: 2 } },
        text: "## Hi\n",
      },
    ];
    expect(renderBlocksToHtml(blocks)).toContain("<h2>");
    expect(renderBlocksToHtml(blocks)).toContain("Hi");
  });
});
