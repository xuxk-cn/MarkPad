import { describe, it, expect } from "vitest";
import { htmlToMarkdown, looksLikeMarkdown, resolvePastePayload } from "./paste-resolve";

describe("looksLikeMarkdown", () => {
  it("detects headings and bold", () => {
    expect(looksLikeMarkdown("# Title\n\n**bold**")).toBe(true);
    expect(looksLikeMarkdown("plain paragraph only")).toBe(false);
  });
});

describe("htmlToMarkdown", () => {
  it("converts headings and emphasis", () => {
    const md = htmlToMarkdown("<h1>Title</h1><p>Hello <strong>world</strong></p>");
    expect(md).toContain("# Title");
    expect(md).toContain("**world**");
  });

  it("converts lists", () => {
    const md = htmlToMarkdown("<ul><li>a</li><li>b</li></ul>");
    expect(md).toContain("- a");
    expect(md).toContain("- b");
  });
});

describe("resolvePastePayload", () => {
  it("prefers markdown mime", () => {
    expect(resolvePastePayload({ plain: "plain", markdown: "# MD" })).toBe("# MD");
  });

  it("keeps plain when it looks like markdown", () => {
    expect(
      resolvePastePayload({ plain: "## Hello", html: "<h2>Hello</h2>" }),
    ).toBe("## Hello");
  });

  it("falls back to html when plain is unstructured", () => {
    const out = resolvePastePayload({
      plain: "Hello world",
      html: "<p>Hello <strong>world</strong></p>",
    });
    expect(out).toContain("**world**");
  });

  it("uses html when plain is empty", () => {
    expect(resolvePastePayload({ html: "<h1>Doc</h1>" })).toContain("# Doc");
  });
});
