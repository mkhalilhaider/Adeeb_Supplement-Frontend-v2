import { tidyAttribute } from "../../../lib/format";
import { defaultVariant, isPurchasable } from "../../catalog/lib/product-view";

/** @typedef {import("../../../types").Variant} Variant */

/** Attributes a variant can differ by, in the order they're shown. */
export const DIMENSIONS = [
  { key: "flavor", label: "Flavour" },
  { key: "weight", label: "Size" },
  { key: "serving", label: "Servings" },
];

/** Comparable key for a free-text attribute ("5LBS" and "5 lbs" are the same option). */
export const attrKey = (value) => tidyAttribute(value).toLowerCase();

/** Variants a customer may see (switched-off ones are hidden entirely). */
export function visibleVariants(product) {
  return (product?.variants ?? []).filter((v) => v.status !== "inactive");
}

/**
 * The attributes worth a picker: only those with more than one distinct value.
 * @param {Variant[]} variants
 * @returns {{ key: string, label: string, options: { key: string, label: string }[] }[]}
 */
export function pickerDimensions(variants) {
  return DIMENSIONS.map((dim) => {
    const seen = new Map();
    for (const v of variants) {
      const raw = v.attributes?.[dim.key];
      const key = attrKey(raw);
      if (key && !seen.has(key)) seen.set(key, tidyAttribute(raw));
    }
    return { ...dim, options: [...seen].map(([key, label]) => ({ key, label })) };
  }).filter((dim) => dim.options.length > 1);
}

const matches = (variant, dimKey, optionKey) => attrKey(variant.attributes?.[dimKey]) === optionKey;

/**
 * How an option looks next to the current selection:
 * - "selected"    the current variant has it
 * - "available"   choosing it gives a sellable variant (other choices may change to match)
 * - "soldout"     every variant with it is out of stock
 *
 * @param {Variant[]} variants
 * @param {Variant} current
 * @param {string} dimKey
 * @param {string} optionKey
 */
export function optionState(variants, current, dimKey, optionKey) {
  if (current && matches(current, dimKey, optionKey)) return "selected";
  const withOption = variants.filter((v) => matches(v, dimKey, optionKey));
  return withOption.some(isPurchasable) ? "available" : "soldout";
}

/**
 * The variant to switch to when an option is picked. Keeps the shopper's other choices when a
 * variant exists for them, prefers something sellable, and falls back gracefully.
 */
export function pickVariant(variants, current, dimKeys, dimKey, optionKey) {
  const withOption = variants.filter((v) => matches(v, dimKey, optionKey));
  const keepsOthers = (v) =>
    dimKeys.every(
      (k) => k === dimKey || attrKey(v.attributes?.[k]) === attrKey(current?.attributes?.[k]),
    );
  return (
    withOption.find((v) => keepsOthers(v) && isPurchasable(v)) ??
    withOption.find(isPurchasable) ??
    withOption.find(keepsOthers) ??
    withOption[0] ??
    current
  );
}

/** Variant from the `?variant=` param, else the default. Ignores ids that don't belong. */
export function initialVariant(product, variantId) {
  const visible = visibleVariants(product);
  return visible.find((v) => v._id === variantId) ?? defaultVariant({ variants: visible }) ?? null;
}

/**
 * Images for the gallery: the chosen variant's own, else the default variant's, else any.
 * De-duplicated by URL (the main image is often also the first gallery image).
 */
export function galleryImages(product, variant) {
  const collect = (v) => [v?.image, ...(v?.images ?? [])].filter((img) => img?.url);
  const visible = visibleVariants(product);
  const chosen = collect(variant);
  const source = chosen.length
    ? chosen
    : collect(defaultVariant({ variants: visible })).length
      ? collect(defaultVariant({ variants: visible }))
      : visible.flatMap(collect);
  const seen = new Set();
  return source.filter((img) => !seen.has(img.url) && seen.add(img.url));
}

/** Short variant description for carts and toasts: "Chocolate · 5 lbs". */
export function variantLabel(variant) {
  const a = variant?.attributes ?? {};
  return [a.flavor, a.weight].map(tidyAttribute).filter(Boolean).join(" · ");
}
