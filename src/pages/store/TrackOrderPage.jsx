import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Search } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Breadcrumbs } from "../../components/ui/Breadcrumbs";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { site, whatsappLink } from "../../config/site";
import { ApiError } from "../../lib/api/errors";
import { formatDate, formatPrice } from "../../lib/format";
import { trackOrder } from "../../features/orders/api";
import { OrderItems } from "../../features/orders/components/OrderItems";
import { OrderStatusTimeline } from "../../features/orders/components/OrderStatusTimeline";
import { parseOrderIdentifier } from "../../features/orders/lib/order-status";

const SHIPMENT_LABEL = {
  pending: "Not booked yet",
  label_created: "Booked",
  in_transit: "In transit",
  delivered: "Delivered",
};

/**
 * /track-order (also /track) — look up an order by its number or the id from our emails
 * (?orderId=…). Shows status, items and total; never the phone or street address.
 */
export default function TrackOrderPage() {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("orderId") ?? params.get("order") ?? "";
  const identifier = parseOrderIdentifier(fromUrl);
  const [draft, setDraft] = useState(fromUrl);
  const [inputError, setInputError] = useState("");
  const resultRef = useRef(/** @type {HTMLDivElement|null} */ (null));

  const query = useQuery({
    queryKey: ["order-track", identifier],
    queryFn: ({ signal }) => trackOrder(identifier, { signal }),
    enabled: Boolean(identifier),
    staleTime: 60_000,
    retry: (n, e) => !(e instanceof ApiError && e.isClientError) && n < 1,
  });

  const submit = (event) => {
    event.preventDefault();
    const next = parseOrderIdentifier(draft);
    if (!next) {
      setInputError("Enter the full order number, like SUP-20261110-0001");
      return;
    }
    setInputError("");
    setParams({ orderId: next }, { replace: true });
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  const order = query.data;
  let result = null;
  if (identifier) {
    if (query.isPending) {
      result = (
        <div role="status" className="flex flex-col gap-4">
          <span className="sr-only">Looking up your order</span>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    } else if (query.error instanceof ApiError && query.error.isNotFound) {
      result = (
        <EmptyState
          icon={PackageSearch}
          title="We couldn't find that order"
          description={`Check the number in your confirmation, or message us on WhatsApp and we'll look it up.`}
          action={
            <Button
              href={whatsappLink(`Hi, I'm looking for my order ${identifier}.`)}
              variant="outline"
            >
              WhatsApp {site.contact.phoneDisplay}
            </Button>
          }
        />
      );
    } else if (query.isError) {
      result = <ErrorState error={query.error} onRetry={() => query.refetch()} />;
    } else if (order) {
      result = (
        <article aria-labelledby="order-heading" className="flex flex-col gap-8">
          <header className="flex flex-col gap-1">
            <h2 id="order-heading" className="font-mono text-h2 font-semibold">
              {order.orderNumber}
            </h2>
            <p className="text-small text-ink-2">
              Placed {formatDate(order.createdAt)}
              {order.shippingAddress?.city && <> · Delivering to {order.shippingAddress.city}</>}
              {" · "}
              {formatPrice(order.total)} cash on delivery
            </p>
          </header>

          <OrderStatusTimeline status={order.orderStatus} />

          {order.trackingNumber && (
            <dl className="grid gap-3 rounded-sm bg-surface p-4 text-small sm:grid-cols-2">
              <div>
                <dt className="label-caps text-ink-3">Tracking number</dt>
                <dd className="mt-1 font-mono font-semibold">{order.trackingNumber}</dd>
              </div>
              <div>
                <dt className="label-caps text-ink-3">Shipment</dt>
                <dd className="mt-1 font-semibold">
                  {SHIPMENT_LABEL[order.shipmentStatus] ?? order.shipmentStatus}
                </dd>
              </div>
            </dl>
          )}

          <section aria-labelledby="track-items-heading">
            <h3 id="track-items-heading" className="text-h3 font-bold">
              Items
            </h3>
            <div className="mt-3">
              <OrderItems items={order.items ?? []} />
            </div>
          </section>
        </article>
      );
    }
  }

  return (
    <div className="page-container pb-16">
      <Seo
        title="Track your order"
        description="Check the status of your Adeeb Supplement order with your order number."
        canonicalPath="/track-order"
      />
      <Breadcrumbs
        className="pt-4 md:pt-6"
        items={[{ label: "Home", to: "/" }, { label: "Track order" }]}
      />

      <div className="mx-auto max-w-3xl">
        <h1 className="mt-4 text-[2.75rem] font-display md:text-[4rem]">Track your order</h1>
        <p className="mt-2 text-ink-2">
          Enter the order number from your confirmation page or email.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <Field label="Order number" hideLabel error={inputError} className="flex-1">
            {(f) => (
              <Input
                {...f}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="SUP-20261110-0001"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                leading={<Search aria-hidden="true" className="size-4" />}
              />
            )}
          </Field>
          <Button type="submit" size="lg" loading={Boolean(identifier) && query.isFetching}>
            Track order
          </Button>
        </form>

        <p className="sr-only" aria-live="polite">
          {!identifier || query.isPending
            ? ""
            : order
              ? `Order ${order.orderNumber} found.`
              : "Order not found."}
        </p>
        <div ref={resultRef} tabIndex={-1} className="mt-10 outline-none">
          {result}
        </div>
      </div>
    </div>
  );
}
