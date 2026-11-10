import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX = 12;

/**
 * Products this device opened recently, stored as ready-to-render card snapshots so the
 * "Recently viewed" rail needs no request. Prices may be a little stale; the product page shows
 * the live price.
 */
export const useRecentlyViewed = create(
  persist(
    (set) => ({
      /** @type {import("./lib/product-view").ProductCardModel[]} */
      cards: [],
      record: (card) =>
        set((s) => ({ cards: [card, ...s.cards.filter((c) => c.id !== card.id)].slice(0, MAX) })),
      clear: () => set({ cards: [] }),
    }),
    { name: "adeeb.recently-viewed", storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
