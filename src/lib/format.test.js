import { describe, expect, it } from "vitest";
import {
  discountPercent,
  formatPkPhone,
  formatPrice,
  normalizePkPhone,
  tidyAttribute,
} from "./format";

describe("formatPrice", () => {
  it("formats whole rupees with grouping", () => {
    expect(formatPrice(8200)).toBe("Rs\u00a08,200");
    expect(formatPrice(45000)).toBe("Rs\u00a045,000");
  });
  it("returns empty for non-numbers", () => {
    expect(formatPrice(undefined)).toBe("");
    expect(formatPrice("abc")).toBe("");
  });
});

describe("discountPercent", () => {
  it("rounds down so a discount is never overstated", () => {
    expect(discountPercent(9000, 8200)).toBe(8);
  });
  it("is 0 when there is no real sale", () => {
    expect(discountPercent(9000, null)).toBe(0);
    expect(discountPercent(9000, 9000)).toBe(0);
    expect(discountPercent(9000, 9500)).toBe(0);
  });
});

describe("Pakistani phone numbers", () => {
  it("accepts local and international formats", () => {
    expect(normalizePkPhone("0310-2987869")).toBe("03102987869");
    expect(normalizePkPhone("+92 310 2987869")).toBe("03102987869");
    expect(formatPkPhone("923102987869")).toBe("0310 2987869");
  });
  it("rejects anything else", () => {
    expect(normalizePkPhone("12345")).toBeNull();
    expect(normalizePkPhone("0210 1234567")).toBeNull();
  });
});

describe("tidyAttribute", () => {
  it("normalises casing and units for display only", () => {
    expect(tidyAttribute("DARK GRAPE")).toBe("Dark Grape");
    expect(tidyAttribute("5lbs")).toBe("5 lbs");
    expect(tidyAttribute("150 GRAM")).toBe("150 Gram");
    expect(tidyAttribute("3kg")).toBe("3 kg");
  });
});
