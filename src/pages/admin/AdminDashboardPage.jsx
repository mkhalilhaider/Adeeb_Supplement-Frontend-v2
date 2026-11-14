import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { OrderStatusBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { formatPrice } from "../../lib/format";
import { adminKeys, fetchDashboard } from "../../features/admin/api";
import { AdminHeader, Panel } from "../../features/admin/ui";
import { adminQuery, shortDateTime } from "../../features/admin/format";

function Stat({ label, value, to, tone }) {
  const body = (
    <>
      <dt className="label-caps text-ink-3">{label}</dt>
      <dd
        className={`mt-1 text-[32px] leading-none font-extrabold font-condensed tabular-nums ${tone ?? ""}`}
      >
        {value}
      </dd>
    </>
  );
  const cls = "block rounded-sm border border-line bg-surface p-4";
  return to ? (
    <Link to={to} className={`${cls} hover:border-ink-3`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function StockList({ rows, empty }) {
  if (!rows?.length) return <p className="text-small text-ink-3">{empty}</p>;
  return (
    <ul className="flex flex-col divide-y divide-line text-small">
      {rows.map((r) => (
        <li key={r.variantId} className="flex items-center justify-between gap-3 py-2">
          <span className="min-w-0">
            <span className="block truncate font-medium">{r.productName}</span>
            <span className="font-mono text-[12px] text-ink-3">{r.sku}</span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums">{r.stockQuantity} left</span>
        </li>
      ))}
    </ul>
  );
}

/** /admin — the day at a glance: totals, stock alerts, latest orders. */
export default function AdminDashboardPage() {
  const query = useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: ({ signal }) => fetchDashboard({ signal }),
    ...adminQuery,
  });

  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  const s = data?.stats;

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        description="Revenue counts cash-on-delivery orders once they're delivered."
      />
      {query.isPending ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Awaiting confirmation"
              value={s.pendingOrders}
              to="/admin/orders?filter=pending_cod"
              tone={s.pendingOrders ? "text-brand-ink" : ""}
            />
            <Stat label="Orders" value={s.totalOrders} to="/admin/orders" />
            <Stat label="Revenue (delivered)" value={formatPrice(s.revenue)} />
            <Stat label="Customers" value={s.totalUsers} />
            <Stat label="Products" value={s.totalProducts} to="/admin/products" />
            <Stat
              label="Low stock"
              value={s.lowStockCount}
              tone={s.lowStockCount ? "text-warning" : ""}
            />
            <Stat
              label="Out of stock"
              value={s.outOfStockCount}
              tone={s.outOfStockCount ? "text-danger" : ""}
            />
          </dl>

          <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
            <Panel
              title="Latest orders"
              actions={
                <Link to="/admin/orders" className="text-small font-medium underline">
                  All orders
                </Link>
              }
            >
              {data.recentOrders?.length ? (
                <ul className="flex flex-col divide-y divide-line text-small">
                  {data.recentOrders.map((o) => (
                    <li
                      key={o._id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <span className="min-w-0">
                        <Link
                          to={`/admin/orders?search=${encodeURIComponent(o.orderNumber)}`}
                          className="font-mono font-semibold hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className="block text-ink-3">
                          {o.shippingAddress?.fullName} · {o.shippingAddress?.city} ·{" "}
                          {shortDateTime(o.createdAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-semibold tabular-nums">{formatPrice(o.total)}</span>
                        <OrderStatusBadge status={o.orderStatus} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-ink-3">No orders yet.</p>
              )}
            </Panel>
            <div className="flex flex-col gap-6">
              <Panel title={`Out of stock (${s.outOfStockCount})`}>
                <StockList rows={data.inventory?.outOfStock} empty="Nothing is out of stock." />
              </Panel>
              <Panel title={`Low stock (${s.lowStockCount})`}>
                <StockList rows={data.inventory?.lowStock} empty="No variants are running low." />
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
