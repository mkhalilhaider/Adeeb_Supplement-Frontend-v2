import { describe, expect, it } from "vitest";
import {
  galleryImages,
  initialVariant,
  optionState,
  pickerDimensions,
  pickVariant,
} from "./variant-matrix";

const img = (id) => ({
  url: `https://res.cloudinary.com/x/image/upload/v1/${id}.webp`,
  publicId: id,
});
const v = (id, attributes, extra = {}) => ({
  _id: id,
  attributes,
  image: null,
  images: [],
  price: 9000,
  salePrice: null,
  stockQuantity: 10,
  lowStockThreshold: 5,
  status: "active",
  isDefault: false,
  ...extra,
});

/** 2 flavours × 2 sizes, one combination missing, one sold out. */
const variants = [
  v(
    "choc-2",
    { flavor: "CHOCOLATE", weight: "2LBS", serving: "30" },
    { isDefault: true, image: img("c2") },
  ),
  v("choc-5", { flavor: "chocolate", weight: "5 lbs", serving: "74" }, { images: [img("c5")] }),
  v(
    "van-2",
    { flavor: "Vanilla", weight: "2lbs", serving: "30" },
    { stockQuantity: 0, status: "out_of_stock" },
  ),
  // vanilla 5 lbs does not exist
];
const dims = pickerDimensions(variants);
const keys = dims.map((d) => d.key);

describe("pickerDimensions", () => {
  it("shows only attributes with more than one value, treating case/spacing as equal", () => {
    expect(dims.map((d) => [d.key, d.options.map((o) => o.label)])).toEqual([
      ["flavor", ["Chocolate", "Vanilla"]],
      ["weight", ["2 lbs", "5 lbs"]],
      ["serving", ["30", "74"]],
    ]);
  });

  it("returns nothing for a single-variant product", () => {
    expect(pickerDimensions([variants[0]])).toEqual([]);
  });
});

describe("optionState", () => {
  const current = variants[0];
  it("marks the current choices as selected", () => {
    expect(optionState(variants, current, "flavor", "chocolate")).toBe("selected");
    expect(optionState(variants, current, "weight", "2 lbs")).toBe("selected");
  });
  it("marks an option sold out when every variant with it is out of stock", () => {
    expect(optionState(variants, current, "flavor", "vanilla")).toBe("soldout");
  });
  it("marks an option available when a sellable variant has it", () => {
    expect(optionState(variants, current, "weight", "5 lbs")).toBe("available");
  });
});

describe("pickVariant", () => {
  it("keeps other choices when that combination exists", () => {
    expect(pickVariant(variants, variants[0], keys, "weight", "5 lbs")._id).toBe("choc-5");
  });
  it("adjusts other choices when the combination doesn't exist", () => {
    // From chocolate 5 lbs, picking vanilla → the only vanilla (2 lbs), even though sold out.
    expect(pickVariant(variants, variants[1], keys, "flavor", "vanilla")._id).toBe("van-2");
  });
});

describe("initialVariant", () => {
  const product = { variants };
  it("uses a valid ?variant= id", () => {
    expect(initialVariant(product, "choc-5")._id).toBe("choc-5");
  });
  it("falls back to the default for unknown ids", () => {
    expect(initialVariant(product, "nope")._id).toBe("choc-2");
  });
});

describe("galleryImages", () => {
  const product = { variants };
  it("uses the chosen variant's images", () => {
    expect(galleryImages(product, variants[1]).map((i) => i.publicId)).toEqual(["c5"]);
  });
  it("falls back to the default variant's images when the chosen one has none", () => {
    expect(galleryImages(product, variants[2]).map((i) => i.publicId)).toEqual(["c2"]);
  });
  it("de-duplicates the main image repeated in the gallery", () => {
    const p = { variants: [v("a", {}, { image: img("x"), images: [img("x"), img("y")] })] };
    expect(galleryImages(p, p.variants[0]).map((i) => i.publicId)).toEqual(["x", "y"]);
  });
});
