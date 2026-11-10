/**
 * Pure helpers for /api/google-reviews (files under api/_lib are not deployed as routes).
 * Source: SerpAPI "Google Maps Reviews" (engine=google_maps_reviews), one page per call.
 */

/** Data id of the Adeeb Supplement listing, from its public Google Maps link. */
export const DEFAULT_DATA_ID = "0x3eb33f006bebfe79:0xf3122b83a6454335";

/** SerpAPI page tokens are opaque base64-ish strings; anything else is refused. */
export function isValidPageToken(token) {
  return typeof token === "string" && /^[A-Za-z0-9_\-=]{1,600}$/.test(token);
}

/**
 * The SerpAPI request URL for one page. The first page can't take `num`; later pages return up
 * to 20 reviews each.
 */
export function serpUrl({ apiKey, dataId, pageToken }) {
  const params = new URLSearchParams({
    engine: "google_maps_reviews",
    data_id: dataId,
    hl: "en",
    sort_by: "newestFirst",
    api_key: apiKey,
  });
  if (pageToken) {
    params.set("next_page_token", pageToken);
    params.set("num", "12");
  }
  return `https://serpapi.com/search.json?${params}`;
}

const text = (value, max) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

/**
 * Keep only what the slider shows; drop everything else SerpAPI returns.
 * @param {any} payload  SerpAPI response
 * @param {{ dataId: string }} opts
 */
export function mapSerpReviews(payload, { dataId }) {
  const place = payload?.place_info ?? {};
  const reviews = (payload?.reviews ?? [])
    .filter((r) => r && Number(r.rating) >= 1)
    .map((r, i) => ({
      id: String(r.review_id ?? `${r.user?.name ?? "review"}-${r.iso_date ?? i}`),
      author: text(r.user?.name, 80) || "Google user",
      avatar: /^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(r.user?.thumbnail ?? "")
        ? r.user.thumbnail
        : undefined,
      rating: Math.max(1, Math.min(5, Math.round(Number(r.rating)))),
      date: text(r.date, 40),
      text: text(r.extracted_snippet?.original ?? r.snippet, 1200),
      link: /^https:\/\/(www\.)?google\.[a-z.]+\//.test(r.link ?? "") ? r.link : undefined,
    }));
  return {
    rating: Number(place.rating) || null,
    total: Number(place.reviews) || null,
    placeUrl: `https://www.google.com/maps/place/data=!4m2!3m1!1s${dataId}`,
    reviews,
    next: payload?.serpapi_pagination?.next_page_token ?? null,
  };
}
