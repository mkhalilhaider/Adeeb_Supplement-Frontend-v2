import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchBrands, fetchCategories, fetchProducts } from "./api";

/** Query keys for the catalog feature — the only place they are spelled out. */
export const catalogKeys = {
  all: ["catalog"],
  categories: () => [...catalogKeys.all, "categories"],
  brands: () => [...catalogKeys.all, "brands"],
  products: (query) => [...catalogKeys.all, "products", query],
  productPages: (query) => [...catalogKeys.all, "product-pages", query],
};

/**
 * Paged product list for "Load more": page 1 first, further pages only on request. Changing
 * filters switches to another cache entry (the old request is cancelled); going back restores
 * the already-loaded pages from cache without refetching.
 * @param {import("./api").ProductQuery} query  Without `page`
 * @param {{ enabled?: boolean }} [options]
 */
export function useProductPages(query, { enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: catalogKeys.productPages(query),
    queryFn: ({ pageParam, signal }) => fetchProducts({ ...query, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta && last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled,
  });
}

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
