/**
 * Listing state ⇄ URL. Every filter, the sort and the page live in the URL so results are
 * shareable, survive refresh, and work with the back button.
 *
 * URL shape (slugs, never ids — readable and stable):
 *   /shop?q=whey&sort=price_asc&min=5000&max=9999&featured=1&page=2
 *   /category/protein?brand=dymatize
 *   /brand/dymatize?category=protein
 * The page's own dimension is in the path; the other one (if any) in the query.
 */

export const PAGE_SIZE = 24;
export const DEFAULT_SORT = "bestselling";

export const SORTS = [
  { value: "bestselling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];
const SORT_VALUES = new Set(SORTS.map((s) => s.value));

/** Price bands sized to the real catalogue (Rs 3,200 – 45,000, median 8,500). */
export const PRICE_PRESETS = [
  { id: "under-5000", label: "Under Rs 5,000", min: undefined, max: 4999 },
  { id: "5000-10000", label: "Rs 5,000 – 10,000", min: 5000, max: 9999 },
  { id: "10000-20000", label: "Rs 10,000 – 20,000", min: 10000, max: 19999 },
  { id: "20000-plus", label: "Rs 20,000 and above", min: 20000, max: undefined },
];

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function positiveInt(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function slugOrUndefined(value) {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  return SLUG.test(s) ? s : undefined;
}

/**
 * @typedef {object} ListingState
 * @property {string} [q]
 * @property {string} [category] slug
 * @property {string} [brand]    slug
 * @property {number} [min]
 * @property {number} [max]
 * @property {boolean} featured
 * @property {string} sort
 * @property {number} page       how many pages are shown ("Load more" count), ≥ 1
 */

/**
 * Read listing state from the URL. Invalid values are dropped, never thrown on.
 * @param {URLSearchParams} params
 * @param {{ category?: string, brand?: string }} [base]  Slug from the path (/category/:slug …)
 * @returns {ListingState}
 */
export function parseListing(params, base = {}) {
  let min = positiveInt(params.get("min"));
  let max = positiveInt(params.get("max"));
  if (min != null && max != null && min > max) [min, max] = [max, min];
  const sort = params.get("sort");
  const q = (params.get("q") ?? "").trim().slice(0, 80);

  return {
    q: q || undefined,
    category: base.category ?? slugOrUndefined(params.get("category")),
    brand: base.brand ?? slugOrUndefined(params.get("brand")),
    min,
    max,
    featured: params.get("featured") === "1",
    sort: SORT_VALUES.has(sort) ? sort : DEFAULT_SORT,
    page: Math.min(positiveInt(params.get("page")) ?? 1, 20),
  };
}

/**
 * Where a listing state lives. The current page type is kept while its dimension is still set
 * (picking a category on a brand page stays on the brand page); otherwise the remaining
 * dimension becomes the path; with neither, it's /shop.
 *
 * @param {ListingState} state
 * @param {"shop"|"category"|"brand"} [prefer]  The current page type
 * @returns {string} path + query
 */
export function listingHref(state, prefer = "shop") {
  const params = new URLSearchParams();
  let path = "/shop";

  const useBrandPath = state.brand && (prefer === "brand" || !state.category);
  if (useBrandPath) {
    path = `/brand/${state.brand}`;
    if (state.category) params.set("category", state.category);
  } else if (state.category) {
    path = `/category/${state.category}`;
    if (state.brand) params.set("brand", state.brand);
  }

  if (state.q) params.set("q", state.q);
  if (state.min != null) params.set("min", String(state.min));
  if (state.max != null) params.set("max", String(state.max));
  if (state.featured) params.set("featured", "1");
  if (state.sort && state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Backend query for the state (ids resolved from slugs). Page is handled by the list itself.
 * @param {ListingState} state
 * @param {{ categoryId?: string, brandId?: string }} ids
 * @returns {import("../api").ProductQuery}
 */
export function toProductQuery(state, { categoryId, brandId } = {}) {
  return {
    search: state.q,
    category: categoryId,
    brand: brandId,
    minPrice: state.min,
    maxPrice: state.max,
    featured: state.featured || undefined,
    sort: state.sort,
    limit: PAGE_SIZE,
  };
}

/** Number of filters the shopper chose (for "Filters (2)"). Search and sort are not filters. */
export function activeFilterCount(state, base = {}) {
  let n = 0;
  if (state.category && !base.category) n += 1;
  if (state.brand && !base.brand) n += 1;
  if (state.min != null || state.max != null) n += 1;
  if (state.featured) n += 1;
  return n;
}

/** The preset matching the current price range, if any. */
export function matchPricePreset(state) {
  return PRICE_PRESETS.find((p) => p.min === state.min && p.max === state.max)?.id ?? null;
}
