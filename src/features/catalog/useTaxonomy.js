import { useMemo } from "react";
import { useBrands, useCategories } from "./queries";

/**
 * Categories + brands with slug lookups. The backend filters by id but URLs use slugs, so every
 * listing resolves slugs here. Both lists are cached for an hour and persisted, so after the
 * first visit this costs no requests.
 */
export function useTaxonomy() {
  const categoriesQuery = useCategories();
  const brandsQuery = useBrands();

  const value = useMemo(() => {
    const categories = categoriesQuery.data ?? [];
    const brands = brandsQuery.data ?? [];
    return {
      categories,
      brands,
      categoryBySlug: new Map(categories.map((c) => [c.slug, c])),
      brandBySlug: new Map(brands.map((b) => [b.slug, b])),
    };
  }, [categoriesQuery.data, brandsQuery.data]);

  return {
    ...value,
    isPending: categoriesQuery.isPending || brandsQuery.isPending,
    error: categoriesQuery.error ?? brandsQuery.error ?? null,
    refetch: () => Promise.all([categoriesQuery.refetch(), brandsQuery.refetch()]),
  };
}
