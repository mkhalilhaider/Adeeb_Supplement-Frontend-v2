import { cn } from "../../lib/cn";
import { discountPercent, formatPrice } from "../../lib/format";

const sizes = {
  sm: { now: "text-small font-semibold", was: "text-[12px]" },
  md: { now: "text-body font-semibold", was: "text-small" },
  lg: { now: "text-h2 font-bold", was: "text-body" },
};

/**
 * Price with optional sale. The paid price is always prominent and in ink; the regular price is
 * struck through and announced as "was" for screen readers.
 *
 * @param {object} props
 * @param {number} props.price         Regular price
 * @param {number|null} [props.salePrice]
 * @param {boolean} [props.from]       Prefix "From" (variants with different prices)
 * @param {boolean} [props.showSaving] Show "Save 8%"
 * @param {"sm"|"md"|"lg"} [props.size]
 */
export function Price({
  price,
  salePrice,
  from = false,
  showSaving = false,
  size = "md",
  className,
}) {
  const onSale = salePrice != null && salePrice < price;
  const paid = onSale ? salePrice : price;
  const percent = onSale ? discountPercent(price, salePrice) : 0;
  const s = sizes[size];

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums", className)}>
      {from && <span className="text-small text-ink-3">From</span>}
      <span className={cn(s.now, "text-ink")}>
        {onSale && <span className="sr-only">Now </span>}
        {formatPrice(paid)}
      </span>
      {onSale && (
        <span className={cn(s.was, "text-ink-3 line-through decoration-1")}>
          <span className="sr-only">was </span>
          {formatPrice(price)}
        </span>
      )}
      {onSale && showSaving && percent > 0 && (
        <span className={cn(s.was, "font-semibold text-brand-ink")}>Save {percent}%</span>
      )}
    </p>
  );
}
