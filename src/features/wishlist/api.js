import { api } from "../../lib/api";

/**
 * Write-only wishlist sync. The backend's read (GET /wishlist) always returns an empty product
 * list (see BACKEND_ANALYSIS §8), so the device list is the source of truth and the server only
 * receives changes — enough for the admin "wishlists" view to stay meaningful.
 */
export const addToServerWishlist = (productId) => api.post(`/wishlist/${productId}`);
export const removeFromServerWishlist = (productId) => api.delete(`/wishlist/${productId}`);
export const syncServerWishlist = (productIds) => api.post("/wishlist/sync", { productIds });
