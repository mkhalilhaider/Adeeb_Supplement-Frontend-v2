import { discountPercent, tidyAttribute } from "../../../lib/format";

/** @typedef {import("../../../types").Product} Product */
/** @typedef {import("../../../types").Variant} Variant */

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_FOR_DAYS = 30;

/** The price a customer actually pays for a variant. */
export const paidPrice = (variant) => variant.salePrice ?? variant.price;

/** Sellable right now: not switched off, not marked out of stock, and units on hand. */
export function isPurchasable(variant) {
  return (
    variant.status !== "inactive" && variant.status !== "out_of_stock" && variant.stockQuantity > 0
  );
}

/** Main image of a variant: `image`, else the first gallery image. */
export function variantImage(variant) {
  if (variant?.image?.url) return variant.image;
  return variant?.images?.find((img) => img?.url) ?? null;
}

/** Variant shown first: the admin's default (if not switched off), else the first sellable one. */
export function defaultVariant(product) {
  const variants = product?.variants ?? [];
  return (
    variants.find((v) => v.isDefault && v.status !== "inactive") ??
    variants.find(isPurchasable) ??
    variants.find((v) => v.status !== "inactive") ??
    variants[0] ??
    null
  );
}

/**
 * @typedef {object} ProductCardModel
 * @property {string} id
 * @property {string} slug
 * @property {string} href
 * @property {string} name
 * @property {string} brand
 * @property {string} category
 * @property {{url: string}|null} image
 * @property {{url: string}|null} secondImage
 * @property {number} price          Regular price of the cheapest sellable variant
 * @property {number|null} salePrice
 * @property {boolean} priceFrom     Variants are priced differently ("From …")
 * @property {number} discount       Whole percent off, 0 when not on sale
 * @property {boolean} inStock
 * @property {number|null} stockLeft Units left when low, else null
 * @property {number} rating
 * @property {number} reviewCount
 * @property {string|null} variantHint "4 flavours" / "2 sizes"
 * @property {boolean} isNew
 * @property {string|null} quickAddVariantId Set only when there is exactly one variant to buy
 */

/**
 * Everything a product card needs, computed once from the API product (so the card itself
 * stays a dumb component and the rules are unit-tested).
 *
 * @param {Product} product
 * @param {{ now?: number }} [options]
 * @returns {ProductCardModel}
 */
export function toProductCard(product, { now = Date.now() } = {}) {
  const variants = (product.variants ?? []).filter((v) => v.status !== "inactive");
  const buyable = variants.filter(isPurchasable);
  const pricePool = buyable.length > 0 ? buyable : variants;
  const cheapest = pricePool.reduce(
    (min, v) => (min == null || paidPrice(v) < paidPrice(min) ? v : min),
    null,
  );

  const main = defaultVariant(product);
  const image = variantImage(main) ?? variants.map(variantImage).find(Boolean) ?? null;
  const secondImage =
    (main?.images ?? []).find((img) => img?.url && img.url !== image?.url) ?? null;

  const totalStock = buyable.reduce((sum, v) => sum + v.stockQuantity, 0);
  const threshold = buyable.length ? Math.min(...buyable.map((v) => v.lowStockThreshold ?? 5)) : 0;
  const lowStock = buyable.length > 0 && totalStock <= threshold;

  const distinct = (key) =>
    new Set(variants.map((v) => tidyAttribute(v.attributes?.[key])).filter(Boolean)).size;
  const flavours = distinct("flavor");
  const sizes = distinct("weight");
  const variantHint = flavours > 1 ? `${flavours} flavours` : sizes > 1 ? `${sizes} sizes` : null;

  const created = Date.parse(product.createdAt);
  const price = cheapest?.price ?? 0;
  const salePrice = cheapest?.salePrice ?? null;

  return {
    id: product._id,
    slug: product.slug,
    href: `/product/${product.slug}`,
    name: product.name,
    brand: product.brand?.name ?? "",
    category: product.category?.name ?? "",
    image,
    secondImage,
    price,
    salePrice,
    priceFrom: new Set(pricePool.map(paidPrice)).size > 1,
    discount: discountPercent(price, salePrice),
    inStock: buyable.length > 0,
    stockLeft: lowStock ? totalStock : null,
    rating: product.averageRating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    variantHint,
    isNew: Number.isFinite(created) && now - created <= NEW_FOR_DAYS * DAY_MS,
    quickAddVariantId: variants.length === 1 && buyable.length === 1 ? buyable[0]._id : null,
  };
}

/**
 * Up to two badges, most important first: Sold out › Only N left › −X%.
 * "New" is deliberately not a card badge: most of the catalog was (re)added within weeks, so it
 * would sit on nearly every card. Newness is shown by the "New arrivals" rail instead.
 * @param {ProductCardModel} card
 * @returns {{ label: string, tone: "danger"|"warning"|"sale" }[]}
 */
export function cardBadges(card) {
  const badges = [];
  if (!card.inStock) badges.push({ label: "Sold out", tone: "danger" });
  else if (card.stockLeft != null)
    badges.push({ label: `Only ${card.stockLeft} left`, tone: "warning" });
  if (card.inStock && card.discount > 0) badges.push({ label: `−${card.discount}%`, tone: "sale" });
  return badges.slice(0, 2);
}
