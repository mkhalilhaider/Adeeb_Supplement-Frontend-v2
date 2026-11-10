import { describe, expect, it } from "vitest";
import { blocksCheckout, checkLine } from "./line-check";

const product = (variant) => ({
  _id: "p1",
  variants: [
    { _id: "v1", price: 9000, salePrice: 8200, stockQuantity: 10, status: "active", ...variant },
  ],
});
const line = (extra) => ({ variantId: "v1", unitPrice: 8200, quantity: 2, ...extra });

describe("checkLine", () => {
  it("is ok when price and stock still match", () => {
    expect(checkLine(line(), product())).toEqual({ status: "ok", livePrice: 8200, stock: 10 });
  });

  it("reports a price change (and which way)", () => {
    expect(checkLine(line({ unitPrice: 9000 }), product())).toMatchObject({
      status: "price",
      livePrice: 8200,
      message: "Price dropped since you added it",
    });
    expect(checkLine(line({ unitPrice: 7000 }), product()).message).toBe(
      "Price changed since you added it",
    );
  });

  it("asks to reduce the quantity when stock is short", () => {
    expect(checkLine(line({ quantity: 12 }), product())).toMatchObject({
      status: "low",
      stock: 10,
    });
  });

  it("marks sold-out, removed variants and deleted products unavailable", () => {
    expect(checkLine(line(), product({ stockQuantity: 0 })).status).toBe("unavailable");
    expect(checkLine(line({ variantId: "gone" }), product()).status).toBe("unavailable");
    expect(checkLine(line(), undefined, { missing: true }).status).toBe("unavailable");
  });

  it("assumes ok while the product is still loading", () => {
    expect(checkLine(line(), undefined)).toEqual({ status: "ok" });
  });
});

describe("blocksCheckout", () => {
  it("blocks only for unavailable or short stock", () => {
    expect(blocksCheckout({ status: "unavailable" })).toBe(true);
    expect(blocksCheckout({ status: "low" })).toBe(true);
    expect(blocksCheckout({ status: "price" })).toBe(false);
    expect(blocksCheckout({ status: "ok" })).toBe(false);
  });
});
