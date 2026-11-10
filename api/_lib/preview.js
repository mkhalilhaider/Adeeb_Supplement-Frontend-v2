import {
  productJsonLd,
  productMeta,
  socialImage,
} from "../../src/features/product/lib/product-seo-core.js";
import { paidPrice, defaultVariant } from "../../src/features/catalog/lib/product-view.js";
import { escapeHtml, jsonForScript } from "./config.js";

const SITE_NAME = "Adeeb Supplement";
const DEFAULT_DESCRIPTION =
  "Authentic whey protein, creatine, pre-workout and mass gainers from 21 trusted brands. Cash on delivery across Pakistan.";

/**
 * Which page a crawler asked for. Only the three shareable page types, with plain slugs.
 * @returns {{ type: "product"|"category"|"brand", slug: string } | null}
 */
export function parsePreviewPath(path) {
  const match = /^\/(product|category|brand)\/([a-z0-9-]{1,200})\/?$/.exec(String(path ?? ""));
  return match ? { type: match[1], slug: match[2] } : null;
}

/**
 * A tiny HTML page with Open Graph / Twitter tags (+ JSON-LD) for link previews in WhatsApp,
 * Facebook, X and friends — they don't run JavaScript. People never see it.
 */
export function renderPreviewHtml({
  title,
  description,
  image,
  url,
  type = "website",
  price,
  jsonLd,
}) {
  const tags = [
    ["og:site_name", SITE_NAME],
    ["og:type", type],
    ["og:title", title],
    ["og:description", description],
    ["og:url", url],
    ["og:image", image],
    ["og:image:width", image ? "1200" : undefined],
    ["og:image:height", image ? "630" : undefined],
    ["product:price:amount", price != null ? String(price) : undefined],
    ["product:price:currency", price != null ? "PKR" : undefined],
  ]
    .filter(([, content]) => content)
    .map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}">`);

  const twitter = [
    ["twitter:card", image ? "summary_large_image" : "summary"],
    ["twitter:title", title],
    ["twitter:description", description],
    ["twitter:image", image],
  ]
    .filter(([, content]) => content)
    .map(([name, content]) => `<meta name="${name}" content="${escapeHtml(content)}">`);

  const ld = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
    .map((block) => `<script type="application/ld+json">${jsonForScript(block)}</script>`)
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(url)}">
${tags.join("\n")}
${twitter.join("\n")}
${ld}
</head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p></body></html>`;
}

/**
 * Build the preview for a path. `load` fetches backend data: load("/catalog/products/x").
 * Unknown or missing pages get the site's generic preview (never an error page).
 */
export async function buildPreview(path, { siteUrl, load }) {
  const target = parsePreviewPath(path);
  const generic = {
    title: `${SITE_NAME} — Authentic Sports Nutrition in Pakistan`,
    description: DEFAULT_DESCRIPTION,
    url: `${siteUrl}/`,
  };
  if (!target) return renderPreviewHtml(generic);

  if (target.type === "product") {
    const product = await load(`/catalog/products/${target.slug}`);
    if (!product) return renderPreviewHtml(generic);
    const meta = productMeta(product);
    const variant = defaultVariant(product);
    return renderPreviewHtml({
      title: meta.title.includes(SITE_NAME) ? meta.title : `${meta.title} | ${SITE_NAME}`,
      description: meta.description || DEFAULT_DESCRIPTION,
      image: meta.image,
      url: `${siteUrl}/product/${product.slug}`,
      type: "product",
      price: variant ? paidPrice(variant) : undefined,
      jsonLd: productJsonLd(product, siteUrl),
    });
  }

  // Categories and brands have no by-slug endpoint: find the slug in the (cached) list.
  const list =
    (await load(target.type === "category" ? "/catalog/categories" : "/catalog/brands")) ?? [];
  const item = list.find((x) => x.slug === target.slug);
  if (!item) return renderPreviewHtml(generic);
  const noun = target.type === "category" ? "" : " supplements";
  return renderPreviewHtml({
    title: `${item.name}${noun} in Pakistan | ${SITE_NAME}`,
    description:
      item.description?.trim() ||
      `Shop authentic ${item.name}${noun} at ${SITE_NAME}. Cash on delivery across Pakistan.`,
    image: socialImage(item.imageUrl || item.logoUrl),
    url: `${siteUrl}/${target.type}/${item.slug}`,
  });
}
