import { lazy, Suspense, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, MessageCircle, RotateCcw } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { OrderStatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { CloudImage } from "../../components/ui/CloudImage";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { site, whatsappLink } from "../../config/site";
import { ApiError } from "../../lib/api/errors";
import { cn } from "../../lib/cn";
import { formatDate, formatPkPhone, formatPrice } from "../../lib/format";
import { notify } from "../../lib/notify";
import { accountKeys } from "../../features/account/api";
import { useMyOrder } from "../../features/account/queries";
import { useCart } from "../../features/cart/useCart";
import { cancelMyOrder } from "../../features/orders/api";
import { OrderStatusTimeline } from "../../features/orders/components/OrderStatusTimeline";
import { canCancel, canReview, orderItemToCartLine } from "../../features/orders/lib/order-actions";
import { variantLabel } from "../../features/product/lib/variant-matrix";
import NotFoundPage from "../store/NotFoundPage";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

function Row({ label, value, strong, tone }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "font-bold")}>
      <dt className={strong ? "" : "text-ink-2"}>{label}</dt>
      <dd className={cn("tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

/** /account/orders/:orderId — progress, items (review, buy again), address, totals, cancel. */
export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const cart = useCart();
  const query = useMyOrder(orderId, queryClient);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rebuying, setRebuying] = useState(false);

  if (query.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <span className="sr-only">Loading order</span>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (query.error instanceof ApiError && query.error.isNotFound) return <NotFoundPage />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;

  const order = query.data;
  const address = order.shippingAddress ?? {};

  const cancel = async () => {
    setCancelling(true);
    try {
      const updated = await cancelMyOrder(order._id);
      queryClient.setQueryData(accountKeys.order(orderId), (o) => ({ ...o, ...updated }));
      queryClient.invalidateQueries({ queryKey: accountKeys.orders });
      notify.success(`Order ${order.orderNumber} cancelled`);
      setConfirmCancel(false);
    } catch (err) {
      notify.error(err);
      queryClient.invalidateQueries({ queryKey: accountKeys.order(orderId) });
    } finally {
      setCancelling(false);
    }
  };

  const buyAgain = async () => {
    if (rebuying) return;
    setRebuying(true);
    const failed = [];
    for (const item of order.items ?? []) {
      try {
        await cart.add(orderItemToCartLine(item), item.quantity);
      } catch {
        failed.push(item.productName);
      }
    }
    setRebuying(false);
    if (failed.length) {
      notify.info("Some items couldn't be added", { description: failed.join(" · ") });
    }
    navigate("/cart");
  };

  return (
    <div className="flex flex-col gap-8">
      <Seo title={`Order ${order.orderNumber}`} noIndex />
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-1 self-start text-small font-medium text-ink-2 hover:text-ink"
      >
        <ChevronLeft aria-hidden="true" className="size-4" /> All orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-h2 font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-small text-ink-2">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.orderStatus} />
      </header>

      <OrderStatusTimeline status={order.orderStatus} />

      {order.trackingNumber && (
        <p className="rounded-sm bg-surface p-4 text-small">
          <span className="text-ink-2">Tracking number </span>
          <span className="font-mono font-semibold">{order.trackingNumber}</span>
          {order.courierName && <span className="text-ink-2"> · {order.courierName}</span>}
        </p>
      )}

      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="text-h3 font-bold">
          Items
        </h2>
        <ul className="mt-3 flex flex-col border-t border-line">
          {(order.items ?? []).map((item) => {
            const label = variantLabel(item);
            return (
              <li key={item.variantId} className="flex gap-3 border-b border-line py-4">
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
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-small">
                  {item.productSlug ? (
                    <Link
                      to={`/product/${item.productSlug}`}
                      className="line-clamp-2 font-medium hover:underline"
                    >
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
        {canReview(order) && (
          <p className="mt-3 text-small text-ink-2">
            Happy with your order?{" "}
            <a
              href={site.google.writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-brand-ink"
            >
              Write a review on Google
            </a>
          </p>
        )}
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="address-heading">
          <h2 id="address-heading" className="text-h3 font-bold">
            Delivery address
          </h2>
          <address className="mt-3 text-small text-ink-2 not-italic">
            <span className="block font-semibold text-ink">{address.fullName}</span>
            <span className="block">{address.addressLine1}</span>
            {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
            <span className="block">{address.city}</span>
            {address.phone && <span className="block">{formatPkPhone(address.phone)}</span>}
          </address>
        </section>
        <section aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="text-h3 font-bold">
            Payment
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-small">
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            {order.discount > 0 && (
              <Row
                label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={`− ${formatPrice(order.discount)}`}
                tone="text-success"
              />
            )}
            <Row
              label="Delivery"
              value={order.shippingFee ? formatPrice(order.shippingFee) : "Free"}
            />
            <div className="border-t border-line pt-2 text-body">
              <Row
                label={order.paymentStatus === "paid" ? "Paid on delivery" : "Cash on delivery"}
                value={formatPrice(order.total)}
                strong
              />
            </div>
          </dl>
        </section>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:flex-wrap">
        <Button
          onClick={buyAgain}
          loading={rebuying}
          leadingIcon={<RotateCcw className="size-4" />}
        >
          Buy again
        </Button>
        <Button
          variant="outline"
          href={whatsappLink(`Hi, I have a question about my order ${order.orderNumber}.`)}
          leadingIcon={<MessageCircle className="size-4" />}
        >
          Ask about this order
        </Button>
        {canCancel(order) && (
          <Button variant="ghost" className="sm:ml-auto" onClick={() => setConfirmCancel(true)}>
            Cancel order
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        {confirmCancel && (
          <ConfirmDialog
            open={confirmCancel}
            onOpenChange={setConfirmCancel}
            title="Cancel this order?"
            description={`Order ${order.orderNumber} will be cancelled. This can't be undone — you'd need to place a new order.`}
            confirmLabel="Cancel order"
            cancelLabel="Keep order"
            pending={cancelling}
            onConfirm={cancel}
          />
        )}
      </Suspense>
    </div>
  );
}
