import { describe, expect, it } from "vitest";
import { buildObsidianStyleTableMarkdown, clearMarkdownFormatting } from "./markdown-edit";

describe("buildObsidianStyleTableMarkdown", () => {
  it("totalRows=2 产生 1 表头 + 分隔 + 1 正文行", () => {
    expect(buildObsidianStyleTableMarkdown(2, 2)).toBe("|  |  |\n| --- | --- |\n|  |  |\n");
  });

  it("totalRows=1 仅产生表头 + 分隔行（无正文）", () => {
    expect(buildObsidianStyleTableMarkdown(2, 1)).toBe("|  |  |\n| --- | --- |\n");
  });

  it("无效维度返回空字符串", () => {
    expect(buildObsidianStyleTableMarkdown(0, 2)).toBe("");
    expect(buildObsidianStyleTableMarkdown(2, 0)).toBe("");
  });
});

describe("clearMarkdownFormatting", () => {
  it("strips bold and italic", () => {
    expect(clearMarkdownFormatting("**a** *b*")).toBe("a b");
  });

  it("strips strike, highlight, code", () => {
    expect(clearMarkdownFormatting("~~x~~ ==y== `z`")).toBe("x y z");
  });

  it("strips html comment wrapper", () => {
    expect(clearMarkdownFormatting("<!-- note -->")).toBe("note");
  });
});
