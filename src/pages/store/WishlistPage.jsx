import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/States";
import { ApiError } from "../../lib/api/errors";
import { fetchProduct } from "../../features/catalog/api";
import { ShopProductCard } from "../../features/catalog/components/ShopProductCard";
import { isPurchasable, toProductCard } from "../../features/catalog/lib/product-view";
import { catalogKeys } from "../../features/catalog/queries";
import { useSession } from "../../features/auth/session-store";
import { useWishlist } from "../../features/wishlist/wishlist-store";
import { toCartLine } from "../../features/cart/useAddToCart";
import { useCart } from "../../features/cart/useCart";
import { useCartUi } from "../../features/cart/cart-ui";
import { notify } from "../../lib/notify";

const REFRESH_LIMIT = 24;

/**
 * "Add all to cart": one of each saved product that can go straight in. Products with several
 * flavours/sizes need a choice first (returned so the page can highlight them), sold-out ones
 * and ones already in the cart are skipped. Stock is re-checked per product before adding.
 */
function useAddAllToCart() {
  const queryClient = useQueryClient();
  const cart = useCart();
  const openDrawer = useCartUi((s) => s.openDrawer);
  const [pending, setPending] = useState(false);
  const [needsChoice, setNeedsChoice] = useState(() => new Set());

  const addAll = async (cards) => {
    if (pending) return;
    setPending(true);
    const inCart = new Set(cart.lines.map((l) => l.variantId));
    let added = 0;
    let lastVariant = null;
    const choose = [];
    const soldOut = [];
    let already = 0;
    try {
      for (const card of cards) {
        if (!card.inStock) {
          soldOut.push(card.name);
          continue;
        }
        if (!card.quickAddVariantId) {
          choose.push(card);
          continue;
        }
        if (inCart.has(card.quickAddVariantId)) {
          already += 1;
          continue;
        }
        try {
          const fresh = await queryClient.fetchQuery({
            queryKey: catalogKeys.product(card.slug),
            queryFn: ({ signal }) => fetchProduct(card.slug, { signal }),
            staleTime: 30_000,
          });
          const variant = fresh.variants.find((v) => v._id === card.quickAddVariantId);
          if (!variant || !isPurchasable(variant)) {
            soldOut.push(card.name);
            continue;
          }
          await cart.add(toCartLine(fresh, variant), 1);
          added += 1;
          lastVariant = variant._id;
        } catch {
          soldOut.push(card.name);
        }
      }
    } finally {
      setPending(false);
    }

    setNeedsChoice(new Set(choose.map((c) => c.id)));
    const notes = [
      ...choose.map((c) => `${c.name} needs a flavour or size`),
      ...(soldOut.length ? [`${soldOut.length} sold out`] : []),
      ...(already ? [`${already} already in your cart`] : []),
    ];
    if (added) {
      notify.success(`${added} added to your cart`, {
        description: notes.join(" · ") || undefined,
      });
      openDrawer(lastVariant);
    } else {
      notify.info("Nothing new to add", { description: notes.join(" · ") || undefined });
    }
  };

  return { addAll, pending, needsChoice };
}

/**
 * /wishlist — saved products (this device). Shown instantly from stored snapshots, then
 * refreshed with live price/stock in the background (one cached request per product).
 */
export default function WishlistPage() {
  const items = useWishlist((s) => s.items);
  const refresh = useWishlist((s) => s.refresh);
  const remove = useWishlist((s) => s.remove);
  const { addAll, pending: addingAll, needsChoice } = useAddAllToCart();
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
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[2.75rem] font-display outline-none md:text-[4rem]"
        >
          Wishlist{items.length ? ` (${items.length})` : ""}
        </h1>
        {items.some((c) => c.inStock && !gone.has(c.id)) && (
          <Button
            size="lg"
            loading={addingAll}
            leadingIcon={<ShoppingBag aria-hidden="true" className="size-5" />}
            onClick={() => addAll(items.filter((c) => !gone.has(c.id)))}
          >
            Add all to cart
          </Button>
        )}
      </div>
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
                <li
                  key={card.id}
                  className={
                    needsChoice.has(card.id)
                      ? "rounded-card ring-2 ring-brand ring-offset-4 ring-offset-paper"
                      : undefined
                  }
                >
                  <ShopProductCard card={card} priority={i < 2} />
                  {needsChoice.has(card.id) && (
                    <p className="mt-2 text-small font-bold text-brand-ink">
                      Pick a flavour or size first
                    </p>
                  )}
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
