import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Cart for shoppers who aren't logged in. The backend has no guest cart, so it lives on this
 * device; checkout sends these lines and the backend re-prices and re-checks stock.
 * (Phase 4 adds the logged-in server cart behind the same `useCart` interface.)
 *
 * @typedef {object} CartLine
 * @property {string} variantId
 * @property {string} productId
 * @property {string} slug
 * @property {string} name
 * @property {string} brand
 * @property {{ flavor?: string, weight?: string, serving?: string }} attributes
 * @property {{ url: string } | null} image
 * @property {number} unitPrice   Price when added (display only; checkout re-prices)
 * @property {number} quantity
 * @property {number} maxQuantity Stock when added (re-checked before checkout)
 */

const MAX_PER_LINE = 20;

export const useGuestCart = create(
  persist(
    (set, get) => ({
      /** @type {CartLine[]} */
      lines: [],

      /**
       * Add a variant (or more of it). Quantity is capped by stock and a sane per-line maximum.
       * @returns {{ quantity: number, capped: boolean }}
       */
      add(line, quantity = 1) {
        const existing = get().lines.find((l) => l.variantId === line.variantId);
        const max = Math.max(0, Math.min(line.maxQuantity ?? MAX_PER_LINE, MAX_PER_LINE));
        const wanted = (existing?.quantity ?? 0) + quantity;
        const next = Math.min(wanted, max);
        if (next <= 0) return { quantity: existing?.quantity ?? 0, capped: true };

        const updated = { ...existing, ...line, quantity: next, maxQuantity: max };
        set((s) => ({
          lines: existing
            ? s.lines.map((l) => (l.variantId === line.variantId ? updated : l))
            : [...s.lines, updated],
        }));
        return { quantity: next, capped: next < wanted };
      },

      setQuantity(variantId, quantity) {
        set((s) => ({
          lines: s.lines
            .map((l) =>
              l.variantId === variantId
                ? { ...l, quantity: Math.max(0, Math.min(quantity, l.maxQuantity ?? MAX_PER_LINE)) }
                : l,
            )
            .filter((l) => l.quantity > 0),
        }));
      },

      remove(variantId) {
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) }));
      },

      clear() {
        set({ lines: [] });
      },
    }),
    {
      name: "adeeb.cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/** Total units in the cart (header badge). */
export const selectCartCount = (s) => s.lines.reduce((sum, l) => sum + l.quantity, 0);
