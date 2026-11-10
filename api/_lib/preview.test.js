import { describe, expect, it } from "vitest";
import { buildPreview, parsePreviewPath, renderPreviewHtml } from "./preview.js";
import { renderSitemap } from "./sitemap.js";

const product = {
  _id: "p1",
  name: "Test Whey <5 lb>",
  slug: "test-whey",
  description: "Great protein.\nMixes well.",
  brand: { name: "Brand" },
  category: { name: "Protein", slug: "protein" },
  averageRating: 0,
  reviewCount: 0,
  variants: [
    {
      _id: "v1",
      sku: "SKU1",
      price: 10000,
      salePrice: 9000,
      stockQuantity: 5,
      status: "active",
      isDefault: true,
      image: { url: "https://res.cloudinary.com/demo/image/upload/v1/x.webp" },
    },
  ],
};

const load = async (path) => {
  if (path === "/catalog/products/test-whey") return product;
  if (path === "/catalog/categories")
    return [
      {
        name: "Protein",
        slug: "protein",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/c.jpg",
      },
    ];
  if (path === "/catalog/brands") return [];
  return null;
};

describe("parsePreviewPath", () => {
  it("accepts only shareable page types with plain slugs", () => {
    expect(parsePreviewPath("/product/test-whey")).toEqual({ type: "product", slug: "test-whey" });
    expect(parsePreviewPath("/category/protein/")).toEqual({ type: "category", slug: "protein" });
    expect(parsePreviewPath("/admin/orders")).toBeNull();
    expect(parsePreviewPath("/product/../../etc")).toBeNull();
  });
});

describe("buildPreview", () => {
  it("renders product Open Graph tags, price and JSON-LD", async () => {
    const html = await buildPreview("/product/test-whey", { siteUrl: "https://shop.test", load });
    expect(html).toContain('<meta property="og:type" content="product">');
    expect(html).toContain('<meta property="product:price:amount" content="9000">');
    expect(html).toContain('<link rel="canonical" href="https://shop.test/product/test-whey">');
    expect(html).toContain("og:image");
    expect(html).toContain('"@type":"Product"');
    // The product name is escaped, never injected as markup.
    expect(html).toContain("Test Whey &lt;5 lb&gt;");
    expect(html).not.toContain("<5 lb>");
  });

  it("finds categories by slug and falls back to the generic preview", async () => {
    const category = await buildPreview("/category/protein", {
      siteUrl: "https://shop.test",
      load,
    });
    expect(category).toContain("Protein in Pakistan");
    const missing = await buildPreview("/brand/nope", { siteUrl: "https://shop.test", load });
    expect(missing).toContain("Authentic Sports Nutrition in Pakistan");
  });

  it("keeps script-breaking text out of JSON-LD", () => {
    const html = renderPreviewHtml({
      title: "t",
      description: "d",
      url: "https://shop.test/",
      jsonLd: { name: "</script><script>alert(1)</script>" },
    });
    expect(html).not.toContain("</script><script>alert");
  });
});

describe("renderSitemap", () => {
  it("lists static pages and the catalog with the new URL structure", () => {
    const xml = renderSitemap({
      siteUrl: "https://shop.test",
      categories: [{ slug: "protein", updatedAt: "2026-11-01T00:00:00Z" }],
      brands: [{ slug: "dymatize" }],
      products: [{ slug: "test-whey", updatedAt: "2026-11-05T10:00:00Z" }],
    });
    expect(xml).toContain("<loc>https://shop.test/</loc>");
    expect(xml).toContain(
      "<loc>https://shop.test/category/protein</loc><lastmod>2026-11-01</lastmod>",
    );
    expect(xml).toContain("<loc>https://shop.test/brand/dymatize</loc>");
    expect(xml).toContain(
      "<loc>https://shop.test/product/test-whey</loc><lastmod>2026-11-05</lastmod>",
    );
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/checkout");
  });
});
