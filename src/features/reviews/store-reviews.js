import { getData } from "../../lib/api";

/**
 * The store's reviews (copied from Google in Admin → Reviews), as shown on a product page:
 * reviews about this product first, then the ones switched on for every product page.
 * Shared by the rating line under the product name and the reviews section, so it is
 * requested once per product.
 *
 * @returns {Promise<{ items: any[], summary: { count: number, average: number|null,
 *   stars: { stars: number, count: number }[] } }>}
 */
export const fetchProductStoreReviews = (productId, { signal } = {}) =>
  getData("/testimonials", { query: { product: productId, limit: 20 }, signal });

export const productStoreReviewsKey = (productId) => ["store-reviews", "product", productId];

const DAY = 86_400_000;

/** "3 days ago", "2 weeks ago", "5 months ago" — the way Google shows review dates. */
export function timeAgo(value) {
  if (!value) return "";
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / DAY));
  const unit = (n, word) => `${n} ${word}${n === 1 ? "" : "s"} ago`;
  if (days < 1) return "Today";
  if (days < 7) return unit(days, "day");
  if (days < 31) return unit(Math.floor(days / 7), "week");
  if (days < 365) return unit(Math.floor(days / 30), "month");
  return unit(Math.floor(days / 365), "year");
}
