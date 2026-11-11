import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSession } from "../auth/session-store";
import { addToServerWishlist, removeFromServerWishlist } from "./api";

const MAX = 100;

/** Fire-and-forget server write for logged-in shoppers; failures never block the UI. */
function syncToServer(fn, productId) {
  if (useSession.getState().status !== "authenticated") return;
  fn(productId).catch(() => {
    /* the device list stays correct; the next login sync repairs the server copy */
  });
}

/**
 * Saved products on this device, stored as card snapshots so the wishlist renders without
 * requests (the page refreshes prices/stock in the background).
 */
export const useWishlist = create(
  persist(
    (set, get) => ({
      /** @type {import("../catalog/lib/product-view").ProductCardModel[]} */
      items: [],
      has: (productId) => get().items.some((c) => c.id === productId),
      /** @returns {boolean} true when the product is now saved */
      toggle(card) {
        const saved = get().has(card.id);
        set((s) => ({
          items: saved ? s.items.filter((c) => c.id !== card.id) : [card, ...s.items].slice(0, MAX),
        }));
        syncToServer(saved ? removeFromServerWishlist : addToServerWishlist, card.id);
        return !saved;
      },
      /** Refresh stored snapshots with live data (prices, stock). */
      refresh(cards) {
        const byId = new Map(cards.map((c) => [c.id, c]));
        set((s) => ({ items: s.items.map((c) => byId.get(c.id) ?? c) }));
      },
      /** Add products saved on other devices (keeps this device's order, newest first). */
      merge(cards) {
        set((s) => {
          const have = new Set(s.items.map((c) => c.id));
          const extra = cards.filter((c) => !have.has(c.id));
          return extra.length ? { items: [...s.items, ...extra].slice(0, MAX) } : s;
        });
      },
      remove(productId) {
        set((s) => ({ items: s.items.filter((c) => c.id !== productId) }));
        syncToServer(removeFromServerWishlist, productId);
      },
    }),
    { name: "adeeb.wishlist", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export const selectWishlistCount = (s) => s.items.length;
