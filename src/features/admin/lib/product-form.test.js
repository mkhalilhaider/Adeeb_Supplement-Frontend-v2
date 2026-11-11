import { describe, expect, it } from "vitest";
import { formToBody, productToForm, validateProductForm } from "./product-form";

const product = {
  name: "Test Whey",
  description: "A protein powder for testing.",
  category: { _id: "c1", name: "Protein" },
  brand: { _id: "b1", name: "Brand" },
  isFeatured: true,
  keywords: ["whey", "protein"],
  variants: [
    {
      _id: "v1",
      sku: "SKU-1",
      attributes: { flavor: "Chocolate", weight: "5 lb" },
      price: 20000,
      salePrice: 18000,
      stockQuantity: 4,
      lowStockThreshold: 2,
      isDefault: false,
      status: "active",
      image: { url: "https://img/1.webp", publicId: "p1" },
    },
    {
      _id: "v2",
      attributes: { flavor: "Vanilla", weight: "5 lb" },
      price: 20000,
      salePrice: null,
      stockQuantity: 0,
      isDefault: true,
      status: "out_of_stock",
    },
  ],
};

describe("product form round trip", () => {
  it("keeps variant ids (and so their SKUs) and exactly one default", () => {
    const body = formToBody(productToForm(product));
    expect(body.category).toBe("c1");
    expect(body.status).toBe("active");
    expect(body.keywords).toEqual(["whey", "protein"]);
    expect(body.variants.map((v) => v._id)).toEqual(["v1", "v2"]);
    expect(body.variants.filter((v) => v.isDefault)).toHaveLength(1);
    expect(body.variants[1].isDefault).toBe(true);
    expect(body.variants[0]).toMatchObject({
      price: 20000,
      salePrice: 18000,
      stockQuantity: 4,
      status: "active",
    });
    expect(body.variants[1]).toMatchObject({ salePrice: null, status: "out_of_stock" });
  });

  it("hides the whole product when switched off", () => {
    const form = productToForm({ ...product, status: "inactive" });
    expect(form.live).toBe(false);
    expect(formToBody({ ...form, live: true }).status).toBe("active");
  });

  it("marks hidden variants inactive", () => {
    const form = productToForm(product);
    form.variants[0].hidden = true;
    expect(formToBody(form).variants[0].status).toBe("inactive");
  });
});

describe("validateProductForm", () => {
  it("accepts a complete product", () => {
    expect(validateProductForm(productToForm(product))).toEqual({});
  });

  it("flags missing basics and bad prices", () => {
    const form = productToForm(null);
    form.variants[0].price = "0";
    form.variants[0].salePrice = "50";
    const errors = validateProductForm(form);
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        "name",
        "description",
        "category",
        "brand",
        "variants.0.price",
        "variants.0.salePrice",
      ]),
    );
  });

  it("refuses duplicate variants", () => {
    const form = productToForm(product);
    form.variants[1].flavor = "chocolate";
    expect(validateProductForm(form).variants).toMatch(/same flavour/);
  });
});
