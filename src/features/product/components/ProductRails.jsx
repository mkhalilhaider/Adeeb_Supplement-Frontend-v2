import { useMemo } from "react";
import { ProductRail } from "../../catalog/components/ProductRail";
import { toProductCard } from "../../catalog/lib/product-view";
import { useProducts } from "../../catalog/queries";
import { useRecentlyViewed } from "../../catalog/recently-viewed";

/** Same-category best sellers, fetched only when the section is about to be seen. */
function RelatedProducts({ product }) {
  const query = useProducts(
    { category: product.category?._id, sort: "bestselling", limit: 9 },
    { enabled: Boolean(product.category?._id) },
  );
  const cards = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((p) => p._id !== product._id)
        .slice(0, 8)
        .map((p) => toProductCard(p)),
    [query.data, product._id],
  );
  return (
    <>
      {(query.isPending && Boolean(product.category?._id)) || cards.length > 0 ? (
        <ProductRail
          id="related-heading"
          eyebrow={product.category?.name}
          title="You may also like"
          cards={cards}
          loading={query.isPending}
          action={
            product.category
              ? { label: "View all", to: `/category/${product.category.slug}` }
              : undefined
          }
        />
      ) : null}
    </>
  );
}

/** Products this device viewed before (no request: stored snapshots). */
function RecentlyViewedRail({ excludeId }) {
  const cards = useRecentlyViewed((s) => s.cards);
  const visible = useMemo(
    () => cards.filter((c) => c.id !== excludeId).slice(0, 8),
    [cards, excludeId],
  );
  return (
    <ProductRail
      id="recent-heading"
      eyebrow="This device"
      title="Recently viewed"
      cards={visible}
    />
  );
}

/** Rails under the product details (lazy-loaded by ProductView when scrolled near). */
export default function ProductRails({ product }) {
  return (
    <div className="flex flex-col gap-14 md:gap-20">
      <RelatedProducts product={product} />
      <RecentlyViewedRail excludeId={product._id} />
    </div>
  );
}
