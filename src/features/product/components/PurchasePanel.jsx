import { Link } from "react-router";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Price } from "../../../components/ui/Price";
import { QuantityStepper } from "../../../components/ui/QuantityStepper";
import { Rating } from "../../../components/ui/Rating";
import { whatsappLink } from "../../../config/site";
import { cn } from "../../../lib/cn";
import { isPurchasable, toProductCard } from "../../catalog/lib/product-view";
import { WishlistButton } from "../../wishlist/WishlistButton";
import { variantLabel } from "../lib/variant-matrix";
import { DeliveryInfo } from "./DeliveryInfo";
import { VariantPicker } from "./VariantPicker";

export const MAX_QTY = 20;

/** "In stock" / "Only 3 left" / "Sold out", from the selected variant. */
export function StockLine({ variant }) {
  if (!variant) return null;
  const stock = variant.stockQuantity ?? 0;
  const sellable = isPurchasable(variant);
  const low = sellable && stock <= (variant.lowStockThreshold ?? 5);
  const tone = !sellable ? "bg-danger" : low ? "bg-warning" : "bg-success";
  const text = !sellable
    ? "Sold out"
    : low
      ? `Only ${stock} left — order soon`
      : "In stock, ready to ship";
  return (
    <p className="flex items-center gap-2 text-small font-medium">
      <span aria-hidden="true" className={cn("size-2 rounded-full", tone)} />
      {text}
    </p>
  );
}

/**
 * Right-hand column (below the gallery on phones): name, price, options, quantity, add to cart,
 * delivery facts. `addRef` marks the main button so the sticky bar knows when it's off-screen.
 */
export function PurchasePanel({
  product,
  variants,
  dimensions,
  variant,
  onVariantChange,
  quantity,
  onQuantityChange,
  onAdd,
  adding,
  addRef,
}) {
  const sellable = variant && isPurchasable(variant);
  const max = Math.max(1, Math.min(variant?.stockQuantity ?? 1, MAX_QTY));

  return (
    <div className="flex flex-col gap-5">
      <div>
        {product.brand && (
          <Link
            to={`/brand/${product.brand.slug}`}
            className="label-mono text-ink-3 hover:text-ink"
          >
            {product.brand.name}
          </Link>
        )}
        <h1 className="mt-1.5 text-h2 leading-tight font-bold md:text-[2rem]">{product.name}</h1>
        {product.reviewCount > 0 && (
          <a href="#reviews" className="mt-2 inline-flex items-center gap-2 hover:underline">
            <Rating value={product.averageRating} count={product.reviewCount} size={15} showValue />
            <span className="sr-only">Read reviews</span>
          </a>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {variant && (
          <Price price={variant.price} salePrice={variant.salePrice} size="lg" showSaving />
        )}
        <StockLine variant={variant} />
      </div>

      {dimensions.length > 0 && (
        <VariantPicker
          variants={variants}
          dimensions={dimensions}
          current={variant}
          onChange={onVariantChange}
        />
      )}

      {sellable ? (
        <div ref={addRef} className="flex gap-2">
          <QuantityStepper
            value={quantity}
            onChange={onQuantityChange}
            max={max}
            label={`Quantity of ${product.name}`}
          />
          <Button
            size="lg"
            fullWidth
            loading={adding}
            onClick={onAdd}
            leadingIcon={<ShoppingBag aria-hidden="true" className="size-5" />}
          >
            Add to cart
          </Button>
          <WishlistButton card={toProductCard(product)} />
        </div>
      ) : (
        <div ref={addRef} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button size="lg" fullWidth disabled>
              Sold out
            </Button>
            <WishlistButton card={toProductCard(product)} />
          </div>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            href={whatsappLink(
              `Hi, is ${product.name}${variant ? ` (${variantLabel(variant)})` : ""} coming back in stock?`,
            )}
            leadingIcon={<MessageCircle aria-hidden="true" className="size-5" />}
          >
            Ask about restock on WhatsApp
          </Button>
        </div>
      )}

      <DeliveryInfo />
    </div>
  );
}
