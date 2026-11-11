import { queryClient } from "../../lib/query-client";
import { fetchProduct } from "./api";
import { catalogKeys, findProductInLists } from "./queries";

/**
 * Route loader for /product/:slug: starts the product request while the page's code is still
 * downloading, instead of after. Returns at once (never holds up navigation). Skipped when a
 * list already holds the product — the page then renders from that instantly.
 */
export function prefetchProduct({ params }) {
  const slug = params.slug;
  if (!slug || findProductInLists(queryClient, slug)) return null;
  queryClient.prefetchQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: ({ signal }) => fetchProduct(slug, { signal }),
    staleTime: 60_000,
  });
  return null;
}
