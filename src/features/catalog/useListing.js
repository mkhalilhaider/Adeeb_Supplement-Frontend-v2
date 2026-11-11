import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useProductPages } from "./queries";
import { useTaxonomy } from "./useTaxonomy";
import { toProductCard } from "./lib/product-view";
import { listingHref, parseListing, toProductQuery } from "./lib/listing-params";

/**
 * Everything a listing page needs: state from the URL, slugs resolved to ids, paged products,
 * and actions that update the URL (which in turn drives the data).
 *
 * @param {{ type: "shop"|"category"|"brand", slug?: string }} page
 */
export function useListing(page) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const taxonomy = useTaxonomy();

  const base = useMemo(
    () =>
      page.type === "category"
        ? { category: page.slug }
        : page.type === "brand"
          ? { brand: page.slug }
          : {},
    [page.type, page.slug],
  );
  const state = useMemo(() => parseListing(params, base), [params, base]);

  const category = state.category ? taxonomy.categoryBySlug.get(state.category) : undefined;
  const brand = state.brand ? taxonomy.brandBySlug.get(state.brand) : undefined;
  // The page's own slug must exist; an unknown slug from the query string is simply ignored.
  const notFound =
    !taxonomy.isPending &&
    ((page.type === "category" && !category) || (page.type === "brand" && !brand));

  const query = useMemo(
    () => toProductQuery(state, { categoryId: category?._id, brandId: brand?._id }),
    [state, category?._id, brand?._id],
  );
  // Wait for slug → id resolution, otherwise we'd briefly fetch unfiltered products. With no
  // category/brand in play there's nothing to resolve, so don't wait for the taxonomy at all.
  const needsTaxonomy = Boolean(state.category || state.brand);
  const ready = !needsTaxonomy || (!taxonomy.isPending && !notFound);
  const list = useProductPages(query, { enabled: ready });

  // Restore "Load more" depth after a refresh or a shared link (?page=3 → load pages 1–3).
  const loadedPages = list.data?.pages.length ?? 0;
  const { isSuccess, isFetching, hasNextPage, fetchNextPage } = list;
  useEffect(() => {
    if (isSuccess && !isFetching && hasNextPage && loadedPages < state.page) fetchNextPage();
  }, [isSuccess, isFetching, hasNextPage, fetchNextPage, loadedPages, state.page]);

  const cards = useMemo(
    () => (list.data?.pages ?? []).flatMap((p) => p.items).map((p) => toProductCard(p)),
    [list.data],
  );
  const total = list.data?.pages[0]?.meta?.total ?? 0;

  /** Change filters/sort: new history entry (Back undoes it), back to page 1, keep scroll. */
  const update = (patch) => {
    navigate(listingHref({ ...state, ...patch, page: 1 }, page.type), { preventScrollReset: true });
  };

  const loadMore = async () => {
    await list.fetchNextPage();
    navigate(listingHref({ ...state, page: loadedPages + 1 }, page.type), {
      replace: true,
      preventScrollReset: true,
    });
  };

  /** Remove every filter and the search term; keep the page's own category/brand and the sort. */
  const clearFilters = () =>
    navigate(listingHref({ ...base, sort: state.sort, featured: false, page: 1 }, page.type), {
      preventScrollReset: true,
    });

  return {
    state,
    base,
    category,
    brand,
    taxonomy,
    notFound,
    cards,
    total,
    list,
    // First load (nothing to show yet) vs. refreshing with old results still on screen.
    initialLoading: !ready ? taxonomy.isPending : list.isPending,
    refreshing: list.isPlaceholderData,
    update,
    loadMore,
    clearFilters,
  };
}
