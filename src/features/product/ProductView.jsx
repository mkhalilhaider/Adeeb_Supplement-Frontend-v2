import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { useInViewOnce } from "../../lib/hooks";
import { ProductRail } from "../catalog/components/ProductRail";
import { toProductCard } from "../catalog/lib/product-view";
import { useProducts } from "../catalog/queries";
import { useRecentlyViewed } from "../catalog/recently-viewed";
import { useAddToCart } from "../cart/useAddToCart";
import { ReviewsSection } from "../reviews/ReviewsSection";
import { ProductGallery } from "./components/ProductGallery";
import { ProductDescription, ProductSpecs } from "./components/ProductDetails";
import { PurchasePanel, MAX_QTY } from "./components/PurchasePanel";
import { StickyBuyBar } from "./components/StickyBuyBar";
import { productJsonLd, productMeta } from "./lib/product-seo";
import {
  galleryImages,
  initialVariant,
  pickerDimensions,
  visibleVariants,
} from "./lib/variant-matrix";

/** Same-category best sellers, fetched only when the section is about to be seen. */
function RelatedProducts({ product }) {
  const [ref, seen] = useInViewOnce();
  const query = useProducts(
    { category: product.category?._id, sort: "bestselling", limit: 9 },
    { enabled: seen && Boolean(product.category?._id) },
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
    <div ref={ref} className="min-h-px">
      {(query.isPending && seen) || cards.length > 0 ? (
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
    </div>
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

/**
 * The product page body. Variant choice lives in the URL (?variant=) so a shared link opens
 * the same flavour/size; quantity resets when the variant changes.
 */
export function ProductView({ product }) {
  const [params, setParams] = useSearchParams();
  const variants = useMemo(() => visibleVariants(product), [product]);
  const dimensions = useMemo(() => pickerDimensions(variants), [variants]);
  const variant = initialVariant(product, params.get("variant"));
  const images = useMemo(() => galleryImages(product, variant), [product, variant]);

  const [qty, setQty] = useState({ variantId: variant?._id, value: 1 });
  const quantity = qty.variantId === variant?._id ? qty.value : 1;
  const max = Math.max(1, Math.min(variant?.stockQuantity ?? 1, MAX_QTY));

  const { add, pending } = useAddToCart();
  const addRef = useRef(null);
  const onAdd = () => add(product, variant, Math.min(quantity, max));

  const record = useRecentlyViewed((s) => s.record);
  useEffect(() => {
    record(toProductCard(product));
  }, [product, record]);

  const meta = productMeta(product);
  const alt = `${product.brand?.name ?? ""} ${product.name}`.trim();

  return (
    <article className="page-container pb-24 md:pb-16">
      <Seo
        title={meta.title}
        description={meta.description}
        image={meta.image}
        type="product"
        canonicalPath={`/product/${product.slug}`}
        jsonLd={productJsonLd(product)}
      />

      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[
          { label: "Home", to: "/" },
          ...(product.category
            ? [{ label: product.category.name, to: `/category/${product.category.slug}` }]
            : [{ label: "Shop", to: "/shop" }]),
          { label: product.name },
        ]}
      />

      <div className="mt-4 grid gap-8 md:mt-6 md:grid-cols-[7fr_5fr] lg:gap-14">
        <ProductGallery key={images.map((i) => i.url).join("|")} images={images} alt={alt} />
        <div className="md:sticky md:top-24 md:self-start">
          <PurchasePanel
            product={product}
            variants={variants}
            dimensions={dimensions}
            variant={variant}
            onVariantChange={(v) =>
              setParams(
                (p) => {
                  p.set("variant", v._id);
                  return p;
                },
                { replace: true, preventScrollReset: true },
              )
            }
            quantity={Math.min(quantity, max)}
            onQuantityChange={(value) => setQty({ variantId: variant?._id, value })}
            onAdd={onAdd}
            adding={pending}
            addRef={addRef}
          />
        </div>
      </div>

      <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-[7fr_5fr] lg:gap-14">
        <section aria-labelledby="about-heading">
          <h2 id="about-heading" className="text-h2 font-extrabold uppercase font-condensed">
            About this product
          </h2>
          <div className="mt-4">
            <ProductDescription text={product.description} />
          </div>
        </section>
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-h2 font-extrabold uppercase font-condensed">
            Details
          </h2>
          <div className="mt-4">
            <ProductSpecs product={product} variants={variants} variant={variant} />
          </div>
        </section>
      </div>

      <div className="mt-14 md:mt-20">
        <ReviewsSection
          productId={product._id}
          average={product.averageRating}
          count={product.reviewCount}
        />
      </div>

      <div className="mt-14 flex flex-col gap-14 md:mt-20 md:gap-20">
        <RelatedProducts product={product} />
        <RecentlyViewedRail excludeId={product._id} />
      </div>

      <StickyBuyBar
        targetRef={addRef}
        variant={variant}
        onAdd={onAdd}
        adding={pending}
        name={product.name}
      />
    </article>
  );
}
