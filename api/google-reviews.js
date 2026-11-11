import {
  DEFAULT_DATA_ID,
  PLACES_KEY_NAMES,
  SERPAPI_KEY_NAMES,
  firstEnv,
  isValidPageToken,
  mapPlacesReviews,
  mapSerpReviews,
  placesRequest,
  serpUrl,
} from "./_lib/google-reviews.js";

/** Six hours at the CDN: a handful of paid API calls a day, whatever the traffic. */
const CACHE_OK = "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400";
const CACHE_FAIL = "public, s-maxage=60";

const json = (body, status, cacheControl) =>
  Response.json(body, { status, headers: { "Cache-Control": cacheControl } });

async function fromSerpApi(apiKey, pageToken) {
  const dataId = process.env.GOOGLE_MAPS_DATA_ID || DEFAULT_DATA_ID;
  const upstream = await fetch(serpUrl({ apiKey, dataId, pageToken }), {
    signal: AbortSignal.timeout(10_000),
  });
  if (!upstream.ok) return null;
  const payload = await upstream.json();
  return payload?.error ? null : mapSerpReviews(payload, { dataId });
}

async function fromPlaces(apiKey) {
  const { url, init } = placesRequest({ apiKey, placeId: process.env.GOOGLE_PLACE_ID?.trim() });
  const upstream = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  if (!upstream.ok) return null;
  return mapPlacesReviews(await upstream.json());
}

/**
 * GET /api/google-reviews[?page=<token>] → { rating, total, placeUrl, reviews[], next }.
 *
 * Source, in order of preference (set in the Vercel environment, never in VITE_ variables):
 * - SerpAPI key (SERPAPI_API_KEY / SERPAPI_KEY): every review, page by page.
 * - Google Places API key (GOOGLE_PLACES_API_KEY / GOOGLE_MAPS_API_KEY / GOOGLE_API_KEY):
 *   the official API, which returns the 5 most relevant reviews (one page).
 * Without either it answers 503 and the homepage shows a link to the Google listing — no
 * stored or invented reviews, ever.
 */
export async function GET(request) {
  const serpKey = firstEnv(process.env, SERPAPI_KEY_NAMES);
  const placesKey = firstEnv(process.env, PLACES_KEY_NAMES);
  if (!serpKey && !placesKey) return json({ error: "not_configured" }, 503, "public, s-maxage=300");

  const pageToken = new URL(request.url).searchParams.get("page");
  if (pageToken && !isValidPageToken(pageToken))
    return json({ error: "bad_page" }, 400, "no-store");

  try {
    const result = serpKey ? await fromSerpApi(serpKey, pageToken) : await fromPlaces(placesKey);
    if (!result) return json({ error: "upstream" }, 502, CACHE_FAIL);
    return json(result, 200, CACHE_OK);
  } catch {
    return json({ error: "upstream" }, 502, CACHE_FAIL);
  }
}
