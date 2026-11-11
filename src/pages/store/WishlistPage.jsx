import { useEffect, useMemo, useRef } from "react";
import { useQueries } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/States";
import { ApiError } from "../../lib/api/errors";
import { fetchProduct } from "../../features/catalog/api";
import { ShopProductCard } from "../../features/catalog/components/ShopProductCard";
import { toProductCard } from "../../features/catalog/lib/product-view";
import { catalogKeys } from "../../features/catalog/queries";
import { useSession } from "../../features/auth/session-store";
import { useWishlist } from "../../features/wishlist/wishlist-store";

const REFRESH_LIMIT = 24;

/**
 * /wishlist — saved products (this device). Shown instantly from stored snapshots, then
 * refreshed with live price/stock in the background (one cached request per product).
 */
export default function WishlistPage() {
  const items = useWishlist((s) => s.items);
  const refresh = useWishlist((s) => s.refresh);
  const remove = useWishlist((s) => s.remove);
  const loggedIn = useSession((s) => s.status === "authenticated");
  const headingRef = useRef(/** @type {HTMLHeadingElement|null} */ (null));
  const previousCount = useRef(items.length);

  // Un-saving removes the card (and its focused heart): keep keyboard focus on the page.
  useEffect(() => {
    if (items.length < previousCount.current && document.activeElement === document.body) {
      headingRef.current?.focus();
    }
    previousCount.current = items.length;
  }, [items.length]);

  const live = useQueries({
    queries: items.slice(0, REFRESH_LIMIT).map((card) => ({
      queryKey: catalogKeys.product(card.slug),
      queryFn: ({ signal }) => fetchProduct(card.slug, { signal }),
      staleTime: 5 * 60_000,
      retry: (n, e) => !(e instanceof ApiError && e.isNotFound) && n < 1,
    })),
  });

  // Products that no longer exist (deleted or switched off).
  const gone = useMemo(
    () =>
      new Set(
        items
          .slice(0, REFRESH_LIMIT)
          .filter((_, i) => live[i]?.error instanceof ApiError && live[i].error.isNotFound)
          .map((c) => c.id),
      ),
    [items, live],
  );

  const freshCards = live.map((q) => q.data).filter(Boolean);
  const freshKey = freshCards.map((p) => `${p._id}:${p.updatedAt}`).join("|");
  useEffect(() => {
    if (freshCards.length) refresh(freshCards.map((p) => toProductCard(p)));
    // freshKey captures the data that matters; refresh is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey, refresh]);

  return (
    <div className="page-container pb-16">
      <Seo title="Your wishlist" noIndex />
      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]}
      />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-h1 font-extrabold uppercase font-condensed outline-none md:text-5xl"
      >
        Wishlist{items.length ? ` (${items.length})` : ""}
      </h1>
      {!loggedIn && items.length > 0 && (
        <p className="mt-2 text-small text-ink-3">
          Saved on this device. Log in to keep it with your account.
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here for later."
          action={<Button to="/shop">Browse products</Button>}
        />
      ) : (
        <>
          <h2 className="sr-only">Saved products</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {items
              .filter((card) => !gone.has(card.id))
              .map((card, i) => (
                <li key={card.id}>
                  <ShopProductCard card={card} priority={i < 2} />
                </li>
              ))}
          </ul>

          {gone.size > 0 && (
            <section aria-labelledby="gone-heading" className="mt-12 border-t border-line pt-6">
              <h2 id="gone-heading" className="font-semibold">
                No longer available
              </h2>
              <ul className="mt-3 flex flex-col">
                {items
                  .filter((card) => gone.has(card.id))
                  .map((card) => (
                    <li
                      key={card.id}
                      className="flex items-center justify-between gap-4 border-b border-line py-3 text-small"
                    >
                      <span className="text-ink-2">{card.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => remove(card.id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
