/**
 * Product SEO without any build-time configuration, so the same code serves the product page
 * and the crawler-preview function (api/preview.js) on Node.
 */
import { site } from "../../../config/site.js";
import { cloudinaryUrl } from "../../../lib/cloudinary.js";
import { isPurchasable, paidPrice, variantImage } from "../../catalog/lib/product-view.js";
import { summarize } from "./description.js";

/** 1200×630 social preview: packshot centred on the page tone. */
export function socialImage(url) {
  if (!url) return undefined;
  const padded = cloudinaryUrl(url, {
    w: 1200,
    h: 630,
    crop: "pad",
    trim: true,
    background: "f6f4ef",
  });
  // A real JPEG: some chat apps don't show WebP previews (f_auto can't help — crawlers vary).
  return padded.replace("/f_auto,", "/f_jpg,").replace(/\.(webp|png|avif)(\?.*)?$/i, ".jpg");
}

/** Title, description and image for <Seo>, preferring what the admin wrote. */
export function productMeta(product) {
  const image = variantImage(product.variants?.find((v) => v.isDefault) ?? product.variants?.[0]);
  return {
    title: product.metaTitle?.trim() || `${product.name} price in Pakistan`,
    description: product.metaDescription?.trim() || summarize(product.description),
    image: socialImage(image?.url),
  };
}

/**
 * schema.org Product + BreadcrumbList from real data only (price, stock, brand, rating).
 * @param {import("../../../types").Product} product
 * @param {string} siteUrl  e.g. "https://www.adeebsupplement.pk" (no trailing slash)
 */
export function productJsonLd(product, siteUrl) {
  const url = `${siteUrl}/product/${product.slug}`;
  const variants = (product.variants ?? []).filter((v) => v.status !== "inactive");
  const prices = variants.map(paidPrice);
  const inStock = variants.some(isPurchasable);
  const images = [...new Set(variants.map((v) => variantImage(v)?.url).filter(Boolean))].slice(
    0,
    5,
  );
  const availability = `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`;

  const offers =
    variants.length > 1 && new Set(prices).size > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "PKR",
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          offerCount: variants.length,
          availability,
          url,
        }
      : {
          "@type": "Offer",
          priceCurrency: "PKR",
          price: prices[0] ?? 0,
          availability,
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: site.name },
          url,
        };

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: summarize(product.description, 500),
    image: images,
    sku: variants[0]?.sku,
    brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
    category: product.category?.name,
    offers,
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${siteUrl}/shop` },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${siteUrl}/category/${product.category.slug}`,
            },
          ]
        : []),
      { "@type": "ListItem", position: product.category ? 3 : 2, name: product.name, item: url },
    ],
  };

  return [productLd, crumbs];
}
