import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "../../../components/ui/Badge";
import { CloudImage } from "../../../components/ui/CloudImage";
import { formatDate, formatPrice } from "../../../lib/format";

/** One row in the order history: number, date, status, first items, total. */
export function OrderCard({ order }) {
  const items = order.items ?? [];
  const count = items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Link
      to={`/account/orders/${order._id}`}
      className="group flex items-center gap-4 rounded-sm border border-line bg-surface p-4 transition-colors duration-(--duration-fast) hover:border-ink-3"
    >
      <div className="flex shrink-0 -space-x-3" aria-hidden="true">
        {items.slice(0, 3).map((item) => (
          <span
            key={item.variantId}
            className="size-12 rounded-sm border-2 border-surface bg-shelf p-0.5"
          >
            <CloudImage
              src={item.image?.url}
              alt=""
              ratio={null}
              sizes="48px"
              trim
              blend
              className="size-full"
            />
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-small font-semibold">{order.orderNumber}</span>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
        <p className="text-small text-ink-2">
          {formatDate(order.createdAt)} · {count} {count === 1 ? "item" : "items"} ·{" "}
          <span className="font-semibold text-ink tabular-nums">{formatPrice(order.total)}</span>
        </p>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-ink-3 group-hover:text-ink"
      />
    </Link>
  );
}
