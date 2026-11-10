import {
  DEFAULT_DATA_ID,
  isValidPageToken,
  mapSerpReviews,
  serpUrl,
} from "./_lib/google-reviews.js";

/** Six hours at the CDN: a handful of paid SerpAPI calls a day, whatever the traffic. */
const CACHE_OK = "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400";

const json = (body, status, cacheControl) =>
  Response.json(body, { status, headers: { "Cache-Control": cacheControl } });

/**
 * GET /api/google-reviews[?page=<token>] → { rating, total, placeUrl, reviews[], next }.
 * Needs SERPAPI_KEY (and optionally GOOGLE_MAPS_DATA_ID) in the Vercel environment. Without a
 * key it answers 503 and the homepage hides the slider (no made-up reviews, ever).
 */
export async function GET(request) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return json({ error: "not_configured" }, 503, "public, s-maxage=300");

  const pageToken = new URL(request.url).searchParams.get("page");
  if (pageToken && !isValidPageToken(pageToken)) {
    return json({ error: "bad_page" }, 400, "no-store");
  }

  const dataId = process.env.GOOGLE_MAPS_DATA_ID || DEFAULT_DATA_ID;
  try {
    const upstream = await fetch(serpUrl({ apiKey, dataId, pageToken }), {
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) return json({ error: "upstream" }, 502, "public, s-maxage=60");
    const payload = await upstream.json();
    if (payload?.error) return json({ error: "upstream" }, 502, "public, s-maxage=60");
    return json(mapSerpReviews(payload, { dataId }), 200, CACHE_OK);
  } catch {
    return json({ error: "upstream" }, 502, "public, s-maxage=60");
  }
}
