import { escapeHtml } from "./config.js";

/** Pages that exist without catalog data. Account, cart, checkout and admin are left out. */
export const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/shop", priority: "0.9", changefreq: "daily" },
  { path: "/brands", priority: "0.6", changefreq: "weekly" },
  { path: "/about", priority: "0.4", changefreq: "monthly" },
  { path: "/contact", priority: "0.4", changefreq: "monthly" },
  { path: "/track-order", priority: "0.3", changefreq: "monthly" },
  { path: "/refund-policy", priority: "0.2", changefreq: "yearly" },
  { path: "/privacy", priority: "0.2", changefreq: "yearly" },
  { path: "/terms", priority: "0.2", changefreq: "yearly" },
];

const day = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
};

/**
 * sitemap.xml using the new URL structure (/product, /category, /brand).
 * @param {{ siteUrl: string, categories: any[], brands: any[], products: any[] }} input
 */
export function renderSitemap({ siteUrl, categories, brands, products }) {
  const entries = [
    ...STATIC_PAGES.map((p) => ({ ...p, loc: `${siteUrl}${p.path}` })),
    ...categories.map((c) => ({
      loc: `${siteUrl}/category/${c.slug}`,
      lastmod: day(c.updatedAt),
      priority: "0.8",
      changefreq: "weekly",
    })),
    ...brands.map((b) => ({
      loc: `${siteUrl}/brand/${b.slug}`,
      lastmod: day(b.updatedAt),
      priority: "0.7",
      changefreq: "weekly",
    })),
    ...products.map((p) => ({
      loc: `${siteUrl}/product/${p.slug}`,
      lastmod: day(p.updatedAt),
      priority: "0.8",
      changefreq: "weekly",
    })),
  ].filter((e) => /^https?:\/\/[^\s]+$/.test(e.loc));

  const urls = entries
    .map(
      (e) =>
        `<url><loc>${escapeHtml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
