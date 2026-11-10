/** Statuses the backend lets the shopper cancel. */
const CANCELLABLE = new Set(["pending", "confirmed", "processing"]);
/** Reviews need an order the shop has confirmed (the backend refuses pending ones). */
const REVIEWABLE = new Set(["confirmed", "processing", "shipped", "delivered"]);

export const canCancel = (order) => CANCELLABLE.has(order?.orderStatus);
export const canReview = (order) => REVIEWABLE.has(order?.orderStatus);

/**
 * A cart line from an order item, for "Buy again". The price is the old one — the cart
 * re-checks live prices and stock before checkout.
 * @returns {import("../../cart/guest-cart").CartLine}
 */
export function orderItemToCartLine(item) {
  return {
    variantId: String(item.variantId),
    productId: String(item.productId),
    slug: item.productSlug ?? "",
    name: item.productName,
    brand: "",
    attributes: item.attributes ?? {},
    image: item.image?.url ? { url: item.image.url } : null,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    maxQuantity: 20,
  };
}
