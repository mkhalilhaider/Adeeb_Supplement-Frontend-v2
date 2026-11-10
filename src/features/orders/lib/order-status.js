/**
 * Shopper-facing order progress. The backend's orderStatus moves
 * pending → confirmed → processing → shipped → delivered (or cancelled).
 */
export const ORDER_STEPS = Object.freeze([
  { status: "pending", label: "Order placed", detail: "We've received your order." },
  { status: "confirmed", label: "Confirmed", detail: "Your order is confirmed." },
  { status: "processing", label: "Packing", detail: "Your items are being packed." },
  { status: "shipped", label: "On the way", detail: "Your parcel is with the rider or courier." },
  { status: "delivered", label: "Delivered", detail: "Delivered and paid on delivery." },
]);

/**
 * Index of the current step (−1 when cancelled or unknown).
 * @param {string} status
 */
export function stepIndex(status) {
  return ORDER_STEPS.findIndex((s) => s.status === status);
}

/**
 * Turn what people paste into a full order identifier, or null.
 * Accepts "SUP-20261110-0001", "#20261110-0001", "sup 20261110 0001" and the 24-character
 * order id from emails. Anything shorter is refused on purpose: the backend also matches the
 * *end* of an order number, so "0001" could open someone else's order.
 *
 * @param {string} input
 * @returns {string|null}
 */
export function parseOrderIdentifier(input) {
  const raw = String(input ?? "")
    .trim()
    .replace(/^#/, "");
  if (/^[a-f0-9]{24}$/i.test(raw)) return raw.toLowerCase();
  const compact = raw.toUpperCase().replace(/[\s_]+/g, "-");
  const match = /^(?:SUP-?)?(\d{8})-?(\d{4,6})$/.exec(compact);
  return match ? `SUP-${match[1]}-${match[2]}` : null;
}
