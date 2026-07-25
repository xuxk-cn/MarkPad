import { describe, expect, it } from "vitest";
import { planBoldAsteriskKey, type EditContext } from "./markdown-auto-pair";

function ctx(before: string, after: string, selected = ""): EditContext {
  return { before, after, selected, collapsed: selected.length === 0 };
}

describe("planBoldAsteriskKey", () => {
  it("opens bold pair on first * at word boundary", () => {
    expect(planBoldAsteriskKey(ctx("hello ", ""))).toBe("pair-open");
    expect(planBoldAsteriskKey(ctx("", " world"))).toBe("pair-open");
  });

  it("skips over closing ** after word", () => {
    expect(planBoldAsteriskKey(ctx("**bold", "** tail"))).toBe("skip-close");
  });

  it("closes bold when typing * after word without closing markers", () => {
    expect(planBoldAsteriskKey(ctx("**bold", ""))).toBe("pair-close");
  });

  it("opens bold after plain word, does not auto-close (H-A)", () => {
    expect(planBoldAsteriskKey(ctx("hello", ""))).toBe("pair-open");
  });

  it("does not close bold inside single-star italic (H-A)", () => {
    expect(planBoldAsteriskKey(ctx("*italic", ""))).toBe(null);
  });

  it("does not skip when cursor sits inside empty **** template", () => {
    expect(planBoldAsteriskKey(ctx("**", "**"))).toBe(null);
  });

  it("ignores non-collapsed selection", () => {
    expect(planBoldAsteriskKey({ before: "a", after: "b", selected: "x", collapsed: false })).toBe(
      null,
    );
  });
});
