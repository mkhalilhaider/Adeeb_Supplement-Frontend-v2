import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { AlertTriangle, Trash2 } from "lucide-react";
import { CloudImage } from "../../../components/ui/CloudImage";
import { QuantityStepper } from "../../../components/ui/QuantityStepper";
import { cn } from "../../../lib/cn";
import { formatPrice } from "../../../lib/format";
import { variantLabel } from "../../product/lib/variant-matrix";

const MAX_PER_LINE = 20;

/**
 * One cart line. Shows the live price when it changed since adding, and any problem (sold out,
 * not enough stock) in plain words next to the line.
 *
 * @param {{ line: import("../guest-cart").CartLine, check?: import("../lib/line-check").LineCheck,
 *   onQuantity: (q: number) => void, onRemove: () => void, compact?: boolean, highlight?: boolean }} props
 */
export function CartLineItem({
  line,
  check,
  onQuantity,
  onRemove,
  compact = false,
  highlight = false,
}) {
  const price = check?.livePrice ?? line.unitPrice;
  const priceChanged = check?.livePrice != null && check.livePrice !== line.unitPrice;
  const max = Math.max(1, Math.min(check?.stock ?? line.maxQuantity ?? MAX_PER_LINE, MAX_PER_LINE));
  const href = line.slug ? `/product/${line.slug}` : undefined;
  const problem = check && check.status !== "ok" && check.status !== "price";
  const label = variantLabel(line);

  const Name = href ? Link : "span";

  // The line just added may sit below the fold of the drawer: bring it into view once it opens.
  const itemRef = useRef(/** @type {HTMLLIElement|null} */ (null));
  useEffect(() => {
    if (!highlight) return;
    const id = setTimeout(() => itemRef.current?.scrollIntoView({ block: "nearest" }), 320);
    return () => clearTimeout(id);
  }, [highlight]);

  return (
    <li
      ref={itemRef}
      className={cn(
        "flex gap-3 border-b border-line py-4 transition-colors duration-700",
        highlight && "bg-brand/10",
      )}
    >
      <Name
        {...(href ? { to: href, tabIndex: -1, "aria-hidden": true } : {})}
        className={cn("shrink-0 bg-shelf p-1.5", compact ? "size-16" : "size-20 md:size-24")}
      >
        <CloudImage
          src={line.image?.url ?? check?.image?.url}
          alt=""
          ratio={null}
          sizes="96px"
          trim
          blend
          className="size-full"
        />
      </Name>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {(line.brand || check?.brand) && (
              <p className="truncate label-mono text-ink-3">{line.brand || check.brand}</p>
            )}
            <Name
              {...(href ? { to: href } : {})}
              className="line-clamp-2 text-small font-medium hover:underline md:text-body"
            >
              {line.name}
            </Name>
            {label && <p className="text-small text-ink-3">{label}</p>}
          </div>
          <p className="shrink-0 text-right font-semibold tabular-nums">
            {formatPrice(price * line.quantity)}
          </p>
        </div>

        <p className="text-small text-ink-2 tabular-nums">
          {formatPrice(price)} each
          {priceChanged && (
            <s className="ml-2 text-ink-3">
              <span className="sr-only">, was </span>
              {formatPrice(line.unitPrice)}
            </s>
          )}
        </p>

        {check?.message && (
          <p
            role={problem ? "alert" : undefined}
            className={cn(
              "flex items-center gap-1.5 text-small",
              problem ? "text-danger" : "text-ink-2",
            )}
          >
            {problem && <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />}
            {check.message}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between gap-3">
          {check?.status === "unavailable" ? (
            <span />
          ) : (
            <QuantityStepper
              size="sm"
              value={line.quantity}
              max={max}
              onChange={onQuantity}
              label={`Quantity of ${line.name}`}
            />
          )}
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-small text-ink-2 hover:bg-shelf hover:text-ink"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Remove<span className="sr-only"> {line.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
