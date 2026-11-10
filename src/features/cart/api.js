import { api, getData } from "../../lib/api";

/**
 * Logged-in shopper's cart on the server. Every call returns the full cart.
 * Note the backend's semantics: POST /cart/items ADDS to the existing quantity, PATCH SETS it.
 */
export const fetchServerCart = ({ signal } = {}) => getData("/cart", { signal });

export const addServerItem = ({ variantId, quantity }) =>
  getData("/cart/items", { method: "POST", body: { variantId, quantity } });

export const setServerItemQuantity = (variantId, quantity) =>
  getData(`/cart/items/${variantId}`, { method: "PATCH", body: { quantity } });

export const removeServerItem = (variantId) =>
  getData(`/cart/items/${variantId}`, { method: "DELETE" });

export const clearServerCart = () => api.delete("/cart");

/**
 * Server cart → the same line shape as the guest cart, so components don't care which it is.
 * @returns {import("./guest-cart").CartLine[]}
 */
export function serverCartToLines(cart) {
  return (cart?.items ?? []).map((item) => ({
    variantId: String(item.variantId),
    productId: String(item.productId),
    slug: item.productSlug ?? "",
    name: item.productName,
    brand: "",
    attributes: item.attributes ?? {},
    image: item.image?.url ? item.image : null,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    maxQuantity: undefined,
    sku: item.sku,
  }));
}
