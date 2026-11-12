import { useState } from "react";
import { useLocation, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Copy } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { ApiError } from "../../lib/api/errors";
import { cn } from "../../lib/cn";
import { formatPkPhone, formatPrice } from "../../lib/format";
import { useSession } from "../../features/auth/session-store";
import { readLastOrder } from "../../features/checkout/lib/checkout-session";
import { trackOrder } from "../../features/orders/api";
import { OrderItems } from "../../features/orders/components/OrderItems";
import { OrderStatusTimeline } from "../../features/orders/components/OrderStatusTimeline";
import { parseOrderIdentifier } from "../../features/orders/lib/order-status";
import NotFoundPage from "./NotFoundPage";

function Row({ label, value, strong = false, tone }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "font-bold")}>
      <dt className={strong ? "" : "text-ink-2"}>{label}</dt>
      <dd className={cn("tabular-nums", tone)}>{value}</dd>
    </div>
  );
}

function CopyNumber({ value }) {
  const [copied, setCopied] = useState(false);
  if (!navigator.clipboard) return null;
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => setCopied(true),
          () => {},
        )
      }
      className="inline-flex items-center gap-1 rounded-sm px-2 py-1 text-small text-ink-2 hover:bg-shelf hover:text-ink"
    >
      <Copy aria-hidden="true" className="size-4" />
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/**
 * /order/:orderNumber/confirmed — shown right after checkout from the order the backend
 * returned (navigation state, or this tab's copy after a reload). Opened anywhere else, it
 * falls back to the public tracking lookup, which has no phone or street address.
 */
export default function OrderConfirmedPage() {
  const { orderNumber = "" } = useParams();
  const location = useLocation();
  const user = useSession((s) => s.user);

  const fromCheckout = (() => {
    const fromState = location.state?.order;
    if (fromState?.orderNumber === orderNumber) return fromState;
    const last = readLastOrder();
    return last?.orderNumber === orderNumber ? last : null;
  })();

  const identifier = parseOrderIdentifier(orderNumber);
  const lookup = useQuery({
    queryKey: ["order-track", identifier],
    queryFn: ({ signal }) => trackOrder(identifier, { signal }),
    enabled: !fromCheckout && Boolean(identifier),
    retry: (n, e) => !(e instanceof ApiError && e.isClientError) && n < 1,
  });

  if (!identifier) return <NotFoundPage />;
  const order = fromCheckout ?? lookup.data;

  if (!order) {
    if (lookup.error instanceof ApiError && lookup.error.isNotFound) return <NotFoundPage />;
    return (
      <div className="page-container py-12">
        {lookup.isError ? (
          <ErrorState error={lookup.error} onRetry={() => lookup.refetch()} />
        ) : (
          <div role="status" className="flex flex-col gap-4">
            <span className="sr-only">Loading your order</span>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
      </div>
    );
  }

  const address = order.shippingAddress ?? {};
  const email = order.guestEmail || (fromCheckout && order.userId ? user?.email : "");
  const firstName = String(address.fullName ?? "").split(" ")[0];

  return (
    <div className="page-container pt-8 pb-16 md:pt-12">
      <Seo title={`Order ${order.orderNumber}`} noIndex />

      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
          <h1 className="text-h1 font-extrabold uppercase font-condensed md:text-5xl">
            {fromCheckout ? `Thank you${firstName ? `, ${firstName}` : ""}!` : "Your order"}
          </h1>
          <p className="text-ink-2">
            {fromCheckout ? "Your order is placed." : "Order details"}
            {email && fromCheckout && (
              <>
                {" "}
                A confirmation is on its way to <span className="text-ink">{email}</span>.
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-sm border border-line bg-surface px-4 py-3">
            <span className="label-caps text-ink-3">Order number</span>
            <span className="font-mono text-h3 font-semibold">{order.orderNumber}</span>
            <CopyNumber value={order.orderNumber} />
          </div>
        </div>

        <section aria-labelledby="progress-heading" className="mt-10">
          <h2 id="progress-heading" className="text-h3 font-bold">
            Order progress
          </h2>
          <OrderStatusTimeline status={order.orderStatus} className="mt-4" />
        </section>

        <section
          aria-labelledby="next-heading"
          className="mt-10 grid gap-4 rounded-sm bg-surface p-5 md:grid-cols-3 md:p-6"
        >
          <h2 id="next-heading" className="sr-only">
            What happens next
          </h2>
          {[
            ["1", "We confirm", "We check your order and get it packed."],
            [
              "2",
              "We deliver",
              order.deliveryType === "local_rider"
                ? "Our rider brings it to you in Karachi."
                : "A courier delivers it to your door.",
            ],
            [
              "3",
              "You pay on delivery",
              `Keep ${formatPrice(order.total)} in cash ready for the rider.`,
            ],
          ].map(([n, title, text]) => (
            <div key={n} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink label-caps text-[12px] text-paper"
              >
                {n}
              </span>
              <p className="text-small">
                <span className="block font-semibold">{title}</span>
                <span className="text-ink-2">{text}</span>
              </p>
            </div>
          ))}
        </section>

        <div className="mt-10 grid gap-10 md:grid-cols-[1fr_18rem]">
          <section aria-labelledby="items-heading">
            <h2 id="items-heading" className="text-h3 font-bold">
              Items
            </h2>
            <div className="mt-3">
              <OrderItems items={order.items ?? []} />
            </div>
            {order.subtotal != null ? (
              <dl className="mt-4 flex flex-col gap-2 text-small">
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
                  <Row label="Total (cash on delivery)" value={formatPrice(order.total)} strong />
                </div>
              </dl>
            ) : (
              <p className="mt-4 flex justify-between font-bold">
                <span>Total (cash on delivery)</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </p>
            )}
          </section>

          <section aria-labelledby="address-heading">
            <h2 id="address-heading" className="text-h3 font-bold">
              Delivering to
            </h2>
            <address className="mt-3 text-small text-ink-2 not-italic">
              <span className="block font-semibold text-ink">{address.fullName}</span>
              {address.addressLine1 && <span className="block">{address.addressLine1}</span>}
              {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
              <span className="block">{address.city}</span>
              {address.phone && <span className="block">{formatPkPhone(address.phone)}</span>}
            </address>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button to={`/track-order?orderId=${encodeURIComponent(order.orderNumber)}`}>
            Track this order
          </Button>
          <Button to="/shop" variant="outline">
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  );
}
