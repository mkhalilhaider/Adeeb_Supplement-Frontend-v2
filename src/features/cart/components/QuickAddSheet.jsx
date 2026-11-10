import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { CloudImage } from "../../../components/ui/CloudImage";
import { Price } from "../../../components/ui/Price";
import { QuantityStepper } from "../../../components/ui/QuantityStepper";
import { Sheet } from "../../../components/ui/Sheet";
import { SkeletonText } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/States";
import { isPurchasable } from "../../catalog/lib/product-view";
import { useProduct } from "../../catalog/queries";
import { StockLine } from "../../product/components/PurchasePanel";
import { VariantPicker } from "../../product/components/VariantPicker";
import {
  galleryImages,
  initialVariant,
  pickerDimensions,
  visibleVariants,
} from "../../product/lib/variant-matrix";
import { useCartUi } from "../cart-ui";
import { useAddToCart } from "../useAddToCart";

const MAX_QTY = 20;

/** Options + quantity for one product, inside the quick-add sheet. */
function QuickAddBody({ product, onDone }) {
  const variants = useMemo(() => visibleVariants(product), [product]);
  const dimensions = useMemo(() => pickerDimensions(variants), [variants]);
  const [variant, setVariant] = useState(() => initialVariant(product, null));
  const [quantity, setQuantity] = useState(1);
  const { add, pending } = useAddToCart();
  const image = galleryImages(product, variant)[0];
  const sellable = variant && isPurchasable(variant);
  const max = Math.max(1, Math.min(variant?.stockQuantity ?? 1, MAX_QTY));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <span className="size-20 shrink-0 bg-shelf p-1.5">
          <CloudImage
            src={image?.url}
            alt=""
            ratio={null}
            sizes="80px"
            trim
            blend
            className="size-full"
          />
        </span>
        <div className="min-w-0">
          <p className="label-mono text-ink-3">{product.brand?.name}</p>
          <p className="line-clamp-2 font-medium">{product.name}</p>
          {variant && (
            <Price price={variant.price} salePrice={variant.salePrice} size="sm" className="mt-1" />
          )}
        </div>
      </div>
      <StockLine variant={variant} />
      {dimensions.length > 0 && (
        <VariantPicker
          variants={variants}
          dimensions={dimensions}
          current={variant}
          onChange={(v) => {
            setVariant(v);
            setQuantity(1);
          }}
        />
      )}
      <div className="flex gap-2">
        <QuantityStepper
          value={Math.min(quantity, max)}
          onChange={setQuantity}
          max={max}
          disabled={!sellable}
          label={`Quantity of ${product.name}`}
        />
        <Button
          size="lg"
          fullWidth
          disabled={!sellable}
          loading={pending}
          leadingIcon={<ShoppingBag aria-hidden="true" className="size-5" />}
          onClick={async () => {
            onDone();
            await add(product, variant, Math.min(quantity, max));
          }}
        >
          {sellable ? "Add to cart" : "Sold out"}
        </Button>
      </div>
      <Link
        to={`/product/${product.slug}`}
        onClick={onDone}
        className="text-small font-semibold underline underline-offset-4"
      >
        View full details
      </Link>
    </div>
  );
}

/**
 * "Choose options" from a product card. The product usually comes from the list already in
 * cache, so the sheet fills instantly without a request.
 */
export default function QuickAddSheet() {
  const slug = useCartUi((s) => s.quickAddSlug);
  const close = useCartUi((s) => s.closeQuickAdd);
  // Keep showing the last product while the sheet animates closed.
  const [shownSlug, setShownSlug] = useState(slug);
  if (slug && slug !== shownSlug) setShownSlug(slug);
  const query = useProduct(shownSlug);

  return (
    <Sheet open={Boolean(slug)} onOpenChange={(open) => !open && close()} title="Choose options">
      {query.isPending ? (
        <div role="status">
          <span className="sr-only">Loading options</span>
          <SkeletonText lines={5} />
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
      ) : (
        <QuickAddBody key={query.data._id} product={query.data} onDone={close} />
      )}
    </Sheet>
  );
}
