import { describe, expect, it } from "vitest";
import { parseDescription, summarize } from "./description";

// Shaped like the live "The Ripper" description.
const RIPPER = `If you want a fat burner that kicks like a bull, The Ripper might be the one.
Designed for hardcore users only.

The Ripper is a fast acting formula. This is a fat burning you can literally feel!

Provides energy and reduces fatigue
Controls appetite and supports weight loss
Boosts metabolism and promotes fat burning`;

describe("parseDescription", () => {
  it("splits paragraphs and turns short unpunctuated lines into a list", () => {
    expect(parseDescription(RIPPER)).toEqual([
      {
        type: "p",
        text: "If you want a fat burner that kicks like a bull, The Ripper might be the one. Designed for hardcore users only.",
      },
      {
        type: "p",
        text: "The Ripper is a fast acting formula. This is a fat burning you can literally feel!",
      },
      {
        type: "ul",
        items: [
          "Provides energy and reduces fatigue",
          "Controls appetite and supports weight loss",
          "Boosts metabolism and promotes fat burning",
        ],
      },
    ]);
  });

  it("strips typed bullet characters", () => {
    expect(parseDescription("- 24g protein\n- 5.5g BCAA")).toEqual([
      { type: "ul", items: ["24g protein", "5.5g BCAA"] },
    ]);
  });

  it("handles empty input and Windows line endings", () => {
    expect(parseDescription("")).toEqual([]);
    expect(parseDescription("One.\r\n\r\nTwo.")).toEqual([
      { type: "p", text: "One." },
      { type: "p", text: "Two." },
    ]);
  });
});

describe("summarize", () => {
  it("keeps short text and cuts long text at a word", () => {
    expect(summarize("Short text.")).toBe("Short text.");
    const out = summarize("word ".repeat(60));
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("word…")).toBe(true);
  });
});
