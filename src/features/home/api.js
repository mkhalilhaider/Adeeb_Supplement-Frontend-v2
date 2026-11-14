import { getData } from "../../lib/api";

/** Public counters: { customers, orders, deliveredParcels, repeatedCustomers } (cached 10 min). */
export const fetchStorefrontStats = ({ signal } = {}) => getData("/stats/storefront", { signal });

/** Homepage videos: real video files (Cloudinary or this site's /reviews/*.mp4), newest first. */
export const fetchReels = ({ signal } = {}) =>
  getData("/reels", { query: { limit: 10 }, signal }).then((d) => d?.reels ?? []);

/**
 * Reviews copied from Google by the admin (Admin → Reviews), in the admin's order, with the
 * rating summary. Each may carry the product it's about (name, slug, one photo, price).
 * @returns {Promise<{ items: any[], summary: { count: number, average: number|null } }>}
 */
export const fetchTestimonials = ({ signal } = {}) =>
  getData("/testimonials", { query: { limit: 24 }, signal });
