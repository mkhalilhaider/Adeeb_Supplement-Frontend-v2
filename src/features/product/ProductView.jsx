import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { useInViewOnce } from "../../lib/hooks";
import { toProductCard } from "../catalog/lib/product-view";
import { useRecentlyViewed } from "../catalog/recently-viewed";
import { useAddToCart } from "../cart/useAddToCart";
import { ProductGallery } from "./components/ProductGallery";
import { ProductDescription, ProductSpecs } from "./components/ProductDetails";
import { PurchasePanel, MAX_QTY } from "./components/PurchasePanel";
import { productJsonLd, productMeta } from "./lib/product-seo";
import {
  galleryImages,
  initialVariant,
  pickerDimensions,
  visibleVariants,
} from "./lib/variant-matrix";

const ProductRails = lazy(() => import("./components/ProductRails"));
const StickyBuyBar = lazy(() =>
  import("./components/StickyBuyBar").then((m) => ({ default: m.StickyBuyBar })),
);

/** True after the first scroll: the sticky bar is only useful once the page has moved. */
function useHasScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (scrolled) return undefined;
    const onScroll = () => setScrolled(true);
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrolled]);
  return scrolled;
}
const ReviewsSection = lazy(() => import("../reviews/ReviewsSection"));

/**
 * Reviews load (code and data) when scrolled near. The anchor stays in the page so the
 * rating link in the purchase panel (#reviews) can jump here and trigger the load.
 */
function BelowFoldReviews({ product }) {
  const [ref, seen] = useInViewOnce({ rootMargin: "600px 0px" });
  return (
    <div ref={ref} id="reviews" className="mt-14 min-h-24 scroll-mt-24 md:mt-20">
      {seen && (
        <Suspense fallback={null}>
          <ReviewsSection
            productId={product._id}
            average={product.averageRating}
            count={product.reviewCount}
          />
        </Suspense>
      )}
    </div>
  );
}

/**
 * Related + recently viewed rails, loaded (code and data) only as the shopper scrolls near
 * them, so their card code stays out of the product page's first load.
 */
function BelowFoldRails({ product }) {
  const [ref, seen] = useInViewOnce({ rootMargin: "600px 0px" });
  return (
    <div ref={ref} className="mt-14 min-h-px md:mt-20">
      {seen && (
        <Suspense fallback={null}>
          <ProductRails product={product} />
        </Suspense>
      )}
    </div>
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
  // Its code loads on the first scroll — it can't be needed before the buy button moves away.
  const scrolled = useHasScrolled();
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
        <div className="md:sticky md:top-24 md:self-start lg:top-[140px]">
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
          <h2 id="about-heading" className="text-[2.25rem] font-display md:text-[2.75rem]">
            About this product
          </h2>
          <div className="mt-4">
            <ProductDescription text={product.description} />
          </div>
        </section>
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="text-[2.25rem] font-display md:text-[2.75rem]">
            Details
          </h2>
          <div className="mt-4">
            <ProductSpecs product={product} variants={variants} variant={variant} />
          </div>
        </section>
      </div>

      <BelowFoldReviews product={product} />

      <BelowFoldRails product={product} />

      {scrolled && (
        <Suspense fallback={null}>
          <StickyBuyBar
            targetRef={addRef}
            variant={variant}
            onAdd={onAdd}
            adding={pending}
            name={product.name}
          />
        </Suspense>
      )}
    </article>
  );
}
