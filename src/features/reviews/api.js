import { getData } from "../../lib/api";

/**
 * @typedef {object} Review
 * @property {string} _id
 * @property {number} rating        1–5
 * @property {string} title
 * @property {string} comment
 * @property {boolean} isVerifiedPurchase
 * @property {{ firstName?: string, lastName?: string } | undefined} user
 * @property {string} createdAt
 */

/**
 * All reviews for a product, newest first, plus the stored summary.
 * @returns {Promise<{ productId: string, count: number, average: number, reviews: Review[] }>}
 */
export const fetchProductReviews = (productId, { signal } = {}) =>
  getData(`/products/${productId}/reviews`, { signal });
