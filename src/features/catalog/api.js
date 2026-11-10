import { getData, request } from "../../lib/api";

/** @typedef {import("../../types").Category} Category */
/** @typedef {import("../../types").Brand} Brand */

/** Active categories, sorted by name. @returns {Promise<Category[]>} */
export const fetchCategories = ({ signal } = {}) => getData("/catalog/categories", { signal });

/** Active brands, sorted by name. @returns {Promise<Brand[]>} */
export const fetchBrands = ({ signal } = {}) => getData("/catalog/brands", { signal });

/**
 * @typedef {object} ProductQuery
 * @property {string} [search]
 * @property {string} [category]   Category _id (not slug — the backend rejects slugs)
 * @property {string} [brand]      Brand _id
 * @property {boolean} [featured]
 * @property {number} [minPrice]
 * @property {number} [maxPrice]
 * @property {"newest"|"bestselling"|"price_asc"|"price_desc"} [sort]
 * @property {number} [page]
 * @property {number} [limit]      1–100
 */

/**
 * One page of active products. Returns items plus paging info from `meta`.
 * @param {ProductQuery} query
 * @returns {Promise<{ items: import("../../types").Product[], meta: import("../../types").ListMeta }>}
 */
export async function fetchProducts(query = {}, { signal } = {}) {
  const { featured, ...rest } = query;
  const envelope = await request("/catalog/products", {
    query: { ...rest, featured: featured ? "true" : undefined },
    signal,
  });
  return { items: envelope.data ?? [], meta: envelope.meta };
}
