import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Cart drawer + quick-add sheet state (not persisted). */
export const useCartUi = create((set) => ({
  drawerOpen: false,
  /** variantId of the line just added, highlighted in the drawer */
  lastAdded: null,
  /** slug of the product whose options sheet is open (quick add from a card) */
  quickAddSlug: null,
  openDrawer: (lastAdded = null) => set({ drawerOpen: true, lastAdded }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  openQuickAdd: (slug) => set({ quickAddSlug: slug }),
  closeQuickAdd: () => set({ quickAddSlug: null }),
}));

/**
 * Choices made on the cart page that checkout reuses: coupon code and delivery zone for the
 * estimate. Kept per browser session (a coupon shouldn't follow someone for weeks).
 */
export const useCartChoices = create(
  persist(
    (set) => ({
      couponCode: "",
      /** "karachi" | "other" — fee depends only on the zone */
      zone: "karachi",
      setCoupon: (couponCode) => set({ couponCode: couponCode.trim().toUpperCase() }),
      clearCoupon: () => set({ couponCode: "" }),
      setZone: (zone) => set({ zone }),
    }),
    { name: "adeeb.cart-choices", storage: createJSONStorage(() => sessionStorage), version: 1 },
  ),
);
