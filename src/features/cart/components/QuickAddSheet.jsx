import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ArrowRight, MessageCircle, ShoppingBag, X } from "lucide-react";
import { Button, IconButton } from "../../../components/ui/Button";
import { CloudImage } from "../../../components/ui/CloudImage";
import { Price } from "../../../components/ui/Price";
import { QuantityStepper } from "../../../components/ui/QuantityStepper";
import { Sheet } from "../../../components/ui/Sheet";
import { Skeleton, SkeletonText } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/States";
import { whatsappLink } from "../../../config/site";
import { cn } from "../../../lib/cn";
import { useIsDesktop } from "../../../lib/useMediaQuery";
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

/**
 * Gallery + options for one product. The pictures follow the chosen flavour/size: each option
 * can have its own photos in Admin → Products, otherwise the product's shared photos show.
 */
function QuickAddBody({ product, onDone, wide }) {
  const navigate = useNavigate();
  const setDrawerOpen = useCartUi((s) => s.setDrawerOpen);
  const variants = useMemo(() => visibleVariants(product), [product]);
  const dimensions = useMemo(() => pickerDimensions(variants), [variants]);
  const [variant, setVariant] = useState(() => initialVariant(product, null));
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const { add, pending } = useAddToCart();
  const images = galleryImages(product, variant);
  const image = images[Math.min(imageIndex, images.length - 1)] ?? images[0];
  const sellable = variant && isPurchasable(variant);
  const max = Math.max(1, Math.min(variant?.stockQuantity ?? 1, MAX_QTY));
  const qty = Math.min(quantity, max);

  const addToCart = async () => {
    onDone();
    await add(product, variant, qty);
  };
  const buyNow = async () => {
    const ok = await add(product, variant, qty);
    if (!ok) return;
    setDrawerOpen(false);
    onDone();
    navigate("/checkout");
  };

  const gallery = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 bg-shelf bg-[radial-gradient(70%_60%_at_50%_50%,#ffffff,var(--color-shelf))]",
        wide ? "p-8" : "-mx-5 -mt-1 mb-1 p-5",
      )}
    >
      <CloudImage
        key={image?.url}
        src={image?.url}
        alt={product.name}
        ratio={null}
        sizes={wide ? "520px" : "90vw"}
        trim
        blend
        className={cn(
          "w-full motion-safe:animate-[fade-in_250ms_ease-out]",
          wide ? "h-[420px]" : "h-60",
        )}
      />
      {images.length > 1 && (
        <ul className="flex gap-2" aria-label="Choose image">
          {images.slice(0, 5).map((img, i) => (
            <li key={img.url ?? i}>
              <button
                type="button"
                aria-label={`Show image ${i + 1}`}
                aria-current={i === imageIndex}
                onClick={() => setImageIndex(i)}
                className={cn(
                  "block size-14 overflow-hidden rounded-md border bg-surface p-1",
                  i === imageIndex ? "border-ink" : "border-line hover:border-line-strong",
                )}
              >
                <CloudImage
                  src={img.url}
                  alt=""
                  ratio={null}
                  sizes="56px"
                  trim
                  blend
                  className="size-full"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const details = (
    <div className={cn("flex flex-col gap-5", wide && "p-8 pr-10")}>
      <div className={cn(wide && "pr-12")}>
        <p className="label-caps text-brand-ink">{product.brand?.name}</p>
        <RadixDialogTitle wide={wide}>{product.name}</RadixDialogTitle>
        {variant && (
          <Price
            price={variant.price}
            salePrice={variant.salePrice}
            size="lg"
            showSaving
            className="mt-3"
          />
        )}
      </div>
      {dimensions.length > 0 && (
        <VariantPicker
          variants={variants}
          dimensions={dimensions}
          current={variant}
          onChange={(v) => {
            setVariant(v);
            setQuantity(1);
            setImageIndex(0);
          }}
        />
      )}
      <StockLine variant={variant} />
      <div className="flex gap-2">
        <QuantityStepper
          value={qty}
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
          onClick={addToCart}
        >
          {sellable ? "Add to cart" : "Sold out"}
        </Button>
      </div>
      {sellable && (
        <Button size="lg" variant="outline" fullWidth disabled={pending} onClick={buyNow}>
          Buy it now
        </Button>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          to={`/product/${product.slug}`}
          onClick={onDone}
          className="inline-flex items-center gap-1.5 font-bold hover:text-brand-ink"
        >
          View full details <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <a
          href={whatsappLink(`Hi Adeeb Supplement, a question about ${product.name}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-small text-ink-2 hover:text-ink"
        >
          <MessageCircle aria-hidden="true" className="size-4 text-success" />
          Questions? WhatsApp us
        </a>
      </div>
    </div>
  );

  if (!wide) {
    return (
      <div className="flex flex-col gap-4">
        {gallery}
        {details}
      </div>
    );
  }
  return (
    <div className="grid min-h-0 grid-cols-[1.05fr_1fr] overflow-hidden">
      {gallery}
      <div className="overflow-y-auto">{details}</div>
    </div>
  );
}

/** Product name: the dialog's accessible title on desktop, a plain heading in the phone sheet. */
function RadixDialogTitle({ wide, children }) {
  const className = "mt-2 text-[1.5rem] leading-tight font-extrabold md:text-[1.875rem]";
  return wide ? (
    <RadixDialog.Title className={className}>{children}</RadixDialog.Title>
  ) : (
    <p className={className}>{children}</p>
  );
}

function Loading({ wide }) {
  return (
    <div role="status" className={cn(wide && "grid grid-cols-[1.05fr_1fr]")}>
      <span className="sr-only">Loading options</span>
      <Skeleton className={cn(wide ? "h-[540px] rounded-none" : "h-60")} />
      <div className={cn(wide ? "p-8" : "pt-4")}>
        <SkeletonText lines={6} />
      </div>
    </div>
  );
}

/**
 * "Choose options" from a product card: a centred popup with a big image on desktop (like a
 * quick view), a bottom sheet on phones. The product usually comes from the list already in
 * cache, so it fills instantly without a request.
 */
export default function QuickAddSheet() {
  const slug = useCartUi((s) => s.quickAddSlug);
  const close = useCartUi((s) => s.closeQuickAdd);
  const isDesktop = useIsDesktop();
  // Keep showing the last product while the popup animates closed.
  const [shownSlug, setShownSlug] = useState(slug);
  if (slug && slug !== shownSlug) setShownSlug(slug);
  const query = useProduct(shownSlug);
  const open = Boolean(slug);

  const body = (wide) =>
    query.isPending ? (
      <Loading wide={wide} />
    ) : query.isError ? (
      <div className={cn(wide && "p-8")}>
        <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
      </div>
    ) : (
      <QuickAddBody key={query.data._id} product={query.data} onDone={close} wide={wide} />
    );

  if (!isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && close()} title="Choose options">
        {body(false)}
      </Sheet>
    );
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/55 data-[state=closed]:animate-[fade-in_150ms_reverse] data-[state=open]:animate-[fade-in_150ms]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[88dvh] w-[min(1120px,calc(100vw-48px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-band bg-surface shadow-overlay outline-none data-[state=open]:animate-[dialog-in_200ms_var(--ease-out-soft)]"
        >
          {query.isPending || query.isError ? (
            <RadixDialog.Title className="sr-only">Choose options</RadixDialog.Title>
          ) : null}
          <RadixDialog.Close asChild>
            <IconButton
              label="Close"
              variant="outline"
              className="absolute top-5 right-5 z-10 rounded-full bg-surface"
            >
              <X aria-hidden="true" className="size-5" />
            </IconButton>
          </RadixDialog.Close>
          {body(true)}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
