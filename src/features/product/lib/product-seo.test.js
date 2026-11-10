import { describe, expect, it } from "vitest";
import { productJsonLd, productMeta, socialImage } from "./product-seo";

const img = { url: "https://res.cloudinary.com/x/image/upload/v1/a.webp", publicId: "a" };
const base = {
  _id: "p1",
  name: "Gold Standard Whey",
  slug: "gold-standard-whey",
  description: "Great protein.",
  brand: { name: "Optimum Nutrition", slug: "on" },
  category: { name: "Protein", slug: "protein" },
  averageRating: 4.6,
  reviewCount: 5,
  metaTitle: "",
  metaDescription: "",
  variants: [
    {
      _id: "v1",
      sku: "SKU1",
      image: img,
      images: [],
      price: 48000,
      salePrice: 45000,
      stockQuantity: 3,
      status: "active",
      isDefault: true,
    },
  ],
};

describe("productMeta", () => {
  it("falls back to name/description when the admin left SEO fields empty", () => {
    const meta = productMeta(base);
    expect(meta.title).toBe("Gold Standard Whey price in Pakistan");
    expect(meta.description).toBe("Great protein.");
    expect(meta.image).toContain("c_pad,w_1200,h_630,b_rgb:f6f4ef");
  });
  it("prefers the admin's SEO fields", () => {
    expect(productMeta({ ...base, metaTitle: "Custom" }).title).toBe("Custom");
  });
});

describe("productJsonLd", () => {
  it("uses a single Offer with the price paid and stock", () => {
    const [product, crumbs] = productJsonLd(base);
    expect(product.offers).toMatchObject({
      "@type": "Offer",
      price: 45000,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
    });
    expect(product.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.6,
      reviewCount: 5,
    });
    expect(crumbs.itemListElement).toHaveLength(3);
  });

  it("uses an AggregateOffer when variants are priced differently, and OutOfStock when none sell", () => {
    const p = {
      ...base,
      reviewCount: 0,
      variants: [
        { ...base.variants[0], stockQuantity: 0 },
        { ...base.variants[0], _id: "v2", price: 20000, salePrice: null, stockQuantity: 0 },
      ],
    };
    const [product] = productJsonLd(p);
    expect(product.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 20000,
      highPrice: 45000,
      availability: "https://schema.org/OutOfStock",
    });
    expect(product.aggregateRating).toBeUndefined();
  });
});

describe("socialImage", () => {
  it("is undefined without an image", () => {
    expect(socialImage(undefined)).toBeUndefined();
  });
});
