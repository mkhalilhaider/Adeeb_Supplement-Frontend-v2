import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchBrands, fetchCategories, fetchProducts } from "./api";

/** Query keys for the catalog feature — the only place they are spelled out. */
export const catalogKeys = {
  all: ["catalog"],
  categories: () => [...catalogKeys.all, "categories"],
  brands: () => [...catalogKeys.all, "brands"],
  products: (query) => [...catalogKeys.all, "products", query],
};

/**
 * One page of products. While a new filter loads, the previous results stay on screen (no
 * flash of skeletons); the previous request is cancelled automatically.
 * @param {import("./api").ProductQuery} query
 * @param {{ enabled?: boolean }} [options]
 */
export function useProducts(query, { enabled = true } = {}) {
  return useQuery({
    queryKey: catalogKeys.products(query),
    queryFn: ({ signal }) => fetchProducts(query, { signal }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

const ONE_HOUR = 60 * 60_000;

/** Categories change rarely: cached an hour and persisted, so repeat visits need no request. */
export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: fetchCategories,
    staleTime: ONE_HOUR,
    meta: { persist: true },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: catalogKeys.brands(),
    queryFn: fetchBrands,
    staleTime: ONE_HOUR,
    meta: { persist: true },
  });
}
