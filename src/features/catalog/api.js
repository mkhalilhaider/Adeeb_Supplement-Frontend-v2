import { getData } from "../../lib/api";

/** @typedef {import("../../types").Category} Category */
/** @typedef {import("../../types").Brand} Brand */

/** Active categories, sorted by name. @returns {Promise<Category[]>} */
export const fetchCategories = ({ signal } = {}) => getData("/catalog/categories", { signal });

/** Active brands, sorted by name. @returns {Promise<Brand[]>} */
export const fetchBrands = ({ signal } = {}) => getData("/catalog/brands", { signal });
