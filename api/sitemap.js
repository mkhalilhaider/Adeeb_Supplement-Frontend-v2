import { API_URL, SITE_URL, backendData } from "./_lib/config.js";
import { renderSitemap } from "./_lib/sitemap.js";

const MAX_PAGES = 20; // 2,000 products at 100 per page — far beyond the catalog

/** Every active product, page by page (the list endpoint caps `limit` at 100). */
async function allProducts() {
  const products = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await fetch(`${API_URL}/catalog/products?limit=100&page=${page}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Backend ${response.status}`);
    const body = await response.json();
    products.push(...(body.data ?? []));
    if (page >= (body.meta?.pages ?? 1)) break;
  }
  return products;
}

/** GET /sitemap.xml (rewritten here by vercel.json). Cached at the CDN for an hour. */
export async function GET() {
  try {
    const [categories, brands, products] = await Promise.all([
      backendData("/catalog/categories"),
      backendData("/catalog/brands"),
      allProducts(),
    ]);
    const xml = renderSitemap({
      siteUrl: SITE_URL,
      categories: categories ?? [],
      brands: brands ?? [],
      products,
    });
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "public, s-maxage=60", "Retry-After": "300" },
    });
  }
}
