import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, ChevronsUpDown, MessagesSquare, Phone, Printer, TextSearch } from "lucide-react";
import { OrderStatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { ApiError, errorMessage } from "../../lib/api/errors";
import { cn } from "../../lib/cn";
import { formatPkPhone, formatPrice } from "../../lib/format";
import { useDebouncedValue } from "../../lib/hooks";
import { notify } from "../../lib/notify";
import {
  adminKeys,
  bookInstaWorld,
  fetchAdminOrders,
  setOrderStatus,
} from "../../features/admin/api";
import {
  ORDER_TABS,
  STATUS_LABEL,
  canBookCourier,
  customerWhatsApp,
  isFinalChange,
  itemCount,
  nextStatuses,
} from "../../features/admin/lib/orders";
import { printPackingSlip } from "../../features/admin/lib/packing-slip";
import { AdminHeader, Pagination } from "../../features/admin/ui";
import { adminQuery, shortDateTime } from "../../features/admin/format";

const ConfirmDialog = lazy(() =>
  import("../../components/ui/Dialog").then((m) => ({ default: m.ConfirmDialog })),
);

function Detail({ label, children }) {
  return (
    <div>
      <dt className="label-mono text-ink-3">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}

/** One order: summary row that expands into everything needed to handle it. */
function OrderRow({ order, onChange }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState("");
  const a = order.shippingAddress ?? {};
  const wa = customerWhatsApp(order);
  const options = nextStatuses(order.orderStatus);

  const applyStatus = async (status) => {
    setBusy("status");
    try {
      const updated = await setOrderStatus(order._id, status);
      onChange(updated);
      notify.success(`${order.orderNumber}: ${STATUS_LABEL[status]}`);
      setTarget("");
      setConfirming(false);
    } catch (err) {
      notify.error(err);
    } finally {
      setBusy("");
    }
  };

  const changeStatus = () => {
    if (!target) return;
    if (isFinalChange(target)) setConfirming(true);
    else applyStatus(target);
  };

  const book = async () => {
    setBusy("book");
    try {
      const result = await bookInstaWorld(order._id);
      onChange(result.order);
      notify.success(
        result.alreadyBooked
          ? `Already booked: ${result.order.trackingNumber}`
          : `Booked on InstaWorld: ${result.order.trackingNumber}`,
      );
    } catch (err) {
      notify.error(err instanceof ApiError ? err.message : errorMessage(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <li className="rounded-sm border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="grid w-full grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1 p-4 text-left md:grid-cols-[11rem_1fr_7rem_10rem_1.5rem] md:items-center"
      >
        <span className="font-mono text-small font-semibold">
          {order.orderNumber}
          <span className="block font-sans text-[12px] font-normal text-ink-3">
            {shortDateTime(order.createdAt)}
          </span>
        </span>
        <span className="col-start-1 min-w-0 text-small md:col-start-auto">
          <span className="block truncate font-medium">{a.fullName}</span>
          <span className="block truncate text-ink-3">
            {a.city} · {itemCount(order)} items{order.userId ? "" : " · guest"}
          </span>
        </span>
        <span className="row-start-1 text-right text-small font-semibold tabular-nums md:row-start-auto">
          {formatPrice(order.total)}
        </span>
        <span className="col-start-2 row-start-2 justify-self-end md:col-start-auto md:row-start-auto md:justify-self-start">
          <OrderStatusBadge status={order.orderStatus} />
        </span>
        <ChevronsUpDown
          aria-hidden="true"
          className={cn(
            "hidden size-5 text-ink-3 transition-transform md:block",
            open && "rotate-180",
          )}
        />
        <span className="sr-only">{open ? "Hide details" : "Show details"}</span>
      </button>

      {open && (
        <div className="border-t border-line p-4">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <ul className="flex flex-col divide-y divide-line text-small">
                {(order.items ?? []).map((i) => (
                  <li key={i.variantId} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block font-medium">{i.productName}</span>
                      <span className="block text-ink-3">
                        {[i.attributes?.flavor, i.attributes?.weight].filter(Boolean).join(" · ")}{" "}
                        <span className="font-mono text-[12px]">{i.sku}</span>
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {i.quantity} × {formatPrice(i.unitPrice)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-small">
                <div className="flex justify-between">
                  <dt className="text-ink-2">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-2">Discount ({order.couponCode})</dt>
                    <dd className="tabular-nums">− {formatPrice(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-2">Delivery</dt>
                  <dd className="tabular-nums">
                    {order.shippingFee ? formatPrice(order.shippingFee) : "Free"}
                  </dd>
                </div>
                <div className="flex justify-between font-bold">
                  <dt>Collect (COD)</dt>
                  <dd className="tabular-nums">{formatPrice(order.total)}</dd>
                </div>
              </dl>
              {order.notes && (
                <p className="mt-3 rounded-sm bg-warning-soft p-3 text-small">
                  <strong>Customer note:</strong> {order.notes}
                </p>
              )}
            </div>

            <dl className="grid content-start gap-4 text-small sm:grid-cols-2 lg:grid-cols-1">
              <Detail label="Deliver to">
                <span className="block font-medium">{a.fullName}</span>
                <span className="block">{a.addressLine1}</span>
                {a.addressLine2 && <span className="block">{a.addressLine2}</span>}
                <span className="block">{a.city}</span>
              </Detail>
              <Detail label="Contact">
                <span className="block">{formatPkPhone(a.phone)}</span>
                <span className="block text-ink-3">
                  {order.user?.email ?? order.guestEmail ?? ""}
                  {order.userId ? " (account)" : order.guestEmail ? " (guest)" : "Guest, no email"}
                </span>
              </Detail>
              <Detail label="Shipping">
                <span className="block">{order.courierName}</span>
                {order.trackingNumber ? (
                  <span className="block font-mono">{order.trackingNumber}</span>
                ) : (
                  <span className="block text-ink-3">No tracking number yet</span>
                )}
                {order.shipmentError && (
                  <span className="mt-1 block text-danger">
                    Last booking error: {order.shipmentError}
                  </span>
                )}
              </Detail>
            </dl>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-line pt-4">
            {options.length > 0 && (
              <div className="flex items-end gap-2">
                <label className="flex flex-col gap-1 text-small">
                  <span className="label-mono text-ink-3">Change status</span>
                  <Select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="!h-10 w-52"
                  >
                    <option value="">Choose…</option>
                    {options.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button onClick={changeStatus} disabled={!target} loading={busy === "status"}>
                  Update
                </Button>
              </div>
            )}
            {canBookCourier(order) && (
              <Button
                variant="outline"
                onClick={book}
                loading={busy === "book"}
                leadingIcon={<Bike className="size-4" />}
              >
                Book on InstaWorld
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() =>
                printPackingSlip(order) || notify.error("Allow pop-ups to print the packing slip")
              }
              leadingIcon={<Printer className="size-4" />}
            >
              Packing slip
            </Button>
            {wa && (
              <Button
                variant="outline"
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                leadingIcon={<MessagesSquare className="size-4" />}
              >
                WhatsApp
              </Button>
            )}
            {a.phone && (
              <Button
                variant="ghost"
                href={`tel:${a.phone}`}
                leadingIcon={<Phone className="size-4" />}
              >
                Call
              </Button>
            )}
          </div>
        </div>
      )}

      {confirming && (
        <Suspense fallback={null}>
          <ConfirmDialog
            open
            onOpenChange={(o) => !o && setConfirming(false)}
            title={`Mark ${order.orderNumber} as ${STATUS_LABEL[target]?.toLowerCase()}?`}
            description={
              target === "cancelled"
                ? "Stock goes back on the shelf and the customer gets a cancellation email. This can't be undone."
                : "The order counts as paid (cash collected) and the customer gets a delivery email. This can't be undone."
            }
            confirmLabel={target === "cancelled" ? "Cancel order" : "Mark delivered"}
            tone={target === "cancelled" ? "danger" : "neutral"}
            pending={busy === "status"}
            onConfirm={() => applyStatus(target)}
          />
        </Suspense>
      )}
    </li>
  );
}

/** /admin/orders — tabs with counts, search, paging, and inline handling of each order. */
export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const term = useDebouncedValue(search.trim(), 400);

  // Keep the URL in step with the debounced search (back button and links keep working).
  useEffect(() => {
    setParams(
      (p) => {
        const current = p.get("search") ?? "";
        if (current === term) return p;
        if (term) p.set("search", term);
        else p.delete("search");
        p.delete("page");
        return p;
      },
      { replace: true },
    );
  }, [term, setParams]);

  const queryParams = { page, filter, search: term };
  const query = useQuery({
    queryKey: adminKeys.orders(queryParams),
    queryFn: ({ signal }) => fetchAdminOrders(queryParams, { signal }),
    placeholderData: keepPreviousData,
    ...adminQuery,
  });

  const setParam = (key, value) =>
    setParams((p) => {
      if (value && value !== "all" && value !== 1) p.set(key, String(value));
      else p.delete(key);
      if (key !== "page") p.delete("page");
      return p;
    });

  const replaceOrder = (updated) => {
    queryClient.setQueryData(adminKeys.orders(queryParams), (data) =>
      data
        ? {
            ...data,
            orders: data.orders.map((o) => (o._id === updated._id ? { ...o, ...updated } : o)),
          }
        : data,
    );
    // Counts and other tabs change too.
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"], refetchType: "none" });
    queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
  };

  const data = query.data;
  return (
    <div>
      <AdminHeader
        title="Orders"
        description="Cash on delivery. Karachi orders get a rider tracking number automatically; other cities need an InstaWorld booking."
      />

      <div className="-mx-4 mb-4 [scrollbar-width:none] overflow-x-auto px-4 md:mx-0 md:px-0">
        <div role="tablist" aria-label="Order status" className="flex gap-1">
          {ORDER_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={filter === t.value}
              onClick={() => setParam("filter", t.value)}
              className={cn(
                "shrink-0 rounded-sm px-3 py-2 text-small font-medium whitespace-nowrap",
                filter === t.value ? "bg-ink text-paper" : "bg-surface text-ink-2 hover:bg-shelf",
              )}
            >
              {t.label}
              {data?.counts?.[t.value] != null && (
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    filter === t.value ? "text-paper/70" : "text-ink-3",
                  )}
                >
                  {data.counts[t.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <label className="mb-4 block max-w-md">
        <span className="sr-only">Search orders</span>
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order number, name, phone or email"
          leading={<TextSearch aria-hidden="true" className="size-4" />}
        />
      </label>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : data.orders.length === 0 ? (
        <p className="rounded-sm border border-line bg-surface p-10 text-center text-ink-3">
          No orders {term ? `match “${term}”` : "here yet"}.
        </p>
      ) : (
        <>
          <ul
            className={cn("flex flex-col gap-2", query.isPlaceholderData && "opacity-60")}
            aria-busy={query.isFetching}
          >
            {data.orders.map((o) => (
              <OrderRow key={o._id} order={o} onChange={replaceOrder} />
            ))}
          </ul>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            label="orders"
            onPage={(p) => setParam("page", p)}
          />
        </>
      )}
    </div>
  );
}
