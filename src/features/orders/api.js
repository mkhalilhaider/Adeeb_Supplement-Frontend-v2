import { getData } from "../../lib/api";

/**
 * Public order lookup by order number ("SUP-20261110-0001", "20261110-0001", "#…") or the
 * order id from emails. Returns limited fields only (no phone or street address).
 */
export const trackOrder = (identifier, { signal } = {}) =>
  getData(`/orders/track/${encodeURIComponent(identifier)}`, { signal });

/** The logged-in shopper's orders, newest first (the backend doesn't paginate). */
export const fetchMyOrders = ({ signal } = {}) => getData("/orders", { signal });

/** One of the shopper's own orders (Mongo id or order number). */
export const fetchMyOrder = (id, { signal } = {}) =>
  getData(`/orders/${encodeURIComponent(id)}`, { signal });

/** Cancel while pending/confirmed/processing. Needs the Mongo `_id`, not the order number. */
export const cancelMyOrder = (orderId) =>
  getData(`/orders/${encodeURIComponent(orderId)}/cancel`, { method: "PATCH" });
