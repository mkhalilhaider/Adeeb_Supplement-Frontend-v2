import { useSyncExternalStore } from "react";

/**
 * Subscribe to a CSS media query. Use for behaviour that differs by device (bottom sheet vs side
 * panel), not for layout — layout belongs in Tailwind breakpoints.
 */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Tablet and up (≥768px) — matches Tailwind's `md`. */
export const useIsDesktop = () => useMediaQuery("(min-width: 48rem)");

/** True when the user asked the OS for less motion. */
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
