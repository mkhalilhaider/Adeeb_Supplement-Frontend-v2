import { useQuery } from "@tanstack/react-query";
import { fetchBrands, fetchCategories } from "./api";

/** Query keys for the catalog feature — the only place they are spelled out. */
export const catalogKeys = {
  all: ["catalog"],
  categories: () => [...catalogKeys.all, "categories"],
  brands: () => [...catalogKeys.all, "brands"],
};

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
