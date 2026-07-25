import { describe, it, expect, beforeEach } from "vitest";
import { loadRecentPaths, rememberRecentPath, refreshRecentSelect } from "./recent-files";

beforeEach(() => {
  localStorage.clear();
});

describe("recent files", () => {
  it("starts empty", () => {
    expect(loadRecentPaths()).toEqual([]);
  });

  it("dedupes and caps order", () => {
    rememberRecentPath("C:\\a\\1.md");
    rememberRecentPath("C:\\b\\2.md");
    rememberRecentPath("C:\\a\\1.md");
    const p = loadRecentPaths();
    expect(p[0]).toBe("C:\\a\\1.md");
    expect(p[1]).toBe("C:\\b\\2.md");
  });

  it("refreshRecentSelect fills options", () => {
    rememberRecentPath("D:\\proj\\readme.md");
    const sel = document.createElement("select");
    refreshRecentSelect(sel);
    expect(sel.options.length).toBeGreaterThanOrEqual(2);
    expect(sel.options[0].value).toBe("");
  });
});
