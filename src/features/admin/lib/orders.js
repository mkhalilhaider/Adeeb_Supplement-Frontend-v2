import { normalizePkPhone } from "../../../lib/format";

/** Tabs the backend counts (filter values) with shop-friendly labels. */
export const ORDER_TABS = [
  { value: "all", label: "All" },
  { value: "pending_cod", label: "To confirm" },
  { value: "karachi", label: "Karachi" },
  { value: "national", label: "Other cities" },
  { value: "confirmed", label: "Confirmed & packing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const STATUS_LABEL = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ALL = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

/**
 * Statuses an order can move to, mirroring the backend: delivered and cancelled are final,
 * shipped can only become delivered, anything else can go anywhere.
 */
export function nextStatuses(current) {
  if (current === "delivered" || current === "cancelled") return [];
  if (current === "shipped") return ["delivered"];
  return ALL.filter((s) => s !== current);
}

/** Changes that deserve an "are you sure?": they email the customer and can't be undone. */
export const isFinalChange = (status) => status === "delivered" || status === "cancelled";

/** Other cities ship by courier and need a manual InstaWorld booking. */
export function canBookCourier(order) {
  return (
    order.deliveryType === "national_courier" &&
    !order.trackingNumber &&
    !["cancelled", "delivered"].includes(order.orderStatus)
  );
}

/** wa.me link to the customer (Pakistani mobiles only), with a friendly opener. */
export function customerWhatsApp(order) {
  const phone = normalizePkPhone(order.shippingAddress?.phone);
  if (!phone) return null;
  const name = String(order.shippingAddress?.fullName ?? "").split(" ")[0];
  const text = `Assalam o Alaikum${name ? ` ${name}` : ""}, this is Adeeb Supplement about your order ${order.orderNumber}.`;
  return `https://wa.me/92${phone.slice(1)}?text=${encodeURIComponent(text)}`;
}

export const itemCount = (order) => (order.items ?? []).reduce((n, i) => n + i.quantity, 0);
