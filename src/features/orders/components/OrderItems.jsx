import { Link } from "react-router";
import { CloudImage } from "../../../components/ui/CloudImage";
import { formatPrice } from "../../../lib/format";
import { variantLabel } from "../../product/lib/variant-matrix";

/**
 * Items of a placed order (prices as charged, from the order itself — not today's prices).
 * @param {{ items: any[] }} props
 */
export function OrderItems({ items }) {
  return (
    <ul className="flex flex-col border-t border-line">
      {items.map((item) => {
        const label = variantLabel(item);
        const href = item.productSlug ? `/product/${item.productSlug}` : null;
        return (
          <li key={item.variantId ?? item._id} className="flex gap-3 border-b border-line py-3">
            <div className="size-16 shrink-0 bg-shelf p-1">
              <CloudImage
                src={item.image?.url}
                alt=""
                ratio={null}
                sizes="64px"
                trim
                blend
                className="size-full"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-small">
              {href ? (
                <Link to={href} className="line-clamp-2 font-medium hover:underline">
                  {item.productName}
                </Link>
              ) : (
                <p className="line-clamp-2 font-medium">{item.productName}</p>
              )}
              {label && <p className="text-ink-3">{label}</p>}
              <p className="text-ink-3">
                {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-small font-semibold tabular-nums">
              {formatPrice(item.lineTotal ?? item.unitPrice * item.quantity)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
