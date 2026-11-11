import { api } from "../../lib/api";

/**
 * Account wishlist. The device list stays the one the store renders from (instant, works
 * logged out); the server copy follows every change and, on login, brings items saved on
 * other devices into this one (see SessionSync).
 */
export const addToServerWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromServerWishlist = (productId) => api.delete(`/wishlist/${productId}`);
/** Adds these ids to the account list and returns the whole list (populated products). */
export const syncServerWishlist = (productIds) =>
  api.post("/wishlist/sync", { productIds }).then((envelope) => envelope.data?.products ?? []);
