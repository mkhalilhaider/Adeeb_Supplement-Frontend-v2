import { lazy, Suspense, useState } from "react";
import { PackageOpen, SlidersHorizontal } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EmptyState, ErrorState } from "../../../components/ui/States";
import { cn } from "../../../lib/cn";
import { activeFilterCount, PAGE_SIZE } from "../lib/listing-params";
import { FilterPanel } from "./FilterPanel";
import { ActiveFilters, SortSelect } from "./ListingControls";

// The sheet (and its drawer library) loads only when a phone user first opens filters.
const FilterSheet = lazy(() => import("./FilterSheet"));
import { ProductCardSkeleton } from "./ProductCard";
import { ShopProductCard } from "./ShopProductCard";

const GRID =
  "grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

/**
 * Shared body of /shop, /category/:slug and /brand/:slug.
 * Desktop: sticky filter sidebar + grid. Phones: "Filter & sort" sheet + 2-column grid.
 *
 * @param {{ listing: ReturnType<import("../useListing").useListing>, header: import("react").ReactNode }} props
 */
export function ListingView({ listing, header }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  // Re-keyed on every open so the draft starts from the current URL state.
  const [sheetKey, setSheetKey] = useState(0);
  const openSheet = () => {
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  };
  const { state, base, cards, total, list } = listing;
  const filters = activeFilterCount(state, base);

  const loadedAll = !list.hasNextPage;
  const shown = cards.length;

  let body;
  if (list.isError && shown === 0) {
    body = (
      <ErrorState error={list.error} onRetry={() => list.refetch()} retrying={list.isFetching} />
    );
  } else if (listing.initialLoading) {
    body = (
      <div role="status" className={GRID}>
        <span className="sr-only">Loading products</span>
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (shown === 0) {
    body = (
      <EmptyState
        icon={PackageOpen}
        title={state.q ? `No results for “${state.q}”` : "No products match these filters"}
        description="Try removing a filter, checking the spelling, or browsing all products."
        action={
          <>
            {(filters > 0 || state.q) && (
              <Button variant="outline" onClick={listing.clearFilters}>
                Clear filters
              </Button>
            )}
            <Button to="/shop" variant="secondary">
              Browse all products
            </Button>
          </>
        }
      />
    );
  } else {
    body = (
      <>
        <ul
          aria-busy={listing.refreshing || undefined}
          className={cn(
            GRID,
            "transition-opacity duration-(--duration-base)",
            listing.refreshing && "opacity-50",
          )}
        >
          {cards.map((card, i) => (
            <li key={card.id}>
              <ShopProductCard card={card} priority={i < 2} />
            </li>
          ))}
          {list.isFetchingNextPage &&
            Array.from({ length: Math.min(PAGE_SIZE, total - shown) || 4 }, (_, i) => (
              <li key={`s-${i}`} aria-hidden="true">
                <ProductCardSkeleton />
              </li>
            ))}
        </ul>

        <div className="mt-12 flex flex-col items-center gap-3">
          <p className="text-small text-ink-3" aria-live="polite">
            Showing {shown} of {total} products
          </p>
          <div aria-hidden="true" className="h-0.5 w-48 bg-line">
            <div
              className="h-full bg-ink"
              style={{ width: `${Math.min(100, (shown / Math.max(total, 1)) * 100)}%` }}
            />
          </div>
          {!loadedAll && (
            <Button
              variant="outline"
              size="lg"
              onClick={listing.loadMore}
              loading={list.isFetchingNextPage}
              className="mt-2 min-w-56"
            >
              Load more
            </Button>
          )}
          {list.isError && shown > 0 && (
            <p role="alert" className="text-small text-danger">
              Couldn't load more products. Please try again.
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="page-container pb-16">
      {header}

      <div className="sticky top-14 z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-y border-line bg-paper px-4 py-2 md:top-16 lg:static lg:mx-0 lg:border-t-0 lg:px-0 lg:py-3">
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden"
          onClick={openSheet}
          leadingIcon={<SlidersHorizontal aria-hidden="true" className="size-4" />}
        >
          Filter & sort{filters > 0 ? ` (${filters})` : ""}
        </Button>
        <p className="hidden text-small text-ink-3 lg:block" aria-live="polite">
          {listing.initialLoading ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
        </p>
        <p className="text-small text-ink-3 lg:hidden">
          {listing.initialLoading ? "" : `${total} items`}
        </p>
        <div className="hidden lg:block">
          <SortSelect value={state.sort} onChange={(sort) => listing.update({ sort })} />
        </div>
      </div>

      <div className="mt-4">
        <ActiveFilters
          state={state}
          base={base}
          category={listing.category}
          brand={listing.brand}
          onChange={listing.update}
          onClearAll={listing.clearFilters}
        />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="pb-6">
            <FilterPanel
              idPrefix="side"
              state={state}
              base={base}
              taxonomy={listing.taxonomy}
              onChange={listing.update}
            />
          </div>
        </aside>
        <section aria-labelledby="listing-results">
          {/* Keeps headings in order: page title (h1) → results (h2) → product names (h3). */}
          <h2 id="listing-results" className="sr-only">
            Products
          </h2>
          {body}
        </section>
      </div>

      {sheetKey > 0 && (
        <Suspense fallback={null}>
          <FilterSheet
            key={sheetKey}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            listing={listing}
          />
        </Suspense>
      )}
    </div>
  );
}
