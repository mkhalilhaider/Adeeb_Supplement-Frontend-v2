import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { getData } from "../../lib/api";
import { ApiError } from "../../lib/api/errors";
import { fetchProduct } from "../catalog/api";
import { variantImage } from "../catalog/lib/product-view";
import { catalogKeys } from "../catalog/queries";
import { fetchDeliveryQuote } from "../delivery/api";
import { checkLine } from "./lib/line-check";

/**
 * @returns {Promise<{ valid: boolean, code: string, discountType: "percentage"|"fixed", discountValue: number, discountAmount: number, finalTotal: number }>}
 */
export const validateCoupon = ({ code, subtotal }) =>
  getData("/coupons/validate", { method: "POST", body: { code, subtotal } });

/**
 * Discount for the applied code at the current subtotal. Re-checked when the subtotal changes
 * (minimum-order rules), never retried on a 4xx (an invalid code stays invalid).
 */
export function useCouponQuote(code, subtotal) {
  return useQuery({
    queryKey: ["coupon", code, Math.round(subtotal)],
    queryFn: () => validateCoupon({ code, subtotal: Math.round(subtotal) }),
    enabled: Boolean(code) && subtotal > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });
}

/** Delivery fee for a zone and subtotal (the backend decides fees and free-delivery). */
export function useDeliveryQuote(zone, subtotal, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["delivery", "quote", zone, Math.round(subtotal)],
    queryFn: ({ signal }) =>
      fetchDeliveryQuote(
        { city: zone === "karachi" ? "Karachi" : "Lahore", subtotal: Math.round(subtotal) },
        { signal },
      ),
    enabled: enabled && subtotal > 0,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60_000,
  });
}

/**
 * Delivery fee for the city typed at checkout (the backend recognises Karachi spellings).
 * Pass an already-debounced city so typing doesn't send a request per letter.
 */
export function useCityDeliveryQuote(city, subtotal) {
  const key = city.trim().toLowerCase();
  return useQuery({
    queryKey: ["delivery", "quote", "city", key, Math.round(subtotal)],
    queryFn: ({ signal }) =>
      fetchDeliveryQuote({ city: city.trim(), subtotal: Math.round(subtotal) }, { signal }),
    enabled: key.length >= 2 && subtotal > 0,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60_000,
  });
}

/**
 * Re-check every cart line against live product data (one CDN-cached request per distinct
 * product, usually 1–3). Returns a map variantId → LineCheck, plus the brand and image the
 * server cart doesn't send.
 * @param {import("./guest-cart").CartLine[]} lines
 */
export function useLineChecks(lines, { enabled = true } = {}) {
  const slugs = [...new Set(lines.map((l) => l.slug).filter(Boolean))];
  const results = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: catalogKeys.product(slug),
      queryFn: ({ signal }) => fetchProduct(slug, { signal }),
      staleTime: 60_000,
      enabled,
      retry: (count, error) => !(error instanceof ApiError && error.isNotFound) && count < 1,
    })),
  });

  const bySlug = new Map(slugs.map((slug, i) => [slug, results[i]]));
  const checks = new Map();
  for (const line of lines) {
    const r = bySlug.get(line.slug);
    const missing = r?.error instanceof ApiError && r.error.isNotFound;
    const product = r?.data;
    const variant = product?.variants?.find((v) => String(v._id) === String(line.variantId));
    checks.set(line.variantId, {
      ...checkLine(line, product, { missing }),
      brand: product?.brand?.name,
      image: variantImage(variant) ?? product?.variants?.map(variantImage).find(Boolean),
    });
  }
  return { checks, checking: results.some((r) => r.isFetching) };
}
