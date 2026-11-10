import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  listingHref,
  matchPricePreset,
  parseListing,
  toProductQuery,
} from "./listing-params";

const parse = (qs, base) => parseListing(new URLSearchParams(qs), base);

describe("parseListing", () => {
  it("applies defaults", () => {
    expect(parse("")).toEqual({
      q: undefined,
      category: undefined,
      brand: undefined,
      min: undefined,
      max: undefined,
      featured: false,
      sort: "bestselling",
      page: 1,
    });
  });

  it("reads every supported param", () => {
    expect(
      parse("q= whey &brand=Dymatize&min=5000&max=9999&featured=1&sort=price_asc&page=3"),
    ).toMatchObject({
      q: "whey",
      brand: "dymatize",
      min: 5000,
      max: 9999,
      featured: true,
      sort: "price_asc",
      page: 3,
    });
  });

  it("drops invalid values instead of failing", () => {
    expect(parse("sort=cheapest&min=-5&max=abc&page=0&brand=<script>")).toMatchObject({
      sort: "bestselling",
      min: undefined,
      max: undefined,
      page: 1,
      brand: undefined,
    });
  });

  it("swaps a reversed price range and caps the page", () => {
    expect(parse("min=9000&max=1000&page=999")).toMatchObject({ min: 1000, max: 9000, page: 20 });
  });

  it("takes the path dimension over the query", () => {
    expect(parse("category=creatine", { category: "protein" }).category).toBe("protein");
  });
});

describe("listingHref", () => {
  const base = { featured: false, sort: "bestselling", page: 1 };

  it("uses /shop with no category or brand", () => {
    expect(listingHref({ ...base })).toBe("/shop");
    expect(listingHref({ ...base, q: "whey", sort: "newest" })).toBe("/shop?q=whey&sort=newest");
  });

  it("puts the category in the path and brand in the query", () => {
    expect(listingHref({ ...base, category: "protein", brand: "dymatize" })).toBe(
      "/category/protein?brand=dymatize",
    );
  });

  it("stays on a brand page when a category is added there", () => {
    expect(listingHref({ ...base, category: "protein", brand: "dymatize" }, "brand")).toBe(
      "/brand/dymatize?category=protein",
    );
  });

  it("falls back to the remaining dimension when the page's own one is cleared", () => {
    expect(listingHref({ ...base, brand: "dymatize" }, "category")).toBe("/brand/dymatize");
  });

  it("omits defaults and keeps filters", () => {
    expect(listingHref({ ...base, min: 5000, max: 9999, featured: true, page: 2 })).toBe(
      "/shop?min=5000&max=9999&featured=1&page=2",
    );
  });

  it("round-trips through parse", () => {
    const state = parse("q=gold&min=10000&featured=1&sort=newest&page=2", { brand: "dymatize" });
    expect(listingHref(state, "brand")).toBe(
      "/brand/dymatize?q=gold&min=10000&featured=1&sort=newest&page=2",
    );
  });
});

describe("helpers", () => {
  it("builds the backend query with ids", () => {
    const state = parse("q=whey&min=5000&featured=1", { category: "protein" });
    expect(toProductQuery(state, { categoryId: "c1" })).toEqual({
      search: "whey",
      category: "c1",
      brand: undefined,
      minPrice: 5000,
      maxPrice: undefined,
      featured: true,
      sort: "bestselling",
      limit: 24,
    });
  });

  it("counts chosen filters, not the page's own dimension", () => {
    const state = parse("brand=dymatize&min=5000&featured=1", { category: "protein" });
    expect(activeFilterCount(state, { category: "protein" })).toBe(3);
  });

  it("recognises a price preset", () => {
    expect(matchPricePreset(parse("min=5000&max=9999"))).toBe("5000-10000");
    expect(matchPricePreset(parse("min=5000&max=8000"))).toBeNull();
  });
});
