import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX = 6;

/** The shopper's last few searches, newest first (this device only). */
export const useRecentSearches = create(
  persist(
    (set) => ({
      terms: [],
      add: (term) => {
        const clean = String(term ?? "")
          .trim()
          .slice(0, 80);
        if (clean.length < 2) return;
        set((s) => ({
          terms: [clean, ...s.terms.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(
            0,
            MAX,
          ),
        }));
      },
      remove: (term) => set((s) => ({ terms: s.terms.filter((t) => t !== term) })),
      clear: () => set({ terms: [] }),
    }),
    {
      name: "adeeb.recent-searches",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
