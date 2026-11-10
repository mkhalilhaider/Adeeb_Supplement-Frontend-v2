import { getData } from "../../lib/api";

/**
 * Public order lookup by order number ("SUP-20261110-0001", "20261110-0001", "#…") or the
 * order id from emails. Returns limited fields only (no phone or street address).
 */
export const trackOrder = (identifier, { signal } = {}) =>
  getData(`/orders/track/${encodeURIComponent(identifier)}`, { signal });
