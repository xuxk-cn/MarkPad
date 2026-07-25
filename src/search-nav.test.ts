import { describe, expect, it } from "vitest";
import { byteOffsetToCharIndex } from "./search-nav";

describe("byteOffsetToCharIndex", () => {
  it("maps UTF-8 byte offset to JS index", () => {
    const text = "a中b";
    const enc = new TextEncoder();
    const offAfterA = enc.encode("a").length;
    const offAfterZhong = enc.encode("a中").length;
    expect(byteOffsetToCharIndex(text, 0)).toBe(0);
    expect(byteOffsetToCharIndex(text, offAfterA)).toBe(1);
    expect(byteOffsetToCharIndex(text, offAfterZhong)).toBe(2);
    expect(byteOffsetToCharIndex(text, 999)).toBe(text.length);
  });
});
