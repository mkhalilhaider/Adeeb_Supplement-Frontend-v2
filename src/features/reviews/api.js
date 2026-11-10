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

/**
 * Write a review (verified buyers only: the order must be confirmed or later). The backend
 * reads productId from the body, not the path. 409 = already reviewed.
 * @param {{ productId: string, orderId: string, rating: number, title?: string, comment?: string }} review
 */
export const createReview = (review) =>
  getData(`/products/${review.productId}/reviews`, { method: "POST", body: review });
