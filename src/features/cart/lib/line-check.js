import { isPurchasable, paidPrice } from "../../catalog/lib/product-view";

/**
 * @typedef {object} LineCheck
 * @property {"ok"|"price"|"low"|"unavailable"} status
 * @property {number} [livePrice]  Current price when known
 * @property {number} [stock]      Units available now
 * @property {string} [message]    Shopper-facing note
 * @property {string} [brand]      From the live product (useLineChecks)
 * @property {{url: string}|null} [image]  From the live product (useLineChecks)
 */

/**
 * Compare a cart line with the live product: has the price changed, is there enough stock,
 * can it still be bought? Pure (unit-tested); the cart shows the result next to the line.
 *
 * @param {import("../guest-cart").CartLine} line
 * @param {import("../../../types").Product | undefined} product  undefined = not loaded yet
 * @param {{ missing?: boolean }} [opts] missing = the product no longer exists (404)
 * @returns {LineCheck}
 */
export function checkLine(line, product, { missing = false } = {}) {
  if (missing) return { status: "unavailable", message: "No longer available" };
  if (!product) return { status: "ok" };

  const variant = product.variants?.find((v) => String(v._id) === String(line.variantId));
  if (!variant || !isPurchasable(variant)) {
    return { status: "unavailable", message: "Sold out — remove it to check out" };
  }

  const livePrice = paidPrice(variant);
  const stock = variant.stockQuantity;
  if (line.quantity > stock) {
    return { status: "low", livePrice, stock, message: `Only ${stock} left — reduce the quantity` };
  }
  if (livePrice !== line.unitPrice) {
    const direction = livePrice < line.unitPrice ? "dropped" : "changed";
    return { status: "price", livePrice, stock, message: `Price ${direction} since you added it` };
  }
  return { status: "ok", livePrice, stock };
}

/** Lines that block checkout (sold out, or more than we have). */
export const blocksCheckout = (check) => check.status === "unavailable" || check.status === "low";
