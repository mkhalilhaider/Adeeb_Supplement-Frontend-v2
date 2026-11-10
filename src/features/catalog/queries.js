import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchBrands, fetchCategories, fetchProduct, fetchProducts } from "./api";

/** Query keys for the catalog feature — the only place they are spelled out. */
export const catalogKeys = {
  all: ["catalog"],
  categories: () => [...catalogKeys.all, "categories"],
  brands: () => [...catalogKeys.all, "brands"],
  products: (query) => [...catalogKeys.all, "products", query],
  productPages: (query) => [...catalogKeys.all, "product-pages", query],
  product: (slug) => [...catalogKeys.all, "product", slug],
};

/**
 * Find a product that a list already loaded (shop grid, rails, search suggestions). List
 * responses contain the full product, so the product page can render instantly from them.
 * @returns {{ product: import("../../types").Product, updatedAt: number } | null}
 */
function findProductInLists(queryClient, slug) {
  let best = null;
  for (const query of queryClient.getQueryCache().findAll({ queryKey: catalogKeys.all })) {
    const { data, dataUpdatedAt } = query.state;
    // Paged lists store { pages: [{ items }] }; single lists and suggestions store { items }.
    const lists = data?.pages ?? (data?.items ? [data] : []);
    for (const list of lists) {
      const product = list.items?.find((p) => p?.slug === slug && Array.isArray(p.variants));
      if (product && (!best || dataUpdatedAt > best.updatedAt)) {
        best = { product, updatedAt: dataUpdatedAt };
      }
    }
  }
  return best;
}

/**
 * One product by slug. Opening it from a card shows it immediately from the list data; it is
 * refreshed in the background only if that data is older than a minute (prices/stock).
 */
export function useProduct(slug) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: ({ signal }) => fetchProduct(slug, { signal }),
    initialData: () => findProductInLists(queryClient, slug)?.product,
    initialDataUpdatedAt: () => findProductInLists(queryClient, slug)?.updatedAt,
    enabled: Boolean(slug),
  });
}

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
