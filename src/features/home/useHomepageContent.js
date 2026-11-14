import { useQuery } from "@tanstack/react-query";
import { getData } from "../../lib/api";

/**
 * What the admin set in Admin → Homepage content: hero products, the Shop all menu's featured
 * product, the big Shop by goal tile and goal titles, and the spotlight band. `null` until it
 * has been saved once — every part then falls back to the site's built-in content.
 *
 * Remembered between visits (persisted cache), so returning shoppers see it at once.
 */
export function useHomepageContent() {
  return useQuery({
    queryKey: ["homepage-content"],
    queryFn: ({ signal }) => getData("/homepage-content", { signal }),
    staleTime: 5 * 60_000,
    meta: { persist: true },
  });
}
