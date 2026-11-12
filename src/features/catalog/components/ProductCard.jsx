import { useState } from "react";
import { Link } from "react-router";
import { Heart, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { CloudImage } from "../../../components/ui/CloudImage";
import { Price } from "../../../components/ui/Price";
import { Rating } from "../../../components/ui/Rating";
import { Skeleton } from "../../../components/ui/Skeleton";
import { cn } from "../../../lib/cn";
import { cardBadges } from "../lib/product-view";

/** Grid columns this card is used in: 2 (phone) / 3 (tablet) / 4 (desktop) / 5 (wide). */
export const CARD_SIZES =
  "(min-width: 96rem) 18vw, (min-width: 64rem) 23vw, (min-width: 48rem) 31vw, 48vw";

/**
 * Product tile for grids and rails. Presentational: data comes from `toProductCard`, actions
 * come in as callbacks, so it renders the same in the shop, rails, search and wishlist.
 *
 * @param {object} props
 * @param {import("../lib/product-view").ProductCardModel} props.card
 * @param {(card) => void} [props.onQuickAdd]   Single variant: add; several: open variant sheet
 * @param {(card) => void} [props.onToggleWishlist]
 * @param {boolean} [props.wishlisted]
 * @param {boolean} [props.priority]   First row above the fold
 * @param {(card) => void} [props.onIntent]  Hover/touch intent (seed the product cache)
 */
export function ProductCard({
  card,
  onQuickAdd,
  onToggleWishlist,
  wishlisted = false,
  priority = false,
  onIntent,
  className,
}) {
  const [hovered, setHovered] = useState(false);
  const badges = cardBadges(card);
  // Announce the brand only when the product name doesn’t already include it.
  const linkLabel =
    card.brand && !card.name.toLowerCase().includes(card.brand.toLowerCase())
      ? `${card.brand} ${card.name}`
      : undefined;
  const showSecond = hovered && card.secondImage;

  const handleIntent = () => {
    if (!hovered) setHovered(true);
    onIntent?.(card);
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface",
        "transition-[border-color,box-shadow] duration-(--duration-base) ease-(--ease-out-soft)",
        "hover:border-ink hover:shadow-[0_18px_32px_-20px_rgb(0_0_0/0.35)]",
        className,
      )}
      onPointerEnter={handleIntent}
      onTouchStart={() => onIntent?.(card)}
      onFocus={() => onIntent?.(card)}
    >
      <div className="relative aspect-square overflow-hidden bg-shelf bg-[radial-gradient(70%_60%_at_50%_55%,#ffffff,var(--color-shelf))]">
        {/* Duplicate of the title link for pointer users; hidden from keyboard/screen readers. */}
        <Link
          to={card.href}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 block p-[8%]"
        >
          <CloudImage
            src={card.image?.url}
            alt=""
            ratio={null}
            sizes={CARD_SIZES}
            priority={priority}
            trim
            blend
            className={cn(
              "size-full transition-[opacity,scale] duration-(--duration-sheet) ease-(--ease-out-soft) md:group-hover:scale-[1.04]",
              showSecond && "md:group-hover:opacity-0",
            )}
          />
          {showSecond && (
            <span className="absolute inset-[8%] hidden opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100 md:block">
              <CloudImage
                src={card.secondImage.url}
                alt=""
                ratio={null}
                sizes={CARD_SIZES}
                trim
                blend
                className="size-full"
              />
            </span>
          )}
        </Link>

        {badges.length > 0 && (
          <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
            {badges.map((b) => (
              <Badge key={b.label} tone={b.tone}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {onToggleWishlist && (
          <button
            type="button"
            aria-label={
              wishlisted ? `Remove ${card.name} from wishlist` : `Save ${card.name} to wishlist`
            }
            aria-pressed={wishlisted}
            onClick={() => onToggleWishlist(card)}
            className={cn(
              "absolute top-2 right-2 flex size-10 items-center justify-center rounded-full border transition-colors duration-(--duration-fast)",
              wishlisted
                ? "border-ink bg-ink text-brand"
                : "border-line bg-surface text-ink hover:border-ink",
            )}
          >
            <Heart
              aria-hidden="true"
              className={cn("size-5", wishlisted ? "fill-brand stroke-brand" : "fill-transparent")}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        {card.brand && <p className="truncate label-caps text-ink-3">{card.brand}</p>}
        <h3 className="line-clamp-2 text-small leading-snug font-medium text-ink md:text-body md:leading-snug">
          <Link
            to={card.href}
            className="hover:underline focus-visible:underline"
            aria-label={linkLabel}
          >
            {card.name}
          </Link>
        </h3>
        <Rating value={card.rating} count={card.reviewCount} size={12} />
        <Price
          price={card.price}
          salePrice={card.salePrice}
          from={card.priceFrom}
          size="sm"
          className="mt-0.5"
        />
        {card.variantHint && <p className="text-[12px] text-ink-3">{card.variantHint}</p>}

        {onQuickAdd &&
          (card.inStock ? (
            <button
              type="button"
              onClick={() => onQuickAdd(card)}
              aria-label={
                card.quickAddVariantId
                  ? `Add ${card.name} to cart`
                  : `Choose options for ${card.name}`
              }
              className="mt-auto flex h-10 translate-y-0 items-center justify-center gap-1.5 rounded-md bg-ink text-small font-bold text-white transition-colors duration-(--duration-fast) group-hover:bg-brand group-hover:text-ink hover:bg-brand-hover md:h-11"
            >
              {card.quickAddVariantId ? (
                <ShoppingBag aria-hidden="true" className="size-4" />
              ) : (
                <SlidersHorizontal aria-hidden="true" className="size-4" />
              )}
              {card.quickAddVariantId ? "Add to cart" : "Choose options"}
            </button>
          ) : (
            <Link
              to={card.href}
              tabIndex={-1}
              aria-hidden="true"
              className="mt-auto flex h-10 items-center justify-center rounded-md border-[1.5px] border-ink text-small font-bold md:h-11"
            >
              View details
            </Link>
          ))}
      </div>
    </article>
  );
}

/** Same footprint as ProductCard, for loading grids. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3 md:p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1 h-4 w-1/3" />
        <Skeleton className="mt-2 h-10 w-full md:h-11" />
      </div>
    </div>
  );
}
