import { Link } from "react-router";
import { MapPin, Package } from "lucide-react";
import { Seo } from "../../components/seo/Seo";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { formatPkPhone } from "../../lib/format";
import { OrderCard } from "../../features/account/components/OrderCard";
import { useAddresses, useMyOrders } from "../../features/account/queries";

function Panel({ title, action, children }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h3 font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** /account — latest orders and the default delivery address at a glance. */
export default function AccountOverviewPage() {
  const orders = useMyOrders();
  const addresses = useAddresses();
  const recent = (orders.data ?? []).slice(0, 3);
  const defaultAddress = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0] ?? null;

  return (
    <div className="flex flex-col gap-10">
      <Seo title="My account" noIndex />
      <h1 className="sr-only">Account overview</h1>

      <Panel
        title="Recent orders"
        action={
          (orders.data?.length ?? 0) > 3 && (
            <Link to="/account/orders" className="text-small font-medium underline">
              All orders
            </Link>
          )
        }
      >
        {orders.isPending ? (
          <div role="status" className="flex flex-col gap-3">
            <span className="sr-only">Loading orders</span>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} compact />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Orders you place while logged in show up here."
            action={<Button to="/shop">Start shopping</Button>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((order) => (
              <li key={order._id}>
                <OrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="Default address"
        action={
          <Link to="/account/addresses" className="text-small font-medium underline">
            Manage
          </Link>
        }
      >
        {addresses.isPending ? (
          <Skeleton className="h-24 w-full max-w-md" />
        ) : defaultAddress ? (
          <address className="max-w-md rounded-sm border border-line bg-surface p-4 text-small text-ink-2 not-italic">
            <span className="block font-semibold text-ink">{defaultAddress.fullName}</span>
            <span className="block">{defaultAddress.addressLine1}</span>
            {defaultAddress.addressLine2 && (
              <span className="block">{defaultAddress.addressLine2}</span>
            )}
            <span className="block">
              {defaultAddress.city} {defaultAddress.postalCode}
            </span>
            <span className="block">{formatPkPhone(defaultAddress.phone)}</span>
          </address>
        ) : (
          <div className="flex max-w-md items-start gap-3 rounded-sm border border-dashed border-line-strong p-4 text-small text-ink-2">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>
              Save an address to check out in one tap.{" "}
              <Link to="/account/addresses" className="font-semibold text-ink underline">
                Add address
              </Link>
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}
