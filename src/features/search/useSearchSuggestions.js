import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDebouncedValue } from "../../lib/hooks";
import { fetchProducts } from "../catalog/api";
import { useTaxonomy } from "../catalog/useTaxonomy";
import { toProductCard } from "../catalog/lib/product-view";

const MIN_CHARS = 2;

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Suggestions for the search box:
 * - products: one request after typing pauses for 300ms (≥2 chars), cached per term; the
 *   previous request is cancelled when the term changes;
 * - categories & brands: matched locally from the cached taxonomy (no request).
 */
export function useSearchSuggestions(term) {
  const trimmed = term.trim();
  const debounced = useDebouncedValue(trimmed, 300);
  const enabled = debounced.length >= MIN_CHARS;
  const { categories, brands } = useTaxonomy();

  const products = useQuery({
    queryKey: ["catalog", "suggest", debounced.toLowerCase()],
    queryFn: ({ signal }) =>
      fetchProducts({ search: debounced, limit: 6, sort: "bestselling" }, { signal }),
    enabled,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    select: (data) => ({
      total: data.meta?.total ?? data.items.length,
      items: data.items.map((p) => toProductCard(p)),
    }),
  });

  const taxonomy = useMemo(() => {
    const q = normalize(trimmed);
    if (q.length < MIN_CHARS) return { categories: [], brands: [] };
    const match = (name) => normalize(name).includes(q);
    return {
      categories: categories.filter((c) => match(c.name)).slice(0, 3),
      brands: brands.filter((b) => match(b.name)).slice(0, 3),
    };
  }, [trimmed, categories, brands]);

  return {
    active: trimmed.length >= MIN_CHARS,
    // While the debounce is pending, show the previous results rather than flashing empty.
    settling: trimmed !== debounced,
    products,
    ...taxonomy,
  };
}
