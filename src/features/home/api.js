import { getData } from "../../lib/api";

/** Public counters: { customers, orders, deliveredParcels, repeatedCustomers } (cached 10 min). */
export const fetchStorefrontStats = ({ signal } = {}) => getData("/stats/storefront", { signal });

/** Homepage videos: real video files (Cloudinary or this site's /reviews/*.mp4), newest first. */
export const fetchReels = ({ signal } = {}) =>
  getData("/reels", { query: { limit: 10 }, signal }).then((d) => d?.reels ?? []);

/**
 * Live Google reviews from our own serverless function (/api/google-reviews), one page at a
 * time. Same-origin, so it is a plain fetch rather than the backend client.
 * @returns {Promise<{ rating: number, total: number, placeUrl: string, reviews: GoogleReview[], next: string|null }>}
 */
export async function fetchGoogleReviews(pageToken, { signal } = {}) {
  const url = pageToken
    ? `/api/google-reviews?page=${encodeURIComponent(pageToken)}`
    : "/api/google-reviews";
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("application/json")) {
    throw new Error(`Google reviews unavailable (${response.status})`);
  }
  return response.json();
}

/**
 * @typedef {object} GoogleReview
 * @property {string} id
 * @property {string} author
 * @property {string} [avatar]
 * @property {number} rating
 * @property {string} date       relative ("2 weeks ago"), as Google shows it
 * @property {string} text
 * @property {string} [link]
 */
