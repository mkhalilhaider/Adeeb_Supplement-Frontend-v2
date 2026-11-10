import { describe, expect, it } from "vitest";
import { cardBadges, defaultVariant, toProductCard, variantImage } from "./product-view";

const NOW = Date.parse("2026-11-10T00:00:00Z");
const img = (id) => ({
  url: `https://res.cloudinary.com/x/image/upload/v1/${id}.webp`,
  publicId: id,
});

/** Shaped like the live "The Ripper by JNX" product: 2 flavours, same price, 2nd has no photo. */
function ripper(overrides = {}) {
  return {
    _id: "p1",
    name: "The Ripper by JNX – 30 Servings",
    slug: "the-ripper-by-jnx-30-servings",
    brand: { _id: "b1", name: "Jinx Sports", slug: "jinx-sports" },
    category: { _id: "c1", name: "Preworkout", slug: "preworkout" },
    averageRating: 4.4,
    reviewCount: 5,
    createdAt: "2026-10-25T15:05:33.408Z",
    variants: [
      {
        _id: "v1",
        attributes: { flavor: "DARK GRAPE", weight: "150 GRAM", serving: "30" },
        image: img("a"),
        images: [img("a"), img("b")],
        price: 9000,
        salePrice: 8200,
        stockQuantity: 20,
        lowStockThreshold: 5,
        status: "active",
        isDefault: true,
      },
      {
        _id: "v2",
        attributes: { flavor: "BLUE RAPSBERRY", weight: "150 GRAM", serving: "30" },
        image: null,
        images: [],
        price: 9000,
        salePrice: 8200,
        stockQuantity: 20,
        lowStockThreshold: 5,
        status: "active",
        isDefault: false,
      },
    ],
    ...overrides,
  };
}

describe("toProductCard", () => {
  it("maps a typical two-flavour product", () => {
    const card = toProductCard(ripper(), { now: NOW });
    expect(card).toMatchObject({
      href: "/product/the-ripper-by-jnx-30-servings",
      brand: "Jinx Sports",
      price: 9000,
      salePrice: 8200,
      priceFrom: false,
      discount: 8,
      inStock: true,
      stockLeft: null,
      variantHint: "2 flavours",
      isNew: true,
      quickAddVariantId: null,
    });
    expect(card.image.url).toContain("/a.webp");
    expect(card.secondImage.url).toContain("/b.webp");
  });

  it("shows 'From' with the cheapest sellable price when variants differ", () => {
    const p = ripper();
    p.variants[1] = {
      ...p.variants[1],
      price: 15000,
      salePrice: null,
      attributes: { weight: "5 lbs" },
    };
    p.variants[0] = { ...p.variants[0], attributes: { weight: "2 lbs" } };
    const card = toProductCard(p, { now: NOW });
    expect(card.priceFrom).toBe(true);
    expect(card.salePrice).toBe(8200);
    expect(card.variantHint).toBe("2 sizes");
  });

  it("ignores sold-out variants for the price and flags low stock", () => {
    const p = ripper();
    p.variants[0] = { ...p.variants[0], stockQuantity: 0, status: "out_of_stock" };
    p.variants[1] = { ...p.variants[1], stockQuantity: 3, salePrice: null };
    const card = toProductCard(p, { now: NOW });
    expect(card.price).toBe(9000);
    expect(card.salePrice).toBeNull();
    expect(card.stockLeft).toBe(3);
  });

  it("is sold out when nothing is sellable", () => {
    const p = ripper();
    p.variants = p.variants.map((v) => ({ ...v, stockQuantity: 0 }));
    const card = toProductCard(p, { now: NOW });
    expect(card.inStock).toBe(false);
    expect(cardBadges(card)).toEqual([{ label: "Sold out", tone: "danger" }]);
  });

  it("allows quick add only for a single sellable variant", () => {
    const p = ripper();
    p.variants = [p.variants[0]];
    expect(toProductCard(p, { now: NOW }).quickAddVariantId).toBe("v1");
  });

  it("treats attribute casing as the same value", () => {
    const p = ripper();
    p.variants[1] = { ...p.variants[1], attributes: { flavor: "dark grape" } };
    expect(toProductCard(p, { now: NOW }).variantHint).toBeNull();
  });

  it("is not new after 30 days", () => {
    expect(toProductCard(ripper(), { now: Date.parse("2027-01-30") }).isNew).toBe(false);
  });
});

describe("cardBadges", () => {
  it("shows the discount for a sale product (and never 'New')", () => {
    const card = toProductCard(ripper(), { now: NOW });
    expect(card.isNew).toBe(true);
    expect(cardBadges(card).map((b) => b.label)).toEqual(["−8%"]);
  });

  it("shows low stock before the discount, at most two badges", () => {
    const p = ripper();
    p.variants = [{ ...p.variants[0], stockQuantity: 2 }];
    expect(cardBadges(toProductCard(p, { now: NOW })).map((b) => b.label)).toEqual([
      "Only 2 left",
      "−8%",
    ]);
  });

  it("has no badges for an in-stock product at full price", () => {
    const p = ripper();
    p.variants = p.variants.map((v) => ({ ...v, salePrice: null }));
    expect(cardBadges(toProductCard(p, { now: NOW }))).toEqual([]);
  });
});

describe("variant helpers", () => {
  it("falls back to the gallery when the main image is missing", () => {
    expect(variantImage({ image: null, images: [img("z")] }).url).toContain("/z.webp");
    expect(variantImage({ image: null, images: [] })).toBeNull();
  });
  it("skips a switched-off default variant", () => {
    const p = ripper();
    p.variants[0] = { ...p.variants[0], status: "inactive" };
    expect(defaultVariant(p)._id).toBe("v2");
  });
});
