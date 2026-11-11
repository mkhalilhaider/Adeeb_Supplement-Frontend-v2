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

// ── Key lookup ──────────────────────────────────────────────────────────────

/** First non-empty value among several possible variable names. */
export const firstEnv = (env, names) => names.map((n) => env[n]?.trim()).find(Boolean) ?? "";

/** SerpAPI key under any of the names people commonly use (the template says SERPAPI_API_KEY). */
export const SERPAPI_KEY_NAMES = ["SERPAPI_API_KEY", "SERPAPI_KEY", "SERP_API_KEY"];
/** Google Maps Platform key with the Places API (New) enabled. */
export const PLACES_KEY_NAMES = ["GOOGLE_PLACES_API_KEY", "GOOGLE_MAPS_API_KEY", "GOOGLE_API_KEY"];

/** Text used to find the listing when no place id is configured. */
export const PLACE_QUERY = "Adeeb Supplement, Gulshan-e-Iqbal, Karachi";

// ── Google Places API (New) ─────────────────────────────────────────────────
// Official API: rating, review count and the 5 most relevant reviews (no further pages).

export const PLACES_FIELDS = ["id", "rating", "userRatingCount", "reviews", "googleMapsUri"];

/**
 * Request for the listing's reviews: Place Details when the place id is known, otherwise a
 * text search for the shop (the first result).
 */
export function placesRequest({ apiKey, placeId }) {
  const headers = { "X-Goog-Api-Key": apiKey, "Content-Type": "application/json" };
  if (placeId) {
    return {
      url: `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      init: { headers: { ...headers, "X-Goog-FieldMask": PLACES_FIELDS.join(",") } },
    };
  }
  return {
    url: "https://places.googleapis.com/v1/places:searchText",
    init: {
      method: "POST",
      headers: {
        ...headers,
        "X-Goog-FieldMask": PLACES_FIELDS.map((f) => `places.${f}`).join(","),
      },
      body: JSON.stringify({ textQuery: PLACE_QUERY, maxResultCount: 1 }),
    },
  };
}

/** Places payload (details or text search) → the same shape as the SerpAPI mapping. */
export function mapPlacesReviews(payload) {
  const place = payload?.places ? payload.places[0] : payload;
  if (!place) return null;
  const reviews = (place.reviews ?? [])
    .filter((r) => Number(r.rating) >= 1)
    .map((r, i) => ({
      id: String(r.name ?? `review-${i}`),
      author: text(r.authorAttribution?.displayName, 80) || "Google user",
      avatar: /^https:\/\/[\w.-]+\.googleusercontent\.com\//.test(
        r.authorAttribution?.photoUri ?? "",
      )
        ? r.authorAttribution.photoUri
        : undefined,
      rating: Math.max(1, Math.min(5, Math.round(Number(r.rating)))),
      date: text(r.relativePublishTimeDescription, 40),
      text: text(r.originalText?.text ?? r.text?.text, 1200),
      link: /^https:\/\/(www\.)?google\.[a-z.]+\//.test(r.googleMapsUri ?? "")
        ? r.googleMapsUri
        : undefined,
    }));
  return {
    rating: Number(place.rating) || null,
    total: Number(place.userRatingCount) || null,
    placeUrl: /^https:\/\//.test(place.googleMapsUri ?? "") ? place.googleMapsUri : undefined,
    reviews,
    next: null,
  };
}
