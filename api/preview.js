import { buildPreview } from "./_lib/preview.js";
import { SITE_URL, backendData } from "./_lib/config.js";

/**
 * GET /api/preview?path=/product/<slug> — link-preview HTML for social crawlers. The
 * middleware sends only crawler user-agents here; people always get the normal app.
 */
export async function GET(request) {
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  try {
    const html = await buildPreview(path, { siteUrl: SITE_URL, load: backendData });
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    // Backend down: a generic preview is better than none.
    const html = await buildPreview("/", { siteUrl: SITE_URL, load: async () => null });
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, s-maxage=60",
      },
    });
  }
}
